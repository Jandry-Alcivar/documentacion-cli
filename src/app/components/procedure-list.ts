import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { Select } from 'primeng/select';
import { Dialog } from 'primeng/dialog';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../services/auth.service.js';
import { ProcedureService } from '../services/procedure.service.js';
import { DepartmentService } from '../services/department.service.js';

@Component({
  selector: 'app-procedure-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    TableModule,
    Select,
    Dialog,
    Toast
  ],
  providers: [MessageService],
  template: `
    <div class="procedure-list-page animate-fade-in">
      <p-toast></p-toast>

      <div class="page-header">
        <div>
          <h1>Control de Trámites y Procesos</h1>
          <p>Supervisa el estado y asignación de expedientes administrativos e institucionales</p>
        </div>
        <button 
          *ngIf="canCreate()"
          class="p-button p-button-primary btn-create"
          routerLink="create"
        >
          <i class="pi pi-plus mr-1"></i> Iniciar Trámite
        </button>
      </div>

      <!-- Pestañas de Vista -->
      <div class="tabs-container">
        <button 
          class="tab-btn" 
          [class.active-tab]="activeView === 'inbox'" 
          (click)="changeView('inbox')"
        >
          <i class="pi pi-inbox"></i> Mi Bandeja de Entrada
        </button>
        <button 
          class="tab-btn" 
          [class.active-tab]="activeView === 'all'" 
          (click)="changeView('all')"
        >
          <i class="pi pi-globe"></i> Historial General del Depto
        </button>
      </div>

      <!-- Tabla de Trámites -->
      <div class="table-card">
        <p-table [value]="procedures" [rows]="10" [paginator]="true" styleClass="p-datatable-sm custom-table">
          <ng-template pTemplate="header">
            <tr>
              <th>Código</th>
              <th>Asunto</th>
              <th>Solicitante</th>
              <th>Prioridad</th>
              <th>Asignado</th>
              <th>Fecha Inicio</th>
              <th>Estado</th>
              <th style="width: 120px; text-align: center;">Acciones</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-proc>
            <tr>
              <td class="font-semibold text-white">{{ proc.code }}</td>
              <td>{{ proc.subject }}</td>
              <td>{{ proc.applicantName }}</td>
              <td>
                <span class="p-priority" [ngClass]="getPriorityClass(proc.priority)">
                  {{ proc.priority }}
                </span>
              </td>
              <td>{{ proc.assignee?.name || 'Sin Asignar' }}</td>
              <td>{{ proc.createdAt | date:'shortDate' }}</td>
              <td>
                <span class="status-badge" [ngClass]="getStatusClass(proc.status)">
                  {{ proc.status }}
                </span>
              </td>
              <td class="text-center">
                  <button 
                    class="p-button p-button-rounded p-button-text p-button-info" 
                    (click)="showDetail(proc.id)"
                    title="Ver Detalles"
                  >
                    <i class="pi pi-info-circle" style="font-size: 1.15rem;"></i>
                  </button>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptystate">
            <tr>
              <td colspan="8" style="text-align: center; padding: 3rem;">No se encontraron trámites en esta bandeja.</td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <!-- DIALOGO DETALLES TRÁMITE -->
      <p-dialog 
        header="Detalle de Trámite" 
        [(visible)]="showDetailDialog" 
        [modal]="true" 
        [style]="{width: '650px'}"
        appendTo="body"
      >
        <div class="proc-detail-content" *ngIf="selectedProcedure">
          <div class="proc-header-meta">
            <h2>{{ selectedProcedure.code }}</h2>
            <span class="status-badge" [ngClass]="getStatusClass(selectedProcedure.status)">{{ selectedProcedure.status }}</span>
          </div>

          <div class="info-section">
            <h4>Detalles de Solicitud</h4>
            <div class="info-grid">
              <div class="info-item"><strong>Asunto:</strong> {{ selectedProcedure.subject }}</div>
              <div class="info-item"><strong>Prioridad:</strong> {{ selectedProcedure.priority }}</div>
              <div class="info-item"><strong>Solicitante:</strong> {{ selectedProcedure.applicantName }}</div>
              <div class="info-item" *ngIf="selectedProcedure.applicantEmail"><strong>Email Solicitante:</strong> {{ selectedProcedure.applicantEmail }}</div>
              <div class="info-item" *ngIf="selectedProcedure.applicantPhone"><strong>Teléfono:</strong> {{ selectedProcedure.applicantPhone }}</div>
              <div class="info-item"><strong>Fecha Inicio:</strong> {{ selectedProcedure.createdAt | date:'medium' }}</div>
            </div>
            <div class="desc-box">
              <strong>Descripción:</strong>
              <p>{{ selectedProcedure.description }}</p>
            </div>
          </div>

          <!-- Documentos Relacionados al trámite -->
          <div class="docs-section">
            <h4>Expediente Digital (Documentos Asociados)</h4>
            <p-table [value]="selectedProcedure.documents" styleClass="p-datatable-sm custom-table">
              <ng-template pTemplate="header">
                <tr>
                  <th>Título</th>
                  <th>Estado</th>
                  <th style="width: 80px; text-align: center;">Ver</th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-doc>
                <tr>
                  <td class="text-white">{{ doc.title }}</td>
                  <td>{{ doc.status }}</td>
                  <td class="text-center">
                    <p-button 
                      icon="pi pi-eye" 
                      styleClass="p-button-text p-button-sm p-button-info" 
                      [routerLink]="'/documents/detail/' + doc.id"
                      (click)="showDetailDialog = false"
                    ></p-button>
                  </td>
                </tr>
              </ng-template>
              <ng-template pTemplate="emptystate">
                <tr>
                  <td colspan="3" style="text-align: center; padding: 1.5rem;">No se han adjuntado documentos a este trámite.</td>
                </tr>
              </ng-template>
            </p-table>
          </div>

          <!-- Modificación Administrativa del Trámite -->
          <div class="admin-actions-section" *ngIf="canManage()">
            <h4>Gestión de Trámite</h4>
            <div class="admin-grid">
              <div class="admin-field">
                <label>Cambiar Asignado:</label>
                <p-select 
                  [options]="deptUsers" 
                  [(ngModel)]="newAssignee" 
                  optionLabel="name" 
                  optionValue="id"
                  placeholder="Selecciona empleado"
                  styleClass="w-full"
                  appendTo="body"
                ></p-select>
              </div>
              <div class="admin-field">
                <label>Actualizar Estado:</label>
                <p-select 
                  [options]="statuses" 
                  [(ngModel)]="newStatus" 
                  placeholder="Selecciona estado"
                  styleClass="w-full"
                  appendTo="body"
                ></p-select>
              </div>
            </div>
            <button 
              class="p-button p-button-success w-full mt-3"
              (click)="onSaveChanges()"
            >
              <i class="pi pi-save mr-2"></i> Guardar Cambios Administrativos
            </button>
          </div>
        </div>
      </p-dialog>
    </div>
  `,
  styles: [`
    .procedure-list-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      font-family: 'Inter', system-ui, sans-serif;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .page-header h1 {
      font-size: 1.8rem;
      font-weight: 800;
      margin: 0;
      color: #ffffff;
    }
    .page-header p {
      font-size: 0.95rem;
      color: #94a3b8;
      margin: 0.3rem 0 0;
    }
    :host ::ng-deep .btn-create {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%) !important;
      border: none !important;
      border-radius: 8px !important;
      padding: 0.6rem 1.2rem !important;
      font-weight: 600 !important;
    }

    /* Tabs Layout */
    .tabs-container {
      display: flex;
      gap: 0.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding-bottom: 0.1rem;
    }
    .tab-btn {
      background: transparent;
      border: none;
      color: #94a3b8;
      padding: 0.8rem 1.2rem;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      border-bottom: 3px solid transparent;
      transition: all 0.2s;
    }
    .tab-btn:hover {
      color: #f8fafc;
      background: rgba(255, 255, 255, 0.02);
      border-radius: 6px 6px 0 0;
    }
    .active-tab {
      color: #818cf8;
      border-bottom-color: #6366f1;
    }

    /* Table Styles */
    .table-card {
      background: rgba(15, 23, 42, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 12px;
      overflow: hidden;
    }
    :host ::ng-deep .custom-table .p-datatable-thead > tr > th {
      background: #1e293b !important;
      color: #cbd5e1 !important;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
      font-weight: 600 !important;
      padding: 1rem !important;
    }
    :host ::ng-deep .custom-table .p-datatable-tbody > tr {
      background: transparent !important;
      color: #e2e8f0 !important;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
    }
    :host ::ng-deep .custom-table .p-datatable-tbody > tr:hover {
      background: rgba(255, 255, 255, 0.02) !important;
    }

    /* Status Badges */
    .status-badge {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
      text-transform: uppercase;
      display: inline-block;
    }
    .badge-received { background: rgba(99, 102, 241, 0.15); color: #818cf8; }
    .badge-pending { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
    .badge-finished { background: rgba(34, 197, 94, 0.15); color: #4ade80; }

    /* Priorities */
    .p-priority {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
    }
    .p-alta { background: rgba(239, 68, 68, 0.15); color: #f87171; }
    .p-normal { background: rgba(99, 102, 241, 0.15); color: #818cf8; }
    .p-baja { background: rgba(148, 163, 184, 0.15); color: #cbd5e1; }

    /* Dialog styling */
    .proc-detail-content {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      color: #cbd5e1;
    }
    .proc-header-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding-bottom: 0.8rem;
    }
    .proc-header-meta h2 {
      margin: 0;
      color: #ffffff;
    }
    .info-section h4, .docs-section h4, .admin-actions-section h4 {
      font-size: 0.95rem;
      font-weight: 700;
      color: #ffffff;
      margin: 0 0 0.8rem;
      border-left: 3px solid #6366f1;
      padding-left: 0.5rem;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.8rem;
      font-size: 0.85rem;
    }
    .desc-box {
      margin-top: 1rem;
      font-size: 0.85rem;
      background: rgba(0, 0, 0, 0.2);
      padding: 0.8rem;
      border-radius: 6px;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }
    .desc-box p {
      margin: 0.4rem 0 0;
      line-height: 1.4;
    }
    .admin-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }
    .admin-field {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }
    .admin-field label {
      font-size: 0.8rem;
      font-weight: 600;
    }
    .mt-3 { margin-top: 1rem; }
    .font-semibold { font-weight: 600; }
    .text-white { color: #ffffff; }
    .text-center { text-align: center; }
  `]
})
export class ProcedureListComponent implements OnInit {
  procedures: any[] = [];
  activeView = 'inbox'; // 'inbox' or 'all'
  selectedProcedure: any = null;
  showDetailDialog = false;

  // Management properties
  deptUsers: any[] = [];
  statuses: string[] = ['REGISTRADO', 'RECIBIDO', 'EN_REVISION', 'DERIVADO', 'OBSERVADO', 'FINALIZADO'];
  newAssignee = null;
  newStatus = null;

  constructor(
    private authService: AuthService,
    private procedureService: ProcedureService,
    private departmentService: DepartmentService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadProcedures();
  }

  canCreate(): boolean {
    return this.authService.hasPermission('procedures.create');
  }

  canManage(): boolean {
    return this.authService.hasPermission('procedures.manage');
  }

  loadProcedures() {
    this.procedureService.getProcedures(this.activeView).subscribe({
      next: (res) => { this.procedures = res; this.cdr.detectChanges(); }
    });
  }

  changeView(view: string) {
    this.activeView = view;
    this.loadProcedures();
  }

  showDetail(id: string) {
    this.procedureService.getProcedureById(id).subscribe({
      next: (res) => {
        this.selectedProcedure = res;
        this.newAssignee = res.assigneeId;
        this.newStatus = res.status;
        this.showDetailDialog = true;
        this.cdr.detectChanges();

        if (this.canManage()) {
          this.loadDepartmentUsers();
        }
      }
    });
  }

  loadDepartmentUsers() {
    const deptId = this.authService.currentUser()?.department?.id;
    if (deptId) {
      this.departmentService.getDepartmentUsers(deptId).subscribe({
        next: (res) => { this.deptUsers = res; this.cdr.detectChanges(); }
      });
    }
  }

  onSaveChanges() {
    if (!this.selectedProcedure) return;

    const updateObj = {
      assigneeId: this.newAssignee,
      status: this.newStatus
    };

    this.procedureService.updateProcedure(this.selectedProcedure.id, updateObj).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Modificación Exitosa',
          detail: 'El trámite ha sido actualizado correctamente.'
        });
        this.showDetailDialog = false;
        this.loadProcedures();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.error || 'No se pudo guardar la modificación.'
        });
      }
    });
  }

  getPriorityClass(priority: string): string {
    const p = priority.toUpperCase();
    if (p.includes('ALTA') || p.includes('URGENTE')) return 'p-alta';
    if (p.includes('BAJA')) return 'p-baja';
    return 'p-normal';
  }

  getStatusClass(status: string): string {
    const s = status.toUpperCase();
    if (s.includes('FINALIZADO') || s.includes('CERRADO')) return 'badge-finished';
    if (s.includes('EN_REVISION') || s.includes('OBSERVADO')) return 'badge-pending';
    return 'badge-received';
  }
}
