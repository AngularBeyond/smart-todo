---
name: angular-feature-store
description: Generates, configures, and tests feature-scoped Angular Signal Stores using @ngrx/signals and RxJS interop. Implements async request status tracking, resilient error handling, component-level provision, and Vitest unit tests. Use when creating or modifying state management within feature modules. Do not use for global application-wide state.
---

# Angular Feature Store

Build robust, testable, feature-scoped Signal Stores using `@ngrx/signals`, RxJS interop, and the standardized `@core` request status feature.

## Core Rules & Architectural Principles

1. **Location:** Every feature store lives strictly inside its feature's `store/` directory:
   `src/app/features/<feature>/store/<store-name>.store.ts`
2. **Component-Scoped Provision:**
   - **Do NOT** add `{ providedIn: 'root' }` to feature stores.
   - Provide the store in the consuming component's `providers: [FeatureStore]` or route providers. This binds store state and lifecycle directly to the view instance and prevents state leaks between page visits.
   - *Exception:* Core public entry points (such as `LoginStore`) may be root-provided if required before authentication shells initialize.
3. **Async State Standardization:** Re-use `withRequestStatus()` from `src/app/core/store/custom-features/request-status.feature.ts` for tracking `idle`, `loading`, `fulfilled`, and error states.
4. **Stream Resilience:** In `rxMethod`, always catch errors on the **inner** observable pipe (`pipe(tap({...}), catchError(() => EMPTY))`). Uncaught errors on the outer stream will terminate the `rxMethod` listener permanently.
5. **Standardized Error Extraction:** Extract `error.error?.message`, `error.error`, or fallback to `HTTP_ERROR_MESSAGES.UNKNOWN_ERROR`.

See [references/feature-store-template.md](references/feature-store-template.md) for the complete store implementation pattern.
See [references/component-integration.md](references/component-integration.md) for component provision and template binding.
See [references/vitest-spec-template.md](references/vitest-spec-template.md) for the Vitest unit test suite.

---

## Workflow: Scaffolding and Implementing a Feature Store

### Step 1: Scaffold Store and Test Files

Run the scaffolding utility to create boilerplate store and spec files:

```bash
.agents/skills/angular-feature-store/scripts/scaffold-feature-store.sh "<feature-store-dir>" "<store-name>"
```

*Example:*
```bash
.agents/skills/angular-feature-store/scripts/scaffold-feature-store.sh "src/app/features/signals/store" "signal-detail"
```

This creates:
- `src/app/features/signals/store/signal-detail.store.ts`
- `src/app/features/signals/store/signal-detail.store.spec.ts`
- Exports the store in `src/app/features/signals/store/index.ts`

### Step 2: Define State & Computed Properties

1. Define the state interface and initial values:
   ```typescript
   export interface MyFeatureState {
     entities: MyEntity[];
     filter: string;
   }

   const initialState: MyFeatureState = {
     entities: [],
     filter: '',
   };
   ```
2. Compose features in `signalStore`:
   ```typescript
   export const MyFeatureStore = signalStore(
     withState(initialState),
     withRequestStatus(),
     withComputed(({ entities, filter }) => ({
       filteredEntities: computed(() =>
         entities().filter((e) => e.name.toLowerCase().includes(filter().toLowerCase()))
       ),
     })),
     // ...
   );
   ```

### Step 3: Implement Methods and RxJS API Calls

Inject dependencies via factory arguments in `withMethods`:

```typescript
withMethods((store, httpService = inject(HttpService), router = inject(Router)) => ({
  loadEntities: rxMethod<void>(
    pipe(
      tap(() => patchState(store, setPending())),
      switchMap(() =>
        httpService.get<ApiResponse<MyEntity[]>>('/v1/entities').pipe(
          tap({
            next: (response) => {
              patchState(store, { entities: response.data }, setFulfilled());
            },
            error: (error: HttpErrorResponse) => {
              const message =
                error.error?.message ||
                (typeof error.error === 'string' ? error.error : null) ||
                HTTP_ERROR_MESSAGES.UNKNOWN_ERROR;
              patchState(store, setError(message));
            },
          }),
          // CRITICAL: Prevent outer stream termination on error
          catchError(() => EMPTY),
        ),
      ),
    ),
  ),

  clearError(): void {
    patchState(store, setIdle());
  },
}))
```

### Step 4: Component Integration

1. Add the store to the component's `providers`:
   ```typescript
   @Component({
     selector: 'app-my-feature-page',
     standalone: true,
     providers: [MyFeatureStore],
     // ...
   })
   export class MyFeaturePage {
     readonly store = inject(MyFeatureStore);
     readonly entities = this.store.filteredEntities;
     readonly isLoading = this.store.isPending;
     readonly error = this.store.error;
   }
   ```
2. Bind template loading and error states:
   - Use `[disabled]="isLoading()"` on actions.
   - Display error alert box when `error()` contains a message.
   - Call `store.clearError()` on user dismissal or form input updates.

### Step 5: Unit Testing with Vitest

Co-locate `<store-name>.store.spec.ts` alongside the store:
1. Provide mock instances for `HttpService` and `Router` in `TestBed.configureTestingModule`.
2. Verify initial state (`isPending() === false`, `error() === null`).
3. Verify successful API calls transition status to `fulfilled` and update state.
4. Verify error handling extracts backend messages and falls back to `HTTP_ERROR_MESSAGES.UNKNOWN_ERROR`.
5. Verify stream resilience: assert that subsequent calls succeed after an initial error.

---

## Verification Commands

Execute the following commands after implementing or modifying a store:

```bash
# 1. Run unit tests for the store
npm test -- --include="src/app/features/<feature>/store/**/*.spec.ts" --watch=false

# 2. Type-check application
npx tsc -p tsconfig.app.json --noEmit

# 3. Lint store files
npx eslint "src/app/features/<feature>/store/**/*.ts"
```
