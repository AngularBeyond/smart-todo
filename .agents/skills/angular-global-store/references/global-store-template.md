# Global Signal Store Template

Save as `src/app/core/store/<store-name>.store.ts`.

## Full Reference Implementation

```typescript
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
import { userAuthenticated, userLogout } from './events';
import { ApiResponse, UserProfile } from '../models';

export interface AppState {
  profile: UserProfile | null;
  isAuthenticated: boolean;
}

const initialAppState: AppState = {
  profile: null,
  isAuthenticated: false,
};

/**
 * Global Signal Store provided at root level.
 * Consumed by Main Layout, navigation guards, and feature components.
 */
export const AppStore = signalStore(
  { providedIn: 'root' },
  withState<AppState>(initialAppState),
  withRequestStatus(),
  withComputed(({ profile, isAuthenticated }) => ({
    userDisplayName: computed(() => {
      const p = profile();
      return p ? `${p.name ?? ''} ${p.lastName ?? ''}`.trim() || p.email : 'Guest';
    }),
    isReady: computed(() => isAuthenticated() && profile() !== null),
  })),
  withEventHandlers((store) => {
    const events = inject(Events);
    const httpService = inject(HttpService);
    const router = inject(Router);

    return {
      /**
       * Reacts to userAuthenticated event by loading profile data.
       */
      loadProfile$: events.on(userAuthenticated).pipe(
        tap(() => patchState(store, { isAuthenticated: true }, setPending())),
        switchMap(() =>
          httpService.get<ApiResponse<{ profile: UserProfile }>>('/v1/profile').pipe(
            tap({
              next: (res) => {
                patchState(store, { profile: res.data.profile }, setFulfilled());
              },
              error: (err: HttpErrorResponse) => {
                const message =
                  err.error?.message ||
                  (typeof err.error === 'string' ? err.error : null) ||
                  HTTP_ERROR_MESSAGES.UNKNOWN_ERROR;
                patchState(store, setError(message));
              },
            }),
            // CRITICAL: Inner catchError keeps the event subscription active
            catchError(() => EMPTY),
          ),
        ),
      ),

      /**
       * Reacts to userLogout event by calling logout API, clearing state, and navigating.
       */
      logout$: events.on(userLogout).pipe(
        tap(() => patchState(store, setPending())),
        switchMap(() =>
          httpService.post<{ success: boolean }>('/v1/auth/logout', {}).pipe(
            tap({
              next: (res) => {
                if (res.success) {
                  patchState(store, initialAppState, setIdle());
                  void router.navigate(['/login']);
                } else {
                  patchState(store, setIdle());
                }
              },
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
    };
  }),
  withMethods((store) => ({
    /**
     * Direct state mutation helper when event-driven flow is not needed.
     */
    setAuthenticated(isAuthenticated: boolean): void {
      patchState(store, { isAuthenticated });
    },

    /**
     * Explicitly clears store back to initial empty state.
     */
    clear(): void {
      patchState(store, initialAppState, setIdle());
    },
  })),
);
```

---

## Barrel Export (`src/app/core/store/index.ts`)

```typescript
export * from './app.store';
export * from './events';
```
