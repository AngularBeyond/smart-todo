import { computed, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { Dispatcher, Events, withEventHandlers } from '@ngrx/signals/events';
import { catchError, EMPTY, switchMap, tap } from 'rxjs';
import {
  HTTP_ERROR_MESSAGES,
  HttpService,
  setError,
  setFulfilled,
  setPending,
  withRequestStatus,
} from '../index';
import { TodoListSummary, TodoListsResponse } from '../models/todo-list.model';
import {
  loadTodoLists,
  selectTodoList,
  apiErrorOccurred,
} from './events';

export interface TodoListsState {
  lists: TodoListSummary[];
  selectedListId: string | null;
}

export const initialTodoListsState: TodoListsState = {
  lists: [],
  selectedListId: null,
};

export const TodoListsStore = signalStore(
  { providedIn: 'root' },
  withState<TodoListsState>(initialTodoListsState),
  withRequestStatus(),
  withComputed(({ lists, selectedListId }) => ({
    starredLists: computed(() =>
      lists()
        .filter((list) => list.isStarred)
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        ),
    ),
    unstarredLists: computed(() =>
      lists()
        .filter((list) => !list.isStarred)
        .sort((a, b) => a.order - b.order),
    ),
    selectedList: computed(() => {
      const id = selectedListId();
      if (!id) return null;
      return lists().find((list) => list.id === id) ?? null;
    }),
    isQuotaReached: computed(() => lists().length >= 3),
  })),
  withEventHandlers((store) => {
    const events = inject(Events);
    const httpService = inject(HttpService);
    const dispatcher = inject(Dispatcher);

    return {
      loadTodoLists$: events.on(loadTodoLists).pipe(
        tap(() => patchState(store, setPending())),
        switchMap(() =>
          httpService.get<TodoListsResponse>('/api/v1/lists').pipe(
            tap({
              next: (res) => {
                const fetchedLists = res.data?.lists ?? [];
                const currentSelectedId = store.selectedListId();
                const stillValid =
                  currentSelectedId !== null &&
                  fetchedLists.some((l) => l.id === currentSelectedId);

                const firstList =
                  fetchedLists.find((l) => l.isStarred) ?? fetchedLists[0] ?? null;
                const nextSelectedId = stillValid
                  ? currentSelectedId
                  : (firstList?.id ?? null);

                patchState(
                  store,
                  { lists: fetchedLists, selectedListId: nextSelectedId },
                  setFulfilled(),
                );
              },
              error: (err: HttpErrorResponse) => {
                const message =
                  err.error?.message ||
                  (typeof err.error === 'string' ? err.error : null) ||
                  HTTP_ERROR_MESSAGES.UNKNOWN_ERROR;
                patchState(store, setError(message));
                dispatcher.dispatch(apiErrorOccurred({ message }));
              },
            }),
            catchError(() => EMPTY),
          ),
        ),
      ),

      selectTodoList$: events.on(selectTodoList).pipe(
        tap(({ payload }) => {
          patchState(store, { selectedListId: payload.listId });
        }),
      ),
    };
  }),
  withMethods((store) => ({
    selectList(listId: string): void {
      patchState(store, { selectedListId: listId });
    },
    clear(): void {
      patchState(store, initialTodoListsState);
    },
  })),
);
