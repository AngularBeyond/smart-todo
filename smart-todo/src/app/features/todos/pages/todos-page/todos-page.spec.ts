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
});
