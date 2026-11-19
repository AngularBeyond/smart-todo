import { inject } from '@angular/core';
import { patchState, signalStore, withHooks, withMethods, withState } from '@ngrx/signals';
import { Dispatcher, Events, withEventHandlers } from '@ngrx/signals/events';
import { tap } from 'rxjs';
import { themeChanged, ThemeMode, ThemeService, withRequestStatus } from '@core';
import { WorkspaceSettings } from '../models';
import { DEFAULT_SETTINGS } from '../constants';

export interface SettingsState {
  settings: WorkspaceSettings;
  saved: boolean;
}

const initialSettingsState: SettingsState = {
  settings: DEFAULT_SETTINGS,
  saved: true,
};

export const SettingsStore = signalStore(
  withState<SettingsState>(initialSettingsState),
  withRequestStatus(),
  withEventHandlers((store, events = inject(Events)) => ({
    syncTheme$: events.on(themeChanged).pipe(
      tap(({ payload }) => {
        if (store.settings().appearance !== payload.mode) {
          patchState(store, {
            settings: {
              ...store.settings(),
              appearance: payload.mode,
            },
          });
        }
      }),
    ),
  })),
  withMethods(
    (
      store,
      dispatcher = inject(Dispatcher, { optional: true }),
      themeService = inject(ThemeService, { optional: true }),
    ) => ({
      toggleNotifications(): void {
        patchState(store, {
          settings: {
            ...store.settings(),
            notifications: !store.settings().notifications,
          },
          saved: true,
        });
      },
      setAppearance(appearance: 'light' | 'dark' | 'system'): void {
        patchState(store, {
          settings: {
            ...store.settings(),
            appearance,
          },
          saved: true,
        });
        if (appearance === 'light' || appearance === 'dark') {
          dispatcher?.dispatch(themeChanged({ mode: appearance }));
          themeService?.applyTheme(appearance);
        }
      },
      toggleAppearance(): void {
        const current = store.settings().appearance === 'dark' ? 'dark' : 'light';
        const next: ThemeMode = current === 'dark' ? 'light' : 'dark';
        this.setAppearance(next);
      },
      setDefaultList(defaultList: string): void {
        patchState(store, {
          settings: {
            ...store.settings(),
            defaultList,
          },
          saved: true,
        });
      },
      setDailyTaskLimit(dailyTaskLimit: number): void {
        patchState(store, {
          settings: {
            ...store.settings(),
            dailyTaskLimit,
          },
          saved: true,
        });
      },
      toggleStartOfWeek(): void {
        const next = store.settings().startOfWeek === 'Monday' ? 'Sunday' : 'Monday';
        patchState(store, {
          settings: {
            ...store.settings(),
            startOfWeek: next,
          },
          saved: true,
        });
      },
      markSaved(): void {
        patchState(store, { saved: true });
      },
    }),
  ),
  withHooks({
    onInit(store) {
      const themeService = inject(ThemeService, { optional: true });
      if (themeService) {
        const storedTheme = themeService.getStoredTheme();
        if (store.settings().appearance !== storedTheme) {
          patchState(store, {
            settings: {
              ...store.settings(),
              appearance: storedTheme,
            },
          });
        }
      }
    },
  }),
);
