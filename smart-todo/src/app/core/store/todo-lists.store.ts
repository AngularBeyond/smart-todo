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
  setIdle,
  setPending,
  withRequestStatus,
} from '../index';
import {
  TodoListSummary,
  TodoListsResponse,
  TodoListResponse,
  DeleteTodoListResponse,
} from '../models/todo-list.model';
import { calculateNewOrder } from '../pure-functions/order-calculator.util';
import {
  loadTodoLists,
  selectTodoList,
  createTodoList,
  renameTodoList,
  toggleStarTodoList,
  reorderUnstarredList,
  deleteTodoList,
  adjustListCounts,
  apiErrorOccurred,
  apiSuccessOccurred,
  userLogout,
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
  withEventHandlers(
    (
      store,
      events = inject(Events),
      httpService = inject(HttpService),
      dispatcher = inject(Dispatcher),
    ) => {
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

                const firstStarred = [...fetchedLists]
                  .filter((l) => l.isStarred)
                  .sort(
                    (a, b) =>
                      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
                  )[0];
                const fallbackList = fetchedLists[0] ?? null;
                const preferredList = firstStarred ?? fallbackList;

                const nextSelectedId = stillValid
                  ? currentSelectedId
                  : (preferredList?.id ?? null);

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

      createTodoList$: events.on(createTodoList).pipe(
        tap(() => patchState(store, setPending())),
        switchMap(({ payload }) =>
          httpService
            .post<TodoListResponse>('/api/v1/lists', { name: payload.name })
            .pipe(
              tap({
                next: (res) => {
                  const newList = res.data.list;
                  patchState(
                    store,
                    {
                      lists: [...store.lists(), newList],
                      selectedListId: newList.id,
                    },
                    setFulfilled(),
                  );
                  dispatcher.dispatch(
                    apiSuccessOccurred({
                      message: 'Todo list created successfully.',
                    }),
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

      renameTodoList$: events.on(renameTodoList).pipe(
        switchMap(({ payload }) => {
          const previousLists = store.lists();
          patchState(store, {
            lists: previousLists.map((l) =>
              l.id === payload.listId ? { ...l, name: payload.name } : l,
            ),
          });

          return httpService
            .patch<TodoListResponse>(`/api/v1/lists/${payload.listId}`, {
              name: payload.name,
            })
            .pipe(
              tap({
                next: (res) => {
                  const updatedList = res.data.list;
                  patchState(store, {
                    lists: store
                      .lists()
                      .map((l) => (l.id === updatedList.id ? updatedList : l)),
                  });
                },
                error: (err: HttpErrorResponse) => {
                  const message =
                    err.error?.message ||
                    (typeof err.error === 'string' ? err.error : null) ||
                    HTTP_ERROR_MESSAGES.UNKNOWN_ERROR;
                  patchState(
                    store,
                    { lists: previousLists },
                    setError(message),
                  );
                  dispatcher.dispatch(apiErrorOccurred({ message }));
                },
              }),
              catchError(() => EMPTY),
            );
        }),
      ),

      toggleStarTodoList$: events.on(toggleStarTodoList).pipe(
        switchMap(({ payload }) => {
          const targetList = store
            .lists()
            .find((l) => l.id === payload.listId);
          if (!targetList) return EMPTY;

          const previousLists = store.lists();
          const nextIsStarred = !targetList.isStarred;

          patchState(store, {
            lists: previousLists.map((l) =>
              l.id === payload.listId
                ? {
                    ...l,
                    isStarred: nextIsStarred,
                    updatedAt: new Date().toISOString(),
                  }
                : l,
            ),
          });

          return httpService
            .patch<TodoListResponse>(`/api/v1/lists/${payload.listId}`, {
              isStarred: nextIsStarred,
            })
            .pipe(
              tap({
                next: (res) => {
                  const updatedList = res.data.list;
                  patchState(store, {
                    lists: store
                      .lists()
                      .map((l) => (l.id === updatedList.id ? updatedList : l)),
                  });
                },
                error: (err: HttpErrorResponse) => {
                  const message =
                    err.error?.message ||
                    (typeof err.error === 'string' ? err.error : null) ||
                    HTTP_ERROR_MESSAGES.UNKNOWN_ERROR;
                  patchState(
                    store,
                    { lists: previousLists },
                    setError(message),
                  );
                  dispatcher.dispatch(apiErrorOccurred({ message }));
                },
              }),
              catchError(() => EMPTY),
            );
        }),
      ),

      reorderUnstarredList$: events.on(reorderUnstarredList).pipe(
        switchMap(({ payload }) => {
          const currentUnstarred = store.unstarredLists();
          const targetList = currentUnstarred.find(
            (l) => l.id === payload.listId,
          );
          if (!targetList) return EMPTY;

          const previousLists = store.lists();
          const unstarredWithoutItem = currentUnstarred.filter(
            (l) => l.id !== payload.listId,
          );
          const newOrder = calculateNewOrder(
            unstarredWithoutItem,
            payload.targetIndex,
          );

          patchState(store, {
            lists: previousLists.map((l) =>
              l.id === payload.listId ? { ...l, order: newOrder } : l,
            ),
          });

          return httpService
            .patch<TodoListResponse>(
              `/api/v1/lists/${payload.listId}/reorder`,
              { order: newOrder },
            )
            .pipe(
              tap({
                next: (res) => {
                  const updatedList = res.data.list;
                  patchState(store, {
                    lists: store
                      .lists()
                      .map((l) => (l.id === updatedList.id ? updatedList : l)),
                  });
                },
                error: (err: HttpErrorResponse) => {
                  const message =
                    err.error?.message ||
                    (typeof err.error === 'string' ? err.error : null) ||
                    HTTP_ERROR_MESSAGES.UNKNOWN_ERROR;
                  patchState(
                    store,
                    { lists: previousLists },
                    setError(message),
                  );
                  dispatcher.dispatch(apiErrorOccurred({ message }));
                },
              }),
              catchError(() => EMPTY),
            );
        }),
      ),

      adjustListCounts$: events.on(adjustListCounts).pipe(
        tap(({ payload }) => {
          patchState(store, {
            lists: store.lists().map((list) => {
              if (list.id !== payload.listId) return list;
              return {
                ...list,
                totalCount: Math.max(
                  0,
                  list.totalCount + (payload.totalDelta ?? 0),
                ),
                activeCount: Math.max(
                  0,
                  list.activeCount + (payload.activeDelta ?? 0),
                ),
              };
            }),
          });
        }),
      ),

      deleteTodoList$: events.on(deleteTodoList).pipe(
        switchMap(({ payload }) =>
          httpService
            .delete<DeleteTodoListResponse>(`/api/v1/lists/${payload.listId}`)
            .pipe(
              tap({
                next: () => {
                  const remainingLists = store
                    .lists()
                    .filter((l) => l.id !== payload.listId);

                  let nextSelectedId = store.selectedListId();
                  if (nextSelectedId === payload.listId) {
                    const nextStarred = [...remainingLists]
                      .filter((l) => l.isStarred)
                      .sort(
                        (a, b) =>
                          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
                      )[0];
                    const nextFallback = remainingLists[0] ?? null;
                    const nextList = nextStarred ?? nextFallback;
                    nextSelectedId = nextList?.id ?? null;
                  }

                  patchState(
                    store,
                    {
                      lists: remainingLists,
                      selectedListId: nextSelectedId,
                    },
                    setFulfilled(),
                  );

                  dispatcher.dispatch(
                    apiSuccessOccurred({
                      message: 'Todo list deleted successfully.',
                    }),
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

      userLogout$: events.on(userLogout).pipe(
        tap(() => {
          patchState(store, initialTodoListsState, setIdle());
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
