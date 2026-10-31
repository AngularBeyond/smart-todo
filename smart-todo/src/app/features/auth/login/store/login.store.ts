import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { withRequestStatus } from '@core';

export interface LoginState {
  showPassword: boolean;
  submitted: boolean;
}

const initialLoginState: LoginState = {
  showPassword: false,
  submitted: false,
};

export const LoginStore = signalStore(
  withState<LoginState>(initialLoginState),
  withRequestStatus(),
  withMethods((store) => ({
    toggleShowPassword(): void {
      patchState(store, { showPassword: !store.showPassword() });
    },
    setSubmitted(submitted: boolean): void {
      patchState(store, { submitted });
    },
    reset(): void {
      patchState(store, initialLoginState);
    },
  })),
);
