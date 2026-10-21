#!/usr/bin/env bash
set -euo pipefail

# Scaffold a feature-scoped Signal Store with spec and barrel export

if [ "$#" -lt 2 ]; then
  echo "Usage: $0 <target-store-dir> <store-kebab-name>" >&2
  echo "Example: $0 src/app/features/billing/store billing" >&2
  exit 1
fi

STORE_DIR="$1"
STORE_NAME="$2"

# Convert kebab-case to PascalCase (e.g. billing-history -> BillingHistory)
PASCAL_NAME=$(echo "$STORE_NAME" | awk -F'-' '{for(i=1;i<=NF;i++) printf toupper(substr($i,1,1)) substr($i,2); print ""}')

mkdir -p "$STORE_DIR"

STORE_FILE="$STORE_DIR/${STORE_NAME}.store.ts"
SPEC_FILE="$STORE_DIR/${STORE_NAME}.store.spec.ts"
INDEX_FILE="$STORE_DIR/index.ts"

# 1. Generate store file if not existing
if [ ! -f "$STORE_FILE" ]; then
  cat <<EOF > "$STORE_FILE"
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, EMPTY, pipe, switchMap, tap } from 'rxjs';
import {
  HTTP_ERROR_MESSAGES,
  HttpService,
  setError,
  setFulfilled,
  setIdle,
  setPending,
  withRequestStatus,
} from '@core';

export interface ${PASCAL_NAME}State {
  data: unknown | null;
}

const initialState: ${PASCAL_NAME}State = {
  data: null,
};

export const ${PASCAL_NAME}Store = signalStore(
  withState(initialState),
  withRequestStatus(),
  withComputed(({ data }) => ({
    hasData: computed(() => data() !== null),
  })),
  withMethods((store, httpService = inject(HttpService), router = inject(Router)) => ({
    loadData: rxMethod<void>(
      pipe(
        tap(() => patchState(store, setPending())),
        switchMap(() =>
          httpService.get('/v1/${STORE_NAME}').pipe(
            tap({
              next: (res) => {
                patchState(store, { data: res }, setFulfilled());
              },
              error: (error: HttpErrorResponse) => {
                const message =
                  error.error?.message ||
                  (typeof error.error === 'string' ? error.error : null) ||
                  HTTP_ERROR_MESSAGES.UNKNOWN_ERROR;
                patchState(store, setError(message));
              },
            }),
            catchError(() => EMPTY),
          ),
        ),
      ),
    ),
    clearError(): void {
      patchState(store, setIdle());
    },
  })),
);
EOF
  echo "Created: $STORE_FILE"
fi

# 2. Generate spec file if not existing
if [ ! -f "$SPEC_FILE" ]; then
  cat <<EOF > "$SPEC_FILE"
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { HTTP_ERROR_MESSAGES, HttpService } from '@core';
import { ${PASCAL_NAME}Store } from './${STORE_NAME}.store';

describe('${PASCAL_NAME}Store', () => {
  let store: InstanceType<typeof ${PASCAL_NAME}Store>;
  let httpServiceMock: { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn> };
  let routerMock: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    httpServiceMock = {
      get: vi.fn(),
      post: vi.fn(),
    };
    routerMock = {
      navigate: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        ${PASCAL_NAME}Store,
        { provide: HttpService, useValue: httpServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    });

    store = TestBed.inject(${PASCAL_NAME}Store);
    store.clearError();
  });

  it('should initialize with idle status', () => {
    expect(store.isPending()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('should transition to fulfilled on success', () => {
    httpServiceMock.get.mockReturnValue(of({ success: true }));
    store.loadData();
    expect(store.isFulfilled()).toBe(true);
    expect(store.error()).toBeNull();
  });

  it('should capture error message on failure', () => {
    const errorResponse = new HttpErrorResponse({
      status: 400,
      error: { message: 'Failed request' },
    });
    httpServiceMock.get.mockReturnValue(throwError(() => errorResponse));
    store.loadData();
    expect(store.isPending()).toBe(false);
    expect(store.error()).toBe('Failed request');
  });
});
EOF
  echo "Created: $SPEC_FILE"
fi

# 3. Export in index.ts
if [ ! -f "$INDEX_FILE" ]; then
  echo "export * from './${STORE_NAME}.store';" > "$INDEX_FILE"
  echo "Created: $INDEX_FILE"
elif ! grep -q "./${STORE_NAME}.store" "$INDEX_FILE"; then
  echo "export * from './${STORE_NAME}.store';" >> "$INDEX_FILE"
  echo "Updated: $INDEX_FILE"
fi

echo "Successfully scaffolded ${PASCAL_NAME}Store in $STORE_DIR"
