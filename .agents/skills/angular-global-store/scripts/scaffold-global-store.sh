#!/usr/bin/env bash
set -euo pipefail

# Scaffold a root-level Global Signal Store with event architecture and Vitest spec

if [ "$#" -lt 2 ]; then
  echo "Usage: $0 <target-core-store-dir> <store-kebab-name>" >&2
  echo "Example: $0 src/app/core/store app" >&2
  exit 1
fi

STORE_DIR="$1"
STORE_NAME="$2"

# Convert kebab-case to PascalCase (e.g. session-state -> SessionState)
PASCAL_NAME=$(echo "$STORE_NAME" | awk -F'-' '{for(i=1;i<=NF;i++) printf toupper(substr($i,1,1)) substr($i,2); print ""}')

mkdir -p "$STORE_DIR"
EVENTS_DIR="$STORE_DIR/events"
mkdir -p "$EVENTS_DIR"

STORE_FILE="$STORE_DIR/${STORE_NAME}.store.ts"
SPEC_FILE="$STORE_DIR/${STORE_NAME}.store.spec.ts"
EVENT_FILE="$EVENTS_DIR/${STORE_NAME}.events.ts"
EVENTS_INDEX="$EVENTS_DIR/index.ts"
STORE_INDEX="$STORE_DIR/index.ts"

# 1. Generate event definition file
if [ ! -f "$EVENT_FILE" ]; then
  cat <<EOF > "$EVENT_FILE"
import { event, type } from '@ngrx/signals/events';

export const ${STORE_NAME}Initialized = event('[${PASCAL_NAME}] Initialized');
export const ${STORE_NAME}Reset = event('[${PASCAL_NAME}] Reset');
export const ${STORE_NAME}Updated = event(
  '[${PASCAL_NAME}] Updated',
  type<{ timestamp: number }>()
);
EOF
  echo "Created: $EVENT_FILE"
fi

# 2. Update events/index.ts
if [ ! -f "$EVENTS_INDEX" ]; then
  echo "export * from './${STORE_NAME}.events';" > "$EVENTS_INDEX"
  echo "Created: $EVENTS_INDEX"
elif ! grep -q "./${STORE_NAME}.events" "$EVENTS_INDEX"; then
  echo "export * from './${STORE_NAME}.events';" >> "$EVENTS_INDEX"
  echo "Updated: $EVENTS_INDEX"
fi

# 3. Generate root store file
if [ ! -f "$STORE_FILE" ]; then
  cat <<EOF > "$STORE_FILE"
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { Events, withEventHandlers } from '@ngrx/signals/events';
import { catchError, EMPTY, switchMap, tap } from 'rxjs';
import {
  HTTP_ERROR_MESSAGES,
  HttpService,
  setError,
  setFulfilled,
  setIdle,
  setPending,
  withRequestStatus,
} from '../custom-features';
import { ${STORE_NAME}Initialized, ${STORE_NAME}Reset } from './events';

export interface ${PASCAL_NAME}State {
  isInitialized: boolean;
}

const initialState: ${PASCAL_NAME}State = {
  isInitialized: false,
};

export const ${PASCAL_NAME}Store = signalStore(
  { providedIn: 'root' },
  withState<${PASCAL_NAME}State>(initialState),
  withRequestStatus(),
  withComputed(({ isInitialized }) => ({
    isReady: computed(() => isInitialized()),
  })),
  withEventHandlers((store) => {
    const events = inject(Events);
    const httpService = inject(HttpService);

    return {
      init$: events.on(${STORE_NAME}Initialized).pipe(
        tap(() => patchState(store, setPending())),
        switchMap(() =>
          httpService.get('/v1/${STORE_NAME}').pipe(
            tap({
              next: () => patchState(store, { isInitialized: true }, setFulfilled()),
              error: (err: HttpErrorResponse) => {
                const message =
                  err.error?.message ||
                  (typeof err.error === 'string' ? err.error : null) ||
                  HTTP_ERROR_MESSAGES.UNKNOWN_ERROR;
                patchState(store, setError(message));
              },
            }),
            catchError(() => EMPTY),
          ),
        ),
      ),
      reset$: events.on(${STORE_NAME}Reset).pipe(
        tap(() => {
          patchState(store, initialState, setIdle());
        }),
      ),
    };
  }),
  withMethods((store) => ({
    clear(): void {
      patchState(store, initialState, setIdle());
    },
  })),
);
EOF
  echo "Created: $STORE_FILE"
fi

# 4. Generate spec file
if [ ! -f "$SPEC_FILE" ]; then
  cat <<EOF > "$SPEC_FILE"
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Dispatcher, provideDispatcher } from '@ngrx/signals/events';
import { HttpService } from '../services/http';
import { ${PASCAL_NAME}Store } from './${STORE_NAME}.store';
import { ${STORE_NAME}Initialized, ${STORE_NAME}Reset } from './events';

describe('${PASCAL_NAME}Store', () => {
  let store: InstanceType<typeof ${PASCAL_NAME}Store>;
  let dispatcher: Dispatcher;
  let httpMock: { get: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    httpMock = { get: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideDispatcher(),
        ${PASCAL_NAME}Store,
        { provide: HttpService, useValue: httpMock },
      ],
    });

    store = TestBed.inject(${PASCAL_NAME}Store);
    dispatcher = TestBed.inject(Dispatcher);
    store.clear();
  });

  it('should initialize with default state', () => {
    expect(store.isReady()).toBe(false);
    expect(store.isPending()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('should respond to ${STORE_NAME}Initialized event', () => {
    httpMock.get.mockReturnValue(of({ success: true }));
    dispatcher.dispatch(${STORE_NAME}Initialized());

    expect(httpMock.get).toHaveBeenCalledWith('/v1/${STORE_NAME}');
    expect(store.isFulfilled()).toBe(true);
    expect(store.isReady()).toBe(true);
  });

  it('should reset on ${STORE_NAME}Reset event', () => {
    dispatcher.dispatch(${STORE_NAME}Reset());
    expect(store.isReady()).toBe(false);
    expect(store.error()).toBeNull();
  });
});
EOF
  echo "Created: $SPEC_FILE"
fi

# 5. Update store/index.ts
if [ ! -f "$STORE_INDEX" ]; then
  cat <<EOF > "$STORE_INDEX"
export * from './${STORE_NAME}.store';
export * from './events';
EOF
  echo "Created: $STORE_INDEX"
elif ! grep -q "./${STORE_NAME}.store" "$STORE_INDEX"; then
  echo "export * from './${STORE_NAME}.store';" >> "$STORE_INDEX"
  echo "Updated: $STORE_INDEX"
fi

echo "Successfully scaffolded ${PASCAL_NAME}Store in $STORE_DIR"
