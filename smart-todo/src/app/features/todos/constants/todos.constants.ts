import { TaskItem } from '../models';

export const STARTER_TASKS: TaskItem[] = [
  { id: 1, text: 'Map out the week ahead', meta: 'Today · 9:00 AM', tag: 'Planning', done: false },
  { id: 2, text: 'Ship the new onboarding flow', meta: 'Today · 11:30 AM', tag: 'Work', done: false },
  { id: 3, text: 'Review product feedback from the team', meta: 'Tomorrow', tag: 'Work', done: false },
  { id: 4, text: 'Book a table for Friday night', meta: 'Friday', tag: 'Personal', done: false },
  { id: 5, text: 'Update portfolio case study', meta: 'Next week', tag: 'Creative', done: false },
];

export const COMPLETED_TASKS: TaskItem[] = [
  { id: 6, text: 'Set up project workspace', meta: 'Completed yesterday', tag: 'Setup', done: true },
  { id: 7, text: 'Write down the first three priorities', meta: 'Completed Monday', tag: 'Planning', done: true },
];

export const MAX_TODOS_LIMIT = 40;
