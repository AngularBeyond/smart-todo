import { inject } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { catchError, switchMap, throwError } from 'rxjs';
import { Dispatcher } from '@ngrx/signals/events';
import { AppStore } from '../store/app.store';
import { userLogout } from '../store/events/auth.events';
import { ApiResponse } from '../http/api-response.model';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const appStore = inject(AppStore);
  const dispatcher = inject(Dispatcher);
  const http = inject(HttpClient);

  const token = appStore.accessToken();
  let authReq = req;

  const isApiRequest = req.url.includes('/v1/');
  const isRefreshRequest = req.url.includes('/v1/auth/refresh');
  const isAuthPublicRequest = req.url.includes('/v1/auth/login') || req.url.includes('/v1/auth/register');

  if (isApiRequest && token && !isAuthPublicRequest) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
      withCredentials: true,
    });
  } else if (isApiRequest) {
    authReq = req.clone({
      withCredentials: true,
    });
  }

  return next(authReq).pipe(
    catchError((error: unknown) => {
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        isApiRequest &&
        !isRefreshRequest &&
        !isAuthPublicRequest
      ) {
        return http
          .post<ApiResponse<{ accessToken: string }>>('/v1/auth/refresh', {}, { withCredentials: true })
          .pipe(
            switchMap((refreshRes) => {
              const newAccessToken = refreshRes?.data?.accessToken;
              if (newAccessToken) {
                appStore.setAccessToken(newAccessToken);
                const retriedReq = req.clone({
                  setHeaders: {
                    Authorization: `Bearer ${newAccessToken}`,
                  },
                  withCredentials: true,
                });
                return next(retriedReq);
              }
              dispatcher.dispatch(userLogout());
              return throwError(() => error);
            }),
            catchError((refreshErr) => {
              dispatcher.dispatch(userLogout());
              return throwError(() => refreshErr);
            }),
          );
      }

      return throwError(() => error);
    }),
  );
};
