import { Routes } from '@angular/router';

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
      // Frameless/unauthenticated pages will be mounted here in future stories (login, register)
    ],
  },
  {
    path: 'app',
    loadComponent: () =>
      import('@layout').then((m) => m.Main),
    children: [
      // Protected dashboard and todo pages will be mounted here in future stories
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
