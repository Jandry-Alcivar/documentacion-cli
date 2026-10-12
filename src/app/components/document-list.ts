import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { MessageService } from 'primeng/api';
import { Toast } from 'primeng/toast';
import { AuthService } from '../services/auth.service.js';
import { DocumentService } from '../services/document.service.js';
import { CatalogService } from '../services/catalog.service.js';

@Component({
  selector: 'app-document-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    TableModule,
    InputText,
    Select,
    Toast
  ],
  providers: [MessageService],
  template: `
    <div class="document-list-page animate-fade-in">
      <p-toast></p-toast>
      
      <div class="page-header">
        <div>
          <h1>Archivo Digital de Documentos & Oficios</h1>
          <p>Repositorio general de correspondencia oficial, memorandos, informes y resoluciones</p>
        </div>
        <div class="header-actions">
          <button 
            class="btn-primary-action"
            routerLink="/procedures/create"
          >
            <i class="pi pi-folder-plus mr-1"></i> Iniciar Trámite / Expediente
          </button>
          <button 
            class="btn-secondary-action"
            routerLink="create"
          >
            <i class="pi pi-file-plus mr-1"></i> Subir Documento Suelto
          </button>
        </div>
      </div>

      <!-- Banner Informativo Institucional -->
      <div class="info-banner">
        <div class="banner-icon">
          <i class="pi pi-info-circle"></i>
        </div>
        <div class="banner-text">
          <strong>Bandeja de Documentos Oficiales:</strong> Aquí visualizas cada documento individual, su estado de firma y el expediente al cual pertenece. Para gestionar flujos de trabajo, derivaciones y requisitos por pasos, ingresa a <a routerLink="/procedures" class="banner-link"><strong>Trámites & Expedientes</strong></a>.
        </div>
      </div>

      <!-- Barra de Filtros -->
      <div class="filters-bar">
        <div class="search-input">
          <i class="pi pi-search"></i>
          <input 
            type="text" 
            pInputText 
            [(ngModel)]="searchQuery" 
            (input)="loadDocuments()"
            placeholder="Buscar por título, código de expediente, descripción..." 
          />
        </div>

        <p-select 
          [options]="docTypes" 
          [(ngModel)]="selectedCategory" 
          optionLabel="name" 
          optionValue="id"
          [showClear]="true" 
          placeholder="Seleccionar Categoría"
          (onChange)="loadDocuments()"
          styleClass="filter-dropdown"
        ></p-select>
      </div>

      <!-- Pestañas de Vista -->
      <div class="tabs-container">
        <button 
          class="tab-btn" 
          [class.active-tab]="activeTab === 'all'" 
          (click)="changeTab('all')"
        >
          <i class="pi pi-file"></i> Todos los Documentos
        </button>
        
        <button 
          class="tab-btn" 
          [class.active-tab]="activeTab === 'procedures'" 
          (click)="changeTab('procedures')"
        >
          <i class="pi pi-folder"></i> De Expedientes / Trámites
        </button>

        <button 
          class="tab-btn" 
          [class.active-tab]="activeTab === 'approved'" 
          (click)="changeTab('approved')"
        >
          <i class="pi pi-check-circle"></i> Aprobados Depto
        </button>

        <button 
          *ngIf="isMayor()"
          class="tab-btn btn-confidential-tab" 
          [class.active-tab]="activeTab === 'confidential'" 
          (click)="changeTab('confidential')"
        >
          <i class="pi pi-lock"></i> Confidenciales Alcaldía
        </button>

        <button 
          class="tab-btn" 
          [class.active-tab]="activeTab === 'trash'" 
          (click)="changeTab('trash')"
        >
          <i class="pi pi-trash"></i> Papelera
        </button>
      </div>

      <!-- Tabla de Documentos -->
      <div class="table-card">
        <p-table [value]="filteredDocuments" [rows]="10" [paginator]="true" styleClass="p-datatable-sm custom-table">
          <ng-template pTemplate="header">
            <tr>
              <th>Título del Documento</th>
              <th>Expediente / Trámite</th>
              <th>Categoría</th>
              <th>Departamento</th>
              <th>Creador</th>
              <th>Fecha</th>
              <th>Estado de Firma</th>
              <th style="width: 150px; text-align: center;">Acciones</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-doc>
            <tr>
              <td>
                <div class="doc-title-cell">
                  <span class="font-semibold text-dark">{{ doc.title }}</span>
                  <small *ngIf="doc.isConfidential" class="badge-confidential">
                    <i class="pi pi-lock"></i> Confidencial
                  </small>
                </div>
              </td>
              <td>
                <span *ngIf="doc.procedure" class="badge-procedure" (click)="goToProcedure(doc.procedure)" title="Ir al Expediente Digital">
                  <i class="pi pi-folder-open"></i> {{ doc.procedure.code }}
                </span>
                <span *ngIf="!doc.procedure" class="badge-single-doc">
                  <i class="pi pi-file"></i> Oficio Suelto
                </span>
              </td>
              <td>{{ doc.type?.name || doc.typeId }}</td>
              <td>{{ doc.department?.name }}</td>
              <td>{{ doc.creator?.name }}</td>
              <td>{{ doc.createdAt | date:'shortDate' }}</td>
              <td>
                <span class="status-badge" [ngClass]="getStatusClass(doc.status)">
                  {{ getFriendlyStatus(doc) }}
                </span>
              </td>
              <td>
                <div class="action-buttons">
                  <!-- Detalle Documento -->
                  <button 
                    *ngIf="activeTab !== 'trash'"
                    class="btn-action-icon" 
                    title="Ver Detalles del Documento"
                    (click)="viewDetail(doc.id)"
                  >
                    <i class="pi pi-eye"></i>
                  </button>
                  
                  <!-- Ver Expediente si pertenece a uno -->
                  <button 
                    *ngIf="doc.procedure && activeTab !== 'trash'"
                    class="btn-action-icon text-indigo" 
                    title="Abrir Expediente Digital"
                    (click)="goToProcedure(doc.procedure)"
                  >
                    <i class="pi pi-folder"></i>
                  </button>

                  <!-- Descarga de archivo -->
                  <a 
                    *ngIf="doc.fileUrl"
                    [href]="'http://localhost:3001' + doc.fileUrl" 
                    target="_blank" 
                    class="btn-action-icon text-blue"
                    title="Descargar Archivo PDF"
                  >
                    <i class="pi pi-download"></i>
                  </a>

                  <!-- Restaurar (Papelera) -->
                  <button 
                    *ngIf="activeTab === 'trash'"
                    class="btn-action-icon text-green" 
                    title="Restaurar"
                    (click)="onRestore(doc.id)"
                  >
                    <i class="pi pi-refresh"></i>
                  </button>

                  <!-- Enviar a Papelera / Eliminar -->
                  <button 
                    class="btn-action-icon text-red" 
                    title="Eliminar"
                    (click)="onDelete(doc.id)"
                  >
                    <i class="pi pi-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptystate">
            <tr>
              <td colspan="8" class="empty-message">
                <i class="pi pi-folder-open"></i>
                <p>No se encontraron documentos en esta bandeja.</p>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </div>
  `,
  styles: [`
    .document-list-page {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      font-family: 'Inter', system-ui, sans-serif;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
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
    .header-actions {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    .btn-primary-action {
      background: #1d4ed8;
      color: #ffffff;
      border: none;
      border-radius: 8px;
      padding: 0.6rem 1.15rem;
      font-weight: 600;
      font-size: 0.88rem;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      transition: background 0.2s, transform 0.15s;
    }
    .btn-primary-action:hover {
      background: #1e40af;
      transform: translateY(-1px);
    }
    .btn-secondary-action {
      background: #ffffff;
      color: #1d4ed8;
      border: 1px solid #bfdbfe;
      border-radius: 8px;
      padding: 0.6rem 1.15rem;
      font-weight: 600;
      font-size: 0.88rem;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      transition: all 0.2s;
    }
    .btn-secondary-action:hover {
      background: #eff6ff;
      border-color: #1d4ed8;
    }

    /* Banner Informativo */
    .info-banner {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 10px;
      padding: 0.85rem 1.25rem;
      color: #1e3a5f;
      font-size: 0.88rem;
    }
    .banner-icon i {
      font-size: 1.4rem;
      color: #1d4ed8;
    }
    .banner-text {
      flex: 1;
      line-height: 1.45;
    }
    .banner-link {
      color: #1d4ed8;
      text-decoration: underline;
    }

    /* Filters Bar */
    .filters-bar {
      display: flex;
      gap: 1rem;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 0.85rem 1.25rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      flex-wrap: wrap;
    }
    .search-input {
      position: relative;
      flex-grow: 1;
      min-width: 260px;
    }
    .search-input i {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: #94a3b8;
    }
    .search-input input {
      width: 100%;
      padding-left: 2.35rem;
      background: #f8fafc !important;
      border: 1px solid #cbd5e1 !important;
      color: #0f172a !important;
      border-radius: 6px;
      height: 38px;
    }
    :host ::ng-deep .filter-dropdown {
      width: 250px;
      background: #f8fafc !important;
      border: 1px solid #cbd5e1 !important;
      border-radius: 6px;
      height: 38px;
    }

    /* Tabs Layout */
    .tabs-container {
      display: flex;
      gap: 0.35rem;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 0;
      overflow-x: auto;
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
      white-space: nowrap;
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
    .btn-confidential-tab.active-tab {
      color: #b91c1c;
      border-bottom-color: #b91c1c;
    }

    /* Table Styles */
    .table-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }
    .text-dark {
      color: #0f172a !important;
      font-weight: 600;
    }
    .text-blue { color: #1d4ed8 !important; }
    .text-green { color: #047857 !important; }
    .text-red { color: #b91c1c !important; }
    .text-indigo { color: #4338ca !important; }

    .doc-title-cell {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .badge-confidential {
      background: #fef2f2;
      color: #b91c1c;
      border: 1px solid #fecaca;
      padding: 0.1rem 0.4rem;
      border-radius: 4px;
      font-size: 0.72rem;
      font-weight: 700;
      width: fit-content;
    }
    .badge-procedure {
      background: #eff6ff;
      color: #1d4ed8;
      border: 1px solid #bfdbfe;
      padding: 0.25rem 0.6rem;
      border-radius: 6px;
      font-size: 0.78rem;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      transition: all 0.15s;
    }
    .badge-procedure:hover {
      background: #dbeafe;
      transform: translateY(-1px);
    }
    .badge-single-doc {
      background: #f1f5f9;
      color: #64748b;
      border: 1px solid #e2e8f0;
      padding: 0.25rem 0.55rem;
      border-radius: 6px;
      font-size: 0.76rem;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
    }

    /* Actions */
    .action-buttons {
      display: flex;
      gap: 0.35rem;
      justify-content: center;
      align-items: center;
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
      color: #1d4ed8;
      transform: translateY(-1px);
    }
    .empty-message {
      text-align: center;
      padding: 3rem 1rem !important;
      color: #94a3b8;
    }
    .empty-message i {
      font-size: 2.2rem;
      margin-bottom: 0.5rem;
      display: block;
    }
    .empty-message p {
      margin: 0;
      font-size: 0.9rem;
    }
  `]
})
export class DocumentListComponent implements OnInit {
  documents: any[] = [];
  docTypes: any[] = [];
  searchQuery = '';
  selectedCategory = null;
  activeTab = 'all';

  constructor(
    private authService: AuthService,
    private documentService: DocumentService,
    private catalogService: CatalogService,
    private router: Router,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadDocTypes();
    this.loadDocuments();
  }

  get filteredDocuments(): any[] {
    if (this.activeTab === 'procedures') {
      return this.documents.filter(d => !!d.procedure);
    }
    return this.documents;
  }

  isMayor(): boolean {
    return this.authService.isMayor();
  }

  loadDocTypes() {
    this.catalogService.getDocumentTypes().subscribe({
      next: (res) => {
        this.docTypes = res;
        this.cdr.detectChanges();
      }
    });
  }

  loadDocuments() {
    const filters: any = {};
    if (this.searchQuery) filters.search = this.searchQuery;
    if (this.selectedCategory) filters.category = this.selectedCategory;

    if (this.activeTab === 'trash') {
      this.documentService.getTrash().subscribe({
        next: (res) => { this.documents = res; this.cdr.detectChanges(); }
      });
      return;
    }

    if (this.activeTab === 'approved') {
      filters.status = 'APPROVED';
      filters.departmentId = this.authService.currentUser()?.department?.id;
    }

    if (this.activeTab === 'confidential') {
      filters.status = 'PENDING_MAYOR';
    }

    this.documentService.getDocuments(filters).subscribe({
      next: (res) => {
        this.documents = res;
        this.cdr.detectChanges();
      }
    });
  }

  changeTab(tab: string) {
    this.activeTab = tab;
    this.loadDocuments();
  }

  goToProcedure(proc: any) {
    if (proc && proc.code) {
      this.router.navigate(['/procedures'], { queryParams: { search: proc.code } });
    } else {
      this.router.navigate(['/procedures']);
    }
  }

  viewDetail(id: string) {
    this.router.navigate(['/documents/detail', id]);
  }

  onRestore(id: string) {
    this.documentService.restoreDocument(id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Documento restaurado',
          detail: 'El documento ha sido devuelto a tus borradores.'
        });
        this.loadDocuments();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.error || 'No se pudo restaurar el documento.'
        });
      }
    });
  }

  onDelete(id: string) {
    this.documentService.deleteDocument(id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Eliminado',
          detail: this.activeTab === 'trash' ? 'Documento eliminado físicamente.' : 'Documento enviado a la papelera.'
        });
        this.loadDocuments();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.error || 'No se pudo eliminar el documento.'
        });
      }
    });
  }

  getFriendlyStatus(doc: any): string {
    const status = doc.status;
    if (status === 'PENDING_LEADER') {
      const deptName = doc.procedure?.department?.name || doc.department?.name || 'Jefatura';
      return `Pendiente Firma: ${deptName}`;
    }
    if (status === 'PENDING_MAYOR') {
      return 'Pendiente Firma: Alcalde';
    }
    if (status === 'DRAFT') return 'Borrador';
    if (status === 'APPROVED') return 'Aprobado';
    if (status === 'REJECTED') return 'Devuelto para Corrección';
    if (status === 'SENT_TO_DEPT') {
      return `Derivado a Depto`;
    }
    if (status === 'ASSIGNED_TO_EMPLOYEE') return 'Asignado a Funcionario';
    if (status === 'RESPONDED') return 'Respondido';
    return status;
  }

  getStatusClass(status: string): string {
    const s = status.toUpperCase();
    if (s.includes('DRAFT')) return 'badge-draft';
    if (s.includes('PENDING')) return 'badge-pending';
    if (s.includes('APPROVED') || s.includes('RESPONDED')) return 'badge-approved';
    if (s.includes('REJECTED')) return 'badge-rejected';
    if (s.includes('SENT') || s.includes('ASSIGNED')) return 'badge-sent';
    return 'badge-draft';
  }
}
