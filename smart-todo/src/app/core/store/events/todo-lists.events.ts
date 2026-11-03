import { type } from '@ngrx/signals';
import { event } from '@ngrx/signals/events';

export const loadTodoLists = event('[Todo Lists] Load Lists');

export const selectTodoList = event(
  '[Todo Lists] Select List',
  type<{ listId: string }>(),
);

export const createTodoList = event(
  '[Todo Lists] Create List',
  type<{ name: string }>(),
);

export const renameTodoList = event(
  '[Todo Lists] Rename List',
  type<{ listId: string; name: string }>(),
);

export const toggleStarTodoList = event(
  '[Todo Lists] Toggle Star',
  type<{ listId: string }>(),
);

export const reorderUnstarredList = event(
  '[Todo Lists] Reorder Unstarred List',
  type<{ listId: string; targetIndex: number }>(),
);

export const deleteTodoList = event(
  '[Todo Lists] Delete List',
  type<{ listId: string }>(),
);

export const adjustListCounts = event(
  '[Todo Lists] Adjust List Counts',
  type<{ listId: string; totalDelta?: number; activeDelta?: number }>(),
);
