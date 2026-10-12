import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Card } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { UIChart } from 'primeng/chart';
import { Select } from 'primeng/select';
import { ReportService } from '../services/report.service.js';
import { DepartmentService } from '../services/department.service.js';
import { CatalogService } from '../services/catalog.service.js';
import { AuthService } from '../services/auth.service.js';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-report-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    UIChart,
    Select
  ],
  template: `
    <div class="reports-page animate-fade-in">
      <!-- Encabezado Institucional -->
      <div class="page-header">
        <div class="header-titles">
          <h1><i class="pi pi-chart-pie mr-2 text-indigo-600"></i>Centro de Reportes & Analítica Institucional</h1>
          <p>Métricas consolidadas de tiempos de resolución, eficiencia de trámites e inventario documental</p>
        </div>
        <div class="header-actions">
          <button class="btn-export-pdf" (click)="exportExecutivePDF()">
            <i class="pi pi-file-pdf mr-1"></i> Descargar Informe Ejecutivo (PDF)
          </button>
        </div>
      </div>

      <!-- Barra de Filtros Globales -->
      <div class="filters-card">
        <div class="filters-grid">
          <div class="filter-field">
            <label><i class="pi pi-building mr-1"></i> Departamento</label>
            <p-select 
              [options]="deptOptions" 
              [(ngModel)]="selectedDept" 
              optionLabel="name" 
              optionValue="id"
              (onChange)="onFilterChange()"
              [disabled]="isDeptLocked"
              class="w-full"
            ></p-select>
          </div>

          <div class="filter-field">
            <label><i class="pi pi-tag mr-1"></i> Estado del Trámite</label>
            <p-select 
              [options]="statusOptions" 
              [(ngModel)]="selectedStatus" 
              optionLabel="label" 
              optionValue="value"
              (onChange)="onFilterChange()"
              class="w-full"
            ></p-select>
          </div>

          <div class="filter-field">
            <label><i class="pi pi-calendar mr-1"></i> Fecha Desde</label>
            <input type="date" [(ngModel)]="startDate" (change)="onFilterChange()" class="filter-date-input" />
          </div>

          <div class="filter-field">
            <label><i class="pi pi-calendar mr-1"></i> Fecha Hasta</label>
            <input type="date" [(ngModel)]="endDate" (change)="onFilterChange()" class="filter-date-input" />
          </div>

          <div class="filter-btn-box">
            <button class="btn-clear-filters" (click)="resetFilters()" title="Restablecer filtros">
              <i class="pi pi-filter-slash mr-1"></i> Limpiar
            </button>
          </div>
        </div>
      </div>

      <!-- Pestañas / Tabs del Centro de Reportes -->
      <div class="reports-tabs-bar">
        <button class="tab-btn" [class.active]="activeTab === 'dashboard'" (click)="activeTab = 'dashboard'">
          <i class="pi pi-th-large mr-1"></i> Resumen General
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'procedures'" (click)="activeTab = 'procedures'">
          <i class="pi pi-folder-open mr-1"></i> Reporte de Trámites ({{ procData?.detailed?.length || 0 }})
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'documents'" (click)="activeTab = 'documents'">
          <i class="pi pi-file mr-1"></i> Inventario de Documentos ({{ docData?.detailed?.length || 0 }})
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'departments'" (click)="activeTab = 'departments'">
          <i class="pi pi-building mr-1"></i> Rendimiento por Departamentos
        </button>
      </div>

      <!-- ========================================================================= -->
      <!-- TAB 1: RESUMEN GENERAL (INDICADORES + GRÁFICOS) -->
      <!-- ========================================================================= -->
      <div *ngIf="activeTab === 'dashboard'" class="tab-content animate-fade-in">
        <!-- Métricas Principales -->
        <div class="metrics-grid">
          <div class="metric-card card-blue">
            <div class="metric-icon-box bg-blue-50 text-blue-600">
              <i class="pi pi-folder"></i>
            </div>
            <div class="metric-content">
              <span class="value">{{ procData.total || 0 }}</span>
              <span class="label">Total Expedientes</span>
              <small class="sub-label">En periodo consultado</small>
            </div>
          </div>

          <div class="metric-card card-purple">
            <div class="metric-icon-box bg-purple-50 text-purple-600">
              <i class="pi pi-file"></i>
            </div>
            <div class="metric-content">
              <span class="value">{{ docData.total || 0 }}</span>
              <span class="label">Total Documentos</span>
              <small class="sub-label">Oficios y resoluciones</small>
            </div>
          </div>

          <div class="metric-card card-green">
            <div class="metric-icon-box bg-green-50 text-green-600">
              <i class="pi pi-clock"></i>
            </div>
            <div class="metric-content">
              <span class="value">{{ procData.avgHours || 0 }} hrs</span>
              <span class="label">Tiempo Promedio</span>
              <small class="sub-label">Resolución institucional</small>
            </div>
          </div>

          <div class="metric-card card-amber">
            <div class="metric-icon-box bg-amber-50 text-amber-600">
              <i class="pi pi-check-circle"></i>
            </div>
            <div class="metric-content">
              <span class="value">{{ (procData.byStatus && procData.byStatus['FINALIZADO']) || 0 }}</span>
              <span class="label">Trámites Concluidos</span>
              <small class="sub-label">{{ getCompletionRate() }}% de resolución</small>
            </div>
          </div>
        </div>

        <!-- Gráficos Principales -->
        <div class="charts-grid mt-4">
          <div class="chart-card">
            <div class="card-header-clean">
              <h3><i class="pi pi-chart-pie text-indigo-500 mr-2"></i>Distribución de Trámites por Estado</h3>
            </div>
            <div class="chart-wrapper">
              <p-chart type="doughnut" [data]="statusChartData" [options]="statusChartOptions" *ngIf="statusChartData"></p-chart>
            </div>
          </div>
          
          <div class="chart-card">
            <div class="card-header-clean">
              <h3><i class="pi pi-chart-bar text-indigo-500 mr-2"></i>Trámites Asignados por Departamento</h3>
            </div>
            <div class="chart-wrapper">
              <p-chart type="bar" [data]="deptChartData" [options]="deptChartOptions" *ngIf="deptChartData"></p-chart>
            </div>
          </div>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- TAB 2: REPORTE DETALLADO DE TRÁMITES -->
      <!-- ========================================================================= -->
      <div *ngIf="activeTab === 'procedures'" class="tab-content animate-fade-in">
        <div class="report-section-card">
          <div class="section-card-header">
            <div>
              <h3><i class="pi pi-folder text-blue-600 mr-2"></i>Listado Detallado de Expedientes</h3>
              <p>Historial consolidado de trámites registrados con departamento actual y responsable</p>
            </div>
            <button class="btn-download-table-pdf" (click)="exportProceduresPDF()">
              <i class="pi pi-file-pdf mr-1"></i> Exportar Trámites PDF
            </button>
          </div>

          <div class="table-container">
            <table class="report-table">
              <thead>
                <tr>
                  <th style="width: 130px;">Código</th>
                  <th>Asunto & Solicitante</th>
                  <th>Departamento</th>
                  <th>Responsable</th>
                  <th style="text-align: center; width: 100px;">Prioridad</th>
                  <th style="text-align: center; width: 110px;">Fecha Ingreso</th>
                  <th style="text-align: center; width: 120px;">Estado</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let proc of procData.detailed">
                  <td>
                    <span class="code-badge">{{ proc.code }}</span>
                  </td>
                  <td>
                    <div class="cell-primary">{{ proc.subject }}</div>
                    <small class="cell-sub"><i class="pi pi-user mr-1"></i>{{ proc.applicantName || 'Trámite Interno' }}</small>
                  </td>
                  <td>{{ proc.department?.name || 'General' }}</td>
                  <td>{{ proc.assignee?.name || 'Bandeja General' }}</td>
                  <td class="text-center">
                    <span class="priority-pill" [ngClass]="getPriorityClass(proc.priority)">{{ proc.priority }}</span>
                  </td>
                  <td class="text-center text-sm">{{ proc.createdAt | date:'dd/MM/yyyy' }}</td>
                  <td class="text-center">
                    <span class="status-pill" [ngClass]="getStatusClass(proc.status)">{{ proc.status }}</span>
                  </td>
                </tr>
                <tr *ngIf="!procData.detailed || procData.detailed.length === 0">
                  <td colspan="7" class="text-center py-4 text-muted">No se encontraron expedientes con los filtros aplicados.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- TAB 3: REPORTE DE DOCUMENTOS & OFICIOS -->
      <!-- ========================================================================= -->
      <div *ngIf="activeTab === 'documents'" class="tab-content animate-fade-in">
        <div class="report-section-card">
          <div class="section-card-header">
            <div>
              <h3><i class="pi pi-file text-purple-600 mr-2"></i>Inventario General de Documentos y Oficios</h3>
              <p>Registro de memorandos, resoluciones, informes técnicos y oficios emitidos</p>
            </div>
            <button class="btn-download-table-pdf" (click)="exportDocumentsPDF()">
              <i class="pi pi-file-pdf mr-1"></i> Exportar Documentos PDF
            </button>
          </div>

          <div class="table-container">
            <table class="report-table">
              <thead>
                <tr>
                  <th>Título del Documento</th>
                  <th>Tipo / Categoría</th>
                  <th>Expediente Vinculado</th>
                  <th>Departamento Creador</th>
                  <th style="text-align: center; width: 120px;">Firma Digital</th>
                  <th style="text-align: center; width: 110px;">Fecha Registro</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let doc of docData.detailed">
                  <td>
                    <div class="cell-primary">{{ doc.title }}</div>
                    <small class="cell-sub" *ngIf="doc.creator"><i class="pi pi-user mr-1"></i>{{ doc.creator.name }}</small>
                  </td>
                  <td>
                    <span class="type-badge">{{ doc.type?.name || 'Oficio General' }}</span>
                  </td>
                  <td>
                    <span class="code-badge" *ngIf="doc.procedure">{{ doc.procedure.code }}</span>
                    <span class="text-muted text-xs" *ngIf="!doc.procedure">Sin trámite</span>
                  </td>
                  <td>{{ doc.department?.name || 'General' }}</td>
                  <td class="text-center">
                    <span class="signed-badge" *ngIf="doc.signatures && doc.signatures.length > 0">
                      <i class="pi pi-verified mr-1"></i> Firmado ({{ doc.signatures.length }})
                    </span>
                    <span class="unsigned-badge" *ngIf="!doc.signatures || doc.signatures.length === 0">
                      Pendiente
                    </span>
                  </td>
                  <td class="text-center text-sm">{{ doc.createdAt | date:'dd/MM/yyyy' }}</td>
                </tr>
                <tr *ngIf="!docData.detailed || docData.detailed.length === 0">
                  <td colspan="6" class="text-center py-4 text-muted">No se encontraron documentos en este reporte.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- TAB 4: RENDIMIENTO Y CARGA POR DEPARTAMENTO -->
      <!-- ========================================================================= -->
      <div *ngIf="activeTab === 'departments'" class="tab-content animate-fade-in">
        <div class="dept-performance-grid">
          <div class="report-section-card">
            <h3><i class="pi pi-building text-indigo-600 mr-2"></i>Carga Laboral por Departamento</h3>
            <div class="table-container mt-3">
              <table class="report-table">
                <thead>
                  <tr>
                    <th>Departamento</th>
                    <th style="text-align: center; width: 120px;">Trámites Asignados</th>
                    <th style="text-align: center; width: 100px;">% del Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let deptName of objectKeys(procData.byDepartment || {})">
                    <td class="font-semibold text-slate-800">{{ deptName }}</td>
                    <td class="text-center font-bold text-indigo-600">{{ procData.byDepartment[deptName] }}</td>
                    <td class="text-center">
                      <span class="pct-badge">{{ getDepartmentPercentage(procData.byDepartment[deptName]) }}%</span>
                    </td>
                  </tr>
                  <tr *ngIf="objectKeys(procData.byDepartment || {}).length === 0">
                    <td colspan="3" class="text-center py-4 text-muted">No hay datos departamentales.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="report-section-card">
            <h3><i class="pi pi-chart-pie text-emerald-600 mr-2"></i>Producción Documental por Tipo</h3>
            <div class="table-container mt-3">
              <table class="report-table">
                <thead>
                  <tr>
                    <th>Categoría / Tipo Documental</th>
                    <th style="text-align: center; width: 120px;">Cantidad Emitida</th>
                    <th style="text-align: center; width: 100px;">% del Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let typeName of objectKeys(docData.byType || {})">
                    <td class="font-semibold text-slate-800">{{ typeName }}</td>
                    <td class="text-center font-bold text-emerald-600">{{ docData.byType[typeName] }}</td>
                    <td class="text-center">
                      <span class="pct-badge bg-emerald-50 text-emerald-700">{{ getDocTypePercentage(docData.byType[typeName]) }}%</span>
                    </td>
                  </tr>
                  <tr *ngIf="objectKeys(docData.byType || {}).length === 0">
                    <td colspan="3" class="text-center py-4 text-muted">No hay documentos registrados.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .reports-page {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .header-titles h1 {
      font-size: 1.5rem;
      font-weight: 800;
      margin: 0;
      color: #0f172a;
      display: flex;
      align-items: center;
    }
    .header-titles p {
      font-size: 0.88rem;
      color: #64748b;
      margin: 0.25rem 0 0;
    }

    .btn-export-pdf {
      background: #dc2626;
      color: #ffffff;
      border: none;
      padding: 0.6rem 1.1rem;
      border-radius: 8px;
      font-weight: 700;
      font-size: 0.85rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      box-shadow: 0 2px 6px rgba(220, 38, 38, 0.25);
      transition: all 0.15s ease;
    }
    .btn-export-pdf:hover {
      background: #b91c1c;
      transform: translateY(-1px);
    }

    /* Filters Card */
    .filters-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 1rem 1.25rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
    }
    .filters-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      align-items: flex-end;
    }
    .filter-field {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .filter-field label {
      font-size: 0.75rem;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .filter-date-input {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 0.5rem 0.75rem;
      font-size: 0.82rem;
      color: #1e293b;
      outline: none;
      width: 100%;
    }
    .filter-date-input:focus {
      border-color: #3b82f6;
    }
    .filter-btn-box {
      display: flex;
      align-items: flex-end;
    }
    .btn-clear-filters {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      color: #475569;
      padding: 0.52rem 0.9rem;
      border-radius: 6px;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
    }
    .btn-clear-filters:hover {
      background: #e2e8f0;
      color: #0f172a;
    }

    /* Reports Tabs Bar */
    .reports-tabs-bar {
      display: flex;
      gap: 0.5rem;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 0.5rem;
      overflow-x: auto;
    }
    .tab-btn {
      background: transparent;
      border: none;
      padding: 0.55rem 1rem;
      border-radius: 6px;
      font-size: 0.85rem;
      font-weight: 600;
      color: #64748b;
      cursor: pointer;
      display: flex;
      align-items: center;
      transition: all 0.15s ease;
      white-space: nowrap;
    }
    .tab-btn:hover {
      background: #e2e8f0;
      color: #0f172a;
    }
    .tab-btn.active {
      background: #eff6ff;
      color: #1d4ed8;
      font-weight: 700;
    }

    /* Metrics Grid */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
    }
    .metric-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
    }
    .card-blue { border-left: 4px solid #2563eb; }
    .card-purple { border-left: 4px solid #7c3aed; }
    .card-green { border-left: 4px solid #059669; }
    .card-amber { border-left: 4px solid #d97706; }

    .metric-icon-box {
      width: 48px;
      height: 48px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.35rem;
    }
    .metric-content {
      display: flex;
      flex-direction: column;
    }
    .metric-content .value {
      font-size: 1.6rem;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.2;
    }
    .metric-content .label {
      font-size: 0.8rem;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      margin-top: 0.15rem;
    }
    .sub-label {
      font-size: 0.72rem;
      color: #94a3b8;
    }

    /* Charts */
    .charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
      gap: 1.25rem;
    }
    .chart-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 1.25rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
    }
    .card-header-clean h3 {
      margin: 0 0 1rem;
      font-size: 0.95rem;
      font-weight: 700;
      color: #0f172a;
      display: flex;
      align-items: center;
    }
    .chart-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
      max-height: 280px;
    }

    /* Section Cards */
    .report-section-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 1.25rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
    }
    .section-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    .section-card-header h3 {
      margin: 0;
      font-size: 1.1rem;
      color: #0f172a;
      font-weight: 800;
    }
    .section-card-header p {
      margin: 0.2rem 0 0;
      font-size: 0.82rem;
      color: #64748b;
    }

    .btn-download-table-pdf {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      color: #b91c1c;
      padding: 0.45rem 0.85rem;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      transition: all 0.15s ease;
    }
    .btn-download-table-pdf:hover {
      background: #fef2f2;
      border-color: #fca5a5;
    }

    /* Table styles */
    .table-container {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      overflow-x: auto;
    }
    .report-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
    }
    .report-table th {
      background: #f8fafc;
      color: #334155;
      font-weight: 700;
      padding: 0.7rem 0.9rem;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .report-table td {
      padding: 0.7rem 0.9rem;
      color: #334155;
      border-bottom: 1px solid #f1f5f9;
    }
    .report-table tr:hover {
      background: #f8fafc;
    }

    .cell-primary {
      font-weight: 600;
      color: #0f172a;
    }
    .cell-sub {
      color: #64748b;
      font-size: 0.75rem;
    }
    .code-badge {
      background: #eff6ff;
      color: #1d4ed8;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-family: monospace;
      font-weight: 700;
      font-size: 0.78rem;
    }
    .type-badge {
      background: #f3e8ff;
      color: #6b21a8;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .signed-badge {
      background: #ecfdf5;
      color: #047857;
      padding: 0.2rem 0.5rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 700;
    }
    .unsigned-badge {
      background: #f1f5f9;
      color: #64748b;
      padding: 0.2rem 0.5rem;
      border-radius: 12px;
      font-size: 0.75rem;
    }
    .priority-pill {
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
    }
    .status-pill {
      font-size: 0.72rem;
      font-weight: 700;
      padding: 0.2rem 0.55rem;
      border-radius: 12px;
    }
    .pct-badge {
      background: #eff6ff;
      color: #1d4ed8;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.2rem 0.5rem;
      border-radius: 10px;
    }

    .priority-urgente { background: #fee2e2; color: #dc2626; }
    .priority-alta { background: #ffedd5; color: #ea580c; }
    .priority-normal { background: #dbeafe; color: #1d4ed8; }
    .priority-baja { background: #f1f5f9; color: #475569; }

    .status-registrado { background: #eff6ff; color: #1d4ed8; }
    .status-recibido { background: #f0fdf4; color: #15803d; }
    .status-en-revision { background: #fef3c7; color: #b45309; }
    .status-derivado { background: #e0e7ff; color: #4338ca; }
    .status-finalizado { background: #ecfdf5; color: #047857; }
    .status-observado { background: #fee2e2; color: #dc2626; }

    .dept-performance-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 1.25rem;
    }

    .mt-3 { margin-top: 0.75rem; }
    .mt-4 { margin-top: 1.25rem; }
    .text-center { text-align: center; }
    .text-muted { color: #94a3b8; }
  `]
})
export class ReportListComponent implements OnInit {
  activeTab: 'dashboard' | 'procedures' | 'documents' | 'departments' = 'dashboard';

  procData: any = {};
  docData: any = {};

  // Filtros
  deptOptions: any[] = [{ id: 'ALL', name: 'Todos los Departamentos' }];
  selectedDept = 'ALL';
  statusOptions = [
    { label: 'Todos los Estados', value: 'ALL' },
    { label: 'REGISTRADO', value: 'REGISTRADO' },
    { label: 'RECIBIDO', value: 'RECIBIDO' },
    { label: 'EN_REVISION', value: 'EN_REVISION' },
    { label: 'DERIVADO', value: 'DERIVADO' },
    { label: 'OBSERVADO', value: 'OBSERVADO' },
    { label: 'FINALIZADO', value: 'FINALIZADO' }
  ];
  selectedStatus = 'ALL';
  startDate = '';
  endDate = '';
  isDeptLocked = false;

  statusChartData: any;
  statusChartOptions: any;
  deptChartData: any;
  deptChartOptions: any;

  constructor(
    private reportService: ReportService,
    private departmentService: DepartmentService,
    private catalogService: CatalogService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.checkUserRoleLock();
    this.loadDepartments();
    this.loadReports();
  }

  checkUserRoleLock() {
    const user = this.authService.currentUser();
    // Si es Director Departamental y no admin, se pre-filtra por su depto
    if (user?.role?.name === 'Director Departamental' && user.department?.id) {
      this.selectedDept = user.department.id;
      this.isDeptLocked = true;
    }
  }

  loadDepartments() {
    this.departmentService.getDepartments().subscribe({
      next: (depts) => {
        this.deptOptions = [
          { id: 'ALL', name: 'Todos los Departamentos' },
          ...depts
        ];
        this.cdr.detectChanges();
      }
    });
  }

  onFilterChange() {
    this.loadReports();
  }

  resetFilters() {
    if (!this.isDeptLocked) {
      this.selectedDept = 'ALL';
    }
    this.selectedStatus = 'ALL';
    this.startDate = '';
    this.endDate = '';
    this.loadReports();
  }

  getFilterParams() {
    return {
      departmentId: this.selectedDept,
      status: this.selectedStatus,
      startDate: this.startDate || undefined,
      endDate: this.endDate || undefined
    };
  }

  loadReports() {
    const params = this.getFilterParams();

    // Filtros específicos para documentos: no enviar status si es estado de trámite
    const docParams: any = {
      departmentId: params.departmentId,
      startDate: params.startDate,
      endDate: params.endDate
    };
    // Si algún estado coincide con DocStatus, se podría enviar, pero por defecto no filtrarlo con estados de trámite
    if (['DRAFT', 'PENDING_LEADER', 'APPROVED', 'REJECTED'].includes(params.status)) {
      docParams.status = params.status;
    }

    this.reportService.getProceduresReport(params).subscribe({
      next: (res) => {
        const totalCount = res?.total !== undefined && res?.total !== null ? Number(res.total) : (res?.detailed?.length || 0);
        this.procData = {
          ...res,
          total: totalCount
        };
        this.buildCharts();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error cargando reporte de trámites', err)
    });

    this.reportService.getDocumentsReport(docParams).subscribe({
      next: (res) => {
        const totalCount = res?.total !== undefined && res?.total !== null ? Number(res.total) : (res?.detailed?.length || 0);
        this.docData = {
          ...res,
          total: totalCount
        };
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error cargando reporte de documentos', err)
    });
  }

  buildCharts() {
    const statusKeys = this.objectKeys(this.procData.byStatus || {});
    const statusValues = statusKeys.map(k => this.procData.byStatus[k]);

    this.statusChartData = {
      labels: statusKeys,
      datasets: [
        {
          data: statusValues,
          backgroundColor: ['#3b82f6', '#f59e0b', '#10b981', '#6366f1', '#ec4899', '#ef4444'],
          hoverBackgroundColor: ['#60a5fa', '#fbbf24', '#34d399', '#818cf8', '#f472b6', '#f87171']
        }
      ]
    };

    this.statusChartOptions = {
      plugins: {
        legend: {
          position: 'right',
          labels: { color: '#334155', font: { family: 'Inter', size: 11 } }
        }
      }
    };

    const deptKeys = this.objectKeys(this.procData.byDepartment || {});
    const deptValues = deptKeys.map(k => this.procData.byDepartment[k]);

    this.deptChartData = {
      labels: deptKeys,
      datasets: [
        {
          label: 'Expedientes por Departamento',
          backgroundColor: '#4f46e5',
          borderRadius: 4,
          data: deptValues
        }
      ]
    };

    this.deptChartOptions = {
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          ticks: { color: '#475569', font: { size: 10 } },
          grid: { display: false }
        },
        y: {
          ticks: { color: '#475569', stepSize: 1 },
          grid: { color: '#f1f5f9' }
        }
      }
    };
  }

  getCompletionRate(): number {
    const total = this.procData.total || 0;
    if (total === 0) return 0;
    const finalizados = (this.procData.byStatus && this.procData.byStatus['FINALIZADO']) || 0;
    return Math.round((finalizados / total) * 100);
  }

  getDepartmentPercentage(count: number): number {
    const total = this.procData.total || 0;
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  }

  getDocTypePercentage(count: number): number {
    const total = this.docData.total || 0;
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  }

  objectKeys(obj: any): string[] {
    return Object.keys(obj || {});
  }

  getPriorityClass(priority: string): string {
    switch (priority) {
      case 'URGENTE': return 'priority-urgente';
      case 'ALTA': return 'priority-alta';
      case 'NORMAL': return 'priority-normal';
      default: return 'priority-baja';
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'REGISTRADO': return 'status-registrado';
      case 'RECIBIDO': return 'status-recibido';
      case 'EN_REVISION': return 'status-en-revision';
      case 'DERIVADO': return 'status-derivado';
      case 'FINALIZADO': return 'status-finalizado';
      case 'OBSERVADO': return 'status-observado';
      default: return 'status-registrado';
    }
  }

  // =========================================================================
  // GENERACIÓN DE REPORTES PDF INSTITUCIONALES (NO IMPRESIÓN DE PANTALLA)
  // =========================================================================

  private addCorporateHeader(doc: jsPDF, title: string) {
    const pageWidth = doc.internal.pageSize.getWidth();

    // Franja decorativa institucional
    doc.setFillColor(30, 58, 138); // Azul institucional #1e3a8a
    doc.rect(0, 0, pageWidth, 24, 'F');

    doc.setFillColor(59, 130, 246); // Acento azul
    doc.rect(0, 24, pageWidth, 3, 'F');

    // Título en cabecera
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('SISTEMA INSTITUCIONAL DE GESTIÓN DOCUMENTAL', 14, 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(title.toUpperCase(), 14, 19);

    // Meta datos fecha
    doc.setFontSize(8);
    const dateStr = `Fecha de Emisión: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
    doc.text(dateStr, pageWidth - 14, 16, { align: 'right' });

    // Pie de página corporativo
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('Reporte Oficial Generado por el Sistema de Trámites y Gestión Documental', 14, pageHeight - 8);
  }

  exportExecutivePDF() {
    const doc = new jsPDF('p', 'mm', 'a4');
    this.addCorporateHeader(doc, 'Informe Ejecutivo Consolidado');

    let currentY = 36;
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('1. Indicadores Globales de Rendimiento', 14, currentY);

    currentY += 8;

    // Tabla de resumen de métricas
    autoTable(doc, {
      startY: currentY,
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
      head: [['Métrica / Indicador', 'Valor']],
      body: [
        ['Total de Expedientes Registrados', (this.procData.total || 0).toString()],
        ['Total de Documentos y Oficios Emitidos', (this.docData.total || 0).toString()],
        ['Tiempo Promedio de Resolución', `${this.procData.avgHours || 0} horas`],
        ['Tasa de Cumplimiento / Finalización', `${this.getCompletionRate()}%`],
        ['Filtro Departamental Aplicado', this.selectedDept === 'ALL' ? 'Todos los Departamentos' : (this.deptOptions.find(d => d.id === this.selectedDept)?.name || 'Específico')],
        ['Filtro de Estado Aplicado', this.selectedStatus === 'ALL' ? 'Todos los Estados' : this.selectedStatus]
      ],
      styles: { fontSize: 9, cellPadding: 3.5 }
    });

    currentY = (doc as any).lastAutoTable.finalY + 12;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('2. Distribución de Expedientes por Estado', 14, currentY);
    currentY += 6;

    const statusRows = this.objectKeys(this.procData.byStatus || {}).map(st => [
      st,
      (this.procData.byStatus[st] || 0).toString(),
      `${this.getDepartmentPercentage(this.procData.byStatus[st])}%`
    ]);

    autoTable(doc, {
      startY: currentY,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
      head: [['Estado', 'Cantidad de Trámites', '% Relativo']],
      body: statusRows.length > 0 ? statusRows : [['Sin datos', '0', '0%']],
      styles: { fontSize: 8.5, cellPadding: 3 }
    });

    currentY = (doc as any).lastAutoTable.finalY + 12;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('3. Carga Laboral por Departamento', 14, currentY);
    currentY += 6;

    const deptRows = this.objectKeys(this.procData.byDepartment || {}).map(d => [
      d,
      (this.procData.byDepartment[d] || 0).toString(),
      `${this.getDepartmentPercentage(this.procData.byDepartment[d])}%`
    ]);

    autoTable(doc, {
      startY: currentY,
      theme: 'striped',
      headStyles: { fillColor: [5, 150, 105], textColor: 255, fontStyle: 'bold' },
      head: [['Departamento', 'Expedientes Asignados', '% Carga Total']],
      body: deptRows.length > 0 ? deptRows : [['Sin datos', '0', '0%']],
      styles: { fontSize: 8.5, cellPadding: 3 }
    });

    doc.save(`Informe_Ejecutivo_Gestion_Documental_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  exportProceduresPDF() {
    const doc = new jsPDF('l', 'mm', 'a4'); // Paisaje para listados anchos
    this.addCorporateHeader(doc, 'Reporte de Expedientes y Trámites');

    const rows = (this.procData.detailed || []).map((p: any) => [
      p.code,
      p.subject,
      p.applicantName || 'Trámite Interno',
      p.department?.name || 'General',
      p.assignee?.name || 'Bandeja General',
      p.priority,
      p.status,
      new Date(p.createdAt).toLocaleDateString()
    ]);

    autoTable(doc, {
      startY: 34,
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      head: [['Código', 'Asunto', 'Solicitante', 'Departamento', 'Responsable', 'Prioridad', 'Estado', 'Fecha']],
      body: rows.length > 0 ? rows : [['-', 'No hay trámites', '-', '-', '-', '-', '-', '-']],
      styles: { fontSize: 8, cellPadding: 2.5 }
    });

    doc.save(`Reporte_Tramites_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  exportDocumentsPDF() {
    const doc = new jsPDF('l', 'mm', 'a4');
    this.addCorporateHeader(doc, 'Reporte de Inventario de Documentos y Oficios');

    const rows = (this.docData.detailed || []).map((d: any) => [
      d.title,
      d.type?.name || 'Oficio General',
      d.procedure?.code || 'N/A',
      d.department?.name || 'General',
      d.creator?.name || 'Funcionario',
      d.signatures && d.signatures.length > 0 ? `Firmado (${d.signatures.length})` : 'Pendiente',
      new Date(d.createdAt).toLocaleDateString()
    ]);

    autoTable(doc, {
      startY: 34,
      theme: 'grid',
      headStyles: { fillColor: [109, 40, 217], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      head: [['Título del Documento', 'Categoría', 'Expediente', 'Departamento Creador', 'Elaborado por', 'Firma', 'Fecha']],
      body: rows.length > 0 ? rows : [['-', 'No hay documentos', '-', '-', '-', '-', '-']],
      styles: { fontSize: 8, cellPadding: 2.5 }
    });

    doc.save(`Reporte_Documentos_${new Date().toISOString().slice(0, 10)}.pdf`);
  }
}
