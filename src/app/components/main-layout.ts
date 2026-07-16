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
    Button,
    BadgeModule
  ],
  template: `
    <div class="app-layout">
      <!-- Sidebar de Navegación -->
      <aside class="sidebar">
        <div class="sidebar-brand">
          <span class="logo-icon"><i class="pi pi-briefcase"></i></span>
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
            <span>Trámites</span>
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
          
          <div class="menu-divider" *ngIf="showAuditMenu()">Seguridad</div>

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
            <span>Reportes</span>
          </a>

          <div class="menu-divider" *ngIf="showAdminMenu()">Administración</div>
          
          <a routerLink="users" routerLinkActive="active-link" class="menu-item" *ngIf="showAdminMenu()">
            <i class="pi pi-users"></i>
            <span>Usuarios</span>
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
        <!-- Header Superior -->
        <header class="app-header">
          <div class="header-left">
            <span class="dept-badge">
              <i class="pi pi-map-marker"></i>
              {{ currentUser()?.department?.name || 'Dirección General' }}
            </span>
          </div>
          <div class="header-right">
            <p-button 
              icon="pi pi-power-off" 
              label="Cerrar Sesión" 
              styleClass="p-button-outlined p-button-danger btn-logout"
              (click)="onLogout()"
            ></p-button>
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
      background-color: #0f172a;
      color: #f8fafc;
      font-family: 'Inter', system-ui, sans-serif;
    }

    /* Sidebar Styles */
    .sidebar {
      width: 280px;
      background: linear-gradient(180deg, #1e1b4b 0%, #0f172a 100%);
      border-right: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      position: sticky;
      top: 0;
      height: 100vh;
    }
    .sidebar-brand {
      padding: 1.5rem 1.8rem;
      display: flex;
      align-items: center;
      gap: 0.8rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }
    .sidebar-brand .logo-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
      color: #ffffff;
      border-radius: 10px;
      font-size: 1.2rem;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
    }
    .brand-text h3 {
      font-size: 1.2rem;
      font-weight: 800;
      margin: 0;
      letter-spacing: 0.05em;
      background: linear-gradient(to right, #ffffff, #c084fc);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .brand-text span {
      font-size: 0.75rem;
      color: #94a3b8;
      font-weight: 500;
    }
    .sidebar-menu {
      padding: 1.5rem 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      flex-grow: 1;
      overflow-y: auto;
    }
    .menu-item {
      display: flex;
      align-items: center;
      gap: 0.8rem;
      padding: 0.75rem 1rem;
      color: #94a3b8;
      text-decoration: none;
      border-radius: 8px;
      font-size: 0.95rem;
      font-weight: 500;
      transition: all 0.2s;
    }
    .menu-item i {
      font-size: 1.1rem;
      transition: transform 0.2s;
    }
    .menu-item:hover {
      background: rgba(255, 255, 255, 0.04);
      color: #f8fafc;
    }
    .menu-item:hover i {
      transform: translateX(2px);
    }
    .active-link {
      background: rgba(99, 102, 241, 0.15) !important;
      color: #818cf8 !important;
      font-weight: 600;
      border-left: 3px solid #6366f1;
      border-radius: 4px 8px 8px 4px;
    }
    .menu-divider {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      color: #475569;
      letter-spacing: 0.05em;
      margin: 1.5rem 0 0.5rem 1rem;
    }
    .alert-item {
      justify-content: flex-start;
    }
    .alert-badge {
      margin-left: auto;
      background: #ef4444;
      color: #fff;
      font-size: 0.7rem;
      font-weight: 700;
      border-radius: 12px;
      padding: 0.1rem 0.45rem;
      min-width: 18px;
      text-align: center;
      animation: pulse-badge 2s ease-in-out infinite;
    }
    @keyframes pulse-badge {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.8; transform: scale(1.08); }
    }

    /* Sidebar Footer */
    .sidebar-footer {
      padding: 1.2rem;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
    }
    .user-badge-sidebar {
      display: flex;
      align-items: center;
      gap: 0.8rem;
      background: rgba(255, 255, 255, 0.03);
      padding: 0.8rem;
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }
    .avatar-circle {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      color: #ffffff;
      font-weight: 700;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.95rem;
      box-shadow: 0 4px 10px rgba(124, 58, 237, 0.25);
    }
    .user-meta {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .user-meta .name {
      font-size: 0.85rem;
      font-weight: 600;
      color: #f8fafc;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
    }
    .user-meta .role {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    /* Main Container & Header */
    .main-container {
      display: flex;
      flex-direction: column;
      flex-grow: 1;
      min-width: 0;
      height: 100vh;
      overflow: hidden;
    }
    .app-header {
      height: 70px;
      background-color: #0b0f19;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 2rem;
      flex-shrink: 0;
    }
    .dept-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(99, 102, 241, 0.1);
      color: #a5b4fc;
      font-size: 0.85rem;
      font-weight: 600;
      padding: 0.4rem 0.8rem;
      border-radius: 8px;
      border: 1px solid rgba(99, 102, 241, 0.2);
    }
    :host ::ng-deep .btn-logout {
      border-radius: 8px !important;
      padding: 0.4rem 0.8rem !important;
      font-size: 0.85rem !important;
    }

    /* Content Area */
    .content-area {
      flex-grow: 1;
      padding: 2rem;
      overflow-y: auto;
      background-color: #0f172a;
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
