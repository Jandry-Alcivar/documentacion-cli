import { Component, OnInit } from '@angular/core';
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
          <h1>Archivo Digital de Documentos</h1>
          <p>Gestiona, aprueba, deriva y valida la integridad de la correspondencia oficial</p>
        </div>
        <p-button 
          label="Crear / Subir Documento" 
          icon="pi pi-plus" 
          styleClass="p-button-primary btn-create"
          routerLink="create"
        ></p-button>
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
            placeholder="Buscar por título, descripción, etiquetas..." 
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
          <i class="pi pi-file"></i> Mis Documentos
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
        <p-table [value]="documents" [rows]="10" [paginator]="true" styleClass="p-datatable-sm custom-table">
          <ng-template pTemplate="header">
            <tr>
              <th>Título</th>
              <th>Categoría</th>
              <th>Departamento</th>
              <th>Creador</th>
              <th>Fecha Registro</th>
              <th>Estado</th>
              <th style="width: 150px; text-align: center;">Acciones</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-doc>
            <tr>
              <td class="font-semibold text-white">{{ doc.title }}</td>
              <td>{{ doc.type?.name || doc.typeId }}</td>
              <td>{{ doc.department?.name }}</td>
              <td>{{ doc.creator?.name }}</td>
              <td>{{ doc.createdAt | date:'shortDate' }}</td>
              <td>
                <span class="status-badge" [ngClass]="getStatusClass(doc.status)">
                  {{ doc.status }}
                </span>
              </td>
              <td>
                <div class="action-buttons">
                  <!-- Detalle -->
                  <button 
                    *ngIf="activeTab !== 'trash'"
                    class="p-button p-button-rounded p-button-text p-button-info" 
                    title="Ver Detalles"
                    (click)="viewDetail(doc.id)"
                  >
                    <i class="pi pi-eye" style="font-size: 1.15rem;"></i>
                  </button>
                  
                  <!-- Descarga de archivo -->
                  <a 
                    *ngIf="doc.fileUrl"
                    [href]="'http://localhost:3001' + doc.fileUrl" 
                    target="_blank" 
                    class="btn-download-link"
                    title="Descargar Archivo"
                  >
                    <i class="pi pi-download"></i>
                  </a>

                  <!-- Restaurar (Papelera) -->
                  <button 
                    *ngIf="activeTab === 'trash'"
                    class="p-button p-button-rounded p-button-text p-button-success" 
                    title="Restaurar"
                    (click)="onRestore(doc.id)"
                  >
                    <i class="pi pi-refresh" style="font-size: 1.15rem;"></i>
                  </button>

                  <!-- Enviar a Papelera / Eliminar -->
                  <button 
                    class="p-button p-button-rounded p-button-text p-button-danger" 
                    title="Eliminar"
                    (click)="onDelete(doc.id)"
                  >
                    <i class="pi pi-trash" style="font-size: 1.15rem;"></i>
                  </button>
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptystate">
            <tr>
              <td colspan="7" style="text-align: center; padding: 3rem;">No se encontraron documentos en esta bandeja.</td>
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

    /* Filters Bar */
    .filters-bar {
      display: flex;
      gap: 1rem;
      background: rgba(15, 23, 42, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 10px;
      padding: 1rem;
    }
    .search-input {
      position: relative;
      flex-grow: 1;
    }
    .search-input i {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: #64748b;
    }
    .search-input input {
      width: 100%;
      padding-left: 2.5rem;
      background: rgba(15, 23, 42, 0.6) !important;
      border: 1px solid rgba(255, 255, 255, 0.1) !important;
      color: #f8fafc !important;
      border-radius: 8px;
    }
    :host ::ng-deep .filter-dropdown {
      width: 250px;
      background: rgba(15, 23, 42, 0.6) !important;
      border: 1px solid rgba(255, 255, 255, 0.1) !important;
      border-radius: 8px;
    }
    :host ::ng-deep .filter-dropdown .p-dropdown-label {
      color: #f8fafc !important;
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
    .btn-confidential-tab.active-tab {
      color: #f43f5e;
      border-bottom-color: #f43f5e;
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
    :host ::ng-deep .custom-table .p-paginator {
      background: #0f172a !important;
      border: none !important;
      border-top: 1px solid rgba(255, 255, 255, 0.08) !important;
    }
    :host ::ng-deep .custom-table .p-paginator .p-paginator-page, 
    :host ::ng-deep .custom-table .p-paginator .p-paginator-next,
    :host ::ng-deep .custom-table .p-paginator .p-paginator-last,
    :host ::ng-deep .custom-table .p-paginator .p-paginator-first,
    :host ::ng-deep .custom-table .p-paginator .p-paginator-prev {
      color: #94a3b8 !important;
    }
    :host ::ng-deep .custom-table .p-paginator .p-highlight {
      background: rgba(99, 102, 241, 0.15) !important;
      color: #818cf8 !important;
    }

    /* Badges */
    .status-badge {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
      text-transform: uppercase;
      display: inline-block;
    }
    .badge-draft { background: rgba(148, 163, 184, 0.15); color: #cbd5e1; }
    .badge-pending { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
    .badge-approved { background: rgba(34, 197, 94, 0.15); color: #4ade80; }
    .badge-rejected { background: rgba(239, 68, 68, 0.15); color: #f87171; }
    .badge-sent { background: rgba(99, 102, 241, 0.15); color: #818cf8; }

    /* Actions */
    .action-buttons {
      display: flex;
      gap: 0.25rem;
      justify-content: center;
      align-items: center;
    }
    .btn-download-link {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2.35rem;
      height: 2.35rem;
      border-radius: 50%;
      color: #38bdf8;
      text-decoration: none;
      transition: background 0.2s;
    }
    .btn-download-link:hover {
      background: rgba(56, 189, 248, 0.1);
    }
    .btn-download-link i {
      font-size: 1rem;
    }
    .font-semibold {
      font-weight: 600;
    }
    .text-white {
      color: #ffffff;
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
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.loadDocTypes();
    this.loadDocuments();
  }

  isMayor(): boolean {
    return this.authService.isMayor();
  }

  loadDocTypes() {
    this.catalogService.getDocumentTypes().subscribe({
      next: (res) => {
        this.docTypes = res;
      }
    });
  }

  loadDocuments() {
    const filters: any = {};
    if (this.searchQuery) filters.search = this.searchQuery;
    if (this.selectedCategory) filters.category = this.selectedCategory;

    if (this.activeTab === 'trash') {
      this.documentService.getTrash().subscribe({
        next: (res) => this.documents = res
      });
      return;
    }

    if (this.activeTab === 'approved') {
      filters.status = 'APPROVED';
      // Ver aprobados de su departamento
      filters.departmentId = this.authService.currentUser()?.department?.id;
    }

    if (this.activeTab === 'confidential') {
      filters.status = 'PENDING_MAYOR';
    }

    this.documentService.getDocuments(filters).subscribe({
      next: (res) => {
        this.documents = res;
      }
    });
  }

  changeTab(tab: string) {
    this.activeTab = tab;
    this.loadDocuments();
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
    // Si ya estamos en papelera, delete físico o suave
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
