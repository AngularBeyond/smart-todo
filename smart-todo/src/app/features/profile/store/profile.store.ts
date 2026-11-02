import { computed, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { Dispatcher } from '@ngrx/signals/events';
import { catchError, EMPTY, pipe, switchMap, tap } from 'rxjs';
import {
  ApiResponse,
  AppStore,
  HTTP_ERROR_MESSAGES,
  HttpService,
  apiSuccessOccurred,
  profileSynced,
  setError,
  setFulfilled,
  setIdle,
  setPending,
  UserProfile,
  withRequestStatus,
} from '@core';
import {
  ChangePasswordRequest,
  ChangePasswordResponseData,
  ProfileResponseData,
  ProfileState,
  UpdateProfileRequest,
} from '../models';
import { PROFILE_CONSTANTS } from '../constants';

const initialProfileState: ProfileState = {
  profile: null,
  profileSuccess: false,
  passwordSuccess: false,
};

export const ProfileStore = signalStore(
  withState<ProfileState>(initialProfileState),
  withRequestStatus(),
  withComputed(({ profile }) => ({
    fullName: computed(() => {
      const p = profile();
      return p ? `${p.name ?? ''} ${p.lastName ?? ''}`.trim() || p.email : '';
    }),
    initials: computed(() => {
      const p = profile();
      if (!p) return 'U';
      const first = p.name ? p.name.charAt(0) : '';
      const last = p.lastName ? p.lastName.charAt(0) : '';
      return (first + last).toUpperCase() || p.email.charAt(0).toUpperCase();
    }),
    email: computed(() => profile()?.email ?? ''),
  })),
  withMethods(
    (
      store,
      http = inject(HttpService),
      dispatcher = inject(Dispatcher),
      appStore = inject(AppStore),
    ) => ({
      setProfile(profile: UserProfile): void {
        patchState(store, { profile });
      },
      clearStatus(): void {
        patchState(store, { profileSuccess: false, passwordSuccess: false }, setIdle());
      },
      loadProfile: rxMethod<void>(
        pipe(
          tap(() => patchState(store, setPending())),
          switchMap(() =>
            http.get<ProfileResponseData>('/api/v1/profile').pipe(
              tap({
                next: (res) => {
                  const profile = res.data.profile;
                  patchState(store, { profile }, setFulfilled());
                  dispatcher.dispatch(profileSynced({ profile }));
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
      updateProfile: rxMethod<UpdateProfileRequest>(
        pipe(
          tap(() => patchState(store, { profileSuccess: false }, setPending())),
          switchMap((dto) =>
            http.patch<ProfileResponseData>('/api/v1/profile', dto).pipe(
              tap({
                next: (res) => {
                  const profile = res.data.profile;
                  patchState(store, { profile, profileSuccess: true }, setFulfilled());
                  dispatcher.dispatch(profileSynced({ profile }));
                  dispatcher.dispatch(
                    apiSuccessOccurred({ message: PROFILE_CONSTANTS.PROFILE_SAVED_SUCCESS }),
                  );
                },
                error: (error: HttpErrorResponse) => {
                  const message =
                    error.error?.message ||
                    (typeof error.error === 'string' ? error.error : null) ||
                    HTTP_ERROR_MESSAGES.UNKNOWN_ERROR;
                  patchState(store, { profileSuccess: false }, setError(message));
                },
              }),
              catchError(() => EMPTY),
            ),
          ),
        ),
      ),
      changePassword: rxMethod<ChangePasswordRequest>(
        pipe(
          tap(() => patchState(store, { passwordSuccess: false }, setPending())),
          switchMap((dto) =>
            http.patch<ChangePasswordResponseData>('/api/v1/auth/change-password', dto).pipe(
              tap({
                next: (res) => {
                  patchState(store, { passwordSuccess: true }, setFulfilled());
                  if (res.data?.accessToken) {
                    appStore.setAccessToken(res.data.accessToken);
                  }
                  dispatcher.dispatch(
                    apiSuccessOccurred({ message: PROFILE_CONSTANTS.PASSWORD_CHANGED_SUCCESS }),
                  );
                },
                error: (error: HttpErrorResponse) => {
                  const message =
                    error.error?.message ||
                    (typeof error.error === 'string' ? error.error : null) ||
                    HTTP_ERROR_MESSAGES.UNKNOWN_ERROR;
                  patchState(store, { passwordSuccess: false }, setError(message));
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
