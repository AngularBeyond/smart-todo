import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Dispatcher, provideDispatcher } from '@ngrx/signals/events';
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
});

