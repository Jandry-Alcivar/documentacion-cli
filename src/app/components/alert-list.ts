import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TableModule } from 'primeng/table';
import { Button } from 'primeng/button';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AlertService } from '../services/alert.service.js';

@Component({
  selector: 'app-alert-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TableModule,
    Toast
  ],
  providers: [MessageService],
  template: `
    <div class="alerts-page animate-fade-in">
      <p-toast></p-toast>

      <div class="page-header">
        <div>
          <h1>Alertas de Integridad Criptográfica</h1>
          <p>Supervisa archivos físicos del servidor cuya firma digital SHA256 no coincida con el registro original</p>
        </div>
      </div>

      <div class="table-card">
        <p-table [value]="alerts" [rows]="10" [paginator]="true" styleClass="p-datatable-sm custom-table">
          <ng-template pTemplate="header">
            <tr>
              <th>Fecha Alerta</th>
              <th>Documento</th>
              <th>Operador Creador</th>
              <th>Detalle del Incidente</th>
              <th style="width: 180px; text-align: center;">Acciones</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-alert>
            <tr class="alert-row">
              <td>{{ alert.createdAt | date:'medium' }}</td>
              <td class="font-semibold text-dark">{{ alert.document?.title }}</td>
              <td>{{ alert.user?.name || 'Desconocido' }}</td>
              <td class="text-red font-semibold"><i class="pi pi-exclamation-triangle mr-1"></i> {{ alert.message }}</td>
              <td>
                <div class="action-buttons">
                  <button 
                    class="btn-action-icon text-blue" 
                    [routerLink]="'/documents/detail/' + alert.document?.id"
                    title="Inspeccionar Documento"
                  >
                    <i class="pi pi-eye"></i>
                  </button>
                  <button 
                    class="btn-action-icon text-green" 
                    (click)="onResolve(alert.id)"
                    title="Resolver / Marcar Leída"
                  >
                    <i class="pi pi-check"></i>
                  </button>
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptystate">
            <tr>
              <td colspan="5" class="empty-state-verified">
                <i class="pi pi-verified"></i>
                <p class="font-bold">No se detectaron alteraciones en la integridad de los archivos.</p>
                <span>Todos los hashes criptográficos SHA256 coinciden con el registro original.</span>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </div>
  `,
  styles: [`
    .alerts-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      font-family: 'Inter', system-ui, sans-serif;
    }
    .page-header h1 {
      font-size: 1.5rem;
      font-weight: 800;
      margin: 0;
      color: #0f172a;
    }
    .page-header p {
      font-size: 0.9rem;
      color: #64748b;
      margin: 0.25rem 0 0;
    }

    /* Table styles */
    .table-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }
    .text-dark {
      color: #0f172a !important;
    }
    .alert-row {
      background: #fff7ed !important;
    }
    .text-red {
      color: #b91c1c !important;
    }
    .text-blue { color: #1d4ed8 !important; }
    .text-green { color: #047857 !important; }

    /* Buttons */
    .action-buttons {
      display: flex;
      justify-content: center;
      gap: 0.4rem;
    }
    .btn-action-icon {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      color: #475569;
      width: 32px;
      height: 32px;
      border-radius: 6px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.15s;
    }
    .btn-action-icon:hover {
      background: #eff6ff;
      border-color: #bfdbfe;
      transform: translateY(-1px);
    }
    .empty-state-verified {
      text-align: center;
      padding: 3.5rem 1rem !important;
      color: #047857;
    }
    .empty-state-verified i {
      font-size: 2.5rem;
      color: #059669;
      margin-bottom: 0.5rem;
      display: block;
    }
    .empty-state-verified p {
      margin: 0 0 0.25rem;
      font-size: 1rem;
      color: #065f46;
    }
    .empty-state-verified span {
      font-size: 0.85rem;
      color: #64748b;
    }
  `]
})
export class AlertListComponent implements OnInit {
  alerts: any[] = [];

  constructor(
    private alertService: AlertService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadAlerts();
  }

  loadAlerts() {
    this.alertService.getAlerts().subscribe({
      next: (res) => {
        this.alerts = res;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar alertas', err)
    });
  }

  onResolve(id: string) {
    this.alertService.markAsRead(id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Alerta Resuelta',
          detail: 'El estado del documento ha sido verificado.'
        });
        this.loadAlerts();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.error || 'No se pudo resolver la alerta.'
        });
        this.cdr.detectChanges();
      }
    });
  }
}
