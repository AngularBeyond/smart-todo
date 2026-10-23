import { type } from '@ngrx/signals';
import { event } from '@ngrx/signals/events';
import { UserProfile } from '../../models';

export const userAuthenticated = event('[Auth] User Authenticated');
export const userLogout = event('[Auth] User Logout');
export const profileSynced = event('[Profile] Profile Synced', type<{ profile: UserProfile }>());
export const themeChanged = event('[Theme] Changed', type<{ mode: 'light' | 'dark' }>());
