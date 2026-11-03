import { HttpErrorResponse } from '@angular/common/http';
import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { Dispatcher } from '@ngrx/signals/events';
import { EMPTY, pipe } from 'rxjs';
import { catchError, exhaustMap, filter, switchMap, tap } from 'rxjs/operators';
import {
  adjustListCounts,
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
  newTask: string;
  editingId: string | number | null;
  editValue: string;
}

export const initialTodosState: TodosState = {
  currentListId: null,
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
  newTask: '',
  editingId: null,
  editValue: '',
};

export const TodosStore = signalStore(
  withState<TodosState>(initialTodosState),
  withRequestStatus(),
  withComputed(({ activeTodos, completedTodos, totalCount, completedCount, query, isCompletedExpanded }) => ({
    isQuotaReached: computed(() => totalCount() >= 40),
    quotaBadgeText: computed(() => `${totalCount()}/40`),
    progressPercentage: computed(() => {
      const total = totalCount();
      if (total === 0) return 100;
      return Math.round((completedCount() / total) * 100);
    }),
    visibleActiveTodos: computed(() => {
      const q = query().toLowerCase().trim();
      return q
        ? activeTodos().filter((t) => t.text.toLowerCase().includes(q))
        : activeTodos();
    }),
    // Backward-compatibility aliases for existing mockup templates
    tasks: computed(() => activeTodos()),
    completed: computed(() => completedTodos()),
    showCompleted: computed(() => isCompletedExpanded()),
    visibleTasks: computed(() => {
      const q = query().toLowerCase().trim();
      return q
        ? activeTodos().filter((t) => t.text.toLowerCase().includes(q))
        : activeTodos();
    }),
    activeList: computed(() => 'My Tasks'),
  })),
  withMethods((store) => {
    const httpService = inject(HttpService);
    const dispatcher = inject(Dispatcher);

    const loadMoreCompletedTodos = rxMethod<void>(
      pipe(
        filter(() => {
          const listId = store.currentListId();
          const loading = store.completedLoading();
          if (!listId || loading) return false;
          if (store.completedTodos().length > 0 && !store.hasMoreCompleted()) return false;
          return true;
        }),
        tap(() => patchState(store, { completedLoading: true })),
        exhaustMap(() => {
          const listId = store.currentListId()!;
          const cursor = store.completedCursor();
          const url = `/lists/${listId}/todos?completed=true&limit=20${cursor ? `&cursor=${cursor}` : ''}`;
          return httpService.get<PaginatedTodosResponse>(url).pipe(
            tap({
              next: (response) => {
                const data = response.data;
                patchState(store, {
                  completedTodos: [...store.completedTodos(), ...data.items],
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
            catchError(() => EMPTY),
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
            },
            setPending(),
          );
        }),
        switchMap((listId) =>
          httpService
            .get<PaginatedTodosResponse>(`/lists/${listId}/todos?completed=false&limit=20`)
            .pipe(
              tap({
                next: (response) => {
                  const data = response.data;
                  patchState(
                    store,
                    {
                      activeTodos: data.items,
                      activeCursor: data.nextCursor,
                      hasMoreActive: data.hasMore,
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
              catchError(() => EMPTY),
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
          return !!listId && hasMore && !loading;
        }),
        tap(() => patchState(store, { activeLoading: true })),
        exhaustMap(() => {
          const listId = store.currentListId()!;
          const cursor = store.activeCursor();
          const url = `/lists/${listId}/todos?completed=false&limit=20${cursor ? `&cursor=${cursor}` : ''}`;
          return httpService.get<PaginatedTodosResponse>(url).pipe(
            tap({
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
            catchError(() => EMPTY),
          );
        }),
      ),
    );

    return {
      loadInitialForList,
      loadMoreActiveTodos,
      loadMoreCompletedTodos,
      toggleCompletedSection(): void {
        const nextExpanded = !store.isCompletedExpanded();
        patchState(store, { isCompletedExpanded: nextExpanded });
        if (nextExpanded && store.completedTodos().length === 0 && store.completedCount() > 0) {
          loadMoreCompletedTodos();
        }
      },
      setNewTask(newTask: string): void {
        patchState(store, { newTask });
      },
      setQuery(query: string): void {
        patchState(store, { query });
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
      resetForNewList(listName?: string): void {
        patchState(store, {
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
        });
      },
      // Backward-compatibility helpers for template before STORY-5.4 & STORY-5.5
      addTask(): void {
        const text = store.newTask().trim();
        if (!text) return;
        const newItem: TodoItem = {
          id: `temp-${Date.now()}`,
          listId: store.currentListId() ?? '',
          userId: '',
          text,
          isCompleted: false,
          order: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          meta: 'Just now',
          tag: 'Inbox',
          done: false,
        };
        patchState(store, {
          activeTodos: [newItem, ...store.activeTodos()],
          newTask: '',
          totalCount: store.totalCount() + 1,
          activeCount: store.activeCount() + 1,
        });
      },
      toggleTask(id: string | number): void {
        const task = store.activeTodos().find((t) => t.id === id);
        if (!task) return;
        patchState(store, {
          activeTodos: store.activeTodos().filter((t) => t.id !== id),
          completedTodos: [{ ...task, isCompleted: true, done: true, meta: 'Completed just now' }, ...store.completedTodos()],
          activeCount: Math.max(0, store.activeCount() - 1),
          completedCount: store.completedCount() + 1,
        });
      },
      restoreTask(id: string | number): void {
        const task = store.completedTodos().find((t) => t.id === id);
        if (!task) return;
        patchState(store, {
          completedTodos: store.completedTodos().filter((t) => t.id !== id),
          activeTodos: [{ ...task, isCompleted: false, done: false, meta: 'Just now' }, ...store.activeTodos()],
          completedCount: Math.max(0, store.completedCount() - 1),
          activeCount: store.activeCount() + 1,
        });
      },
      saveEdit(id: string | number): void {
        const trimmed = store.editValue().trim();
        if (trimmed) {
          patchState(store, {
            activeTodos: store.activeTodos().map((t) =>
              t.id === id ? { ...t, text: trimmed, meta: 'Updated just now' } : t,
            ),
            editingId: null,
            editValue: '',
          });
        } else {
          patchState(store, { editingId: null, editValue: '' });
        }
      },
      deleteTask(id: string | number): void {
        patchState(store, {
          activeTodos: store.activeTodos().filter((t) => t.id !== id),
          totalCount: Math.max(0, store.totalCount() - 1),
          activeCount: Math.max(0, store.activeCount() - 1),
        });
      },
      deleteCompleted(id: string | number): void {
        patchState(store, {
          completedTodos: store.completedTodos().filter((t) => t.id !== id),
          totalCount: Math.max(0, store.totalCount() - 1),
          completedCount: Math.max(0, store.completedCount() - 1),
        });
      },
    };
  }),
);
