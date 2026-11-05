import { computed, inject } from '@angular/core';
import { pipe, debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withLinkedState,
  withMethods,
  withState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { addEntity, removeEntity, setAllEntities, withEntities } from '@ngrx/signals/entities';
import { tapResponse } from '@ngrx/operators';
import { Injectable } from '@angular/core';

// 1. Types & Interfaces
export type FeatureItem = {
  id: string;
  name: string;
  category: string;
};

export type Filter = {
  query: string;
  selectedCategory: string | null;
};

// 2. Mock Dependency Service
@Injectable({ providedIn: 'root' })
export class FeatureService {
  async getItems(): Promise<FeatureItem[]> {
    return [];
  }
  getByQuery(query: string) {
    return [];
  }
}

// 3. SignalStore Blueprint
export const FeatureStore = signalStore(
  { providedIn: 'root' },

  // A. Entity Collection Setup
  withEntities<FeatureItem>(),

  // B. State Slice Definitions
  withState({
    isLoading: false,
    filter: { query: '', selectedCategory: null } as Filter,
    _internalSecret: 'encapsulated_value', // Private state slice
  }),

  // C. Linked State Slices
  withLinkedState(({ entities }) => ({
    firstCategory: () => entities()[0]?.category ?? null,
  })),

  // D. Derived Computed Signals
  withComputed(({ entities, filter }) => ({
    totalCount: computed(() => entities().length),
    filteredItems: computed(() => {
      const q = filter.query().toLowerCase();
      const cat = filter.selectedCategory();
      return entities().filter((item) => {
        const matchesQuery = item.name.toLowerCase().includes(q);
        const matchesCat = !cat || item.category === cat;
        return matchesQuery && matchesCat;
      });
    }),
  })),

  // E. Methods & Side Effects
  withMethods((store, featureService = inject(FeatureService)) => ({
    // Public synchronous mutators
    setQuery(query: string): void {
      patchState(store, (state) => ({
        filter: { ...state.filter, query },
      }));
    },
    selectCategory(selectedCategory: string | null): void {
      patchState(store, (state) => ({
        filter: { ...state.filter, selectedCategory },
      }));
    },

    // Entity Updaters
    addItem(item: FeatureItem): void {
      patchState(store, addEntity(item));
    },
    removeItem(id: string): void {
      patchState(store, removeEntity(id));
    },

    // Async Promise Method
    async loadAll(): Promise<void> {
      patchState(store, { isLoading: true });
      try {
        const items = await featureService.getItems();
        patchState(store, setAllEntities(items), { isLoading: false });
      } catch (error) {
        patchState(store, { isLoading: false });
      }
    },

    // RxJS Reactive Method
    searchByQuery: rxMethod<string>(
      pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap(() => patchState(store, { isLoading: true })),
        switchMap((query) =>
          featureService.getByQuery(query).pipe(
            tapResponse({
              next: (items) => patchState(store, setAllEntities(items)),
              error: console.error,
              finalize: () => patchState(store, { isLoading: false }),
            })
          )
        )
      )
    ),
  })),

  // F. Lifecycle Hooks
  withHooks({
    onInit(store) {
      store.loadAll();
    },
    onDestroy(store) {
      console.log('FeatureStore destroyed');
    },
  })
);
