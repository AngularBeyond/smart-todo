# Signal Store Events Architecture

Angular applications using `@ngrx/signals/events` decouple trigger sources (layouts, components, guards, interceptors) from state management through a centralized, type-safe event bus.

---

## 1. Application-Level Prerequisite

The event system requires `provideDispatcher()` to be registered in the application providers (`src/app/app.config.ts`):

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideDispatcher } from '@ngrx/signals/events';

export const appConfig: ApplicationConfig = {
  providers: [
    // Register the root event dispatcher
    provideDispatcher(),
    // ...other providers
  ],
};
```

---

## 2. Event Definitions

Define events inside dedicated domain files under `src/app/core/store/events/`:

```typescript
// src/app/core/store/events/auth.events.ts
import { event, type } from '@ngrx/signals/events';

// Payload-free event
export const userAuthenticated = event('[Authentication API] User Authenticated');
export const userLogout = event('[Layout Header] User Logout');

// Payload-bearing event
export const themeChanged = event(
  '[Theme Service] Changed',
  type<{ mode: 'light' | 'dark' }>()
);
```

Barrel export in `src/app/core/store/events/index.ts`:
```typescript
export * from './auth.events';
```

---

## 3. Handling Events in the Global Store

Global stores listen for events using `withEventHandlers`:

```typescript
import { inject } from '@angular/core';
import { patchState } from '@ngrx/signals';
import { Events, withEventHandlers } from '@ngrx/signals/events';
import { catchError, EMPTY, switchMap, tap } from 'rxjs';
import { userAuthenticated, themeChanged } from './events';

export const AppStore = signalStore(
  { providedIn: 'root' },
  // ...withState, withRequestStatus
  withEventHandlers((store) => {
    const events = inject(Events);
    const httpService = inject(HttpService);

    return {
      // 1. Handling payload-free event with async API call
      loadProfile$: events.on(userAuthenticated).pipe(
        tap(() => patchState(store, { isAuthenticated: true }, setPending())),
        switchMap(() =>
          httpService.get('/v1/profile').pipe(
            tap({
              next: (res) => patchState(store, { profile: res.data }, setFulfilled()),
              error: (err) => patchState(store, setError(err.message)),
            }),
            // CRITICAL: Inner catchError prevents terminating the event listener
            catchError(() => EMPTY),
          ),
        ),
      ),

      // 2. Handling payload-bearing event
      syncTheme$: events.on(themeChanged).pipe(
        tap(({ mode }) => {
          patchState(store, { themeMode: mode });
        }),
      ),
    };
  }),
);
```

---

## 4. Dispatching Events Across the Application

Any Angular service, guard, or component can inject `Dispatcher` and publish an event without direct coupling to the store:

### From a Layout Component (e.g. Header or Sidebar)
```typescript
import { Component, inject } from '@angular/core';
import { Dispatcher } from '@ngrx/signals/events';
import { userLogout } from '@core';

@Component({
  selector: 'app-header',
  template: `
    <button type="button" (click)="handleLogout()">Sign out</button>
  `,
})
export class Header {
  private readonly dispatcher = inject(Dispatcher);

  handleLogout(): void {
    this.dispatcher.dispatch(userLogout());
  }
}
```

### From a Routing Guard
```typescript
import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { Dispatcher } from '@ngrx/signals/events';
import { userAuthenticated } from '@core';

export const authGuard: CanActivateFn = () => {
  const dispatcher = inject(Dispatcher);
  // When authentication succeeds:
  dispatcher.dispatch(userAuthenticated());
  return true;
};
```
