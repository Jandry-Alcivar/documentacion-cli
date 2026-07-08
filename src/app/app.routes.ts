import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard.js';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./components/login.js').then(m => m.LoginComponent)
  },
  {
    path: '',
    loadComponent: () => import('./components/main-layout.js').then(m => m.MainLayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./components/dashboard.js').then(m => m.DashboardComponent)
      },
      {
        path: 'documents',
        loadComponent: () => import('./components/document-list.js').then(m => m.DocumentListComponent)
      },
      {
        path: 'documents/create',
        loadComponent: () => import('./components/document-create.js').then(m => m.DocumentCreateComponent)
      },
      {
        path: 'documents/detail/:id',
        loadComponent: () => import('./components/document-detail.js').then(m => m.DocumentDetailComponent)
      },
      {
        path: 'procedures',
        loadComponent: () => import('./components/procedure-list.js').then(m => m.ProcedureListComponent)
      },
      {
        path: 'procedures/create',
        loadComponent: () => import('./components/procedure-create.js').then(m => m.ProcedureCreateComponent)
      },
      {
        path: 'templates',
        loadComponent: () => import('./components/template-list.js').then(m => m.TemplateListComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('./components/user-list.js').then(m => m.UserListComponent)
      },
      {
        path: 'catalogs',
        loadComponent: () => import('./components/catalog-list.js').then(m => m.CatalogListComponent)
      },
      {
        path: 'alerts',
        loadComponent: () => import('./components/alert-list.js').then(m => m.AlertListComponent)
      },
      {
        path: 'audit-logs',
        loadComponent: () => import('./components/audit-list.js').then(m => m.AuditListComponent)
      },
      {
        path: 'reports',
        loadComponent: () => import('./components/report-list.js').then(m => m.ReportListComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
