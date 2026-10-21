# Feature Signal Store Template

This document provides the standard reference implementation for a feature-scoped Signal Store using `@ngrx/signals`.

## Standard Feature Store Pattern

Save as `src/app/features/<feature>/store/<feature-name>.store.ts`:

```typescript
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
import { FeatureItem, FeatureRequest, FeatureResponse } from '../models';

export interface FeatureState {
  items: FeatureItem[];
  selectedId: string | null;
}

const initialFeatureState: FeatureState = {
  items: [],
  selectedId: null,
};

/**
 * Feature Store scoped to the component or feature route lifecycle.
 * Note: Do NOT add `{ providedIn: 'root' }` unless this is an intentional app-level
 * singleton or public entry exception (e.g., LoginStore).
 */
export const FeatureStore = signalStore(
  withState(initialFeatureState),
  withRequestStatus(),
  withComputed(({ items, selectedId }) => ({
    selectedItem: computed(() => items().find((item) => item.id === selectedId()) ?? null),
    hasItems: computed(() => items().length > 0),
  })),
  withMethods((store, httpService = inject(HttpService), router = inject(Router)) => ({
    /**
     * Executes async API operation with status tracking and error resilience.
     */
    loadItems: rxMethod<void>(
      pipe(
        tap(() => patchState(store, setPending())),
        switchMap(() =>
          httpService.get<FeatureResponse>('/v1/feature/items').pipe(
            tap({
              next: (response) => {
                patchState(store, { items: response.data }, setFulfilled());
              },
              error: (error: HttpErrorResponse) => {
                const message =
                  error.error?.message ||
                  (typeof error.error === 'string' ? error.error : null) ||
                  HTTP_ERROR_MESSAGES.UNKNOWN_ERROR;
                patchState(store, setError(message));
              },
            }),
            // CRITICAL: catchError(() => EMPTY) inside the switchMap pipe keeps the
            // outer rxMethod stream alive so subsequent user invocations succeed.
            catchError(() => EMPTY),
          ),
        ),
      ),
    ),

    /**
     * Mutation method with payload and navigation.
     */
    saveItem: rxMethod<FeatureRequest>(
      pipe(
        tap(() => patchState(store, setPending())),
        switchMap((payload) =>
          httpService.post<FeatureResponse>('/v1/feature/items', payload).pipe(
            tap({
              next: (response) => {
                patchState(store, setFulfilled());
                void router.navigate(['/items', response.data.id]);
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

    /**
     * Synchronous state modifier to reset error status.
     */
    clearError(): void {
      patchState(store, setIdle());
    },

    /**
     * Local state setter.
     */
    selectId(id: string | null): void {
      patchState(store, { selectedId: id });
    },
  })),
);
```

---

## Barrel Export (`store/index.ts`)

Always export the store and any associated state interfaces from `store/index.ts`:

```typescript
export * from './feature.store';
```
