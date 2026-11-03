import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { Dispatcher, Events, provideDispatcher } from '@ngrx/signals/events';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { HttpService } from '../http/http.service';
import { ApiResponse } from '../http/api-response.model';
import {
  TodoListSummary,
  TodoListsResponse,
  TodoListResponse,
  DeleteTodoListResponse,
} from '../models/todo-list.model';
import { TodoListsStore } from './todo-lists.store';
import {
  apiErrorOccurred,
  apiSuccessOccurred,
  loadTodoLists,
  selectTodoList,
  createTodoList,
  renameTodoList,
  toggleStarTodoList,
  reorderUnstarredList,
  deleteTodoList,
  adjustListCounts,
} from './events';

describe('TodoListsStore', () => {
  let store: InstanceType<typeof TodoListsStore>;
  let httpMock: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    patch: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let dispatcher: Dispatcher;
  let events: Events;

  const mockLists: TodoListSummary[] = [
    {
      id: 'list-unstarred-2',
      name: 'Work',
      isStarred: false,
      order: 3000,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      totalCount: 5,
      activeCount: 3,
    },
    {
      id: 'list-starred-1',
      name: 'Starred Old',
      isStarred: true,
      order: 1000,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-02T10:00:00.000Z',
      totalCount: 4,
      activeCount: 1,
    },
    {
      id: 'list-unstarred-1',
      name: 'Personal',
      isStarred: false,
      order: 1000,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      totalCount: 2,
      activeCount: 0,
    },
    {
      id: 'list-starred-2',
      name: 'Starred New',
      isStarred: true,
      order: 2000,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-03T12:00:00.000Z',
      totalCount: 8,
      activeCount: 6,
    },
  ];

  const mockResponse: ApiResponse<TodoListsResponse> = {
    success: true,
    data: { lists: mockLists },
  };

  beforeEach(() => {
    httpMock = {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        provideDispatcher(),
        { provide: HttpService, useValue: httpMock },
      ],
    });

    store = TestBed.inject(TodoListsStore);
    dispatcher = TestBed.inject(Dispatcher);
    events = TestBed.inject(Events);
  });

  it('should initialize with empty state and idle status', () => {
    expect(store.lists()).toEqual([]);
    expect(store.selectedListId()).toBeNull();
    expect(store.selectedList()).toBeNull();
    expect(store.isQuotaReached()).toBe(false);
    expect(store.starredLists()).toEqual([]);
    expect(store.unstarredLists()).toEqual([]);
    expect(store.isPending()).toBe(false);
  });

  describe('computed signals', () => {
    beforeEach(() => {
      httpMock.get.mockReturnValue(of(mockResponse));
      dispatcher.dispatch(loadTodoLists());
    });

    it('should sort starred lists by updatedAt DESC', () => {
      const starred = store.starredLists();
      expect(starred).toHaveLength(2);
      expect(starred[0].id).toBe('list-starred-2');
      expect(starred[1].id).toBe('list-starred-1');
    });

    it('should sort unstarred lists by order ASC', () => {
      const unstarred = store.unstarredLists();
      expect(unstarred).toHaveLength(2);
      expect(unstarred[0].id).toBe('list-unstarred-1');
      expect(unstarred[1].id).toBe('list-unstarred-2');
    });

    it('should calculate isQuotaReached when lists >= 3', () => {
      expect(store.lists().length).toBe(4);
      expect(store.isQuotaReached()).toBe(true);
    });

    it('should compute selectedList from selectedListId', () => {
      expect(store.selectedList()?.id).toBe('list-starred-1');

      dispatcher.dispatch(selectTodoList({ listId: 'list-unstarred-1' }));
      expect(store.selectedList()?.id).toBe('list-unstarred-1');
      expect(store.selectedList()?.name).toBe('Personal');
    });
  });

  describe('loadTodoLists event', () => {
    it('should load lists, update store, and auto-select first list', () => {
      httpMock.get.mockReturnValue(of(mockResponse));

      dispatcher.dispatch(loadTodoLists());

      expect(httpMock.get).toHaveBeenCalledWith('/api/v1/lists');
      expect(store.lists()).toEqual(mockLists);
      expect(store.isFulfilled()).toBe(true);
      expect(store.selectedListId()).toBe('list-starred-1');
    });

    it('should handle error, set error state, and dispatch apiErrorOccurred', () => {
      const errorSpy = vi.fn();
      events.on(apiErrorOccurred).subscribe(errorSpy);

      const errorResponse = new HttpErrorResponse({
        error: { message: 'Failed to fetch lists' },
        status: 500,
        statusText: 'Server Error',
      });
      httpMock.get.mockReturnValue(throwError(() => errorResponse));

      dispatcher.dispatch(loadTodoLists());

      expect(store.error()).toBe('Failed to fetch lists');
      expect(errorSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: { message: 'Failed to fetch lists' },
        }),
      );
    });
  });

  describe('selectTodoList event and selectList method', () => {
    beforeEach(() => {
      httpMock.get.mockReturnValue(of(mockResponse));
      dispatcher.dispatch(loadTodoLists());
    });

    it('should update selectedListId when selectTodoList is dispatched', () => {
      dispatcher.dispatch(selectTodoList({ listId: 'list-unstarred-2' }));
      expect(store.selectedListId()).toBe('list-unstarred-2');
    });

    it('should update selectedListId when selectList method is called', () => {
      store.selectList('list-starred-2');
      expect(store.selectedListId()).toBe('list-starred-2');
    });
  });

  describe('createTodoList event', () => {
    const newCreatedList: TodoListSummary = {
      id: 'list-new-1',
      name: 'New Project',
      isStarred: false,
      order: 4000,
      createdAt: '2026-01-04T00:00:00.000Z',
      updatedAt: '2026-01-04T00:00:00.000Z',
      totalCount: 0,
      activeCount: 0,
    };

    const mockCreateResponse: ApiResponse<TodoListResponse> = {
      success: true,
      data: { list: newCreatedList },
    };

    it('should create list, append to store, select it, and dispatch apiSuccessOccurred', () => {
      const successSpy = vi.fn();
      events.on(apiSuccessOccurred).subscribe(successSpy);
      httpMock.post.mockReturnValue(of(mockCreateResponse));

      dispatcher.dispatch(createTodoList({ name: 'New Project' }));

      expect(httpMock.post).toHaveBeenCalledWith('/api/v1/lists', {
        name: 'New Project',
      });
      expect(store.lists()).toContainEqual(newCreatedList);
      expect(store.selectedListId()).toBe('list-new-1');
      expect(store.isFulfilled()).toBe(true);
      expect(successSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: { message: 'Todo list created successfully.' },
        }),
      );
    });

    it('should handle error when creating list fails', () => {
      const errorSpy = vi.fn();
      events.on(apiErrorOccurred).subscribe(errorSpy);

      const errorResponse = new HttpErrorResponse({
        error: { message: 'Demo quota reached: You can create a maximum of 3 lists.' },
        status: 422,
        statusText: 'Unprocessable Entity',
      });
      httpMock.post.mockReturnValue(throwError(() => errorResponse));

      dispatcher.dispatch(createTodoList({ name: 'Exceeding List' }));

      expect(store.error()).toBe(
        'Demo quota reached: You can create a maximum of 3 lists.',
      );
      expect(errorSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: {
            message: 'Demo quota reached: You can create a maximum of 3 lists.',
          },
        }),
      );
    });
  });

  describe('renameTodoList event', () => {
    beforeEach(() => {
      httpMock.get.mockReturnValue(of(mockResponse));
      dispatcher.dispatch(loadTodoLists());
    });

    it('should optimistically update name and persist via PATCH', () => {
      const updatedList: TodoListSummary = {
        ...mockLists[2],
        name: 'Renamed Personal',
      };
      const mockPatchResponse: ApiResponse<TodoListResponse> = {
        success: true,
        data: { list: updatedList },
      };
      httpMock.patch.mockReturnValue(of(mockPatchResponse));

      dispatcher.dispatch(
        renameTodoList({ listId: 'list-unstarred-1', name: 'Renamed Personal' }),
      );

      expect(httpMock.patch).toHaveBeenCalledWith(
        '/api/v1/lists/list-unstarred-1',
        { name: 'Renamed Personal' },
      );
      const renamed = store.lists().find((l) => l.id === 'list-unstarred-1');
      expect(renamed?.name).toBe('Renamed Personal');
    });

    it('should rollback name and dispatch apiErrorOccurred if PATCH fails', () => {
      const errorSpy = vi.fn();
      events.on(apiErrorOccurred).subscribe(errorSpy);

      const errorResponse = new HttpErrorResponse({
        error: { message: 'Failed to rename list' },
        status: 500,
      });
      httpMock.patch.mockReturnValue(throwError(() => errorResponse));

      dispatcher.dispatch(
        renameTodoList({ listId: 'list-unstarred-1', name: 'Failed Name' }),
      );

      const list = store.lists().find((l) => l.id === 'list-unstarred-1');
      expect(list?.name).toBe('Personal'); // rolled back
      expect(errorSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: { message: 'Failed to rename list' },
        }),
      );
    });
  });

  describe('toggleStarTodoList event', () => {
    beforeEach(() => {
      httpMock.get.mockReturnValue(of(mockResponse));
      dispatcher.dispatch(loadTodoLists());
    });

    it('should optimistically toggle star status and persist via PATCH', () => {
      const updatedList: TodoListSummary = {
        ...mockLists[2],
        isStarred: true,
      };
      const mockPatchResponse: ApiResponse<TodoListResponse> = {
        success: true,
        data: { list: updatedList },
      };
      httpMock.patch.mockReturnValue(of(mockPatchResponse));

      dispatcher.dispatch(toggleStarTodoList({ listId: 'list-unstarred-1' }));

      expect(httpMock.patch).toHaveBeenCalledWith(
        '/api/v1/lists/list-unstarred-1',
        { isStarred: true },
      );
      const starred = store.lists().find((l) => l.id === 'list-unstarred-1');
      expect(starred?.isStarred).toBe(true);
    });

    it('should rollback star status and dispatch apiErrorOccurred if PATCH fails', () => {
      const errorSpy = vi.fn();
      events.on(apiErrorOccurred).subscribe(errorSpy);

      const errorResponse = new HttpErrorResponse({
        error: { message: 'Failed to toggle star' },
        status: 500,
      });
      httpMock.patch.mockReturnValue(throwError(() => errorResponse));

      dispatcher.dispatch(toggleStarTodoList({ listId: 'list-unstarred-1' }));

      const list = store.lists().find((l) => l.id === 'list-unstarred-1');
      expect(list?.isStarred).toBe(false); // rolled back
      expect(errorSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: { message: 'Failed to toggle star' },
        }),
      );
    });
  });

  describe('adjustListCounts event', () => {
    beforeEach(() => {
      httpMock.get.mockReturnValue(of(mockResponse));
      dispatcher.dispatch(loadTodoLists());
    });

    it('should update totalCount and activeCount by deltas', () => {
      dispatcher.dispatch(
        adjustListCounts({
          listId: 'list-unstarred-1',
          totalDelta: 2,
          activeDelta: 1,
        }),
      );

      const list = store.lists().find((l) => l.id === 'list-unstarred-1');
      // original: totalCount 2, activeCount 0
      expect(list?.totalCount).toBe(4);
      expect(list?.activeCount).toBe(1);
    });

    it('should clamp counts at zero', () => {
      dispatcher.dispatch(
        adjustListCounts({
          listId: 'list-unstarred-1',
          totalDelta: -10,
          activeDelta: -10,
        }),
      );

      const list = store.lists().find((l) => l.id === 'list-unstarred-1');
      expect(list?.totalCount).toBe(0);
      expect(list?.activeCount).toBe(0);
    });
  });

  describe('reorderUnstarredList event', () => {
    beforeEach(() => {
      httpMock.get.mockReturnValue(of(mockResponse));
      dispatcher.dispatch(loadTodoLists());
    });

    it('should optimistically calculate order and update unstarredLists positioning', () => {
      // Current unstarred: list-unstarred-1 (order 1000), list-unstarred-2 (order 3000)
      // Moving list-unstarred-2 to targetIndex 0:
      // remaining: [list-unstarred-1 (order 1000)]
      // calculateNewOrder([{ order: 1000 }], 0) = 0
      const updatedList: TodoListSummary = {
        ...mockLists[0],
        order: 0,
      };
      const mockPatchResponse: ApiResponse<TodoListResponse> = {
        success: true,
        data: { list: updatedList },
      };
      httpMock.patch.mockReturnValue(of(mockPatchResponse));

      dispatcher.dispatch(
        reorderUnstarredList({
          listId: 'list-unstarred-2',
          targetIndex: 0,
        }),
      );

      expect(httpMock.patch).toHaveBeenCalledWith(
        '/api/v1/lists/list-unstarred-2/reorder',
        { order: 0 },
      );
      const unstarred = store.unstarredLists();
      expect(unstarred[0].id).toBe('list-unstarred-2');
      expect(unstarred[0].order).toBe(0);
      expect(unstarred[1].id).toBe('list-unstarred-1');
      expect(unstarred[1].order).toBe(1000);
    });

    it('should rollback list ordering and dispatch apiErrorOccurred if reorder fails', () => {
      const errorSpy = vi.fn();
      events.on(apiErrorOccurred).subscribe(errorSpy);

      const errorResponse = new HttpErrorResponse({
        error: { message: 'Cannot reorder a starred list.' },
        status: 400,
      });
      httpMock.patch.mockReturnValue(throwError(() => errorResponse));

      dispatcher.dispatch(
        reorderUnstarredList({
          listId: 'list-unstarred-2',
          targetIndex: 0,
        }),
      );

      const unstarred = store.unstarredLists();
      expect(unstarred[0].id).toBe('list-unstarred-1');
      expect(unstarred[1].id).toBe('list-unstarred-2');
      expect(unstarred[1].order).toBe(3000); // rolled back
      expect(errorSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: { message: 'Cannot reorder a starred list.' },
        }),
      );
    });
  });

  describe('deleteTodoList event', () => {
    beforeEach(() => {
      httpMock.get.mockReturnValue(of(mockResponse));
      dispatcher.dispatch(loadTodoLists());
    });

    it('should delete list, remove from store, select next remaining list, and dispatch apiSuccessOccurred', () => {
      const successSpy = vi.fn();
      events.on(apiSuccessOccurred).subscribe(successSpy);

      const mockDeleteResponse: ApiResponse<DeleteTodoListResponse> = {
        success: true,
        data: { message: 'Todo list deleted successfully.' },
      };
      httpMock.delete.mockReturnValue(of(mockDeleteResponse));

      // Currently selected list is list-starred-1
      expect(store.selectedListId()).toBe('list-starred-1');

      dispatcher.dispatch(deleteTodoList({ listId: 'list-starred-1' }));

      expect(httpMock.delete).toHaveBeenCalledWith(
        '/api/v1/lists/list-starred-1',
      );
      expect(store.lists().some((l) => l.id === 'list-starred-1')).toBe(false);
      // Next available starred list should be selected (list-starred-2)
      expect(store.selectedListId()).toBe('list-starred-2');
      expect(store.isFulfilled()).toBe(true);
      expect(successSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: { message: 'Todo list deleted successfully.' },
        }),
      );
    });

    it('should set selectedListId to null when deleting the last remaining list', () => {
      // Setup a store with only 1 list
      const singleList = [mockLists[0]];
      httpMock.get.mockReturnValue(
        of({ success: true, data: { lists: singleList } }),
      );
      dispatcher.dispatch(loadTodoLists());
      expect(store.lists()).toHaveLength(1);
      expect(store.selectedListId()).toBe(singleList[0].id);

      const mockDeleteResponse: ApiResponse<DeleteTodoListResponse> = {
        success: true,
        data: { message: 'Todo list deleted successfully.' },
      };
      httpMock.delete.mockReturnValue(of(mockDeleteResponse));

      dispatcher.dispatch(deleteTodoList({ listId: singleList[0].id }));

      expect(store.lists()).toEqual([]);
      expect(store.selectedListId()).toBeNull();
      expect(store.selectedList()).toBeNull();
    });

    it('should handle error when deleting list fails', () => {
      const errorSpy = vi.fn();
      events.on(apiErrorOccurred).subscribe(errorSpy);

      const errorResponse = new HttpErrorResponse({
        error: { message: 'Todo list not found.' },
        status: 404,
      });
      httpMock.delete.mockReturnValue(throwError(() => errorResponse));

      dispatcher.dispatch(deleteTodoList({ listId: 'non-existent' }));

      expect(store.error()).toBe('Todo list not found.');
      expect(errorSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: { message: 'Todo list not found.' },
        }),
      );
    });
  });
});



