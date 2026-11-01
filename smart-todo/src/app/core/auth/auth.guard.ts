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

  if (appStore.isAuthenticated()) {
    return true;
  }

  return http.get<{ success: boolean }>('/api/v1/auth/authenticated').pipe(
    map((res) => {
      if (res.success) {
        dispatcher.dispatch(userAuthenticated());
        return true;
      }
      return router.createUrlTree(['/login']);
    }),
    catchError(() => of(router.createUrlTree(['/login']))),
  );
};
