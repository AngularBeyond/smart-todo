import { type } from '@ngrx/signals';
import { event } from '@ngrx/signals/events';

export const apiSuccessOccurred = event(
  '[API] Success Occurred',
  type<{ message: string }>(),
);
