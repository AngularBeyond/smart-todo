import { type } from '@ngrx/signals';
import { event } from '@ngrx/signals/events';

export const apiErrorOccurred = event(
  '[API] Error Occurred',
  type<{ message: string }>(),
);
