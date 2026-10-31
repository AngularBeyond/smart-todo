import { Routes } from '@angular/router';
import { authGuard, guestGuard } from '@core';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('@layout').then((m) => m.FullScreenLayout),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'app',
      },
      {
        path: 'login',
        canActivate: [guestGuard],
        loadComponent: () =>
          import('./features/auth/login/pages/login-page/login-page').then((m) => m.LoginPage),
      },
      {
        path: 'register',
        canActivate: [guestGuard],
        children: [],
      },
    ],
  },
  {
    path: 'app',
    canActivate: [authGuard],
    loadComponent: () =>
      import('@layout').then((m) => m.Main),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'todos',
      },
      {
        path: 'todos',
        children: [],
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
