---
name: angular-global-store
description: Generates, configures, and tests application-wide Angular Signal Stores using @ngrx/signals and @ngrx/signals/events. Implements root-level state, RxJS event-driven API orchestration, decoupled event dispatching, and Vitest unit testing. Use when managing global state (session, profile, layout, theme) or reacting to app-wide events. Do not use for feature-scoped or component-local state.
---

# Angular Global Signal Store

Build root-level, event-driven Signal Stores using `@ngrx/signals` and `@ngrx/signals/events` to manage application-wide concerns such as authentication session, user profile, theme preference, and global layout state.

## Core Rules & Architectural Principles

1. **Location & Root Scoping:**
   - Global stores live in `src/app/core/store/<store-name>.store.ts`.
   - Must be configured with `{ providedIn: 'root' }`.
   - Consumed primarily by the Main Layout (`Header`, `Sidebar`), routing guards, and interceptors.
2. **Application Prerequisite (`provideDispatcher`):**
   - The root application config (`src/app/app.config.ts`) **must** include `provideDispatcher()` from `@ngrx/signals/events`.
3. **Decoupled Event Architecture:**
   - Triggers (e.g. login completion, user logout button, route guard checks) emit type-safe events defined in `src/app/core/store/events/`.
   - The global store listens for these events via `withEventHandlers` rather than exposing direct coupling to components.
4. **Stream Resilience:**
   - In event handler streams (`events.on(event).pipe(...)`), always catch errors within the inner switchMap/exhaustMap pipe (`catchError(() => EMPTY)`). This ensures the event listener remains active if an HTTP call fails.
5. **UI Framework Agnostic:**
   - Use standard Angular signals and template bindings for consumption in layout components. Avoid coupling the store to specific UI component libraries.

See [references/events-architecture.md](references/events-architecture.md) for event bus setup and dispatching.
See [references/global-store-template.md](references/global-store-template.md) for full store implementation.
See [references/vitest-spec-template.md](references/vitest-spec-template.md) for Vitest unit testing.

---

## Workflow: Scaffolding and Implementing a Global Store

### Step 1: Ensure Root Event Dispatcher Setup
Verify that `src/app/app.config.ts` includes `provideDispatcher()`:

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideDispatcher } from '@ngrx/signals/events';

export const appConfig: ApplicationConfig = {
  providers: [
    provideDispatcher(),
    // ...other providers
  ],
};
```

### Step 2: Scaffold Store, Events, and Spec Files
Execute the scaffolding utility to create the store, event definitions, and unit test suite:

```bash
.agents/skills/angular-global-store/scripts/scaffold-global-store.sh "src/app/core/store" "<store-name>"
```

*Example:*
```bash
.agents/skills/angular-global-store/scripts/scaffold-global-store.sh "src/app/core/store" "app"
```

This creates:
- `src/app/core/store/<store-name>.store.ts`
- `src/app/core/store/<store-name>.store.spec.ts`
- `src/app/core/store/events/<store-name>.events.ts`
- Updates barrel exports in `events/index.ts` and `store/index.ts`

### Step 3: Define Domain Events
Declare events in `src/app/core/store/events/<name>.events.ts`:

```typescript
import { event, type } from '@ngrx/signals/events';

// Payload-free event
export const userAuthenticated = event('[Authentication Guard] User Authenticated');
export const userLogout = event('[Main Layout Header] User Logout');

// Payload-bearing event
export const themeChanged = event('[Theme Service] Changed', type<{ mode: 'light' | 'dark' }>());
```

### Step 4: Implement Event Handlers in the Global Store
In `src/app/core/store/<name>.store.ts`, bind events to reactive pipelines:

```typescript
export const AppStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withRequestStatus(),
  withEventHandlers((store) => {
    const events = inject(Events);
    const httpService = inject(HttpService);
    const router = inject(Router);

    return {
      loadProfile$: events.on(userAuthenticated).pipe(
        tap(() => patchState(store, { isAuthenticated: true }, setPending())),
        switchMap(() =>
          httpService.get<ApiResponse<{ profile: UserProfile }>>('/v1/profile').pipe(
            tap({
              next: (res) => patchState(store, { profile: res.data.profile }, setFulfilled()),
              error: (err: HttpErrorResponse) => patchState(store, setError(err.error?.message || HTTP_ERROR_MESSAGES.UNKNOWN_ERROR)),
            }),
            // CRITICAL: Prevent stream termination on HTTP error
            catchError(() => EMPTY),
          ),
        ),
      ),
      logout$: events.on(userLogout).pipe(
        tap(() => patchState(store, setPending())),
        switchMap(() =>
          httpService.post<{ success: boolean }>('/v1/auth/logout', {}).pipe(
            tap({
              next: () => {
                patchState(store, initialState, setIdle());
                void router.navigate(['/login']);
              },
              error: () => patchState(store, setIdle()),
            }),
            catchError(() => EMPTY),
          ),
        ),
      ),
    };
  }),
  withMethods((store) => ({
    clear(): void {
      patchState(store, initialState, setIdle());
    },
  })),
);
```

### Step 5: Consume in Main Layout & Dispatch Events

1. **Inject in Layout Component:**
   ```typescript
   @Component({
     selector: 'app-header',
     standalone: true,
     template: `
       @if (profile(); as user) {
         <span>{{ user.name }}</span>
       }
       <button type="button" (click)="handleLogout()">Sign out</button>
     `,
   })
   export class Header {
     private readonly appStore = inject(AppStore);
     private readonly dispatcher = inject(Dispatcher);

     readonly profile = this.appStore.profile;

     handleLogout(): void {
       this.dispatcher.dispatch(userLogout());
     }
   }
   ```

2. **Dispatch from Routing Guard:**
   ```typescript
   export const authGuard: CanActivateFn = () => {
     const dispatcher = inject(Dispatcher);
     const appStore = inject(AppStore);

     if (appStore.isAuthenticated()) {
       return true;
     }

     return http.get<{ success: boolean }>('/v1/auth/authenticated').pipe(
       map((res) => {
         if (res.success) {
           dispatcher.dispatch(userAuthenticated());
           return true;
         }
         return router.createUrlTree(['/login']);
       }),
     );
   };
   ```

### Step 6: Unit Testing with Vitest
In `<store-name>.store.spec.ts`:
- Include `provideDispatcher()` and `provideRouter([])` in `TestBed.configureTestingModule`.
- Inject `Dispatcher` via `TestBed.inject(Dispatcher)`.
- Dispatch events (`dispatcher.dispatch(...)`) and assert state changes, HTTP requests, and router navigations.

---

## Verification Commands

```bash
# 1. Run unit tests for global stores
npm test -- --include="src/app/core/store/**/*.spec.ts" --watch=false

# 2. Type-check application
npx tsc -p tsconfig.app.json --noEmit

# 3. Lint store files
npx eslint "src/app/core/store/**/*.ts"
```
