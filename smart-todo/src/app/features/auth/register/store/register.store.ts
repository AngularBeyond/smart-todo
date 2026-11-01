import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { withRequestStatus } from '@core';
import { RegisterFeatureState } from '../models';

const initialRegisterState: RegisterFeatureState = {
  showPassword: false,
  submitted: false,
};

export const RegisterStore = signalStore(
  withState<RegisterFeatureState>(initialRegisterState),
  withRequestStatus(),
  withMethods((store) => ({
    toggleShowPassword(): void {
      patchState(store, { showPassword: !store.showPassword() });
    },
    setSubmitted(submitted: boolean): void {
      patchState(store, { submitted });
    },
    reset(): void {
      patchState(store, initialRegisterState);
    },
  })),
);
