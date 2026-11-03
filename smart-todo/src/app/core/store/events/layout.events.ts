import { type } from '@ngrx/signals';
import { event } from '@ngrx/signals/events';

export const toggleMobileSidebar = event('[Layout] Toggle Mobile Sidebar');
export const setMobileSidebarOpen = event(
  '[Layout] Set Mobile Sidebar Open',
  type<{ isOpen: boolean }>(),
);
