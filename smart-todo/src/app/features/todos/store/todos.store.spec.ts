import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { Dispatcher, provideDispatcher } from '@ngrx/signals/events';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { adjustListCounts, ApiResponse, HttpService } from '@core';
import { DeleteTodoResponse, PaginatedTodosResponse, TodoItem, TodoResponse } from '../models';
import { TodosStore } from './todos.store';

describe('TodosStore', () => {
  let store: InstanceType<typeof TodosStore>;
  let dispatcher: Dispatcher;
  let dispatchSpy: ReturnType<typeof vi.spyOn>;
  let httpService: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    patch: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  const mockActiveTodo: TodoItem = {
    id: 'todo-1',
    listId: 'list-1',
    userId: 'user-1',
    text: 'Active Task 1',
    isCompleted: false,
    order: 1000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockCompletedTodo: TodoItem = {
    id: 'todo-c1',
    listId: 'list-1',
    userId: 'user-1',
    text: 'Completed Task 1',
    isCompleted: true,
    order: 2000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockInitialResponse: ApiResponse<PaginatedTodosResponse> = {
    success: true,
    data: {
      items: [mockActiveTodo],
      hasMore: true,
      nextCursor: 'todo-1',
      meta: {
        totalCount: 25,
        activeCount: 20,
        completedCount: 5,
        quotaLimit: 40,
      },
    },
  };

  beforeEach(() => {
    httpService = {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        TodosStore,
        provideDispatcher(),
        {
          provide: HttpService,
          useValue: httpService,
        },
      ],
    });

    store = TestBed.inject(TodosStore);
    dispatcher = TestBed.inject(Dispatcher);
    dispatchSpy = vi.spyOn(dispatcher, 'dispatch');
  });

  it('initializes with empty initial state and correct computed properties', () => {
    expect(store.activeTodos()).toEqual([]);
    expect(store.completedTodos()).toEqual([]);
    expect(store.totalCount()).toBe(0);
    expect(store.isQuotaReached()).toBe(false);
    expect(store.quotaBadgeText()).toBe('0/40');
    expect(store.isCompletedExpanded()).toBe(false);
  });

  describe('resetForNewList', () => {
    it('resets state and sets currentListId when listId is provided', () => {
      store.resetForNewList('new-list-id');

      expect(store.currentListId()).toBe('new-list-id');
      expect(store.activeTodos()).toEqual([]);
      expect(store.completedTodos()).toEqual([]);
      expect(store.totalCount()).toBe(0);
      expect(store.activeCount()).toBe(0);
      expect(store.completedCount()).toBe(0);
    });

    it('resets currentListId to null when no listId is provided', () => {
      store.resetForNewList('some-list-id');
      expect(store.currentListId()).toBe('some-list-id');

      store.resetForNewList();
      expect(store.currentListId()).toBeNull();
    });
  });

  describe('loadInitialForList', () => {
    it('loads first batch of active todos and populates counts and cursor', () => {
      httpService.get.mockReturnValue(of(mockInitialResponse));

      store.loadInitialForList('list-1');

      expect(httpService.get).toHaveBeenCalledWith('/api/v1/lists/list-1/todos?completed=false&limit=20');
      expect(store.activeTodos()).toEqual([mockActiveTodo]);
      expect(store.activeCursor()).toBe('todo-1');
      expect(store.hasMoreActive()).toBe(true);
      expect(store.totalCount()).toBe(25);
      expect(store.activeCount()).toBe(20);
      expect(store.completedCount()).toBe(5);
      expect(store.isQuotaReached()).toBe(false);
      expect(store.quotaBadgeText()).toBe('25/40');
      expect(store.requestStatus()).toBe('fulfilled');
    });

    it('sets error state when initial load fails', () => {
      const error = new HttpErrorResponse({
        error: { message: 'Failed to fetch list todos' },
        status: 500,
      });
      httpService.get.mockReturnValue(throwError(() => error));

      store.loadInitialForList('list-1');

      expect(store.error()).toBe('Failed to fetch list todos');
      expect(store.activeLoading()).toBe(false);
    });
  });

  describe('loadMoreActiveTodos', () => {
    it('appends next page of active todos with cursor and updates hasMore', () => {
      // 1. Initial load
      httpService.get.mockReturnValueOnce(of(mockInitialResponse));
      store.loadInitialForList('list-1');

      // 2. Next page
      const secondTodo: TodoItem = { ...mockActiveTodo, id: 'todo-2', text: 'Active Task 2' };
      const secondPageResponse: ApiResponse<PaginatedTodosResponse> = {
        success: true,
        data: {
          items: [secondTodo],
          hasMore: false,
          nextCursor: null,
          meta: {
            totalCount: 25,
            activeCount: 20,
            completedCount: 5,
            quotaLimit: 40,
          },
        },
      };
      httpService.get.mockReturnValueOnce(of(secondPageResponse));

      store.loadMoreActiveTodos();

      expect(httpService.get).toHaveBeenLastCalledWith(
        '/api/v1/lists/list-1/todos?completed=false&limit=20&cursor=todo-1',
      );
      expect(store.activeTodos()).toEqual([mockActiveTodo, secondTodo]);
      expect(store.activeCursor()).toBeNull();
      expect(store.hasMoreActive()).toBe(false);
    });

    it('does not trigger if hasMoreActive is false', () => {
      httpService.get.mockReturnValueOnce(
        of({
          success: true,
          data: {
            items: [mockActiveTodo],
            hasMore: false,
            nextCursor: null,
            meta: { totalCount: 1, activeCount: 1, completedCount: 0, quotaLimit: 40 },
          },
        }),
      );
      store.loadInitialForList('list-1');
      expect(httpService.get).toHaveBeenCalledTimes(1);

      store.loadMoreActiveTodos();
      expect(httpService.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('toggleCompletedSection & loadMoreCompletedTodos', () => {
    it('toggles section expansion and lazy-loads completed tasks on first expand', () => {
      httpService.get.mockReturnValueOnce(of(mockInitialResponse));
      store.loadInitialForList('list-1');

      const completedResponse: ApiResponse<PaginatedTodosResponse> = {
        success: true,
        data: {
          items: [mockCompletedTodo],
          hasMore: false,
          nextCursor: null,
          meta: {
            totalCount: 25,
            activeCount: 20,
            completedCount: 5,
            quotaLimit: 40,
          },
        },
      };
      httpService.get.mockReturnValueOnce(of(completedResponse));

      // Expand
      store.toggleCompletedSection();

      expect(store.isCompletedExpanded()).toBe(true);
      expect(httpService.get).toHaveBeenLastCalledWith('/api/v1/lists/list-1/todos?completed=true&limit=20');
      expect(store.completedTodos()).toEqual([mockCompletedTodo]);

      // Collapse
      store.toggleCompletedSection();
      expect(store.isCompletedExpanded()).toBe(false);
      // Doesn't re-fetch on collapse
      expect(httpService.get).toHaveBeenCalledTimes(2);
    });

    it('fetches subsequent pages of completed todos with cursor', () => {
      httpService.get.mockReturnValueOnce(of(mockInitialResponse));
      store.loadInitialForList('list-1');

      // First batch hasMore: true
      const firstBatch: ApiResponse<PaginatedTodosResponse> = {
        success: true,
        data: {
          items: [mockCompletedTodo],
          hasMore: true,
          nextCursor: 'todo-c1',
          meta: { totalCount: 25, activeCount: 20, completedCount: 5, quotaLimit: 40 },
        },
      };
      httpService.get.mockReturnValueOnce(of(firstBatch));
      store.toggleCompletedSection();

      // Second batch
      const secondCompletedTodo: TodoItem = { ...mockCompletedTodo, id: 'todo-c2' };
      const secondBatch: ApiResponse<PaginatedTodosResponse> = {
        success: true,
        data: {
          items: [secondCompletedTodo],
          hasMore: false,
          nextCursor: null,
          meta: { totalCount: 25, activeCount: 20, completedCount: 5, quotaLimit: 40 },
        },
      };
      httpService.get.mockReturnValueOnce(of(secondBatch));

      store.loadMoreCompletedTodos();

      expect(httpService.get).toHaveBeenLastCalledWith(
        '/api/v1/lists/list-1/todos?completed=true&limit=20&cursor=todo-c1',
      );
      expect(store.completedTodos()).toEqual([mockCompletedTodo, secondCompletedTodo]);
    });
  });

  describe('computed properties', () => {
    it('computes isQuotaReached when totalCount >= 40', () => {
      httpService.get.mockReturnValueOnce(
        of({
          success: true,
          data: {
            items: [],
            hasMore: false,
            nextCursor: null,
            meta: { totalCount: 40, activeCount: 30, completedCount: 10, quotaLimit: 40 },
          },
        }),
      );
      store.loadInitialForList('list-1');

      expect(store.isQuotaReached()).toBe(true);
      expect(store.quotaBadgeText()).toBe('40/40');
      expect(store.progressPercentage()).toBe(25);
    });
  });

  describe('createTodo', () => {
    beforeEach(() => {
      httpService.get.mockReturnValueOnce(of(mockInitialResponse));
      store.loadInitialForList('list-1');
      dispatchSpy.mockClear();
    });

    it('optimistically prepends item, increments counts, dispatches adjustListCounts, and replaces with server response', () => {
      const serverTodo: TodoItem = {
        ...mockActiveTodo,
        id: 'real-server-id',
        text: 'New task text',
        order: -500,
      };
      httpService.post.mockReturnValue(of({ success: true, data: { todo: serverTodo } }));

      store.createTodo({ text: 'New task text' });

      // Check request
      expect(httpService.post).toHaveBeenCalledWith('/api/v1/lists/list-1/todos', { text: 'New task text' });
      // Check event dispatched
      expect(dispatchSpy).toHaveBeenCalledWith(
        adjustListCounts({ listId: 'list-1', totalDelta: 1, activeDelta: 1 }),
      );
      // Check store updated with server item
      expect(store.activeTodos()[0].id).toBe('real-server-id');
      expect(store.totalCount()).toBe(26);
      expect(store.activeCount()).toBe(21);
    });

    it('rolls back optimistic addition and counts when server creation fails', () => {
      const error = new HttpErrorResponse({
        error: { message: 'Quota exceeded' },
        status: 422,
      });
      httpService.post.mockReturnValue(throwError(() => error));

      store.createTodo({ text: 'Failing task' });

      // Check rollback event dispatched
      expect(dispatchSpy).toHaveBeenCalledWith(
        adjustListCounts({ listId: 'list-1', totalDelta: -1, activeDelta: -1 }),
      );
      // Check state reverted
      expect(store.activeTodos()).toEqual([mockActiveTodo]);
      expect(store.totalCount()).toBe(25);
      expect(store.activeCount()).toBe(20);
      expect(store.error()).toBe('Quota exceeded');
    });
  });

  describe('updateTodoText', () => {
    beforeEach(() => {
      httpService.get.mockReturnValueOnce(of(mockInitialResponse));
      store.loadInitialForList('list-1');
    });

    it('optimistically updates text and replaces with server response', () => {
      const updatedTodo: TodoItem = { ...mockActiveTodo, text: 'Renamed task' };
      httpService.patch.mockReturnValue(of({ success: true, data: { todo: updatedTodo } }));

      store.updateTodoText({ todoId: 'todo-1', text: 'Renamed task' });

      expect(httpService.patch).toHaveBeenCalledWith('/api/v1/lists/list-1/todos/todo-1', {
        text: 'Renamed task',
      });
      expect(store.activeTodos()[0].text).toBe('Renamed task');
    });

    it('rolls back to previous text when API call fails', () => {
      const error = new HttpErrorResponse({
        error: { message: 'Database error' },
        status: 500,
      });
      httpService.patch.mockReturnValue(throwError(() => error));

      store.updateTodoText({ todoId: 'todo-1', text: 'Will fail' });

      expect(store.activeTodos()[0].text).toBe('Active Task 1');
      expect(store.error()).toBe('Database error');
    });
  });

  describe('toggleTodoCompletion', () => {
    beforeEach(() => {
      httpService.get.mockReturnValueOnce(of(mockInitialResponse));
      store.loadInitialForList('list-1');
      dispatchSpy.mockClear();
    });

    it('completing a todo moves it to completedTodos, updates counts and dispatches event', () => {
      const completedResponse: TodoItem = { ...mockActiveTodo, isCompleted: true };
      httpService.patch.mockReturnValue(of({ success: true, data: { todo: completedResponse } }));

      store.toggleTodoCompletion(mockActiveTodo);

      expect(httpService.patch).toHaveBeenCalledWith('/api/v1/lists/list-1/todos/todo-1', {
        isCompleted: true,
      });
      expect(store.activeTodos()).toEqual([]);
      expect(store.completedTodos()[0].id).toBe('todo-1');
      expect(store.activeCount()).toBe(19);
      expect(store.completedCount()).toBe(6);
      expect(dispatchSpy).toHaveBeenCalledWith(
        adjustListCounts({
          listId: 'list-1',
          activeDelta: -1,
        }),
      );
    });

    it('uncompleting a todo moves it to top of activeTodos (Uncomplete-to-Top)', () => {
      // Setup existing completed
      const existingCompleted: TodoItem = { ...mockCompletedTodo, id: 'todo-c1' };
      const uncompletedResponse: TodoItem = {
        ...existingCompleted,
        isCompleted: false,
        order: -1000,
      };
      httpService.patch.mockReturnValue(of({ success: true, data: { todo: uncompletedResponse } }));

      store.toggleTodoCompletion(existingCompleted);

      expect(httpService.patch).toHaveBeenCalledWith('/api/v1/lists/list-1/todos/todo-c1', {
        isCompleted: false,
      });
      expect(store.activeTodos()[0].id).toBe('todo-c1');
      expect(store.activeCount()).toBe(21);
      expect(store.completedCount()).toBe(4);
      expect(dispatchSpy).toHaveBeenCalledWith(
        adjustListCounts({
          listId: 'list-1',
          activeDelta: 1,
        }),
      );
    });

    it('rolls back when toggling fails', () => {
      const error = new HttpErrorResponse({ status: 500 });
      httpService.patch.mockReturnValue(throwError(() => error));

      store.toggleTodoCompletion(mockActiveTodo);

      // Reverted to active
      expect(store.activeTodos()[0].id).toBe('todo-1');
      expect(store.activeCount()).toBe(20);
      expect(store.completedCount()).toBe(5);
    });
  });

  describe('deleteTodo', () => {
    beforeEach(() => {
      httpService.get.mockReturnValueOnce(of(mockInitialResponse));
      store.loadInitialForList('list-1');
      dispatchSpy.mockClear();
    });

    it('deletes active todo and updates counts', () => {
      httpService.delete.mockReturnValue(
        of({
          success: true,
          data: {
            message: 'Deleted',
            deletedId: 'todo-1',
            counts: { totalCount: 24, activeCount: 19, completedCount: 5 },
          },
        }),
      );

      store.deleteTodo(mockActiveTodo);

      expect(httpService.delete).toHaveBeenCalledWith('/api/v1/lists/list-1/todos/todo-1');
      expect(store.activeTodos()).toEqual([]);
      expect(store.totalCount()).toBe(24);
      expect(store.activeCount()).toBe(19);
      expect(dispatchSpy).toHaveBeenCalledWith(
        adjustListCounts({
          listId: 'list-1',
          totalDelta: -1,
          activeDelta: -1,
        }),
      );
    });

    it('rolls back when deletion fails', () => {
      const error = new HttpErrorResponse({ status: 500 });
      httpService.delete.mockReturnValue(throwError(() => error));

      store.deleteTodo(mockActiveTodo);

      expect(store.activeTodos()[0].id).toBe('todo-1');
      expect(store.totalCount()).toBe(25);
      expect(store.activeCount()).toBe(20);
    });
  });

  describe('reorderActiveTodo', () => {
    const todoA: TodoItem = { ...mockActiveTodo, id: 'todo-a', order: 1000 };
    const todoB: TodoItem = { ...mockActiveTodo, id: 'todo-b', order: 2000 };
    const todoC: TodoItem = { ...mockActiveTodo, id: 'todo-c', order: 3000 };

    beforeEach(() => {
      const mockThreeItemsResponse: ApiResponse<PaginatedTodosResponse> = {
        success: true,
        data: {
          items: [todoA, todoB, todoC],
          hasMore: false,
          nextCursor: null,
          meta: {
            totalCount: 3,
            activeCount: 3,
            completedCount: 0,
            quotaLimit: 40,
          },
        },
      };
      httpService.get.mockReturnValueOnce(of(mockThreeItemsResponse));
      store.loadInitialForList('list-1');
    });

    it('moves an active item to targetIndex 0 (top of list)', () => {
      // items remaining without todoC: [todoA (1000), todoB (2000)]
      // targetIndex 0: newOrder = firstOrder (1000) - ORDER_STEP (1000) = 0
      const updatedTodo: TodoItem = { ...todoC, order: 0 };
      httpService.patch.mockReturnValue(
        of({ success: true, data: { todo: updatedTodo } }),
      );

      store.reorderActiveTodo({ todoId: 'todo-c', targetIndex: 0 });

      expect(httpService.patch).toHaveBeenCalledWith('/api/v1/lists/list-1/todos/todo-c/reorder', {
        order: 0,
      });
      const active = store.activeTodos();
      expect(active[0].id).toBe('todo-c');
      expect(active[0].order).toBe(0);
      expect(active[1].id).toBe('todo-a');
      expect(active[2].id).toBe('todo-b');
    });

    it('moves an active item to middle position', () => {
      // items remaining without todoA: [todoB (2000), todoC (3000)]
      // targetIndex 1: between todoB and todoC -> (2000 + 3000) / 2 = 2500
      const updatedTodo: TodoItem = { ...todoA, order: 2500 };
      httpService.patch.mockReturnValue(
        of({ success: true, data: { todo: updatedTodo } }),
      );

      store.reorderActiveTodo({ todoId: 'todo-a', targetIndex: 1 });

      expect(httpService.patch).toHaveBeenCalledWith('/api/v1/lists/list-1/todos/todo-a/reorder', {
        order: 2500,
      });
      const active = store.activeTodos();
      expect(active[0].id).toBe('todo-b');
      expect(active[1].id).toBe('todo-a');
      expect(active[1].order).toBe(2500);
      expect(active[2].id).toBe('todo-c');
    });

    it('moves an active item to end of list', () => {
      // items remaining without todoA: [todoB (2000), todoC (3000)]
      // targetIndex 2: after todoC -> lastOrder (3000) + ORDER_STEP (1000) = 4000
      const updatedTodo: TodoItem = { ...todoA, order: 4000 };
      httpService.patch.mockReturnValue(
        of({ success: true, data: { todo: updatedTodo } }),
      );

      store.reorderActiveTodo({ todoId: 'todo-a', targetIndex: 2 });

      expect(httpService.patch).toHaveBeenCalledWith('/api/v1/lists/list-1/todos/todo-a/reorder', {
        order: 4000,
      });
      const active = store.activeTodos();
      expect(active[0].id).toBe('todo-b');
      expect(active[1].id).toBe('todo-c');
      expect(active[2].id).toBe('todo-a');
      expect(active[2].order).toBe(4000);
    });

    it('rolls back to previous array order on reorder failure', () => {
      const error = new HttpErrorResponse({ status: 500 });
      httpService.patch.mockReturnValue(throwError(() => error));

      store.reorderActiveTodo({ todoId: 'todo-c', targetIndex: 0 });

      // Should be rolled back
      const active = store.activeTodos();
      expect(active[0].id).toBe('todo-a');
      expect(active[1].id).toBe('todo-b');
      expect(active[2].id).toBe('todo-c');
    });

    it('recovers and processes subsequent reorder calls after an error (stream resilience)', () => {
      const error = new HttpErrorResponse({ status: 500 });
      httpService.patch.mockReturnValueOnce(throwError(() => error));

      // First call fails
      store.reorderActiveTodo({ todoId: 'todo-c', targetIndex: 0 });
      expect(store.activeTodos()[0].id).toBe('todo-a');

      // Second call succeeds
      const updatedTodo: TodoItem = { ...todoC, order: 0 };
      httpService.patch.mockReturnValueOnce(
        of({ success: true, data: { todo: updatedTodo } }),
      );

      store.reorderActiveTodo({ todoId: 'todo-c', targetIndex: 0 });
      expect(store.activeTodos()[0].id).toBe('todo-c');
      expect(store.activeTodos()[0].order).toBe(0);
    });
  });
});

