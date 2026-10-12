import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
                <td class="font-semibold text-dark">{{ proc.code }}</td>
                <td>{{ proc.subject }}</td>
                <td>{{ proc.applicantName }}</td>
                <td>{{ proc.updatedAt | date:'short' }}</td>
                <td class="text-center">
                  <button class="btn-action btn-success" (click)="openArchiveDialog(proc)">
                    <i class="pi pi-box"></i> Archivar Físico
                  </button>
                </td>
              </tr>
            </ng-template>
            <ng-template pTemplate="emptystate">
              <tr>
                <td colspan="5" class="text-center" style="padding: 3rem; color: #94a3b8;">No hay trámites finalizados pendientes de archivado físico.</td>
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
                <td class="font-semibold text-dark">{{ proc.code }}</td>
                <td>{{ proc.subject }}</td>
                <td>{{ proc.warehouse?.name }}</td>
                <td>{{ proc.sector?.name }}</td>
                <td>{{ proc.section?.name }}</td>
                <td class="font-mono text-indigo font-semibold">{{ proc.folderCode }}</td>
                <td class="text-center">
                  <button class="btn-action btn-danger" (click)="revertFinalization(proc.id)">
                    <i class="pi pi-refresh"></i> Revertir
                  </button>
                </td>
              </tr>
            </ng-template>
            <ng-template pTemplate="emptystate">
              <tr>
                <td colspan="7" class="text-center" style="padding: 3rem; color: #94a3b8;">No se han encontrado expedientes archivados físicamente.</td>
              </tr>
            </ng-template>
          </p-table>
        </div>
      </div>

      <!-- DIÁLOGO: ASOCIAR LOCALIZACIÓN FÍSICA (siempre en el DOM) -->
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
            <input type="text" pInputText [(ngModel)]="archiveForm.folderCode" placeholder="Ej. EXP-JUNIN-2026-0045" class="w-full" />
          </div>
          
          <div class="dialog-actions mt-4 flex justify-content-end gap-2">
            <button class="btn-action btn-cancel" (click)="showArchiveDialog = false">
              <i class="pi pi-times"></i> Cancelar
            </button>
            <button class="btn-action btn-success" [disabled]="!archiveForm.warehouseId || !archiveForm.sectorId || !archiveForm.sectionId || !archiveForm.folderCode" (click)="saveArchive()">
              <i class="pi pi-check"></i> Guardar Ubicación y Archivar
            </button>
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
      font-size: 1.5rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
    }
    .page-header p {
      color: #64748b;
      font-size: 0.9rem;
      margin: 0.25rem 0 0;
    }

    /* Tabs Layout */
    .tabs-container {
      display: flex;
      gap: 0.35rem;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 0;
    }
    .tab-btn {
      background: transparent;
      border: none;
      color: #64748b;
      padding: 0.65rem 1.1rem;
      font-size: 0.88rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.45rem;
      border-bottom: 3px solid transparent;
      margin-bottom: -2px;
      transition: all 0.2s;
    }
    .tab-btn:hover {
      color: #0f172a;
      background: #f8fafc;
    }
    .active-tab {
      color: #1d4ed8;
      border-bottom-color: #1d4ed8;
      background: #ffffff;
      font-weight: 700;
    }

    .tab-pane-content {
      animation: fadeIn 0.25s ease-out;
    }

    /* Table Styles */
    .table-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }
    .text-dark { color: #0f172a !important; }
    .font-semibold { font-weight: 600; }
    .font-mono { font-family: 'Courier New', Courier, monospace; }
    .text-indigo { color: #1d4ed8; }
    .text-center { text-align: center; }

    .btn-action {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.4rem 0.8rem;
      border: none;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
      white-space: nowrap;
    }
    .btn-action:hover { transform: translateY(-1px); }
    .btn-success { background: #047857; color: #fff; }
    .btn-danger  { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
    .btn-cancel  { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }

    /* Dialog styling */
    .dialog-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      color: #0f172a;
    }
    .form-field {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }
    .form-field label {
      font-size: 0.85rem;
      font-weight: 600;
      color: #334155;
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
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadPendingProcedures();
    this.loadArchivedProcedures();
    this.loadWarehouses();
  }

  loadPendingProcedures() {
    // Trámites en estado FINALIZADO
    this.procedureService.getProcedures('all').subscribe({
      next: (res) => { this.pendingProcedures = res.filter((p: any) => p.status === 'FINALIZADO'); this.cdr.detectChanges(); }
    });
  }

  loadArchivedProcedures() {
    this.http.get<any[]>('http://localhost:3001/api/archives/list').subscribe({
      next: (res) => { this.archivedProcedures = res; this.cdr.detectChanges(); }
    });
  }

  loadWarehouses() {
    this.http.get<any[]>('http://localhost:3001/api/archives/warehouses').subscribe({
      next: (res) => { this.warehouses = res; this.cdr.detectChanges(); }
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
    this.cdr.detectChanges();
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
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'No se pudo revertir',
          detail: err.error?.error || 'No se pudo reabrir el trámite (posible bloqueo total de inmutabilidad).'
        });
      }
    });
  }
}
