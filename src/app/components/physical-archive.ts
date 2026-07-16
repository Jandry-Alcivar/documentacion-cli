import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TableModule } from 'primeng/table';
import { Select } from 'primeng/select';
import { Toast } from 'primeng/toast';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { ProcedureService } from '../services/procedure.service.js';

@Component({
  selector: 'app-physical-archive',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    Select,
    Toast,
    Dialog,
    InputText
  ],
  providers: [MessageService],
  template: `
    <div class="physical-archive-page animate-fade-in">
      <p-toast></p-toast>

      <div class="page-header">
        <div>
          <h1>Archivo Físico e Histórico</h1>
          <p>Controla la ubicación física (bodega, sector, carpeta) de los expedientes oficiales de trámites finalizados</p>
        </div>
      </div>

      <!-- Pestañas -->
      <div class="tabs-container">
        <button class="tab-btn" [class.active-tab]="activeTab === 'pending'" (click)="activeTab = 'pending'"><i class="pi pi-clock"></i> Pendientes de Archivar</button>
        <button class="tab-btn" [class.active-tab]="activeTab === 'archived'" (click)="activeTab = 'archived'"><i class="pi pi-briefcase"></i> Expedientes Archivados</button>
      </div>

      <!-- CONTENIDO: PENDIENTES -->
      <div *ngIf="activeTab === 'pending'" class="tab-pane-content">
        <div class="table-card">
          <p-table [value]="pendingProcedures" [rows]="10" [paginator]="true" styleClass="p-datatable-sm custom-table">
            <ng-template pTemplate="header">
              <tr>
                <th>Código</th>
                <th>Asunto</th>
                <th>Solicitante</th>
                <th>Fecha Cierre</th>
                <th style="width: 150px; text-align: center;">Archivar</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-proc>
              <tr>
                <td class="font-semibold text-white">{{ proc.code }}</td>
                <td>{{ proc.subject }}</td>
                <td>{{ proc.applicantName }}</td>
                <td>{{ proc.updatedAt | date:'short' }}</td>
                <td class="text-center">
                  <button pButton label="Archivar Físico" icon="pi pi-box" class="p-button-sm p-button-success" (click)="openArchiveDialog(proc)"></button>
                </td>
              </tr>
            </ng-template>
            <ng-template pTemplate="emptystate">
              <tr>
                <td colspan="5" class="text-center" style="padding: 3rem;">No hay trámites finalizados pendientes de archivado físico.</td>
              </tr>
            </ng-template>
          </p-table>
        </div>
      </div>

      <!-- CONTENIDO: ARCHIVADOS -->
      <div *ngIf="activeTab === 'archived'" class="tab-pane-content">
        <div class="table-card">
          <p-table [value]="archivedProcedures" [rows]="10" [paginator]="true" styleClass="p-datatable-sm custom-table">
            <ng-template pTemplate="header">
              <tr>
                <th>Código</th>
                <th>Asunto</th>
                <th>Bodega</th>
                <th>Sector</th>
                <th>Sección</th>
                <th>Código Carpeta</th>
                <th style="width: 120px; text-align: center;">Revertir</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-proc>
              <tr>
                <td class="font-semibold text-white">{{ proc.code }}</td>
                <td>{{ proc.subject }}</td>
                <td>{{ proc.warehouse?.name }}</td>
                <td>{{ proc.sector?.name }}</td>
                <td>{{ proc.section?.name }}</td>
                <td class="font-mono text-indigo font-semibold">{{ proc.folderCode }}</td>
                <td class="text-center">
                  <button pButton icon="pi pi-refresh" class="p-button-text p-button-danger p-button-sm" (click)="revertFinalization(proc.id)"></button>
                </td>
              </tr>
            </ng-template>
            <ng-template pTemplate="emptystate">
              <tr>
                <td colspan="7" class="text-center" style="padding: 3rem;">No se han encontrado expedientes archivados físicamente.</td>
              </tr>
            </ng-template>
          </p-table>
        </div>
      <!-- DIÁLOGO: ASOCIAR LOCALIZACIÓN FÍSICA -->
      <p-dialog header="Registrar Ubicación Física del Expediente" [(visible)]="showArchiveDialog" [modal]="true" [style]="{width: '500px'}" appendTo="body">
        <div class="dialog-form" *ngIf="selectedProc">
          <p class="mb-2">Asigne la localización física del trámite: <strong>{{ selectedProc.code }}</strong></p>
          
          <div class="form-field mb-2">
            <label>Bodega *</label>
            <p-select [options]="warehouses" [(ngModel)]="archiveForm.warehouseId" optionLabel="name" optionValue="id" placeholder="Seleccionar bodega" styleClass="w-full" appendTo="body" (onChange)="onWarehouseChange()"></p-select>
          </div>

          <div class="form-field mb-2">
            <label>Sector / Estante *</label>
            <p-select [options]="sectors" [(ngModel)]="archiveForm.sectorId" optionLabel="name" optionValue="id" placeholder="Seleccionar sector" styleClass="w-full" appendTo="body" [disabled]="!archiveForm.warehouseId" (onChange)="onSectorChange()"></p-select>
          </div>

          <div class="form-field mb-2">
            <label>Sección / Nivel *</label>
            <p-select [options]="sections" [(ngModel)]="archiveForm.sectionId" optionLabel="name" optionValue="id" placeholder="Seleccionar sección" styleClass="w-full" appendTo="body" [disabled]="!archiveForm.sectorId"></p-select>
          </div>

          <div class="form-field mb-2">
            <label>Código de Carpeta Física *</label>
            <input type="text" pInputText [(ngModel)]="archiveForm.folderCode" placeholder="Ej. EXP-CHONE-2026-0045" class="w-full" />
          </div>
          
          <div class="dialog-actions mt-4 flex justify-content-end gap-2">
            <button pButton label="Cancelar" icon="pi pi-times" class="p-button-text p-button-secondary" (click)="showArchiveDialog = false"></button>
            <button pButton label="Guardar Ubicación y Archivar" icon="pi pi-check" class="p-button-success" [disabled]="!archiveForm.warehouseId || !archiveForm.sectorId || !archiveForm.sectionId || !archiveForm.folderCode" (click)="saveArchive()"></button>
          </div>
        </div>
      </p-dialog>
    </div>
  `,
  styles: [`
    .physical-archive-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      font-family: 'Inter', system-ui, sans-serif;
    }
    .page-header h1 {
      font-size: 1.8rem;
      font-weight: 800;
      color: #ffffff;
      margin: 0;
    }
    .page-header p {
      color: #94a3b8;
      font-size: 0.95rem;
      margin: 0.3rem 0 0;
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

    .tab-pane-content {
      animation: fadeIn 0.3s ease-out;
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
    .font-semibold { font-weight: 600; }
    .font-mono { font-family: 'Courier New', Courier, monospace; }
    .text-white { color: #ffffff; }
    .text-indigo { color: #818cf8; }
    .text-center { text-align: center; }

    /* Dialog styling */
    .dialog-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      color: #cbd5e1;
    }
    .form-field {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }
    .form-field label {
      font-size: 0.85rem;
      font-weight: 600;
    }
  `]
})
export class PhysicalArchiveComponent implements OnInit {
  activeTab = 'pending';
  pendingProcedures: any[] = [];
  archivedProcedures: any[] = [];
  warehouses: any[] = [];
  sectors: any[] = [];
  sections: any[] = [];

  showArchiveDialog = false;
  selectedProc: any = null;

  archiveForm = {
    warehouseId: null,
    sectorId: null,
    sectionId: null,
    folderCode: ''
  };

  constructor(
    private http: HttpClient,
    private procedureService: ProcedureService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.loadPendingProcedures();
    this.loadArchivedProcedures();
    this.loadWarehouses();
  }

  loadPendingProcedures() {
    // Trámites en estado FINALIZADO
    this.procedureService.getProcedures('all').subscribe({
      next: (res) => this.pendingProcedures = res.filter(p => p.status === 'FINALIZADO')
    });
  }

  loadArchivedProcedures() {
    this.http.get<any[]>('http://localhost:3001/api/archives/list').subscribe({
      next: (res) => this.archivedProcedures = res
    });
  }

  loadWarehouses() {
    this.http.get<any[]>('http://localhost:3001/api/archives/warehouses').subscribe({
      next: (res) => this.warehouses = res
    });
  }

  onWarehouseChange() {
    this.archiveForm.sectorId = null;
    this.archiveForm.sectionId = null;
    this.sectors = [];
    this.sections = [];

    const selectedWh = this.warehouses.find(w => w.id === this.archiveForm.warehouseId);
    if (selectedWh && selectedWh.sectors) {
      this.sectors = selectedWh.sectors;
    }
  }

  onSectorChange() {
    this.archiveForm.sectionId = null;
    this.sections = [];

    const selectedSec = this.sectors.find(s => s.id === this.archiveForm.sectorId);
    if (selectedSec && selectedSec.sections) {
      this.sections = selectedSec.sections;
    }
  }

  openArchiveDialog(proc: any) {
    this.selectedProc = proc;
    this.archiveForm = {
      warehouseId: null,
      sectorId: null,
      sectionId: null,
      folderCode: ''
    };
    this.showArchiveDialog = true;
  }

  saveArchive() {
    if (!this.selectedProc) return;

    const payload = {
      procedureId: this.selectedProc.id,
      warehouseId: this.archiveForm.warehouseId,
      sectorId: this.archiveForm.sectorId,
      sectionId: this.archiveForm.sectionId,
      folderCode: this.archiveForm.folderCode
    };

    this.http.post('http://localhost:3001/api/archives/finalize-physical', payload).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Archivado', detail: 'Expediente físico registrado con éxito.' });
        this.showArchiveDialog = false;
        this.loadPendingProcedures();
        this.loadArchivedProcedures();
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.error || 'No se pudo archivar.' });
      }
    });
  }

  revertFinalization(procId: string) {
    this.http.post(`http://localhost:3001/api/procedures/${procId}/revert`, { reason: 'Reversión desde Archivo Físico.' }).subscribe({
      next: () => {
        this.messageService.add({ severity: 'warn', summary: 'Trámite Reabierto', detail: 'El trámite ha sido retornado a bandeja de entrada.' });
        this.loadPendingProcedures();
        this.loadArchivedProcedures();
      }
    });
  }
}
