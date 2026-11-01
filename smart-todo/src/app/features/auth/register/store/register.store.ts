import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { Dispatcher } from '@ngrx/signals/events';
import { catchError, EMPTY, pipe, switchMap, tap } from 'rxjs';
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
import { RegisterFeatureState, RegisterRequest } from '../models';

export interface AuthSuccessPayload {
  accessToken: string;
  user: {
    id: string;
    name: string;
    lastName: string;
    email: string;
    preferredTheme: string;
  };
}

const initialRegisterState: RegisterFeatureState = {
  showPassword: false,
};

export const RegisterStore = signalStore(
  withState<RegisterFeatureState>(initialRegisterState),
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
      register: rxMethod<RegisterRequest>(
        pipe(
          tap(() => patchState(store, setPending())),
          switchMap((request) =>
            http.post<AuthSuccessPayload>('/v1/auth/register', request).pipe(
              tap({
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
              catchError(() => EMPTY),
            ),
          ),
        ),
      ),
    }),
  ),
);

