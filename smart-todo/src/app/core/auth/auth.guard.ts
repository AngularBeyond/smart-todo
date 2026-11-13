import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { Dispatcher } from '@ngrx/signals/events';
import { HttpService } from '../http/http.service';
import { AppStore } from '../store/app.store';
import { userAuthenticated } from '../store/events/auth.events';

export const authGuard: CanActivateFn = () => {
  const appStore = inject(AppStore);
  const router = inject(Router);
  const http = inject(HttpService);
  const dispatcher = inject(Dispatcher);

  if (appStore.isAuthenticated() && appStore.accessToken()) {
    return true;
  }

  return http
    .post<{ accessToken: string }>('/api/v1/auth/refresh', {})
    .pipe(
      map((res) => {
        if (res.success && res.data?.accessToken) {
          appStore.setAccessToken(res.data.accessToken);
          appStore.setAuthenticated(true);
          dispatcher.dispatch(userAuthenticated());
          return true;
        }
        return router.createUrlTree(['/login']);
      }),
      catchError(() => of(router.createUrlTree(['/login']))),
    );
};
