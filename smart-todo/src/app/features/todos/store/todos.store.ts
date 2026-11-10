import { HttpErrorResponse } from '@angular/common/http';
import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { Dispatcher } from '@ngrx/signals/events';
import { tapResponse } from '@ngrx/operators';
import { EMPTY, of, pipe } from 'rxjs';
import { concatMap, exhaustMap, filter, switchMap, tap } from 'rxjs/operators';
import {
  adjustListCounts,
  apiInfoOccurred,
  calculateNewOrder,
  HTTP_ERROR_MESSAGES,
  HttpService,
  setError,
  setFulfilled,
  setPending,
  withRequestStatus,
} from '@core';
import {
  DeleteTodoResponse,
  PaginatedTodosResponse,
  TodoItem,
  TodoResponse,
} from '../models';

export interface TodosState {
  currentListId: string | null;
  viewMode: 'list' | 'all' | 'starred';
  activeTodos: TodoItem[];
  completedTodos: TodoItem[];
  activeCursor: string | null;
  completedCursor: string | null;
  hasMoreActive: boolean;
  hasMoreCompleted: boolean;
  isCompletedExpanded: boolean;
  totalCount: number;
  activeCount: number;
  completedCount: number;
  activeLoading: boolean;
  completedLoading: boolean;
  query: string;
  isSearching: boolean;
  searchActiveTodos: TodoItem[];
  searchCompletedTodos: TodoItem[];
  preSearchExpandedState: boolean | null;
  newTask: string;
  editingId: string | number | null;
  editValue: string;
}

export const initialTodosState: TodosState = {
  currentListId: null,
  viewMode: 'list',
  activeTodos: [],
  completedTodos: [],
  activeCursor: null,
  completedCursor: null,
  hasMoreActive: false,
  hasMoreCompleted: false,
  isCompletedExpanded: false,
  totalCount: 0,
  activeCount: 0,
  completedCount: 0,
  activeLoading: false,
  completedLoading: false,
  query: '',
  isSearching: false,
  searchActiveTodos: [],
  searchCompletedTodos: [],
  preSearchExpandedState: null,
  newTask: '',
  editingId: null,
  editValue: '',
};

export const TodosStore = signalStore(
  withState<TodosState>(initialTodosState),
  withRequestStatus(),
  withComputed(({ activeTodos, completedTodos, totalCount, completedCount, query, searchActiveTodos, searchCompletedTodos, isCompletedExpanded, viewMode }) => ({
    isAllTasks: computed(() => viewMode() === 'all'),
    isStarredTasks: computed(() => viewMode() === 'starred'),
    isAggregateView: computed(() => viewMode() === 'all' || viewMode() === 'starred'),
    isQuotaReached: computed(() => totalCount() >= 40),
    quotaBadgeText: computed(() => `${totalCount()}/40`),
    progressPercentage: computed(() => {
      const total = totalCount();
      if (total === 0) return 100;
      return Math.round((completedCount() / total) * 100);
    }),
    isSearchActive: computed(() => query().trim().length > 0),
    visibleActiveTodos: computed(() => {
      if (query().trim().length > 0) {
        return searchActiveTodos();
      }
      return activeTodos();
    }),
    visibleCompletedTodos: computed(() => {
      if (query().trim().length > 0) {
        return searchCompletedTodos();
      }
      return completedTodos();
    }),
    // Backward-compatibility aliases for existing mockup templates
    tasks: computed(() => (query().trim().length > 0 ? searchActiveTodos() : activeTodos())),
    completed: computed(() => (query().trim().length > 0 ? searchCompletedTodos() : completedTodos())),
    showCompleted: computed(() => isCompletedExpanded()),
    visibleTasks: computed(() => (query().trim().length > 0 ? searchActiveTodos() : activeTodos())),
    activeList: computed(() => 'My Tasks'),
  })),
  withMethods(
    (
      store,
      httpService = inject(HttpService),
      dispatcher = inject(Dispatcher),
    ) => {
      const loadMoreCompletedTodos = rxMethod<void>(
        pipe(
          filter(() => {
            const listId = store.currentListId();
            const loading = store.completedLoading();
            if (store.isSearchActive() || (!listId && !store.isAggregateView()) || loading) return false;
            if (store.completedTodos().length > 0 && !store.hasMoreCompleted()) return false;
            return true;
          }),
          tap(() => patchState(store, { completedLoading: true })),
          exhaustMap(() => {
            const cursor = store.completedCursor();
            let url: string;
            if (store.viewMode() === 'starred') {
              url = `/api/v1/todos?completed=true&limit=20&starred=true${cursor ? `&cursor=${cursor}` : ''}`;
            } else if (store.viewMode() === 'all') {
              url = `/api/v1/todos?completed=true&limit=20${cursor ? `&cursor=${cursor}` : ''}`;
            } else {
              url = `/api/v1/lists/${store.currentListId()}/todos?completed=true&limit=20${cursor ? `&cursor=${cursor}` : ''}`;
            }
            return httpService.get<PaginatedTodosResponse>(url).pipe(
              tapResponse({
                next: (response) => {
                  const data = response.data;
                  const existingIds = new Set(store.completedTodos().map((t) => t.id));
                  const newItems = data.items.filter((item) => !existingIds.has(item.id));
                  patchState(store, {
                    completedTodos: [...store.completedTodos(), ...newItems],
                    completedCursor: data.nextCursor,
                    hasMoreCompleted: data.hasMore,
                    completedLoading: false,
                  });
                },
                error: (error: HttpErrorResponse) => {
                  const message =
                    error.error?.message ||
                    (typeof error.error === 'string' ? error.error : null) ||
                    HTTP_ERROR_MESSAGES.UNKNOWN_ERROR;
                  patchState(store, { completedLoading: false }, setError(message));
                },
              }),
            );
          }),
        ),
      );

      const loadInitialForList = rxMethod<string>(
        pipe(
          tap((listId) => {
            patchState(
              store,
              {
                currentListId: listId,
                viewMode: 'list',
                activeTodos: [],
                completedTodos: [],
                activeCursor: null,
                completedCursor: null,
                hasMoreActive: false,
                hasMoreCompleted: false,
                isCompletedExpanded: false,
                totalCount: 0,
                activeCount: 0,
                completedCount: 0,
                activeLoading: true,
                completedLoading: false,
                query: '',
                isSearching: false,
                searchActiveTodos: [],
                searchCompletedTodos: [],
                preSearchExpandedState: null,
              },
              setPending(),
            );
          }),
          switchMap((listId) =>
            httpService
              .get<PaginatedTodosResponse>(`/api/v1/lists/${listId}/todos?completed=false&limit=20`)
              .pipe(
                tapResponse({
                  next: (response) => {
                    const data = response.data;
                    patchState(
                      store,
                      {
                        activeTodos: data.items,
                        activeCursor: data.nextCursor,
                        hasMoreActive: data.hasMore,
                        hasMoreCompleted: data.meta.completedCount > 0,
                        totalCount: data.meta.totalCount,
                        activeCount: data.meta.activeCount,
                        completedCount: data.meta.completedCount,
                        activeLoading: false,
                      },
                      setFulfilled(),
                    );
                  },
                  error: (error: HttpErrorResponse) => {
                    const message =
                      error.error?.message ||
                      (typeof error.error === 'string' ? error.error : null) ||
                      HTTP_ERROR_MESSAGES.UNKNOWN_ERROR;
                    patchState(store, { activeLoading: false }, setError(message));
                  },
                }),
              ),
          ),
        ),
      );

      const loadInitialAllTodos = rxMethod<void>(
        pipe(
          tap(() => {
            patchState(
              store,
              {
                currentListId: null,
                viewMode: 'all',
                activeTodos: [],
                completedTodos: [],
                activeCursor: null,
                completedCursor: null,
                hasMoreActive: false,
                hasMoreCompleted: false,
                isCompletedExpanded: false,
                totalCount: 0,
                activeCount: 0,
                completedCount: 0,
                activeLoading: true,
                completedLoading: false,
                query: '',
                isSearching: false,
                searchActiveTodos: [],
                searchCompletedTodos: [],
                preSearchExpandedState: null,
              },
              setPending(),
            );
          }),
          switchMap(() =>
            httpService
              .get<PaginatedTodosResponse>('/api/v1/todos?completed=false&limit=20')
              .pipe(
                tapResponse({
                  next: (response) => {
                    const data = response.data;
                    patchState(
                      store,
                      {
                        activeTodos: data.items,
                        activeCursor: data.nextCursor,
                        hasMoreActive: data.hasMore,
                        hasMoreCompleted: data.meta.completedCount > 0,
                        totalCount: data.meta.totalCount,
                        activeCount: data.meta.activeCount,
                        completedCount: data.meta.completedCount,
                        activeLoading: false,
                      },
                      setFulfilled(),
                    );
                  },
                  error: (error: HttpErrorResponse) => {
                    const message =
                      error.error?.message ||
                      (typeof error.error === 'string' ? error.error : null) ||
                      HTTP_ERROR_MESSAGES.UNKNOWN_ERROR;
                    patchState(store, { activeLoading: false }, setError(message));
                  },
                }),
              ),
          ),
        ),
      );

      const loadInitialStarredTodos = rxMethod<void>(
        pipe(
          tap(() => {
            patchState(
              store,
              {
                currentListId: null,
                viewMode: 'starred',
                activeTodos: [],
                completedTodos: [],
                activeCursor: null,
                completedCursor: null,
                hasMoreActive: false,
                hasMoreCompleted: false,
                isCompletedExpanded: false,
                totalCount: 0,
                activeCount: 0,
                completedCount: 0,
                activeLoading: true,
                completedLoading: false,
                query: '',
                isSearching: false,
                searchActiveTodos: [],
                searchCompletedTodos: [],
                preSearchExpandedState: null,
              },
              setPending(),
            );
          }),
          switchMap(() =>
            httpService
              .get<PaginatedTodosResponse>('/api/v1/todos?completed=false&limit=20&starred=true')
              .pipe(
                tapResponse({
                  next: (response) => {
                    const data = response.data;
                    patchState(
                      store,
                      {
                        activeTodos: data.items,
                        activeCursor: data.nextCursor,
                        hasMoreActive: data.hasMore,
                        hasMoreCompleted: data.meta.completedCount > 0,
                        totalCount: data.meta.totalCount,
                        activeCount: data.meta.activeCount,
                        completedCount: data.meta.completedCount,
                        activeLoading: false,
                      },
                      setFulfilled(),
                    );
                  },
                  error: (error: HttpErrorResponse) => {
                    const message =
                      error.error?.message ||
                      (typeof error.error === 'string' ? error.error : null) ||
                      HTTP_ERROR_MESSAGES.UNKNOWN_ERROR;
                    patchState(store, { activeLoading: false }, setError(message));
                  },
                }),
              ),
          ),
        ),
      );

    const loadMoreActiveTodos = rxMethod<void>(
      pipe(
        filter(() => {
          const listId = store.currentListId();
          const hasMore = store.hasMoreActive();
          const loading = store.activeLoading();
          return (!!listId || store.isAggregateView()) && hasMore && !loading;
        }),
        tap(() => patchState(store, { activeLoading: true })),
        exhaustMap(() => {
          const cursor = store.activeCursor();
          let url: string;
          if (store.viewMode() === 'starred') {
            url = `/api/v1/todos?completed=false&limit=20&starred=true${cursor ? `&cursor=${cursor}` : ''}`;
          } else if (store.viewMode() === 'all') {
            url = `/api/v1/todos?completed=false&limit=20${cursor ? `&cursor=${cursor}` : ''}`;
          } else {
            url = `/api/v1/lists/${store.currentListId()}/todos?completed=false&limit=20${cursor ? `&cursor=${cursor}` : ''}`;
          }
          return httpService.get<PaginatedTodosResponse>(url).pipe(
            tapResponse({
              next: (response) => {
                const data = response.data;
                patchState(store, {
                  activeTodos: [...store.activeTodos(), ...data.items],
                  activeCursor: data.nextCursor,
                  hasMoreActive: data.hasMore,
                  activeLoading: false,
                });
              },
              error: (error: HttpErrorResponse) => {
                const message =
                  error.error?.message ||
                  (typeof error.error === 'string' ? error.error : null) ||
                  HTTP_ERROR_MESSAGES.UNKNOWN_ERROR;
                patchState(store, { activeLoading: false }, setError(message));
              },
            }),
          );
        }),
      ),
    );

    const createTodo = rxMethod<{ text: string }>(
      pipe(
        filter(({ text }) => {
          if (store.isAggregateView()) return false;
          const listId = store.currentListId();
          const trimmed = text?.trim();
          return !!listId && !!trimmed && !store.isQuotaReached();
        }),
        concatMap(({ text }) => {
          const listId = store.currentListId()!;
          const trimmed = text.trim();
          const tempId = `temp-${Date.now()}`;
          const tempTodo: TodoItem = {
            id: tempId,
            listId,
            userId: '',
            text: trimmed,
            isCompleted: false,
            order: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            meta: 'Just now',
            tag: 'Inbox',
            done: false,
          };

          // Optimistic create
          patchState(store, {
            activeTodos: [tempTodo, ...store.activeTodos()],
            newTask: '',
            totalCount: store.totalCount() + 1,
            activeCount: store.activeCount() + 1,
          });
          dispatcher.dispatch(adjustListCounts({ listId, totalDelta: 1, activeDelta: 1 }));

          return httpService
            .post<TodoResponse>(`/api/v1/lists/${listId}/todos`, { text: trimmed })
            .pipe(
              tapResponse({
                next: (response) => {
                  const realTodo = response.data.todo;
                  patchState(store, {
                    activeTodos: store.activeTodos().map((t) => (t.id === tempId ? realTodo : t)),
                  });
                },
                error: (error: HttpErrorResponse) => {
                  // Rollback
                  patchState(store, {
                    activeTodos: store.activeTodos().filter((t) => t.id !== tempId),
                    totalCount: Math.max(0, store.totalCount() - 1),
                    activeCount: Math.max(0, store.activeCount() - 1),
                  });
                  dispatcher.dispatch(adjustListCounts({ listId, totalDelta: -1, activeDelta: -1 }));
                  const message =
                    error.error?.message ||
                    (typeof error.error === 'string' ? error.error : null) ||
                    HTTP_ERROR_MESSAGES.UNKNOWN_ERROR;
                  patchState(store, setError(message));
                },
              }),
            );
        }),
      ),
    );

    const updateTodoText = rxMethod<{ todoId: string; text: string }>(
      pipe(
        filter(({ todoId, text }) => {
          return !!todoId && !!text?.trim();
        }),
        concatMap(({ todoId, text }) => {
          const trimmed = text.trim();
          const existing =
            store.activeTodos().find((t) => t.id === todoId) ||
            store.completedTodos().find((t) => t.id === todoId);
          if (!existing || existing.text === trimmed) {
            patchState(store, { editingId: null, editValue: '' });
            return EMPTY;
          }

          const listId = existing.listId || store.currentListId();
          if (!listId) return EMPTY;

          const previousText = existing.text;
          const wasCompleted = existing.isCompleted;

          // Optimistic update
          if (wasCompleted) {
            patchState(store, {
              completedTodos: store.completedTodos().map((t) => (t.id === todoId ? { ...t, text: trimmed } : t)),
              searchCompletedTodos: store.searchCompletedTodos().map((t) => (t.id === todoId ? { ...t, text: trimmed } : t)),
              editingId: null,
              editValue: '',
            });
          } else {
            patchState(store, {
              activeTodos: store.activeTodos().map((t) => (t.id === todoId ? { ...t, text: trimmed } : t)),
              searchActiveTodos: store.searchActiveTodos().map((t) => (t.id === todoId ? { ...t, text: trimmed } : t)),
              editingId: null,
              editValue: '',
            });
          }

          return httpService
            .patch<TodoResponse>(`/api/v1/lists/${listId}/todos/${todoId}`, { text: trimmed })
            .pipe(
              tapResponse({
                next: (response) => {
                  const updated = response.data.todo;
                  if (wasCompleted) {
                    patchState(store, {
                      completedTodos: store.completedTodos().map((t) => (t.id === todoId ? updated : t)),
                      searchCompletedTodos: store.searchCompletedTodos().map((t) => (t.id === todoId ? updated : t)),
                    });
                  } else {
                    patchState(store, {
                      activeTodos: store.activeTodos().map((t) => (t.id === todoId ? updated : t)),
                      searchActiveTodos: store.searchActiveTodos().map((t) => (t.id === todoId ? updated : t)),
                    });
                  }
                },
                error: (error: HttpErrorResponse) => {
                  // Rollback
                  if (wasCompleted) {
                    patchState(store, {
                      completedTodos: store.completedTodos().map((t) => (t.id === todoId ? { ...t, text: previousText } : t)),
                      searchCompletedTodos: store.searchCompletedTodos().map((t) => (t.id === todoId ? { ...t, text: previousText } : t)),
                    });
                  } else {
                    patchState(store, {
                      activeTodos: store.activeTodos().map((t) => (t.id === todoId ? { ...t, text: previousText } : t)),
                      searchActiveTodos: store.searchActiveTodos().map((t) => (t.id === todoId ? { ...t, text: previousText } : t)),
                    });
                  }
                  const message =
                    error.error?.message ||
                    (typeof error.error === 'string' ? error.error : null) ||
                    HTTP_ERROR_MESSAGES.UNKNOWN_ERROR;
                  patchState(store, setError(message));
                },
              }),
            );
        }),
      ),
    );

    const toggleTodoCompletion = rxMethod<TodoItem>(
      pipe(
        filter((todo) => (!!store.currentListId() || !!todo?.listId) && !!todo),
        concatMap((todo) => {
          const listId = todo.listId || store.currentListId()!;
          const targetIsCompleted = !todo.isCompleted;

          if (targetIsCompleted) {
            // Completing
            patchState(store, {
              activeTodos: store.activeTodos().filter((t) => t.id !== todo.id),
              completedTodos: [{ ...todo, isCompleted: true, done: true }, ...store.completedTodos()],
              searchActiveTodos: store.searchActiveTodos().filter((t) => t.id !== todo.id),
              searchCompletedTodos: [{ ...todo, isCompleted: true, done: true }, ...store.searchCompletedTodos()],
              activeCount: Math.max(0, store.activeCount() - 1),
              completedCount: store.completedCount() + 1,
            });
            dispatcher.dispatch(adjustListCounts({ listId, activeDelta: -1 }));
          } else {
            // Uncompleting (Uncomplete-to-Top)
            patchState(store, {
              completedTodos: store.completedTodos().filter((t) => t.id !== todo.id),
              activeTodos: [{ ...todo, isCompleted: false, done: false }, ...store.activeTodos()],
              searchCompletedTodos: store.searchCompletedTodos().filter((t) => t.id !== todo.id),
              searchActiveTodos: [{ ...todo, isCompleted: false, done: false }, ...store.searchActiveTodos()],
              activeCount: store.activeCount() + 1,
              completedCount: Math.max(0, store.completedCount() - 1),
            });
            dispatcher.dispatch(adjustListCounts({ listId, activeDelta: 1 }));
          }

          return httpService
            .patch<TodoResponse>(`/api/v1/lists/${listId}/todos/${todo.id}`, { isCompleted: targetIsCompleted })
            .pipe(
              tapResponse({
                next: (response) => {
                  const updated = response.data.todo;
                  if (targetIsCompleted) {
                    patchState(store, {
                      completedTodos: store.completedTodos().map((t) => (t.id === todo.id ? updated : t)),
                      searchCompletedTodos: store.searchCompletedTodos().map((t) => (t.id === todo.id ? updated : t)),
                    });
                    dispatcher.dispatch(apiInfoOccurred({ message: 'Task completed' }));
                  } else {
                    patchState(store, {
                      activeTodos: store.activeTodos().map((t) => (t.id === todo.id ? updated : t)),
                      searchActiveTodos: store.searchActiveTodos().map((t) => (t.id === todo.id ? updated : t)),
                    });
                  }
                },
                error: (error: HttpErrorResponse) => {
                  // Rollback
                  if (targetIsCompleted) {
                    patchState(store, {
                      completedTodos: store.completedTodos().filter((t) => t.id !== todo.id),
                      activeTodos: [todo, ...store.activeTodos()],
                      searchCompletedTodos: store.searchCompletedTodos().filter((t) => t.id !== todo.id),
                      searchActiveTodos: [todo, ...store.searchActiveTodos()],
                      activeCount: store.activeCount() + 1,
                      completedCount: Math.max(0, store.completedCount() - 1),
                    });
                    dispatcher.dispatch(adjustListCounts({ listId, activeDelta: 1 }));
                  } else {
                    patchState(store, {
                      activeTodos: store.activeTodos().filter((t) => t.id !== todo.id),
                      completedTodos: [todo, ...store.completedTodos()],
                      searchActiveTodos: store.searchActiveTodos().filter((t) => t.id !== todo.id),
                      searchCompletedTodos: [todo, ...store.searchCompletedTodos()],
                      activeCount: Math.max(0, store.activeCount() - 1),
                      completedCount: store.completedCount() + 1,
                    });
                    dispatcher.dispatch(adjustListCounts({ listId, activeDelta: -1 }));
                  }
                  const message =
                    error.error?.message ||
                    (typeof error.error === 'string' ? error.error : null) ||
                    HTTP_ERROR_MESSAGES.UNKNOWN_ERROR;
                  patchState(store, setError(message));
                },
              }),
            );
        }),
      ),
    );

    const deleteTodo = rxMethod<TodoItem>(
      pipe(
        filter((todo) => (!!store.currentListId() || !!todo?.listId) && !!todo),
        concatMap((todo) => {
          const listId = todo.listId || store.currentListId()!;
          const wasCompleted = todo.isCompleted;

          if (wasCompleted) {
            patchState(store, {
              completedTodos: store.completedTodos().filter((t) => t.id !== todo.id),
              searchCompletedTodos: store.searchCompletedTodos().filter((t) => t.id !== todo.id),
              totalCount: Math.max(0, store.totalCount() - 1),
              completedCount: Math.max(0, store.completedCount() - 1),
            });
            dispatcher.dispatch(adjustListCounts({ listId, totalDelta: -1, activeDelta: 0 }));
          } else {
            patchState(store, {
              activeTodos: store.activeTodos().filter((t) => t.id !== todo.id),
              searchActiveTodos: store.searchActiveTodos().filter((t) => t.id !== todo.id),
              totalCount: Math.max(0, store.totalCount() - 1),
              activeCount: Math.max(0, store.activeCount() - 1),
            });
            dispatcher.dispatch(adjustListCounts({ listId, totalDelta: -1, activeDelta: -1 }));
          }

          return httpService
            .delete<DeleteTodoResponse>(`/api/v1/lists/${listId}/todos/${todo.id}`)
            .pipe(
              tapResponse({
                next: (response) => {
                  if (response.data?.counts) {
                    patchState(store, {
                      totalCount: response.data.counts.totalCount,
                      activeCount: response.data.counts.activeCount,
                      completedCount: response.data.counts.completedCount,
                    });
                  }
                },
                error: (error: HttpErrorResponse) => {
                  // Rollback
                  if (wasCompleted) {
                    patchState(store, {
                      completedTodos: [todo, ...store.completedTodos()],
                      searchCompletedTodos: [todo, ...store.searchCompletedTodos()],
                      totalCount: store.totalCount() + 1,
                      completedCount: store.completedCount() + 1,
                    });
                    dispatcher.dispatch(adjustListCounts({ listId, totalDelta: 1, activeDelta: 0 }));
                  } else {
                    patchState(store, {
                      activeTodos: [todo, ...store.activeTodos()],
                      searchActiveTodos: [todo, ...store.searchActiveTodos()],
                      totalCount: store.totalCount() + 1,
                      activeCount: store.activeCount() + 1,
                    });
                    dispatcher.dispatch(adjustListCounts({ listId, totalDelta: 1, activeDelta: 1 }));
                  }
                  const message =
                    error.error?.message ||
                    (typeof error.error === 'string' ? error.error : null) ||
                    HTTP_ERROR_MESSAGES.UNKNOWN_ERROR;
                  patchState(store, setError(message));
                },
              }),
            );
        }),
      ),
    );

    const reorderActiveTodo = rxMethod<{
      todoId: string;
      targetIndex: number;
    }>(
      pipe(
        filter(() => !store.isAggregateView()),
        filter(({ todoId, targetIndex }) => {
          const listId = store.currentListId();
          return !!listId && !!todoId && targetIndex >= 0;
        }),
        concatMap(({ todoId, targetIndex }) => {
          const listId = store.currentListId()!;
          const currentActive = store.activeTodos();
          const targetItem = currentActive.find((t) => t.id === todoId);
          if (!targetItem) return EMPTY;

          const previousActive = currentActive;
          const activeWithoutItem = currentActive.filter((t) => t.id !== todoId);
          const newOrder = calculateNewOrder(activeWithoutItem, targetIndex);

          const updatedItem: TodoItem = {
            ...targetItem,
            order: newOrder,
          };

          const newActiveTodos = [...activeWithoutItem];
          const clampedIndex = Math.max(0, Math.min(targetIndex, newActiveTodos.length));
          newActiveTodos.splice(clampedIndex, 0, updatedItem);

          // Optimistic reorder
          patchState(store, {
            activeTodos: newActiveTodos,
          });

          return httpService
            .patch<TodoResponse>(`/api/v1/lists/${listId}/todos/${todoId}/reorder`, {
              order: newOrder,
            })
            .pipe(
              tapResponse({
                next: (response) => {
                  const savedTodo = response.data.todo;
                  patchState(store, {
                    activeTodos: store
                      .activeTodos()
                      .map((t) => (t.id === savedTodo.id ? savedTodo : t)),
                  });
                },
                error: (error: HttpErrorResponse) => {
                  // Rollback
                  patchState(store, {
                    activeTodos: previousActive,
                  });
                  const message =
                    error.error?.message ||
                    (typeof error.error === 'string' ? error.error : null) ||
                    HTTP_ERROR_MESSAGES.UNKNOWN_ERROR;
                  patchState(store, setError(message));
                },
              }),
            );
        }),
      ),
    );

    const searchTodos = rxMethod<string>(
      pipe(
        tap((q) => {
          const trimmed = q.trim();
          if (!trimmed) {
            const prev = store.preSearchExpandedState();
            patchState(store, {
              query: '',
              isSearching: false,
              searchActiveTodos: [],
              searchCompletedTodos: [],
              isCompletedExpanded: prev !== null ? prev : store.isCompletedExpanded(),
              preSearchExpandedState: null,
            });
            return;
          }

          const currentPre = store.preSearchExpandedState();
          patchState(store, {
            query: trimmed,
            isSearching: true,
            preSearchExpandedState: currentPre !== null ? currentPre : store.isCompletedExpanded(),
            isCompletedExpanded: true,
          });
        }),
        filter((q) => q.trim().length > 0),
        switchMap((q) => {
          const listId = store.currentListId();
          const viewMode = store.viewMode();
          let url: string;

          if (viewMode === 'starred') {
            url = `/api/v1/todos?query=${encodeURIComponent(q.trim())}&starred=true&limit=40`;
          } else if (viewMode === 'all') {
            url = `/api/v1/todos?query=${encodeURIComponent(q.trim())}&limit=40`;
          } else if (listId) {
            url = `/api/v1/lists/${listId}/todos?query=${encodeURIComponent(q.trim())}&limit=40`;
          } else {
            return of(null);
          }

          return httpService.get<PaginatedTodosResponse>(url).pipe(
            tapResponse({
              next: (response) => {
                const items = response.data.items;
                const active = items.filter((item) => !item.isCompleted);
                const completed = items.filter((item) => item.isCompleted);
                patchState(store, {
                  searchActiveTodos: active,
                  searchCompletedTodos: completed,
                  isSearching: false,
                });
              },
              error: (error: HttpErrorResponse) => {
                const message =
                  error.error?.message ||
                  (typeof error.error === 'string' ? error.error : null) ||
                  HTTP_ERROR_MESSAGES.UNKNOWN_ERROR;
                patchState(store, { isSearching: false }, setError(message));
              },
            }),
          );
        }),
      ),
    );

    return {
      loadInitialForList,
      loadInitialAllTodos,
      loadInitialStarredTodos,
      loadMoreActiveTodos,
      loadMoreCompletedTodos,
      createTodo,
      updateTodoText,
      toggleTodoCompletion,
      deleteTodo,
      reorderActiveTodo,
      searchTodos,
      toggleCompletedSection(): void {
        const nextExpanded = !store.isCompletedExpanded();
        patchState(store, { isCompletedExpanded: nextExpanded });
        if (
          nextExpanded &&
          !store.isSearchActive() &&
          store.completedCount() > 0 &&
          (store.completedTodos().length === 0 || store.hasMoreCompleted())
        ) {
          loadMoreCompletedTodos();
        }
      },
      setNewTask(newTask: string): void {
        patchState(store, { newTask });
      },
      setQuery(query: string): void {
        searchTodos(query);
      },
      clearSearch(): void {
        searchTodos('');
      },
      toggleShowCompleted(): void {
        const nextExpanded = !store.isCompletedExpanded();
        patchState(store, { isCompletedExpanded: nextExpanded });
        if (nextExpanded && store.completedTodos().length === 0 && store.completedCount() > 0) {
          loadMoreCompletedTodos();
        }
      },
      startEditing(id: string | number, text: string): void {
        patchState(store, { editingId: id, editValue: text });
      },
      setEditValue(editValue: string): void {
        patchState(store, { editValue });
      },
      cancelEditing(): void {
        patchState(store, { editingId: null, editValue: '' });
      },
      resetForNewList(listId?: string): void {
        patchState(store, {
          currentListId: listId ?? null,
          viewMode: 'list',
          activeTodos: [],
          completedTodos: [],
          newTask: '',
          isCompletedExpanded: false,
          activeCursor: null,
          completedCursor: null,
          hasMoreActive: false,
          hasMoreCompleted: false,
          totalCount: 0,
          activeCount: 0,
          completedCount: 0,
          editingId: null,
          editValue: '',
          query: '',
          isSearching: false,
          searchActiveTodos: [],
          searchCompletedTodos: [],
          preSearchExpandedState: null,
        });
      },
      // Backward-compatibility helpers for template before STORY-5.4 & STORY-5.5
      addTask(): void {
        createTodo({ text: store.newTask() });
      },
      toggleTask(id: string | number): void {
        const task = store.activeTodos().find((t) => t.id === id);
        if (task) {
          toggleTodoCompletion(task);
        }
      },
      restoreTask(id: string | number): void {
        const task = store.completedTodos().find((t) => t.id === id);
        if (task) {
          toggleTodoCompletion(task);
        }
      },
      saveEdit(id: string | number): void {
        const trimmed = store.editValue().trim();
        if (trimmed) {
          updateTodoText({ todoId: String(id), text: trimmed });
        } else {
          patchState(store, { editingId: null, editValue: '' });
        }
      },
      deleteTask(id: string | number): void {
        const task = store.activeTodos().find((t) => t.id === id);
        if (task) {
          deleteTodo(task);
        }
      },
      deleteCompleted(id: string | number): void {
        const task = store.completedTodos().find((t) => t.id === id);
        if (task) {
          deleteTodo(task);
        }
      },
    };
  }),
);
