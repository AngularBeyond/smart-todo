### Custom Store Features (`signalStoreFeature`)

Use `signalStoreFeature` to construct modular, reusable building blocks across multiple SignalStores.

#### 1. Standalone Features & State Updaters
Define custom features alongside standalone updater functions to support tree-shaking.

```typescript
import { computed } from '@angular/core';
import { signalStoreFeature, withComputed, withState } from '@ngrx/signals';

export type RequestStatus = 'idle' | 'pending' | 'fulfilled' | { error: string };
export type RequestStatusState = { requestStatus: RequestStatus };

// Standalone state updaters
export function setPending(): RequestStatusState { return { requestStatus: 'pending' }; }
export function setFulfilled(): RequestStatusState { return { requestStatus: 'fulfilled' }; }
export function setError(error: string): RequestStatusState { return { requestStatus: { error } }; }

// Feature definition
export function withRequestStatus() {
  return signalStoreFeature(
    withState<RequestStatusState>({ requestStatus: 'idle' }),
    withComputed(({ requestStatus }) => ({
      isPending: computed(() => requestStatus() === 'pending'),
      isFulfilled: computed(() => requestStatus() === 'fulfilled'),
      error: computed(() => {
        const s = requestStatus();
        return typeof s === 'object' ? s.error : null;
      }),
    }))
  );
}
```

#### 2. Custom Features with Input (`type<T>()`)
Specify requirements expected from the host store using `type<T>()`.

##### State Input Requirement

```typescript
import { computed } from '@angular/core';
import { signalStoreFeature, type, withComputed, withState } from '@ngrx/signals';
import { EntityId, EntityState } from '@ngrx/signals/entities';

export type SelectedEntityState = { selectedEntityId: EntityId | null };

export function withSelectedEntity<Entity>() {
  return signalStoreFeature(
    { state: type<EntityState<Entity>>() },
    withState<SelectedEntityState>({ selectedEntityId: null }),
    withComputed(({ entityMap, selectedEntityId }) => ({
      selectedEntity: computed(() => {
        const id = selectedEntityId();
        return id ? entityMap()[id] : null;
      }),
    }))
  );
}
```

##### Props and Methods Input Requirements

```typescript
import { Signal } from '@angular/core';
import { signalStoreFeature, type, withMethods } from '@ngrx/signals';

export function withBaz<Foo extends string | number>() {
  return signalStoreFeature(
    {
      props: type<{ foo: Signal<Foo> }>(),
      methods: type<{ bar(foo: number): void }>(),
    },
    withMethods((store) => ({
      baz(): void {
        const val = store.foo();
        store.bar(typeof val === 'number' ? val : Number(val));
      },
    }))
  );
}
```

#### 3. Utilizing `withFeature`
Pass parameters dynamically into features without coupling to rigid store inputs.

```typescript
import { Signal, computed } from '@angular/core';
import { patchState, signalStore, signalStoreFeature, withComputed, withFeature, withMethods, withState } from '@ngrx/signals';
import { withEntities } from '@ngrx/signals/entities';

export type Book = { id: number; name: string };

export function withBooksFilter(books: Signal<Book[]>) {
  return signalStoreFeature(
    withState({ query: '' }),
    withComputed(({ query }) => ({
      filteredBooks: computed(() => books().filter((b) => b.name.includes(query()))),
    })),
    withMethods((store) => ({
      setQuery(query: string): void {
        patchState(store, { query });
      },
    }))
  );
}

export const BooksStore = signalStore(
  withEntities<Book>(),
  withFeature(({ entities }) => withBooksFilter(entities))
);
```

#### 4. TypeScript Generic Constraint Workaround
When combining multiple custom features with static input and no generic parameters, TypeScript may throw compilation errors. Solve this by adding an unused generic parameter (`<_>`).

```typescript
import { signalStore, signalStoreFeature, type, withState } from '@ngrx/signals';

// Add unused generic `<_>` to avoid TS union inference issues
function withFeatureA<_>() {
  return signalStoreFeature(
    { state: type<{ x: number }>() },
    withState({ z: 10 })
  );
}

function withFeatureB<_>() {
  return signalStoreFeature(
    { state: type<{ y: number }>() },
    withState({ w: 100 })
  );
}

export const CombinedStore = signalStore(
  withState({ x: 10, y: 100 }),
  withFeatureA(),
  withFeatureB()
);
```
