import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { provideDispatcher } from '@ngrx/signals/events';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ApiResponse, HttpService } from '@core';
import { PaginatedTodosResponse, TodoItem } from '../models';
import { TodosStore } from './todos.store';

describe('TodosStore (Sub-Phase 1: State & Pagination)', () => {
  let store: InstanceType<typeof TodosStore>;
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
  });

  it('initializes with empty initial state and correct computed properties', () => {
    expect(store.activeTodos()).toEqual([]);
    expect(store.completedTodos()).toEqual([]);
    expect(store.totalCount()).toBe(0);
    expect(store.isQuotaReached()).toBe(false);
    expect(store.quotaBadgeText()).toBe('0/40');
    expect(store.isCompletedExpanded()).toBe(false);
  });

  describe('loadInitialForList', () => {
    it('loads first batch of active todos and populates counts and cursor', () => {
      httpService.get.mockReturnValue(of(mockInitialResponse));

      store.loadInitialForList('list-1');

      expect(httpService.get).toHaveBeenCalledWith('/lists/list-1/todos?completed=false&limit=20');
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
        '/lists/list-1/todos?completed=false&limit=20&cursor=todo-1',
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
      expect(httpService.get).toHaveBeenLastCalledWith('/lists/list-1/todos?completed=true&limit=20');
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
        '/lists/list-1/todos?completed=true&limit=20&cursor=todo-c1',
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
});
