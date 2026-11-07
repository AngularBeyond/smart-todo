import { inject } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import {
  catchError,
  finalize,
  map,
  Observable,
  of,
  shareReplay,
  switchMap,
  throwError,
} from 'rxjs';
import { Dispatcher } from '@ngrx/signals/events';
import { environment } from '../../../environments/environment';
import { AppStore } from '../store/app.store';
import { userLogout } from '../store/events/auth.events';
import { ApiResponse } from '../http/api-response.model';

let refreshObservable$: Observable<string | null> | null = null;

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const appStore = inject(AppStore);
  const dispatcher = inject(Dispatcher);
  const http = inject(HttpClient);

  const token = appStore.accessToken();
  let authReq = req;

  const isApiRequest = req.url.includes(environment.apiUrl) || req.url.includes('/api/v1/') || req.url.includes('/v1/');
  const isRefreshRequest = req.url.includes('/auth/refresh');
  const isAuthPublicRequest = req.url.includes('/auth/login') || req.url.includes('/auth/register');

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
        if (!refreshObservable$) {
          refreshObservable$ = http
            .post<ApiResponse<{ accessToken: string }>>(
              `${environment.apiUrl}/auth/refresh`,
              {},
              { withCredentials: true },
            )
            .pipe(
              map((res) => res?.data?.accessToken ?? null),
              catchError(() => of(null)),
              shareReplay(1),
              finalize(() => {
                refreshObservable$ = null;
              }),
            );
        }

        return refreshObservable$.pipe(
          switchMap((newAccessToken) => {
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
        );
      }

      return throwError(() => error);
    }),
  );
};
