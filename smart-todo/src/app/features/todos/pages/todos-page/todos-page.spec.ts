import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DatePipe } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Dispatcher, provideDispatcher } from '@ngrx/signals/events';
import { patchState } from '@ngrx/signals';
import {
  deleteTodoList,
  renameTodoList,
  TodoListSummary,
  TodoListsStore,
  toggleStarTodoList,
} from '@core';
import { TodosPage } from './todos-page';

const mockList: TodoListSummary = {
  id: 'list-123',
  name: 'Active Project',
  isStarred: false,
  order: 1000,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  totalCount: 4,
  activeCount: 2,
};

describe('TodosPage', () => {
  let fixture: ComponentFixture<TodosPage>;
  let component: TodosPage;
  let dispatcher: Dispatcher;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TodosPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideDispatcher(),
        TodoListsStore,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TodosPage);
    component = fixture.componentInstance;
    dispatcher = TestBed.inject(Dispatcher);
    fixture.detectChanges();
  });

  it('dispatches renameTodoList on onRenameList', () => {
    const dispatchSpy = vi.spyOn(dispatcher, 'dispatch');
    component.onRenameList('list-123', 'Renamed Title');

    expect(dispatchSpy).toHaveBeenCalledWith(
      renameTodoList({ listId: 'list-123', name: 'Renamed Title' }),
    );
  });

  it('dispatches toggleStarTodoList on onToggleStar', () => {
    const dispatchSpy = vi.spyOn(dispatcher, 'dispatch');
    component.onToggleStar('list-123');

    expect(dispatchSpy).toHaveBeenCalledWith(
      toggleStarTodoList({ listId: 'list-123' }),
    );
  });

  it('dispatches deleteTodoList on onDeleteList', () => {
    const dispatchSpy = vi.spyOn(dispatcher, 'dispatch');
    component.onDeleteList('list-123');

    expect(dispatchSpy).toHaveBeenCalledWith(
      deleteTodoList({ listId: 'list-123' }),
    );
  });

  it('calls store.createTodo on onCreateTodo', () => {
    const store = (component as any).store;
    const createSpy = vi.spyOn(store, 'createTodo');

    component.onCreateTodo('New Task Item');
    expect(createSpy).toHaveBeenCalledWith({ text: 'New Task Item' });
  });

  it('calls store.toggleTodoCompletion on onToggleComplete', () => {
    const store = (component as any).store;
    const toggleSpy = vi.spyOn(store, 'toggleTodoCompletion');

    const mockTodo = {
      id: 'todo-1',
      listId: 'list-1',
      userId: 'user-1',
      text: 'Sample',
      isCompleted: false,
      order: 1000,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    };
    component.onToggleComplete(mockTodo);
    expect(toggleSpy).toHaveBeenCalledWith(mockTodo);
  });

  it('calls store.updateTodoText on onUpdateText', () => {
    const store = (component as any).store;
    const updateSpy = vi.spyOn(store, 'updateTodoText');

    component.onUpdateText('todo-1', 'Updated Text');
    expect(updateSpy).toHaveBeenCalledWith({ todoId: 'todo-1', text: 'Updated Text' });
  });

  it('calls store.deleteTodo on onDeleteTodo', () => {
    const store = (component as any).store;
    const deleteSpy = vi.spyOn(store, 'deleteTodo');

    const mockTodo = {
      id: 'todo-1',
      listId: 'list-1',
      userId: 'user-1',
      text: 'Sample',
      isCompleted: false,
      order: 1000,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    };
    component.onDeleteTodo(mockTodo);
    expect(deleteSpy).toHaveBeenCalledWith(mockTodo);
  });

  it('calls store.reorderActiveTodo on onDropActive when indices differ', () => {
    const store = (component as any).store;
    const reorderSpy = vi.spyOn(store, 'reorderActiveTodo');

    const mockTodo = {
      id: 'todo-1',
      listId: 'list-1',
      userId: 'user-1',
      text: 'Sample',
      isCompleted: false,
      order: 1000,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    };

    vi.spyOn(store, 'visibleActiveTodos').mockReturnValue([mockTodo]);

    component.onDropActive({
      previousIndex: 0,
      currentIndex: 2,
      item: {} as any,
      container: {} as any,
      previousContainer: {} as any,
      isPointerOverContainer: true,
      distance: { x: 0, y: 0 },
      dropPoint: { x: 0, y: 0 },
      event: new MouseEvent('drop'),
    });

    expect(reorderSpy).toHaveBeenCalledWith({
      todoId: 'todo-1',
      targetIndex: 2,
    });
  });

  it('does nothing on onDropActive when previousIndex equals currentIndex', () => {
    const store = (component as any).store;
    const reorderSpy = vi.spyOn(store, 'reorderActiveTodo');

    component.onDropActive({
      previousIndex: 1,
      currentIndex: 1,
      item: {} as any,
      container: {} as any,
      previousContainer: {} as any,
      isPointerOverContainer: true,
      distance: { x: 0, y: 0 },
      dropPoint: { x: 0, y: 0 },
      event: new MouseEvent('drop'),
    });

    expect(reorderSpy).not.toHaveBeenCalled();
  });

  it('calls store.toggleCompletedSection on onToggleCompletedSection', () => {
    const store = (component as any).store;
    const toggleSpy = vi.spyOn(store, 'toggleCompletedSection');

    component.onToggleCompletedSection();
    expect(toggleSpy).toHaveBeenCalled();
  });

  it('calls store.loadMoreActiveTodos on onLoadMoreActive', () => {
    const store = (component as any).store;
    const loadSpy = vi.spyOn(store, 'loadMoreActiveTodos');

    component.onLoadMoreActive();
    expect(loadSpy).toHaveBeenCalled();
  });

  it('calls store.loadMoreCompletedTodos on onLoadMoreCompleted', () => {
    const store = (component as any).store;
    const loadSpy = vi.spyOn(store, 'loadMoreCompletedTodos');

    component.onLoadMoreCompleted();
    expect(loadSpy).toHaveBeenCalled();
  });

  it('renders dynamic current date formatted with date pipe', () => {
    const datePipe = new DatePipe('en-US');
    const expectedDate = datePipe.transform(component.currentDate, 'EEEE, MMMM dd, yyyy');
    expect(fixture.nativeElement.textContent).toContain(expectedDate);
  });

  it('renders filter tasks input and does not render removed buttons or footer info', () => {
    const el = fixture.nativeElement as HTMLElement;
    const filterInput = el.querySelector('input[placeholder="Filter tasks"]');
    expect(filterInput).toBeTruthy();

    expect(el.querySelector('button[aria-label="More options"]')).toBeFalsy();
    expect(el.textContent).not.toContain('Good morning');
    expect(el.textContent).not.toContain('Make today count');
    expect(el.textContent).not.toContain('Auto-saved just now');
    expect(el.textContent).not.toContain('total tasks');
    expect(el.textContent).toContain("Today's progress");
  });

  it('displays accurate completedCount/totalCount in progress box even when completed list is not expanded', () => {
    const todoListsStore = TestBed.inject(TodoListsStore);
    const store = (component as any).store;
    vi.spyOn(store, 'loadInitialForList').mockImplementation(() => {});

    patchState(todoListsStore as any, {
      lists: [mockList],
      selectedListId: mockList.id,
    });
    patchState(store, {
      completedTodos: [],
      completedCount: 2,
      totalCount: 6,
    });
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('2/6');
  });

  it('configures drag placeholder in template', () => {
    const store = (component as any).store;
    patchState(store, {
      activeTodos: [
        {
          id: 'task-1',
          text: 'First task',
          isCompleted: false,
          order: 1000,
          listId: 'list-123',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    });
    fixture.detectChanges();

    const itemRow = fixture.nativeElement.querySelector('app-todo-item-row');
    expect(itemRow).toBeTruthy();
  });

  it('calls loadInitialForList when selected list changes, even if totalCount is 0', () => {
    const todoListsStore = TestBed.inject(TodoListsStore);
    const store = (component as any).store;
    const loadSpy = vi.spyOn(store, 'loadInitialForList');

    patchState(todoListsStore as any, {
      lists: [{ ...mockList, id: 'new-list-id', totalCount: 0, activeCount: 0 }],
      selectedListId: 'new-list-id',
    });
    fixture.detectChanges();

    expect(loadSpy).toHaveBeenCalledWith('new-list-id');
  });

  it('resets store when selected list becomes null', () => {
    const todoListsStore = TestBed.inject(TodoListsStore);
    const store = (component as any).store;

    patchState(todoListsStore as any, {
      lists: [mockList],
      selectedListId: mockList.id,
    });
    fixture.detectChanges();

    const resetSpy = vi.spyOn(store, 'resetForNewList');

    patchState(todoListsStore as any, {
      lists: [],
      selectedListId: null,
    });
    fixture.detectChanges();

    expect(resetSpy).toHaveBeenCalled();
  });

  it('renders All tasks header and hides creation bar and list actions when in all view', () => {
    Object.defineProperty(component, 'isAllTasks', {
      value: () => true,
    });
    Object.defineProperty(component, 'isAggregateView', {
      value: () => true,
    });
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('h1')?.textContent).toContain('All tasks');
    expect(el.querySelector('app-todo-create-bar')).toBeNull();
    expect(el.querySelector('button[aria-label="Star list"]')).toBeNull();
    expect(el.querySelector('button[aria-label="Delete list"]')).toBeNull();
  });

  it('does not reorder active todos when in all view', () => {
    Object.defineProperty(component, 'isAllTasks', {
      value: () => true,
    });
    Object.defineProperty(component, 'isAggregateView', {
      value: () => true,
    });
    const store = (component as any).store;
    const reorderSpy = vi.spyOn(store, 'reorderActiveTodo');

    component.onDropActive({
      previousIndex: 0,
      currentIndex: 1,
    } as any);

    expect(reorderSpy).not.toHaveBeenCalled();
  });

  it('renders Starred tasks header and hides creation bar and list actions when in starred view', () => {
    Object.defineProperty(component, 'isStarredTasks', {
      value: () => true,
    });
    Object.defineProperty(component, 'isAggregateView', {
      value: () => true,
    });
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('h1')?.textContent).toContain('Starred tasks');
    expect(el.querySelector('app-todo-create-bar')).toBeNull();
    expect(el.querySelector('button[aria-label="Star list"]')).toBeNull();
    expect(el.querySelector('button[aria-label="Delete list"]')).toBeNull();
  });
});

