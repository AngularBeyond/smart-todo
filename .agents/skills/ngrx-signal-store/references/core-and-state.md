### Core State, Computed Signals, & State Management

#### 1. Defining State (`withState`)
Use `withState` to define object literal state slices. Nested properties become `DeepSignal` instances automatically.

```typescript
import { InjectionToken, inject } from '@angular/core';
import { signalStore, withState } from '@ngrx/signals';

export type Filter = { query: string; order: 'asc' | 'desc' };
export type State = { items: string[]; isLoading: boolean; filter: Filter };

const initialState: State = { items: [], isLoading: false, filter: { query: '', order: 'asc' } };

// Standard initialization
export const SharedStore = signalStore(
  { providedIn: 'root' },
  withState(initialState)
);

// Injected initialization (factory signature runs inside injection context)
export const BOOK_STATE = new InjectionToken<State>('BOOK_STATE', { factory: () => initialState });
export const InjectedStore = signalStore(
  withState(() => inject(BOOK_STATE))
);
```

#### 2. Linked State (`withLinkedState`)
Use `withLinkedState` when state slices depend reactively on other signals.

##### Implicit Linking
Pass a computation function; updates automatically when dependent signals change.

```typescript
import { patchState, signalStore, withLinkedState, withMethods, withState } from '@ngrx/signals';

export const OptionsStore = signalStore(
  withState({ options: [1, 2, 3] }),
  withLinkedState(({ options }) => ({
    selectedOption: () => options()[0] ?? undefined,
  })),
  withMethods((store) => ({
    setOptions(options: number[]): void {
      patchState(store, { options });
    },
    setSelectedOption(selectedOption: number): void {
      patchState(store, { selectedOption });
    },
  }))
);
```

##### Explicit Linking
Pass `linkedSignal()` with `source` and `computation` options for complete synchronization.

```typescript
import { linkedSignal } from '@angular/core';
import { signalStore, withLinkedState, withState } from '@ngrx/signals';

export const OptionsStore = signalStore(
  withState({ options: [] as Option[] }),
  withLinkedState(({ options }) => ({
    selectedOption: linkedSignal<Option[], Option>({
      source: options,
      computation: (newOptions, previous) => {
        const option = newOptions.find((o) => o.id === previous?.value.id);
        return option ?? newOptions[0];
      },
    }),
  }))
);
```

#### 3. Computed Signals (`withComputed`)
Derive data using `withComputed`. Factory functions run inside the injection context and receive state signals and properties.

```typescript
import { computed } from '@angular/core';
import { signalStore, withComputed, withState } from '@ngrx/signals';

export const ItemStore = signalStore(
  withState({ items: [] as Item[], filter: { query: '' } }),
  withComputed(({ items, filter }) => ({
    itemCount: computed(() => items().length),
    // Shorthand function (wrapped automatically in computed)
    filteredItems: () => items().filter(i => i.name.includes(filter.query())),
  }))
);
```

#### 4. State Mutations & Methods (`withMethods`)
State changes must be performed inside `withMethods` via `patchState`.

```typescript
import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { ApiService } from './api.service';

export const BookStore = signalStore(
  withState({ books: [], isLoading: false }),
  withMethods((store, apiService = inject(ApiService)) => ({
    updateQuery(query: string): void {
      patchState(store, (state) => ({ filter: { ...state.filter, query } }));
    },
    async loadBooks(): Promise<void> {
      patchState(store, { isLoading: true });
      const books = await apiService.getBooks();
      patchState(store, { books, isLoading: false });
    },
  }))
);
```

#### 5. Encapsulation (`_` Underscore Prefix)
Private state slices, computed signals, properties, and methods are prefixed with `_` to prevent external access.

```typescript
import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';

export const EncapsulatedStore = signalStore(
  withState({
    publicData: 'hello',
    _privateSecret: 42, // Private state slice
  }),
  withComputed(({ publicData, _privateSecret }) => ({
    _internalCalc: computed(() => _privateSecret() * 2), // Private computed
    publicView: computed(() => `${publicData()}: ${_privateSecret()}`),
  })),
  withMethods((store) => ({
    _internalMutate(): void { // Private method
      patchState(store, { _privateSecret: store._privateSecret() + 1 });
    },
    publicAction(): void {
      store._internalMutate();
    },
  }))
);
```

#### 6. Custom Store Properties (`withProps`)
Inject services, expose observables, or define shared constants.

```typescript
import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { signalStore, withProps, withState } from '@ngrx/signals';
import { Logger } from './logger';

export const CustomPropsStore = signalStore(
  withState({ count: 0 }),
  withProps(({ count }) => ({
    logger: inject(Logger),
    count$: toObservable(count),
  }))
);
```

#### 7. Lifecycle Hooks (`withHooks`)
Execute logic on store initialization and destruction.

```typescript
import { inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';
import { patchState, signalStore, withHooks, withMethods, withState } from '@ngrx/signals';
import { Logger } from './logger';

export const LifecycleStore = signalStore(
  withState({ count: 0 }),
  withMethods((store) => ({
    increment(): void {
      patchState(store, (state) => ({ count: state.count + 1 }));
    },
  })),
  // Factory signature supports shared variables & injection context
  withHooks((store) => {
    const logger = inject(Logger);
    return {
      onInit() {
        logger.info('Store initialized');
        interval(1000).pipe(takeUntilDestroyed()).subscribe(() => store.increment());
      },
      onDestroy() {
        logger.info('Final count', store.count());
      },
    };
  })
);
```

#### 8. State Tracking (`getState` & `watchState`)
Track state changes for logging, undo/redo, or persistence.

```typescript
import { effect } from '@angular/core';
import { getState, signalStore, watchState, withHooks, withState } from '@ngrx/signals';

export const TrackingStore = signalStore(
  withState({ count: 0 }),
  withHooks({
    onInit(store) {
      // Coalesced effect logging (runs once per tick)
      effect(() => console.log('Final tick state:', getState(store)));

      // Synchronous observation of every state transition
      watchState(store, (state) => console.log('Immediate change:', state));
    },
  })
);
```
