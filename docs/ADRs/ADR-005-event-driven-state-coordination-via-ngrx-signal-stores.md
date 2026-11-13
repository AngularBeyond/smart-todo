# ADR-005: Event-Driven State Coordination via NgRx SignalStores and Signal Events

## Status
Accepted

## Date
2026-11-04

## Context
The Smart TODO frontend architecture encompasses both application-wide global concerns and feature-specific domains:
- **Global Concerns (`src/app/core/store/`):** User authentication session (`AppStore`), user profile display, active theme (`light` vs `dark`), responsive mobile sidebar toggle, and global HTTP notification toasts.
- **Feature Concerns (`src/app/features/*/store/`):** Active todo list selection, pagination, optimistic drag-and-drop ordering, and filtering (`TodosStore`); list creation and quotas (`TodoListsStore`); password management (`ProfileStore`).

Traditional state architectures struggle with cross-store synchronization:
1. **Direct Store Coupling:** If `TodosStore` directly injects `AppStore` to reset on logout or trigger error toasts, and `AppStore` injects `TodoListsStore` to refresh lists upon login, circular dependency graphs inevitably emerge (`AppStore` &harr; `TodoListsStore`).
2. **Global Monolithic Stores:** Storing all application state in a single giant store causes bloated state trees, excessive re-renders, and defeats feature-level lazy loading.
3. **RxJS Subject Spaghetti:** Creating ad-hoc `Subject` or `EventEmitter` singletons without standardized typing makes state transitions difficult to trace and test.

## Decision
We decided to adopt **NgRx SignalStores (`@ngrx/signals`)** combined with **Signal Events (`@ngrx/signals/events`)**:
1. **Scoped Store Boundaries**:
   - `AppStore` and `TodoListsStore` live in `src/app/core/store/` as root-provided global stores (`providedIn: 'root'`).
   - Feature stores (`TodosStore`, `ProfileStore`, `LoginStore`, `RegisterStore`) live in `src/app/features/<feature>/store/` and are provided at the component or feature route level.
2. **Decoupled Event Dispatching via `Dispatcher`**:
   - Stores and interceptors never call methods on opposing stores directly.
   - Cross-domain intents are expressed as typed event objects defined in `src/app/core/store/events/`:
     - `userAuthenticated`: Dispatched when login or session restoration succeeds.
     - `userLogout`: Dispatched when the user signs out or a session expires; listened to by `AppStore` (navigates to `/login`) and `TodoListsStore` (resets entity state).
     - `profileSynced`: Dispatched by `ProfileStore` after saving settings; updates `AppStore`'s header display name.
     - `selectTodoList`: Dispatched when switching lists; listened to by `AppStore` to automatically close the mobile sidebar.
     - `apiErrorOccurred`, `apiSuccessOccurred`, `apiInfoOccurred`: Dispatched by HTTP interceptors and feature stores; listened to by `AppStore` to invoke `ToastService`.
3. **Reactive Handling with `withEventHandlers`**:
   - Stores declare event listeners using `withEventHandlers` and `events.on(eventAction).pipe(...)`.
   - Event handlers run as managed reactive streams that are tied to the store's lifecycle, automatically unsubscribing upon store destruction.

## Alternatives Considered

### Alternative 1: Traditional NgRx Global Store (`@ngrx/store` + `@ngrx/effects`)
- **Pros:** Mature ecosystem, extensive Redux DevTools support.
- **Cons:** High boilerplate (actions, reducers, selectors, effects classes), relies heavily on RxJS subscriptions rather than native Angular Signals, increases bundle size.
- **Rejected:** NgRx SignalStores provide native signal reactivity, fine-grained reactivity without zone.js overhead, and significantly less boilerplate.

### Alternative 2: Direct Store-to-Store Method Invocations
- **Pros:** No event dispatcher or event definition files required.
- **Cons:** Directly injecting stores into other stores creates tight coupling, makes lazy loading impossible, leads to circular dependency errors, and makes unit testing difficult due to cascading mock requirements.
- **Rejected:** Anti-pattern that violates clean architecture layer boundaries.

### Alternative 3: Standalone Angular Signals in Plain Services
- **Pros:** Minimalist, zero third-party dependencies.
- **Cons:** Lacks standardized lifecycle hooks (`withHooks`), async status management, entity adapters, and built-in event orchestration.
- **Rejected:** Custom implementations reinvent the wheel with less type safety and higher maintenance costs.

## Consequences

### Positive
- **Zero Circular Dependencies:** Feature and core stores remain fully decoupled. Modules communicate exclusively by emitting or reacting to events.
- **Unidirectional Data Flow:** State transitions are predictable, easily auditable in logs, and simple to debug.
- **Straightforward Unit Testing:** Stores can be tested in isolation by injecting the `Dispatcher` and verifying store state changes when specific events are dispatched, without mocking complex sibling stores.
- **Independent Feature Lifecycles:** Feature stores are instantiated when their route loads and cleanly destroyed when the user navigates away.

### Trade-offs / Considerations
- Requires defining event constants in `src/app/core/store/events/` and importing `Dispatcher`/`provideDispatcher()` in tests.
