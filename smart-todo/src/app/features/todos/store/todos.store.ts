import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { withRequestStatus } from '@core';
import { TaskItem } from '../models';
import { COMPLETED_TASKS, STARTER_TASKS } from '../constants';

export interface TodosState {
  tasks: TaskItem[];
  completed: TaskItem[];
  newTask: string;
  showCompleted: boolean;
  activeList: string;
  editingId: number | null;
  editValue: string;
  query: string;
}

const initialTodosState: TodosState = {
  tasks: STARTER_TASKS,
  completed: COMPLETED_TASKS,
  newTask: '',
  showCompleted: true,
  activeList: 'My Tasks',
  editingId: null,
  editValue: '',
  query: '',
};

export const TodosStore = signalStore(
  withState<TodosState>(initialTodosState),
  withRequestStatus(),
  withComputed(({ tasks, completed, query }) => ({
    visibleTasks: computed(() => {
      const q = query().toLowerCase().trim();
      return q ? tasks().filter((task) => task.text.toLowerCase().includes(q)) : tasks();
    }),
    totalCount: computed(() => tasks().length + completed().length),
    progressPercentage: computed(() => {
      const total = tasks().length + completed().length;
      if (total === 0) return 100;
      return Math.round((completed().length / total) * 100);
    }),
  })),
  withMethods((store) => ({
    setNewTask(newTask: string): void {
      patchState(store, { newTask });
    },
    setQuery(query: string): void {
      patchState(store, { query });
    },
    toggleShowCompleted(): void {
      patchState(store, { showCompleted: !store.showCompleted() });
    },
    startEditing(id: number, text: string): void {
      patchState(store, { editingId: id, editValue: text });
    },
    setEditValue(editValue: string): void {
      patchState(store, { editValue });
    },
    cancelEditing(): void {
      patchState(store, { editingId: null, editValue: '' });
    },
    saveEdit(id: number): void {
      const trimmed = store.editValue().trim();
      if (trimmed) {
        patchState(store, {
          tasks: store.tasks().map((task) =>
            task.id === id ? { ...task, text: trimmed, meta: 'Updated just now' } : task,
          ),
          editingId: null,
          editValue: '',
        });
      } else {
        patchState(store, { editingId: null, editValue: '' });
      }
    },
    addTask(): void {
      const text = store.newTask().trim();
      if (!text) return;
      const newItem: TaskItem = {
        id: Date.now(),
        text,
        meta: 'Just now',
        tag: 'Inbox',
        done: false,
      };
      patchState(store, {
        tasks: [newItem, ...store.tasks()],
        newTask: '',
      });
    },
    toggleTask(id: number): void {
      const task = store.tasks().find((item) => item.id === id);
      if (!task) return;
      patchState(store, {
        tasks: store.tasks().filter((item) => item.id !== id),
        completed: [{ ...task, done: true, meta: 'Completed just now' }, ...store.completed()],
      });
    },
    restoreTask(id: number): void {
      const task = store.completed().find((item) => item.id === id);
      if (!task) return;
      patchState(store, {
        completed: store.completed().filter((item) => item.id !== id),
        tasks: [{ ...task, done: false, meta: 'Just now' }, ...store.tasks()],
      });
    },
    deleteTask(id: number): void {
      patchState(store, {
        tasks: store.tasks().filter((item) => item.id !== id),
      });
    },
    deleteCompleted(id: number): void {
      patchState(store, {
        completed: store.completed().filter((item) => item.id !== id),
      });
    },
  })),
);
