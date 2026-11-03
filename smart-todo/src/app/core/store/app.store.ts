import { computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { Dispatcher, Events, withEventHandlers } from '@ngrx/signals/events';
import { catchError, EMPTY, switchMap, tap } from 'rxjs';
import {
  HTTP_ERROR_MESSAGES,
  HttpService,
  setError,
  setFulfilled,
  setIdle,
  setPending,
  withRequestStatus,
} from '../index';
import { toast } from '@spartan-ng/brain/sonner';
import {
  apiErrorOccurred,
  apiSuccessOccurred,
  profileSynced,
  selectTodoList,
  setMobileSidebarOpen,
  themeChanged,
  toggleMobileSidebar,
  userAuthenticated,
  userLogout,
} from './events';
import { UserProfile } from '../models/user-profile.model';
import { ThemeMode, ThemeService } from '../services/theme.service';

export interface AppState {
  profile: UserProfile | null;
  isAuthenticated: boolean;
  accessToken: string | null;
  theme: ThemeMode;
  isMobileSidebarOpen: boolean;
}

export const initialAppState: AppState = {
  profile: null,
  isAuthenticated: false,
  accessToken: null,
  theme: 'light',
  isMobileSidebarOpen: false,
};

/**
 * Global Signal Store provided at root level.
 * Manages user profile, authentication state, access token, and global theme.
 */
export const AppStore = signalStore(
  { providedIn: 'root' },
  withState<AppState>(initialAppState),
  withRequestStatus(),
  withComputed(({ profile, isAuthenticated, theme }) => ({
    userDisplayName: computed(() => {
      const p = profile();
      return p ? `${p.name ?? ''} ${p.lastName ?? ''}`.trim() || p.email : 'Guest';
    }),
    userInitials: computed(() => {
      const p = profile();
      if (!p) return 'JD';
      const first = p.name ? p.name.charAt(0).toUpperCase() : '';
      const last = p.lastName ? p.lastName.charAt(0).toUpperCase() : '';
      return `${first}${last}` || p.email.charAt(0).toUpperCase();
    }),
    isReady: computed(() => isAuthenticated() && profile() !== null),
  })),
  withEventHandlers((store) => {
    const events = inject(Events);
    const httpService = inject(HttpService);
    const themeService = inject(ThemeService);
    const router = inject(Router);

    return {
      handleApiError$: events.on(apiErrorOccurred).pipe(
        tap((evt) => {
          toast.error(evt.payload.message || HTTP_ERROR_MESSAGES.UNKNOWN_ERROR, {
            position: 'top-center',
          });
        }),
      ),

      handleApiSuccess$: events.on(apiSuccessOccurred).pipe(
        tap((evt) => {
          toast.success(evt.payload.message, {
            position: 'top-center',
          });
        }),
      ),

      loadProfile$: events.on(userAuthenticated).pipe(
        tap(() => patchState(store, { isAuthenticated: true }, setPending())),
        switchMap(() =>
          httpService.get<{ profile: UserProfile }>('/api/v1/profile').pipe(
            tap({
              next: (res) => {
                const profile = res.data.profile;
                patchState(store, { profile }, setFulfilled());
              },
              error: (err: HttpErrorResponse) => {
                const message =
                  err.error?.message ||
                  (typeof err.error === 'string' ? err.error : null) ||
                  HTTP_ERROR_MESSAGES.UNKNOWN_ERROR;
                patchState(store, setError(message));
              },
            }),
            catchError(() => EMPTY),
          ),
        ),
      ),

      logout$: events.on(userLogout).pipe(
        tap(() => patchState(store, setPending())),
        switchMap(() =>
          httpService.post<{ loggedOut: boolean }>('/api/v1/auth/logout', {}).pipe(
            tap({
              next: (res) => {
                if (res.success) {
                  patchState(store, { ...initialAppState, theme: store.theme() }, setIdle());
                  void router.navigate(['/login']);
                } else {
                  patchState(store, setIdle());
                }
              },
              error: () => {
                patchState(store, { ...initialAppState, theme: store.theme() }, setIdle());
                void router.navigate(['/login']);
              },
            }),
            catchError(() => EMPTY),
          ),
        ),
      ),

      profileSynced$: events.on(profileSynced).pipe(
        tap(({ payload }) => {
          patchState(store, { profile: payload.profile });
        }),
      ),

      themeChanged$: events.on(themeChanged).pipe(
        tap(({ payload }) => {
          themeService.applyTheme(payload.mode);
          patchState(store, { theme: payload.mode });
        }),
      ),

      toggleMobileSidebar$: events.on(toggleMobileSidebar).pipe(
        tap(() => {
          patchState(store, { isMobileSidebarOpen: !store.isMobileSidebarOpen() });
        }),
      ),

      setMobileSidebarOpen$: events.on(setMobileSidebarOpen).pipe(
        tap(({ payload }) => {
          patchState(store, { isMobileSidebarOpen: payload.isOpen });
        }),
      ),

      autoCloseMobileSidebarOnSelect$: events.on(selectTodoList).pipe(
        tap(() => {
          if (store.isMobileSidebarOpen()) {
            patchState(store, { isMobileSidebarOpen: false });
          }
        }),
      ),
    };
  }),
  withMethods((store) => {
    const themeService = inject(ThemeService);
    const dispatcher = inject(Dispatcher);

    return {
      setAccessToken(accessToken: string | null): void {
        patchState(store, { accessToken, isAuthenticated: !!accessToken });
      },
      setAuthenticated(isAuthenticated: boolean): void {
        patchState(store, { isAuthenticated });
      },
      setTheme(theme: ThemeMode): void {
        dispatcher.dispatch(themeChanged({ mode: theme }));
      },
      toggleTheme(): void {
        const nextTheme: ThemeMode = store.theme() === 'dark' ? 'light' : 'dark';
        dispatcher.dispatch(themeChanged({ mode: nextTheme }));
      },
      toggleMobileSidebar(): void {
        dispatcher.dispatch(toggleMobileSidebar());
      },
      setMobileSidebarOpen(isOpen: boolean): void {
        dispatcher.dispatch(setMobileSidebarOpen({ isOpen }));
      },
      clear(): void {
        patchState(store, initialAppState, setIdle());
      },
    };
  }),
  withHooks({
    onInit(store) {
      const themeService = inject(ThemeService);
      const storedTheme = themeService.getStoredTheme();
      if (storedTheme !== store.theme()) {
        patchState(store, { theme: storedTheme });
      }
      themeService.applyTheme(storedTheme);
    },
  }),
);
