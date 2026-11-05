### Events Plugin Architecture (@ngrx/signals/events)

The `@ngrx/signals/events` plugin introduces event-driven state transitions and side-effect handling to SignalStore.

#### 1. Defining Event Creators

##### Using `event` Function
Define standalone event creators using the `[Source] EventName` naming pattern.

```typescript
import { type } from '@ngrx/signals';
import { event } from '@ngrx/signals/events';

export const opened = event('[Book Search Page] Opened');
export const queryChanged = event('[Book Search Page] Query Changed', type<string>());
export const loadedSuccess = event('[Books API] Loaded Success', type<Book[]>());
```

##### Using `eventGroup` Function
Group related events under a common source.

```typescript
import { type } from '@ngrx/signals';
import { eventGroup } from '@ngrx/signals/events';

export const bookSearchEvents = eventGroup({
  source: 'Book Search Page',
  events: {
    opened: type<void>(),
    queryChanged: type<string>(),
  },
});

export const booksApiEvents = eventGroup({
  source: 'Books API',
  events: {
    loadedSuccess: type<Book[]>(),
    loadedFailure: type<string>(),
  },
});
```

#### 2. Defining State Transitions (`withReducer`)
Use `withReducer` and `on()` to map events to state mutations.

```typescript
import { signalStore, withState } from '@ngrx/signals';
import { on, withReducer } from '@ngrx/signals/events';
import { bookSearchEvents, booksApiEvents } from './events';

type BookState = { query: string; books: Book[]; isLoading: boolean };

export const BookSearchStore = signalStore(
  withState<BookState>({ query: '', books: [], isLoading: false }),
  withReducer(
    on(bookSearchEvents.opened, () => ({ isLoading: true })),
    on(bookSearchEvents.queryChanged, ({ payload: query }) => ({ query, isLoading: true })),
    on(booksApiEvents.loadedSuccess, ({ payload: books }) => ({ books, isLoading: false })),
    on(booksApiEvents.loadedFailure, () => ({ isLoading: false }))
  )
);
```

#### 3. Defining Event Handlers (`withEventHandlers`)
Handle side-effects by listening to the `Events` service.

```typescript
import { inject } from '@angular/core';
import { switchMap, tap } from 'rxjs';
import { signalStore, withState } from '@ngrx/signals';
import { Events, withEventHandlers } from '@ngrx/signals/events';
import { mapResponse } from '@ngrx/operators';
import { BooksService } from './books.service';
import { bookSearchEvents, booksApiEvents } from './events';

export const BookSearchStore = signalStore(
  withState({ query: '', books: [] }),
  withEventHandlers((store, events = inject(Events), booksService = inject(BooksService)) => ({
    loadBooks$: events.on(bookSearchEvents.queryChanged).pipe(
      switchMap(({ payload: query }) =>
        booksService.getByQuery(query).pipe(
          mapResponse({
            next: (books) => booksApiEvents.loadedSuccess(books),
            error: (err: { message: string }) => booksApiEvents.loadedFailure(err.message),
          })
        )
      )
    ),
    logError$: events.on(booksApiEvents.loadedFailure).pipe(
      tap(({ payload }) => console.error(payload))
    ),
  }))
);
```

#### 4. Dispatching Events

##### Using `Dispatcher` or `injectDispatch`
Inject `Dispatcher` directly or use `injectDispatch` for auto-generated dispatch methods.

```typescript
import { Component, inject } from '@angular/core';
import { injectDispatch } from '@ngrx/signals/events';
import { bookSearchEvents } from './events';
import { BookSearchStore } from './book-search-store';

@Component({
  selector: 'app-book-search',
  providers: [BookSearchStore],
  template: `
    <input (ngModelChange)="dispatch.queryChanged($event)" />
  `
})
export class BookSearchComponent {
  readonly store = inject(BookSearchStore);
  readonly dispatch = injectDispatch(bookSearchEvents);

  constructor() {
    this.dispatch.opened();
  }
}
```

#### 5. Scoped Events (`provideDispatcher`)
Isolate event scope at the feature/component boundary using `provideDispatcher()`.

```typescript
import { Component, inject } from '@angular/core';
import { injectDispatch, provideDispatcher } from '@ngrx/signals/events';
import { bookSearchEvents } from './events';

@Component({
  selector: 'app-book-search',
  providers: [
    provideDispatcher(), // Creates component-level event bus
    BookSearchStore,
  ],
  template: ''
})
export class BookSearchComponent {
  readonly dispatch = injectDispatch(bookSearchEvents);

  sendLocal(): void {
    this.dispatch.opened(); // Local scope
  }
  sendParent(): void {
    this.dispatch({ scope: 'parent' }).opened(); // Parent scope
  }
  sendGlobal(): void {
    this.dispatch({ scope: 'global' }).opened(); // Application scope
  }
}
```
