import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { AuditService } from '../services/audit.service.js';

@Component({
  selector: 'app-audit-list',
  standalone: true,
  imports: [
    CommonModule,
    TableModule
  ],
  template: `
    <div class="audit-page animate-fade-in">
      <div class="page-header">
        <div>
          <h1>Bitácora de Auditoría del Sistema</h1>
          <p>Registro histórico detallado de transacciones, ingresos de credenciales y operaciones de seguridad del sistema</p>
        </div>
      </div>

      <div class="table-card">
        <p-table [value]="logs" [rows]="15" [paginator]="true" styleClass="p-datatable-sm custom-table">
          <ng-template pTemplate="header">
            <tr>
              <th style="width: 180px;">Fecha y Hora</th>
              <th>Operador</th>
              <th>Módulo</th>
              <th>Operación</th>
              <th>ID Registro</th>
              <th>IP Servidor/Cliente</th>
              <th>Detalles</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-log>
            <tr>
              <td>{{ log.createdAt | date:'medium' }}</td>
              <td class="font-semibold text-white">{{ log.user?.name || 'Sistema' }}</td>
              <td>
                <span class="module-badge">{{ log.module }}</span>
              </td>
              <td>{{ log.action }}</td>
              <td class="font-mono text-xs">{{ log.recordId }}</td>
              <td><code>{{ log.ipAddress || '127.0.0.1' }}</code></td>
              <td>
                <span class="details-text" [title]="log.details">{{ log.details || 'Sin detalles' }}</span>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptystate">
            <tr>
              <td colspan="7" style="text-align: center; padding: 3rem;">No se encontraron registros de auditoría.</td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </div>
  `,
  styles: [`
    .audit-page {
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
    }
    :host ::ng-deep .custom-table .p-datatable-tbody > tr:hover {
      background: rgba(255, 255, 255, 0.02) !important;
    }
    :host ::ng-deep .custom-table .p-datatable-tbody > tr > td {
      padding: 1rem !important;
      border: none !important;
    }

    .module-badge {
      background: rgba(99, 102, 241, 0.12);
      color: #818cf8;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .details-text {
      max-width: 250px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      display: inline-block;
      color: #94a3b8;
    }
  `]
})
export class AuditListComponent implements OnInit {
  logs: any[] = [];

  constructor(private auditService: AuditService) {}

  ngOnInit() {
    this.loadLogs();
  }

  loadLogs() {
    this.auditService.getAuditLogs().subscribe({
      next: (res) => this.logs = res,
      error: (err) => console.error('Error loading audit logs', err)
    });
  }
}
