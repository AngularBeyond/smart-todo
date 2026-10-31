import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { withRequestStatus } from '@core';
import { ProfileData } from '../models';
import { DEFAULT_PROFILE } from '../constants';

export interface ProfileState {
  profile: ProfileData;
  saved: boolean;
}

const initialProfileState: ProfileState = {
  profile: DEFAULT_PROFILE,
  saved: true,
};

export const ProfileStore = signalStore(
  withState<ProfileState>(initialProfileState),
  withRequestStatus(),
  withComputed(({ profile }) => ({
    fullName: computed(() => `${profile().firstName} ${profile().lastName}`.trim()),
    initials: computed(() => {
      const p = profile();
      const first = p.firstName.charAt(0);
      const last = p.lastName.charAt(0);
      return (first + last).toUpperCase();
    }),
  })),
  withMethods((store) => ({
    updateField<K extends keyof ProfileData>(key: K, value: ProfileData[K]): void {
      patchState(store, {
        profile: {
          ...store.profile(),
          [key]: value,
        },
        saved: false,
      });
    },
    saveChanges(): void {
      patchState(store, { saved: true });
    },
  })),
);
