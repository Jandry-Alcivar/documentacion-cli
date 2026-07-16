import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Card } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { UIChart } from 'primeng/chart';
import { ReportService } from '../services/report.service.js';

@Component({
  selector: 'app-report-list',
  standalone: true,
  imports: [
    CommonModule,
    Card,
    TableModule,
    UIChart
  ],
  template: `
    <div class="reports-page animate-fade-in">
      <div class="page-header">
        <div>
          <h1>Reportes e Indicadores Estadísticos</h1>
          <p>Métricas consolidadas de tiempos de resolución, eficiencia de trámites e inventario documental</p>
        </div>
      </div>

      <!-- Métricas Principales -->
      <div class="metrics-grid">
        <p-card styleClass="metric-card card-blue">
          <div class="metric-content">
            <span class="value">{{ procData.total || 0 }}</span>
            <span class="label">Total Expedientes</span>
          </div>
        </p-card>
        <p-card styleClass="metric-card card-purple">
          <div class="metric-content">
            <span class="value">{{ docData.total || 0 }}</span>
            <span class="label">Total Documentos</span>
          </div>
        </p-card>
        <p-card styleClass="metric-card card-green">
          <div class="metric-content">
            <span class="value">{{ procData.avgHours || 0 }} hrs</span>
            <span class="label">Tiempo Promedio Resolución</span>
          </div>
        </p-card>
      </div>

      <!-- Charts Section (Premium Dashboards look) -->
      <div class="charts-grid mt-4">
        <p-card styleClass="chart-card" header="Trámites por Estado (Distribución)">
          <div class="chart-wrapper">
            <p-chart type="doughnut" [data]="statusChartData" [options]="statusChartOptions" *ngIf="statusChartData"></p-chart>
          </div>
        </p-card>
        
        <p-card styleClass="chart-card" header="Trámites Asignados por Departamento">
          <div class="chart-wrapper">
            <p-chart type="bar" [data]="deptChartData" [options]="deptChartOptions" *ngIf="deptChartData"></p-chart>
          </div>
        </p-card>
      </div>

      <div class="reports-grid mt-4">
        <!-- Columna de Trámites -->
        <div class="report-section-card">
          <h2><i class="pi pi-folder-open"></i> Tabla: Trámites por Departamento</h2>
          <div class="table-container">
            <table class="report-table">
              <thead>
                <tr>
                  <th>Departamento</th>
                  <th style="width: 100px; text-align: center;">Cantidad</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of objectKeys(procData.byDepartment || {})">
                  <td>{{ item }}</td>
                  <td class="text-center font-semibold text-white">{{ procData.byDepartment[item] }}</td>
                </tr>
                <tr *ngIf="objectKeys(procData.byDepartment || {}).length === 0">
                  <td colspan="2" class="text-center text-muted">No hay datos registrados.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Columna de Documentos -->
        <div class="report-section-card">
          <h2><i class="pi pi-file"></i> Documentos por Categoría</h2>
          <div class="table-container">
            <table class="report-table">
              <thead>
                <tr>
                  <th>Categoría</th>
                  <th style="width: 100px; text-align: center;">Cantidad</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of objectKeys(docData.byType || {})">
                  <td>{{ item }}</td>
                  <td class="text-center font-semibold text-white">{{ docData.byType[item] }}</td>
                </tr>
                <tr *ngIf="objectKeys(docData.byType || {}).length === 0">
                  <td colspan="2" class="text-center text-muted">No hay datos registrados.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .reports-page {
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

    /* Metrics Grid */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
    }
    :host ::ng-deep .metric-card {
      border: 1px solid rgba(255, 255, 255, 0.06) !important;
      border-radius: 12px !important;
      background: rgba(15, 23, 42, 0.4) !important;
    }
    .metric-content {
      display: flex;
      flex-direction: column;
    }
    .metric-content .value {
      font-size: 2.2rem;
      font-weight: 800;
      color: #ffffff;
    }
    .metric-content .label {
      font-size: 0.85rem;
      color: #94a3b8;
      margin-top: 0.2rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .card-blue { border-left: 4px solid #3b82f6 !important; }
    .card-purple { border-left: 4px solid #8b5cf6 !important; }
    .card-green { border-left: 4px solid #10b981 !important; }

    /* Charts styles */
    .charts-grid {
      display: grid;
      grid-template-columns: 1fr 1.5fr;
      gap: 1.5rem;
    }
    :host ::ng-deep .chart-card {
      background: rgba(15, 23, 42, 0.4) !important;
      border: 1px solid rgba(255, 255, 255, 0.06) !important;
      border-radius: 12px !important;
      color: #ffffff !important;
    }
    :host ::ng-deep .chart-card .p-card-title {
      font-size: 1rem !important;
      font-weight: 700 !important;
      color: #cbd5e1 !important;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
      padding-bottom: 0.5rem !important;
    }
    .chart-wrapper {
      padding: 1rem;
      display: flex;
      justify-content: center;
      max-height: 300px;
    }

    /* Layout grid */
    .reports-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }

    .report-section-card {
      background: rgba(15, 23, 42, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.3);
    }
    .report-section-card h2 {
      font-size: 1.1rem;
      color: #f8fafc;
      margin: 0 0 1rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .mt-4 { margin-top: 1.8rem; }

    .table-container {
      background: rgba(15, 23, 42, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      overflow: hidden;
    }

    .report-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9rem;
    }
    .report-table th {
      background: rgba(15, 23, 42, 0.6);
      color: #94a3b8;
      font-weight: 600;
      padding: 0.75rem 1rem;
      text-align: left;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    .report-table td {
      padding: 0.75rem 1rem;
      color: #cbd5e1;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    }
    .report-table tr:hover {
      background: rgba(255, 255, 255, 0.01);
    }

    .text-center { text-align: center; }
    .text-muted { color: #64748b; }
    .font-semibold { font-weight: 600; }
  `]
})
export class ReportListComponent implements OnInit {
  procData: any = {};
  docData: any = {};

  statusChartData: any;
  statusChartOptions: any;
  deptChartData: any;
  deptChartOptions: any;

  constructor(private reportService: ReportService) {}

  ngOnInit() {
    this.loadProceduresReport();
    this.loadDocumentsReport();
  }

  loadProceduresReport() {
    this.reportService.getProceduresReport().subscribe({
      next: (res) => {
        this.procData = res;
        this.buildCharts();
      },
      error: (err) => console.error('Error loading procedures report', err)
    });
  }

  loadDocumentsReport() {
    this.reportService.getDocumentsReport().subscribe({
      next: (res) => this.docData = res,
      error: (err) => console.error('Error loading documents report', err)
    });
  }

  buildCharts() {
    // Pie Chart (Trámites por Estado)
    const statusKeys = this.objectKeys(this.procData.byStatus || {});
    const statusValues = statusKeys.map(k => this.procData.byStatus[k]);

    this.statusChartData = {
      labels: statusKeys,
      datasets: [
        {
          data: statusValues,
          backgroundColor: ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#ec4899', '#3b82f6'],
          hoverBackgroundColor: ['#818cf8', '#fbbf24', '#34d399', '#f87171', '#f472b6', '#60a5fa']
        }
      ]
    };

    this.statusChartOptions = {
      plugins: {
        legend: {
          position: 'right',
          labels: { color: '#cbd5e1' }
        }
      }
    };

    // Bar Chart (Trámites por Departamento)
    const deptKeys = this.objectKeys(this.procData.byDepartment || {});
    const deptValues = deptKeys.map(k => this.procData.byDepartment[k]);

    this.deptChartData = {
      labels: deptKeys,
      datasets: [
        {
          label: 'Cantidad de Expedientes',
          backgroundColor: '#818cf8',
          borderColor: '#6366f1',
          data: deptValues
        }
      ]
    };

    this.deptChartOptions = {
      plugins: {
        legend: { labels: { color: '#cbd5e1' } }
      },
      scales: {
        x: {
          ticks: { color: '#94a3b8' },
          grid: { color: 'rgba(255, 255, 255, 0.05)' }
        },
        y: {
          ticks: { color: '#94a3b8' },
          grid: { color: 'rgba(255, 255, 255, 0.05)' }
        }
      }
    };
  }

  objectKeys(obj: any): string[] {
    return Object.keys(obj || {});
  }
}
