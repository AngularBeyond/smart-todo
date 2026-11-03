import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { TodosStore } from './todos.store';

describe('TodosStore', () => {
  let store: InstanceType<typeof TodosStore>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TodosStore],
    });
    store = TestBed.inject(TodosStore);
  });

  it('initializes with default starter tasks', () => {
    expect(store.tasks().length).toBeGreaterThan(0);
    expect(store.completed().length).toBeGreaterThan(0);
    expect(store.showCompleted()).toBe(false);
  });

  it('resets to 0 items when resetForNewList is called', () => {
    store.resetForNewList('Fresh Project');

    expect(store.tasks()).toEqual([]);
    expect(store.completed()).toEqual([]);
    expect(store.totalCount()).toBe(0);
    expect(store.activeList()).toBe('Fresh Project');
    expect(store.showCompleted()).toBe(false);
    expect(store.newTask()).toBe('');
  });

  it('adds a task to the tasks list', () => {
    store.resetForNewList('Project 1');
    store.setNewTask('First item');
    store.addTask();

    expect(store.tasks().length).toBe(1);
    expect(store.tasks()[0].text).toBe('First item');
    expect(store.newTask()).toBe('');
    expect(store.totalCount()).toBe(1);
  });

  it('toggles a task into completed list', () => {
    store.resetForNewList('Project 1');
    store.setNewTask('Task 1');
    store.addTask();

    const taskId = store.tasks()[0].id;
    store.toggleTask(taskId);

    expect(store.tasks().length).toBe(0);
    expect(store.completed().length).toBe(1);
    expect(store.completed()[0].text).toBe('Task 1');
    expect(store.completed()[0].done).toBe(true);
  });

  it('restores a completed task back to active tasks', () => {
    store.resetForNewList('Project 1');
    store.setNewTask('Task 1');
    store.addTask();

    const taskId = store.tasks()[0].id;
    store.toggleTask(taskId);
    store.restoreTask(taskId);

    expect(store.tasks().length).toBe(1);
    expect(store.completed().length).toBe(0);
    expect(store.tasks()[0].text).toBe('Task 1');
    expect(store.tasks()[0].done).toBe(false);
  });
});
