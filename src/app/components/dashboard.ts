import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Card } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { AuthService } from '../services/auth.service.js';
import { CatalogService } from '../services/catalog.service.js';
import { ProcedureService } from '../services/procedure.service.js';
import { AlertService } from '../services/alert.service.js';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    Card,
    TableModule
  ],
  template: `
    <div class="dashboard-page animate-fade-in">
      <div class="welcome-header">
        <h1>Bienvenido de nuevo, {{ currentUser()?.name }} 👋</h1>
        <p>GAD Junín — Sistema de Gestión Documental Inteligente (G-DOC)</p>
      </div>

      <!-- VISTA ADMINISTRADOR -->
      <div *ngIf="isAdmin()" class="admin-dashboard">
        <div class="stats-grid">
          <p-card styleClass="stat-card stat-indigo">
            <div class="stat-content">
              <div class="stat-icon"><i class="pi pi-users"></i></div>
              <div class="stat-values">
                <span class="value">{{ adminStats.totalUsers }}</span>
                <span class="label">Usuarios Registrados</span>
              </div>
            </div>
          </p-card>

          <p-card styleClass="stat-card stat-purple">
            <div class="stat-content">
              <div class="stat-icon"><i class="pi pi-map"></i></div>
              <div class="stat-values">
                <span class="value">{{ adminStats.totalDepts }}</span>
                <span class="label">Departamentos</span>
              </div>
            </div>
          </p-card>

          <p-card styleClass="stat-card stat-red clickable-card" [routerLink]="'/alerts'">
            <div class="stat-content">
              <div class="stat-icon"><i class="pi pi-shield"></i></div>
              <div class="stat-values">
                <span class="value">{{ adminStats.totalAlerts }}</span>
                <span class="label">Alertas Activas</span>
              </div>
              <div class="card-link-hint" *ngIf="adminStats.totalAlerts > 0">
                <i class="pi pi-arrow-right"></i>
              </div>
            </div>
          </p-card>

          <p-card styleClass="stat-card stat-green">
            <div class="stat-content">
              <div class="stat-icon"><i class="pi pi-check-circle"></i></div>
              <div class="stat-values">
                <span class="value">{{ getApprovedDocsCount() }}</span>
                <span class="label">Docs Aprobados</span>
              </div>
            </div>
          </p-card>
        </div>

        <div class="dashboard-sections">
          <!-- Historial Reciente de Operaciones -->
          <div class="section-card">
            <h3><i class="pi pi-history"></i> Historial Reciente de Operaciones</h3>
            <p-table [value]="adminStats.auditLogs" [rows]="10" styleClass="p-datatable-sm custom-table">
              <ng-template pTemplate="header">
                <tr>
                  <th>Fecha/Hora</th>
                  <th>Usuario</th>
                  <th>Documento</th>
                  <th>Operación</th>
                  <th>Descripción</th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-log>
                <tr>
                  <td>{{ log.createdAt | date:'short' }}</td>
                  <td>{{ log.user?.name || 'Sistema' }}</td>
                  <td>{{ log.document?.title || 'N/A' }}</td>
                  <td>
                    <span class="badge-op" [ngClass]="getOpClass(log.action)">
                      {{ log.action }}
                    </span>
                  </td>
                  <td>{{ log.changesDescription }}</td>
                </tr>
              </ng-template>
              <ng-template pTemplate="emptystate">
                <tr>
                  <td colspan="5" style="text-align: center; padding: 2rem;">No hay registros recientes.</td>
                </tr>
              </ng-template>
            </p-table>
          </div>
        </div>
      </div>

      <!-- VISTA FUNCIONARIOS / DIRECTORES / ALCALDE -->
      <div *ngIf="!isAdmin()" class="user-dashboard">
        <div class="stats-grid">
          <p-card styleClass="stat-card stat-indigo">
            <div class="stat-content">
              <div class="stat-icon"><i class="pi pi-inbox"></i></div>
              <div class="stat-values">
                <span class="value">{{ userStats.totalPending }}</span>
                <span class="label">Pendientes en Bandeja</span>
              </div>
            </div>
          </p-card>

          <p-card styleClass="stat-card stat-purple">
            <div class="stat-content">
              <div class="stat-icon"><i class="pi pi-cloud-download"></i></div>
              <div class="stat-values">
                <span class="value">{{ userStats.received }}</span>
                <span class="label">Trámites Recibidos</span>
              </div>
            </div>
          </p-card>

          <p-card styleClass="stat-card stat-red">
            <div class="stat-content">
              <div class="stat-icon"><i class="pi pi-exclamation-triangle"></i></div>
              <div class="stat-values">
                <span class="value">{{ userStats.expired }}</span>
                <span class="label">Trámites Vencidos</span>
              </div>
            </div>
          </p-card>

          <p-card styleClass="stat-card stat-green">
            <div class="stat-content">
              <div class="stat-icon"><i class="pi pi-check-circle"></i></div>
              <div class="stat-values">
                <span class="value">{{ userStats.finished }}</span>
                <span class="label">Trámites Finalizados</span>
              </div>
            </div>
          </p-card>
        </div>

        <div class="quick-actions-panel">
          <h2>Acciones Rápidas</h2>
          <div class="actions-grid">
            <div class="action-item-card" routerLink="/procedures/create">
              <i class="pi pi-plus-circle text-indigo"></i>
              <h4>Registrar Trámite</h4>
              <p>Crear y derivar una nueva solicitud ciudadana o depto.</p>
            </div>
            <div class="action-item-card" routerLink="/documents">
              <i class="pi pi-file-import text-purple"></i>
              <h4>Ver Documentos</h4>
              <p>Revisar borradores, aprobados o el archivo digital.</p>
            </div>
            <div class="action-item-card" routerLink="/templates">
              <i class="pi pi-clone text-green"></i>
              <h4>Plantillas Base</h4>
              <p>Buscar y descargar machotes oficiales aprobados.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-page {
      display: flex;
      flex-direction: column;
      gap: 2rem;
      font-family: 'Inter', system-ui, sans-serif;
    }
    .welcome-header h1 {
      font-size: 1.8rem;
      font-weight: 800;
      margin: 0;
      color: #ffffff;
    }
    .welcome-header p {
      font-size: 0.95rem;
      color: #94a3b8;
      margin: 0.3rem 0 0;
    }

    /* Stats Grid Cards */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.5rem;
    }
    :host ::ng-deep .stat-card {
      background: rgba(255, 255, 255, 0.03) !important;
      border: 1px solid rgba(255, 255, 255, 0.06) !important;
      border-radius: 12px !important;
      color: #ffffff !important;
    }
    .stat-content {
      display: flex;
      align-items: center;
      gap: 1.2rem;
    }
    .stat-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 50px;
      height: 50px;
      border-radius: 10px;
      font-size: 1.5rem;
    }
    .stat-indigo .stat-icon {
      background: rgba(99, 102, 241, 0.15);
      color: #818cf8;
    }
    .stat-purple .stat-icon {
      background: rgba(168, 85, 247, 0.15);
      color: #c084fc;
    }
    .stat-red .stat-icon {
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;
    }
    .stat-green .stat-icon {
      background: rgba(34, 197, 94, 0.15);
      color: #4ade80;
    }
    .stat-values {
      display: flex;
      flex-direction: column;
    }
    .stat-values .value {
      font-size: 1.6rem;
      font-weight: 800;
      line-height: 1;
    }
    .stat-values .label {
      font-size: 0.8rem;
      color: #94a3b8;
      margin-top: 0.3rem;
      font-weight: 500;
    }

    /* Sections */
    .dashboard-sections {
      margin-top: 1rem;
    }
    .section-card {
      background: rgba(15, 23, 42, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 12px;
      padding: 1.5rem;
    }
    .section-card h3 {
      font-size: 1.1rem;
      font-weight: 700;
      color: #ffffff;
      margin: 0 0 1.2rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .section-card h3 i {
      color: #818cf8;
    }

    /* Table styles override */
    :host ::ng-deep .custom-table .p-datatable-thead > tr > th {
      background: #1e293b !important;
      color: #cbd5e1 !important;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
      font-weight: 600 !important;
    }
    :host ::ng-deep .custom-table .p-datatable-tbody > tr {
      background: transparent !important;
      color: #e2e8f0 !important;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
    }
    :host ::ng-deep .custom-table .p-datatable-tbody > tr:hover {
      background: rgba(255, 255, 255, 0.02) !important;
    }

    /* Badges */
    .badge-op {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
      text-transform: uppercase;
    }
    .badge-create { background: rgba(99, 102, 241, 0.15); color: #818cf8; }
    .badge-approve { background: rgba(34, 197, 94, 0.15); color: #4ade80; }
    .badge-reject { background: rgba(239, 68, 68, 0.15); color: #f87171; }
    .badge-alert { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
    .badge-default { background: rgba(148, 163, 184, 0.15); color: #cbd5e1; }

    /* Quick Actions */
    .quick-actions-panel {
      background: rgba(15, 23, 42, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 12px;
      padding: 1.8rem;
    }
    .quick-actions-panel h2 {
      font-size: 1.2rem;
      font-weight: 700;
      color: #ffffff;
      margin: 0 0 1.2rem;
    }
    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
    }
    .action-item-card {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 10px;
      padding: 1.5rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .action-item-card:hover {
      background: rgba(99, 102, 241, 0.05);
      border-color: rgba(99, 102, 241, 0.2);
      transform: translateY(-2px);
    }
    .action-item-card i {
      font-size: 2rem;
      margin-bottom: 0.8rem;
    }
    .action-item-card h4 {
      font-size: 1rem;
      font-weight: 700;
      margin: 0 0 0.4rem;
      color: #ffffff;
    }
    .action-item-card p {
      font-size: 0.85rem;
      color: #94a3b8;
      margin: 0;
      line-height: 1.4;
    }
    .text-indigo { color: #818cf8; }
    .text-purple { color: #c084fc; }
    .text-green { color: #4ade80; }

    :host ::ng-deep .clickable-card {
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s !important;
    }
    :host ::ng-deep .clickable-card:hover {
      transform: translateY(-3px) !important;
      box-shadow: 0 8px 25px rgba(0,0,0,0.3) !important;
    }
    .card-link-hint {
      margin-left: auto;
      color: rgba(255,255,255,0.4);
      font-size: 0.9rem;
      transition: color 0.2s, transform 0.2s;
    }
    :host ::ng-deep .clickable-card:hover .card-link-hint {
      color: rgba(255,255,255,0.8);
      transform: translateX(3px);
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .animate-fade-in {
      animation: fadeIn 0.4s ease-out;
    }
  `]
})
export class DashboardComponent implements OnInit {
  currentUser: any;
  adminStats: any = {
    totalUsers: 0,
    totalDepts: 0,
    totalAlerts: 0,
    documentsByStatus: [],
    auditLogs: []
  };

  userStats = {
    totalPending: 0,
    pending: 0,
    received: 0,
    derived: 0,
    expired: 0,
    finished: 0
  };

  constructor(
    private authService: AuthService,
    private catalogService: CatalogService,
    private procedureService: ProcedureService,
    private alertService: AlertService,
    private cdr: ChangeDetectorRef
  ) {
    this.currentUser = this.authService.currentUser;
  }

  ngOnInit() {
    // Intentar cargar inmediatamente
    if (this.isAdmin()) {
      this.loadAdminStats();
    } else if (this.authService.isLoggedIn()) {
      // Si el usuario está logueado pero el signal aun no se resolvió,
      // esperar un tick para que Angular inicialice el signal correctamente
      setTimeout(() => {
        if (this.isAdmin()) {
          this.loadAdminStats();
        } else {
          this.loadUserStats();
        }
        this.cdr.detectChanges();
      }, 0);
    }
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  loadAdminStats() {
    this.catalogService.getSystemReports().subscribe({
      next: (res) => {
        this.adminStats = {
          totalUsers: res.stats.totalUsers,
          totalDepts: res.stats.totalDepts,
          totalAlerts: res.stats.totalAlerts,
          documentsByStatus: res.stats.documentsByStatus,
          auditLogs: res.auditLogs
        };
        this.cdr.detectChanges();
        // Sobrescribir con el conteo real desde el endpoint de alertas
        this.alertService.getAlerts().subscribe({
          next: (alerts) => {
            this.adminStats = { ...this.adminStats, totalAlerts: alerts.length };
            this.cdr.detectChanges();
          }
        });
      },
      error: (err) => {
        console.error('Error loading admin stats', err);
        // Intentar obtener alertas de todas formas
        this.alertService.getAlerts().subscribe({
          next: (alerts) => {
            this.adminStats = { ...this.adminStats, totalAlerts: alerts.length };
            this.cdr.detectChanges();
          }
        });
      }
    });
  }

  loadUserStats() {
    this.procedureService.getInboxCounts().subscribe({
      next: (res) => {
        this.userStats = res;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading user stats', err);
      }
    });
  }

  getApprovedDocsCount(): number {
    const approvedItem = this.adminStats.documentsByStatus.find((item: any) => item.status === 'APPROVED');
    return approvedItem ? approvedItem._count.id : 0;
  }

  getOpClass(action: string): string {
    const act = action.toUpperCase();
    if (act.includes('CREATE')) return 'badge-create';
    if (act.includes('APPROVE')) return 'badge-approve';
    if (act.includes('REJECT')) return 'badge-reject';
    if (act.includes('VIOLATION') || act.includes('ALERT')) return 'badge-alert';
    return 'badge-default';
  }
}
