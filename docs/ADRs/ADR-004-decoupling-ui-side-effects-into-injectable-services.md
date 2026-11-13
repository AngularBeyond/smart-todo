# ADR-004: Decoupling UI Side-Effects into Injectable Services

## Status
Accepted

## Date
2026-11-11

## Context
In the Angular frontend (`smart-todo`), global notifications (success banners, API failure toasts, informatory messages) are triggered in response to application-wide events (`apiErrorOccurred`, `apiSuccessOccurred`, `apiInfoOccurred`).

Initially, the global `AppStore` (implemented via NgRx Signals) imported the `toast` object directly from the UI library package `@spartan-ng/brain/sonner`:
```typescript
import { toast } from '@spartan-ng/brain/sonner';

// Inside withEventHandlers:
handleApiError$: events.on(apiErrorOccurred).pipe(
  tap((evt) => toast.error(evt.payload.message, { position: 'top-center' }))
);
```

While this functioned during local interactive development, it broke in GitHub Actions CI during `ng test --watch=false` execution:
1. **Modern Bundler Chunking in Angular 22:** The Angular test builder (`@angular/build:application`) with Vitest splits source code and shared dependencies into optimization chunks (e.g., `chunk-YUTCUJXV.js`, `styles.css`).
2. **Module Mock Isolation Failure:** In `app.store.spec.ts`, `vi.mock('@spartan-ng/brain/sonner')` attempted to intercept calls to `toast`. However, when test files ran in the CI runner, shared vendor chunks had already evaluated and bound the real `@spartan-ng/brain/sonner` module instance.
3. Consequently, the mock was never invoked (`AssertionError: expected "vi.fn()" to be called ... Number of calls: 0`), resulting in CI pipeline failures.

## Decision
We decided to:
1. **Encapsulate Third-Party UI Side-Effects in an Injectable Angular Service**:
   - Create `ToastService` in `src/app/core/services/toast.service.ts` with `@Injectable({ providedIn: 'root' })`.
   - Wrap all Sonner calls (`show`, `success`, `error`, `info`) inside `ToastService`.
2. **Inject `ToastService` into SignalStores via Angular Dependency Injection**:
   - Update `AppStore`'s `withEventHandlers` factory to inject `ToastService` via Angular DI:
     ```typescript
     withEventHandlers((store, events = inject(Events), toastService = inject(ToastService)) => {
       return {
         handleApiError$: events.on(apiErrorOccurred).pipe(
           tap((evt) => toastService.error(evt.payload.message, { position: 'top-center' }))
         ),
         // ...
       };
     });
     ```
3. **Mock Dependencies via Angular TestBed Providers**:
   - Replace fragile bundler-level `vi.mock()` calls with idiomatic Angular DI mocking in `app.store.spec.ts`:
     ```typescript
     TestBed.configureTestingModule({
       providers: [
         AppStore,
         { provide: ToastService, useValue: toastMock }
       ]
     });
     ```

## Alternatives Considered

### Alternative 1: Persist with Vitest `vi.mock()` and Force Single-Thread / No-Chunking
- **Pros:** No new service file required.
- **Cons:** Bypassing the Angular CLI test runner's chunking options requires custom test runner overrides that may diverge from production build behavior. Moreover, Vitest module mocks remain brittle when packages are pre-bundled by esbuild.
- **Rejected:** Fragile and fights the Angular framework's design.

### Alternative 2: Direct Component Template Binding for Toasts
- **Pros:** Keeps toast logic entirely within Angular templates.
- **Cons:** Sonner is an imperative notification system mounted at the application root (`<hlm-toaster />`). Forcing event handlers to update reactive signals just for transient notifications introduces unnecessary state boilerplate.
- **Rejected:** Notifications are transient UI side-effects, not persistent application state.

### Alternative 3: Global Browser Events (`window.dispatchEvent`)
- **Pros:** No Angular DI coupling.
- **Cons:** Breaks SSR compatibility, bypasses Angular zone/signal reactivity, untyped payloads, difficult to unit test.
- **Rejected:** Unsound in structured Angular applications.

## Consequences

### Positive
- **Deterministic Unit Testing:** Tests inject lightweight mock objects via `TestBed.configureTestingModule({ providers: [...] })`, running cleanly in milliseconds across all CI environments regardless of bundler chunking strategies.
- **Architectural Purity:** Adheres to Tomas Trajan 5-layer Angular architecture: core services encapsulate external vendor libraries and provide clean, typed interfaces to the rest of the application.
- **Extensibility:** If the toast library is replaced in the future (e.g., switching from Sonner to another toast primitive), only `ToastService` requires modification; stores and business logic remain untouched.

### Trade-offs / Considerations
- Adds a lightweight service class (`ToastService`) and unit test (`toast.service.spec.ts`) in `core/services/`.
