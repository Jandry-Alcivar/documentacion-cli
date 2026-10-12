import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
              <td class="font-semibold text-dark">{{ log.user?.name || 'Sistema' }}</td>
              <td>
                <span class="module-badge">{{ log.module }}</span>
              </td>
              <td><span class="action-tag">{{ log.action }}</span></td>
              <td class="font-mono text-xs">{{ log.recordId }}</td>
              <td><code class="ip-code">{{ log.ipAddress || '127.0.0.1' }}</code></td>
              <td>
                <span class="details-text" [title]="log.details">{{ log.details || 'Sin detalles' }}</span>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptystate">
            <tr>
              <td colspan="7" style="text-align: center; padding: 3rem; color: #94a3b8;">No se encontraron registros de auditoría.</td>
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
    .module-badge {
      background: #eff6ff;
      color: #1d4ed8;
      border: 1px solid #bfdbfe;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
    }
    .action-tag {
      font-weight: 600;
      color: #334155;
    }
    .ip-code {
      background: #f1f5f9;
      padding: 0.2rem 0.4rem;
      border-radius: 4px;
      font-size: 0.8rem;
      color: #475569;
    }
    .details-text {
      max-width: 250px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      display: inline-block;
      color: #64748b;
    }
  `]
})
export class AuditListComponent implements OnInit {
  logs: any[] = [];

  constructor(private auditService: AuditService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadLogs();
  }

  loadLogs() {
    this.auditService.getAuditLogs().subscribe({
      next: (res) => {
        this.logs = res;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading audit logs', err)
    });
  }
}
