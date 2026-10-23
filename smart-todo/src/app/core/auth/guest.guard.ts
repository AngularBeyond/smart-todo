import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AppStore } from '../store/app.store';

export const guestGuard: CanActivateFn = () => {
  const appStore = inject(AppStore);
  const router = inject(Router);

  if (appStore.isAuthenticated()) {
    return router.createUrlTree(['/app/todos']);
  }

  return true;
};
