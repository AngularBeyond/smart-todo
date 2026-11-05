---
name: ngrx-signal-store
description: Teaches coding agents best practices for building, extending, and testing Angular NgRx SignalStores. Use when creating new SignalStores, managing state with withState or withLinkedState, defining computed signals with withComputed, adding methods with withMethods, managing entity collections with withEntities, building reusable custom features with signalStoreFeature, integrating RxJS effects using rxMethod, implementing event-driven architectures with @ngrx/signals/events, or writing unit tests using TestBed and unprotected. Don't use for legacy RxJS-based NgRx Store/Effects (@ngrx/store), component-level local signals without SignalStore, or non-Angular state management.
---

### Angular NgRx SignalStore Engineering Guide

#### Procedures

**Step 1: Determine Store Scope & Foundation**
1. Analyze whether the store manages global application state or component-local state.
2. For global state, configure root injection: `signalStore({ providedIn: 'root' }, ...)`.
3. For component-local state, omit `providedIn` and register the store class in the component's `providers: [MyStore]` array.
4. If starting a new store implementation from scratch, reference `assets/signal-store.template.ts` for standard formatting.

**Step 2: Core State, Computed Signals, and Methods**
1. Read `references/core-and-state.md` to format state definitions, dependent signals, computed properties, and state mutations.
2. Define initial state using `withState({...})` with object literals or a factory function for injected initial state.
3. Use `withLinkedState(({ stateSlice }) => ({ ... }))` when state slices depend reactively on other signals (using implicit computation functions or explicit `linkedSignal()`).
4. Derive state using `withComputed(...)`. Ensure computed properties return values wrapped in `computed()` or plain functions.
5. Add state mutation and side-effect methods via `withMethods((store) => ({ ... }))`. Always perform state mutations using `patchState(store, ...)`.
6. Enforce encapsulation for private state slices, computed signals, and methods by prepending an underscore (`_`) to member names (e.g., `_internalSlice: 0`).

**Step 3: Feature & Architectural Selection (Just-in-Time Loading)**
Evaluate the store requirements and load specific reference documentation only when applicable:

* **If managing collections or relational entities:**
  Read `references/entity-management.md` to implement `@ngrx/signals/entities`, `withEntities`, `entityConfig`, custom `selectId` functions, and named/private entity collections.
* **If building reusable, modular store features:**
  Read `references/custom-features.md` to construct `signalStoreFeature`, configure feature input types using `type<T>()`, avoid TypeScript compilation errors with `withZ<_>()`, or utilize `withFeature`.
* **If integrating RxJS pipelines, API calls, or Angular Resources:**
  Read `references/rxjs-and-async.md` to handle side-effects with `rxMethod`, handle API responses with `tapResponse`, manage injector scope cleanup, or extend Angular Resources via `extendResource`.
* **If implementing an event-driven / decoupled architecture:**
  Read `references/events-plugin.md` to define event creators using `event` or `eventGroup`, create state transitions using `withReducer` and `on()`, attach side-effects with `withEventHandlers`, and handle scoped event dispatching.

**Step 4: Verification & Unit Testing**
1. Read `references/testing-guide.md` to write unit tests for the store and components using Vitest/Jasmine and Angular `TestBed`.
2. Ensure tests verify the store's public API rather than spying on internal implementations.
3. Use `unprotected(store)` from `@ngrx/signals/testing` when direct state patching is required during unit testing.

#### Error Handling

* **TypeScript Compilation Error on Multiple Custom Features:**
  If combining custom features with static inputs throws type errors, add an unused generic parameter to the feature factory function: `function withMyFeature<_>() { return signalStoreFeature(...); }`. Read `references/custom-features.md` for full details.
* **`patchState` Disallowed Error:**
  If `patchState(store, ...)` throws a compilation error regarding protected state, verify that mutations occur inside `withMethods` or `withHooks`. For testing environments, wrap the store instance in `unprotected(store)`.
* **Deprecated `rxMethod` Injection Warning:**
  If `rxMethod` emits a warning about execution outside an injection context, ensure the call is made in a constructor/field initializer or pass `{ injector }` explicitly as the second argument. Read `references/rxjs-and-async.md`.
* **Entity Identifier Missing:**
  If an entity object lacks an `id` property, provide a custom `selectId` function or use `entityConfig({ entity: type<MyType>(), selectId: (item) => item.key })`. Read `references/entity-management.md`.
