import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { withRequestStatus } from '@core';
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
  withMethods((store) => ({
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
  })),
);
