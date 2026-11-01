import { Routes } from '@angular/router';
import { authGuard, guestGuard } from '@core';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('@layout').then((m) => m.FullScreenLayout),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/auth/login/pages/login-page/login-page').then((m) => m.LoginPage),
      },
    ],
  },
  {
    path: 'signup',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('@layout').then((m) => m.FullScreenLayout),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/auth/register/pages/register-page/register-page').then((m) => m.RegisterPage),
      },
    ],
  },
  {
    path: 'register',
    redirectTo: 'signup',
    pathMatch: 'full',
  },
  {
    path: '',
    loadComponent: () =>
      import('@layout').then((m) => m.Main),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./features/todos/pages/todos-page/todos-page').then((m) => m.TodosPage),
      },
      {
        path: 'tags',
        loadComponent: () =>
          import('./features/tags/pages/tags-page/tags-page').then((m) => m.TagsPage),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/pages/settings-page/settings-page').then((m) => m.SettingsPage),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/profile/pages/profile-page/profile-page').then((m) => m.ProfilePage),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
