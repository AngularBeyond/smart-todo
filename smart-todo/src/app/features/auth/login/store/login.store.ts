import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { Dispatcher } from '@ngrx/signals/events';
import { tapResponse } from '@ngrx/operators';
import { pipe, switchMap, tap } from 'rxjs';
import {
  ApiResponse,
  HTTP_ERROR_MESSAGES,
  HttpService,
  setError,
  setFulfilled,
  setIdle,
  setPending,
  withRequestStatus,
} from '@core';
import { userAuthenticated } from '../../../../core/store/events/auth.events';
import { AppStore } from '../../../../core/store/app.store';
import { LoginCredentials, LoginFeatureState } from '../models';

export interface AuthSuccessPayload {
  accessToken: string;
  user: {
    id: string;
    name: string;
    lastName: string;
    email: string;
  };
}

const initialLoginState: LoginFeatureState = {
  showPassword: false,
};

export const LoginStore = signalStore(
  withState<LoginFeatureState>(initialLoginState),
  withRequestStatus(),
  withMethods(
    (
      store,
      http = inject(HttpService),
      router = inject(Router),
      dispatcher = inject(Dispatcher),
      appStore = inject(AppStore),
    ) => ({
      toggleShowPassword(): void {
        patchState(store, { showPassword: !store.showPassword() });
      },
      clearError(): void {
        patchState(store, setIdle());
      },
      login: rxMethod<LoginCredentials>(
        pipe(
          tap(() => patchState(store, setPending())),
          switchMap((credentials) =>
            http.post<AuthSuccessPayload>('/api/v1/auth/login', credentials).pipe(
              tapResponse({
                next: (response) => {
                  patchState(store, setFulfilled());
                  appStore.setAccessToken(response.data.accessToken);
                  dispatcher.dispatch(userAuthenticated());
                  void router.navigate(['/']);
                },
                error: (error: HttpErrorResponse) => {
                  const message =
                    error.error?.message ||
                    (typeof error.error === 'string' ? error.error : null) ||
                    HTTP_ERROR_MESSAGES.UNKNOWN_ERROR;
                  patchState(store, setError(message));
                },
              }),
            ),
          ),
        ),
      ),
    }),
  ),
);

