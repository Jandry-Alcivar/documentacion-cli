import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Button } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { AuthService } from '../services/auth.service.js';
import { AlertService } from '../services/alert.service.js';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    BadgeModule
  ],
  template: `
    <div class="app-layout">
      <!-- Sidebar de Navegación Institucional -->
      <aside class="sidebar">
        <div class="sidebar-brand">
          <div class="logo-box">
            <i class="pi pi-building-columns"></i>
          </div>
          <div class="brand-text">
            <h3>G-DOC</h3>
            <span>Gestión Documental</span>
          </div>
        </div>

        <nav class="sidebar-menu">
          <a routerLink="dashboard" routerLinkActive="active-link" class="menu-item">
            <i class="pi pi-chart-bar"></i>
            <span>Dashboard</span>
          </a>
          <a routerLink="procedures" routerLinkActive="active-link" class="menu-item">
            <i class="pi pi-folder-open"></i>
            <span>Trámites & Expedientes</span>
          </a>
          <a routerLink="physical-archive" routerLinkActive="active-link" class="menu-item">
            <i class="pi pi-box"></i>
            <span>Archivo Físico</span>
          </a>
          <a routerLink="documents" routerLinkActive="active-link" class="menu-item">
            <i class="pi pi-file"></i>
            <span>Documentos</span>
          </a>
          <a routerLink="templates" routerLinkActive="active-link" class="menu-item">
            <i class="pi pi-clone"></i>
            <span>Plantillas</span>
          </a>
          
          <div class="menu-divider" *ngIf="showAuditMenu()">Seguridad y Control</div>

          <a routerLink="alerts" routerLinkActive="active-link" class="menu-item alert-item" *ngIf="showAuditMenu()">
            <i class="pi pi-shield"></i>
            <span>Alertas de Integridad</span>
            <span class="alert-badge" *ngIf="alertCount() > 0">{{ alertCount() }}</span>
          </a>
          <a routerLink="audit-logs" routerLinkActive="active-link" class="menu-item" *ngIf="showAuditMenu()">
            <i class="pi pi-list"></i>
            <span>Bitácora de Auditoría</span>
          </a>
          <a routerLink="reports" routerLinkActive="active-link" class="menu-item" *ngIf="showAuditMenu()">
            <i class="pi pi-chart-pie"></i>
            <span>Centro de Reportes</span>
          </a>

          <div class="menu-divider" *ngIf="showAdminMenu()">Administración</div>
          
          <a routerLink="users" routerLinkActive="active-link" class="menu-item" *ngIf="showAdminMenu()">
            <i class="pi pi-users"></i>
            <span>Usuarios & Roles</span>
          </a>
          <a routerLink="workflow-designer" routerLinkActive="active-link" class="menu-item" *ngIf="showAdminMenu()">
            <i class="pi pi-directions"></i>
            <span>Diseñador de Flujos</span>
          </a>
          <a routerLink="catalogs" routerLinkActive="active-link" class="menu-item" *ngIf="showAdminMenu()">
            <i class="pi pi-cog"></i>
            <span>Configuración</span>
          </a>
        </nav>

        <div class="sidebar-footer">
          <div class="user-badge-sidebar">
            <div class="avatar-circle">
              {{ userInitials() }}
            </div>
            <div class="user-meta">
              <span class="name">{{ currentUser()?.name }}</span>
              <span class="role">{{ currentUser()?.role?.name }}</span>
            </div>
          </div>
        </div>
      </aside>

      <!-- Contenedor Principal -->
      <div class="main-container">
        <!-- Header Superior Institucional -->
        <header class="app-header">
          <div class="header-left">
            <span class="dept-badge">
              <i class="pi pi-building text-blue-600"></i>
              <span class="dept-label">{{ currentUser()?.department?.name || 'Dirección General' }}</span>
            </span>
          </div>
          <div class="header-right">
            <button class="btn-logout" (click)="onLogout()">
              <i class="pi pi-power-off mr-1"></i> Cerrar Sesión
            </button>
          </div>
        </header>

        <!-- Area de Contenido (Router Outlet) -->
        <main class="content-area">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .app-layout {
      display: flex;
      min-height: 100vh;
      background-color: #f1f5f9;
      color: #0f172a;
      font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
    }

    /* Sidebar Institucional */
    .sidebar {
      width: 270px;
      background: linear-gradient(180deg, #0f2137 0%, #0a1626 100%);
      border-right: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      position: sticky;
      top: 0;
      height: 100vh;
      box-shadow: 2px 0 12px rgba(0, 0, 0, 0.08);
      z-index: 10;
    }

    .sidebar-brand {
      padding: 1.25rem 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.85rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      background: rgba(0, 0, 0, 0.15);
    }

    .logo-box {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 38px;
      height: 38px;
      background: linear-gradient(135deg, #1d4ed8 0%, #0284c7 100%);
      color: #ffffff;
      border-radius: 9px;
      font-size: 1.15rem;
      box-shadow: 0 2px 8px rgba(2, 132, 199, 0.35);
    }

    .brand-text h3 {
      font-size: 1.15rem;
      font-weight: 800;
      margin: 0;
      letter-spacing: 0.05em;
      color: #ffffff;
    }

    .brand-text span {
      font-size: 0.72rem;
      color: #94a3b8;
      font-weight: 500;
      letter-spacing: 0.02em;
    }

    .sidebar-menu {
      padding: 1.2rem 0.85rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      flex-grow: 1;
      overflow-y: auto;
    }

    .menu-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.65rem 0.9rem;
      color: #94a3b8;
      text-decoration: none;
      border-radius: 7px;
      font-size: 0.88rem;
      font-weight: 500;
      transition: all 0.15s ease;
    }

    .menu-item i {
      font-size: 1.05rem;
      color: #64748b;
      transition: color 0.15s ease;
    }

    .menu-item:hover {
      background: rgba(255, 255, 255, 0.06);
      color: #ffffff;
    }

    .menu-item:hover i {
      color: #38bdf8;
    }

    .active-link {
      background: rgba(29, 78, 216, 0.25) !important;
      color: #ffffff !important;
      font-weight: 600;
      border-left: 3px solid #38bdf8;
      border-radius: 4px 7px 7px 4px;
    }

    .active-link i {
      color: #38bdf8 !important;
    }

    .menu-divider {
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      color: #475569;
      letter-spacing: 0.06em;
      margin: 1.2rem 0 0.4rem 0.9rem;
    }

    .alert-item {
      justify-content: flex-start;
    }

    .alert-badge {
      margin-left: auto;
      background: #dc2626;
      color: #ffffff;
      font-size: 0.7rem;
      font-weight: 700;
      border-radius: 10px;
      padding: 0.1rem 0.45rem;
      min-width: 18px;
      text-align: center;
    }

    /* Sidebar Footer */
    .sidebar-footer {
      padding: 1rem;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      background: rgba(0, 0, 0, 0.15);
    }

    .user-badge-sidebar {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: rgba(255, 255, 255, 0.04);
      padding: 0.65rem 0.8rem;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.06);
    }

    .avatar-circle {
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, #1e40af 0%, #0369a1 100%);
      color: #ffffff;
      font-weight: 700;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.85rem;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    }

    .user-meta {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .user-meta .name {
      font-size: 0.82rem;
      font-weight: 600;
      color: #f8fafc;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
    }

    .user-meta .role {
      font-size: 0.72rem;
      color: #94a3b8;
    }

    /* Main Container & Topbar */
    .main-container {
      display: flex;
      flex-direction: column;
      flex-grow: 1;
      min-width: 0;
      height: 100vh;
      overflow: hidden;
    }

    .app-header {
      height: 64px;
      background-color: #ffffff;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 1.8rem;
      flex-shrink: 0;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
    }

    .dept-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: #eff6ff;
      color: #1e40af;
      font-size: 0.82rem;
      font-weight: 600;
      padding: 0.35rem 0.8rem;
      border-radius: 6px;
      border: 1px solid #bfdbfe;
    }

    .btn-logout {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      background: #fff5f5;
      border: 1px solid #fecaca;
      color: #dc2626;
      padding: 0.45rem 0.85rem;
      border-radius: 6px;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .btn-logout:hover {
      background: #dc2626;
      color: #ffffff;
      border-color: #dc2626;
    }

    /* Content Area */
    .content-area {
      flex-grow: 1;
      padding: 1.8rem;
      overflow-y: auto;
      background-color: #f1f5f9;
    }
  `]
})
export class MainLayoutComponent implements OnInit {
  private authService = inject(AuthService);
  private alertService = inject(AlertService);
  private router = inject(Router);
  currentUser = this.authService.currentUser;
  alertCount = signal<number>(0);

  ngOnInit() {
    this.loadAlertCount();
  }

  loadAlertCount() {
    this.alertService.getAlerts().subscribe({
      next: (alerts) => this.alertCount.set(alerts.length),
      error: () => this.alertCount.set(0)
    });
  }

  userInitials = computed(() => {
    const user = this.currentUser();
    if (!user) return 'U';
    const names = user.name.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return user.name[0].toUpperCase();
  });

  showAdminMenu(): boolean {
    return this.authService.isAdmin();
  }

  showAuditMenu(): boolean {
    const role = this.currentUser()?.role?.name;
    return !!role && ['Administrador', 'Alcalde', 'Director Departamental', 'Auditor'].includes(role);
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
