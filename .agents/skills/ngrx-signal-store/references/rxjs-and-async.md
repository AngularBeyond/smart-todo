### RxJS Integration & @ngrx/operators Best Practices

Use `@ngrx/signals/rxjs-interop` and `@ngrx/operators` for reactive side-effects, API stream management, and safe state evaluation.

---

#### 1. `@ngrx/operators` Package Standards

All utility operators must be imported directly from `@ngrx/operators` (moved from legacy `@ngrx/component-store` and `@ngrx/effects` packages in NgRx v18+).

##### A. `tapResponse`
Safely manages async response streams in `rxMethod` or effects without terminating the outer observable stream when errors occur (internally wraps with `catchError(() => EMPTY)`).

* **Callbacks:** `next`, `error`, `complete`, and `finalize`.
* **Usage:** Always use `tapResponse` inside `rxMethod` or RxJS pipelines when performing HTTP calls or side-effects.

```typescript
import { inject } from '@angular/core';
import { pipe, switchMap, tap } from 'rxjs';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { tapResponse } from '@ngrx/operators';
import { BooksService } from './books-service';

export const BooksStore = signalStore(
  withState({ books: [], isLoading: false }),
  withMethods((store, booksService = inject(BooksService)) => ({
    loadByQuery: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((query) =>
          booksService.getByQuery(query).pipe(
            tapResponse({
              next: (books) => patchState(store, { books }),
              error: (err) => console.error('Failed to load books:', err),
              finalize: () => patchState(store, { isLoading: false }),
            })
          )
        )
      )
    ),
  }))
);
```

##### B. `concatLatestFrom`
Lazily evaluates an Observable/Signal factory function at emission time.

* **Key Advantage over `withLatestFrom`:** Mitigates performance overhead by lazily computing selectors or reading signals only when the source stream emits, preventing eager or premature state evaluation.
* **Usage:** Combine store state or active signals into an RxJS pipe within `rxMethod` or effects.

```typescript
import { inject } from '@angular/core';
import { pipe, switchMap } from 'rxjs';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { concatLatestFrom, tapResponse } from '@ngrx/operators';
import { BooksService } from './books-service';

export const BooksStore = signalStore(
  withState({ books: [], selectedCategoryId: 1 }),
  withMethods((store, booksService = inject(BooksService)) => ({
    refreshCategoryBooks: rxMethod<void>(
      pipe(
        // Lazily reads the current selectedCategoryId signal value when refresh is triggered
        concatLatestFrom(() => store.selectedCategoryId),
        switchMap(([_, categoryId]) =>
          booksService.getByCategory(categoryId).pipe(
            tapResponse({
              next: (books) => patchState(store, { books }),
              error: console.error,
            })
          )
        )
      )
    ),
  }))
);
```

##### C. `mapResponse`
Transforms successful API data or error states into typed objects, events, or actions with minimal boilerplate.

```typescript
import { mapResponse } from '@ngrx/operators';
import { booksApiEvents } from './events';

// Example inside withEventHandlers or RxJS pipeline:
booksService.getAll().pipe(
  mapResponse({
    next: (books) => booksApiEvents.loadedSuccess(books),
    error: (error: { message: string }) => booksApiEvents.loadedFailure(error.message),
  })
);
```

---

#### 2. Reactive Methods (`rxMethod`)

`rxMethod<T>` defines reactive methods that accept static values, signals, computation functions, or observables as input.

```typescript
import { Component, inject, signal } from '@angular/core';
import { of, interval } from 'rxjs';
import { NumbersStore } from './numbers.store';

@Component({ selector: 'app-demo', template: '' })
export class DemoComponent {
  private readonly store = inject(NumbersStore);

  constructor() {
    // 1. Called with static value
    this.store.logNumber(42);

    // 2. Called with Signal (triggers stream whenever signal updates)
    const count = signal(10);
    this.store.logNumber(count);

    // 3. Called with computation function combining multiple signals
    const a = signal(5);
    const b = signal(10);
    this.store.logSum(() => ({ a: a(), b: b() }));

    // 4. Called with Observable (triggers on each emission)
    this.store.logNumber(of(100, 200, 300));
  }
}
```

##### Parameterless `rxMethod`
Specify `rxMethod<void>` for reactive methods without parameters:

```typescript
readonly loadAll = rxMethod<void>(
  switchMap(() =>
    booksService.getAll().pipe(
      tapResponse({
        next: (books) => patchState(store, { books }),
        error: console.error,
      })
    )
  )
);
```

---

#### 3. Injector Hierarchy & Manual Cleanup

* By default, `rxMethod` must be initialized within an injection context and is automatically destroyed when the injector is destroyed.
* **Calling outside injection context:** If invoking `rxMethod` with an Observable or Signal outside an injection context (e.g., inside lifecycle hooks or async callbacks), pass `{ injector }` explicitly:

```typescript
import { Component, inject, Injector, OnInit } from '@angular/core';
import { interval } from 'rxjs';
import { NumbersStore } from './numbers.store';

@Component({ selector: 'app-demo', template: '' })
export class DemoComponent implements OnInit {
  private readonly injector = inject(Injector);
  private readonly store = inject(NumbersStore);

  ngOnInit(): void {
    // Requires explicit injector reference when invoked in lifecycle hooks with Observables
    const sub = this.store.logNumber(interval(1000), { injector: this.injector });

    // Manual cleanup before component destruction if needed
    setTimeout(() => sub.destroy(), 5000);
  }
}
```

---

#### 4. Resource Extensions (`@ngrx/signals/resource`)

Customize Angular `httpResource` behaviors cleanly while preserving original types.

```typescript
import { Component } from '@angular/core';
import { httpResource } from '@angular/common/http';
import {
  extendResource,
  withPreviousValueOnLoading,
  withValueOnError,
} from '@ngrx/signals/resource';

type Todo = { id: number; title: string };

@Component({ selector: 'app-todos', template: '' })
export class TodoListComponent {
  readonly todosResource = extendResource(
    httpResource<Todo[]>(() => '/api/todos'),
    withPreviousValueOnLoading(), // Retains previous page data while reloading
    withValueOnError([])          // Returns empty array fallback on HTTP errors
  );
}
```

##### Global Resource Extensions
Register default resource behavior application-wide or route-wide:

```typescript
import { bootstrapApplication } from '@angular/platform-browser';
import { provideResourceExtensions, withValueOnError } from '@ngrx/signals/resource';
import { AppComponent } from './app.component';

bootstrapApplication(AppComponent, {
  providers: [
    provideResourceExtensions(withValueOnError(null))
  ],
});
```
