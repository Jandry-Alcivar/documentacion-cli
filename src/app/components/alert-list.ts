import { Component, OnInit } from '@angular/core';
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
    Button,
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
              <td class="font-semibold text-white">{{ alert.document?.title }}</td>
              <td>{{ alert.user?.name || 'Desconocido' }}</td>
              <td class="text-red font-semibold"><i class="pi pi-exclamation-triangle"></i> {{ alert.message }}</td>
              <td>
                <div class="action-buttons">
                  <p-button 
                    icon="pi pi-eye" 
                    styleClass="p-button-rounded p-button-text p-button-info" 
                    [routerLink]="'/documents/detail/' + alert.document?.id"
                    title="Inspeccionar Documento"
                  ></p-button>
                  <p-button 
                    icon="pi pi-check" 
                    styleClass="p-button-rounded p-button-text p-button-success" 
                    (click)="onResolve(alert.id)"
                    title="Resolver / Marcar Leída"
                  ></p-button>
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptystate">
            <tr>
              <td colspan="5" style="text-align: center; padding: 3rem;">
                <i class="pi pi-verified" style="font-size: 2.5rem; color: #10b981; margin-bottom: 0.5rem; display: block;"></i>
                No se detectaron alteraciones en la integridad de los archivos. Todo está verificado.
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

    /* Table styles */
    .table-card {
      background: rgba(15, 23, 42, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.3);
    }
    :host ::ng-deep .custom-table .p-datatable-thead > tr > th {
      background: rgba(15, 23, 42, 0.6) !important;
      color: #94a3b8 !important;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
      padding: 1rem !important;
      font-weight: 600;
    }
    :host ::ng-deep .custom-table .p-datatable-tbody > tr {
      background: transparent !important;
      color: #cbd5e1 !important;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
      transition: background 0.2s;
    }
    :host ::ng-deep .custom-table .p-datatable-tbody > tr:hover {
      background: rgba(255, 255, 255, 0.02) !important;
    }
    :host ::ng-deep .custom-table .p-datatable-tbody > tr > td {
      padding: 1rem !important;
      border: none !important;
    }

    .alert-row {
      background: rgba(239, 68, 68, 0.03) !important;
    }
    .text-red {
      color: #f87171 !important;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    /* Buttons */
    .action-buttons {
      display: flex;
      justify-content: center;
      gap: 0.5rem;
    }
  `]
})
export class AlertListComponent implements OnInit {
  alerts: any[] = [];

  constructor(
    private alertService: AlertService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.loadAlerts();
  }

  loadAlerts() {
    this.alertService.getAlerts().subscribe({
      next: (res) => this.alerts = res,
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
      }
    });
  }
}
