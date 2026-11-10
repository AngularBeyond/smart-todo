import { type } from '@ngrx/signals';
import { event } from '@ngrx/signals/events';

export const apiInfoOccurred = event(
  '[API] Info Occurred',
  type<{ message: string }>(),
);
