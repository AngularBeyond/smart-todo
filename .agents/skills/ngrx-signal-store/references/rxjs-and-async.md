### RxJS Integration & Async Handling

Use `@ngrx/signals/rxjs-interop` and `@ngrx/operators` for reactive side-effects and API integration.

#### 1. Reactive Methods (`rxMethod`)
`rxMethod<T>` accepts static values, signals, computation functions, or observables as inputs.

```typescript
import { inject } from '@angular/core';
import { pipe, debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { tapResponse } from '@ngrx/operators';
import { BooksService } from './books-service';

export const BooksStore = signalStore(
  withState({ books: [], isLoading: false }),
  withMethods((store, booksService = inject(BooksService)) => ({
    loadByQuery: rxMethod<string>(
      pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap(() => patchState(store, { isLoading: true })),
        switchMap((query) =>
          booksService.getByQuery(query).pipe(
            tapResponse({
              next: (books) => patchState(store, { books }),
              error: console.error,
              finalize: () => patchState(store, { isLoading: false }),
            })
          )
        )
      )
    ),
    // Method without arguments
    loadAll: rxMethod<void>(
      switchMap(() =>
        booksService.getAll().pipe(
          tapResponse({
            next: (books) => patchState(store, { books }),
            error: console.error,
          })
        )
      )
    ),
  }))
);
```

#### 2. Injector Hierarchy & Manual Cleanup
`rxMethod` requires an injection context during initialization. If called outside an injection context with an observable, pass `{ injector }`.

```typescript
import { Component, inject, Injector, OnInit } from '@angular/core';
import { interval, tap } from 'rxjs';
import { rxMethod } from '@ngrx/signals/rxjs-interop';

@Component({ selector: 'app-demo', template: '' })
export class DemoComponent implements OnInit {
  private readonly injector = inject(Injector);
  readonly log = rxMethod<number>(tap(console.log));

  ngOnInit(): void {
    // Requires explicit injector reference when invoked in lifecycle hooks with Observables
    const sub = this.log(interval(1000), { injector: this.injector });

    // Manual cleanup before component destruction
    setTimeout(() => sub.destroy(), 5000);
  }
}
```

#### 3. Resource Extensions (`@ngrx/signals/resource`)
Customize Angular `httpResource` behavior while preserving original types.

```typescript
import { Component } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { extendResource, withPreviousValueOnLoading, withValueOnError } from '@ngrx/signals/resource';

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
Register default resource behavior application-wide:

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
