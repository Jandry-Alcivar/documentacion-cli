import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../services/auth.service.js';
import { TemplateService } from '../services/template.service.js';
import { CatalogService } from '../services/catalog.service.js';
import { RichEditorComponent } from './rich-editor.js';

@Component({
  selector: 'app-template-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    Button,
    Dialog,
    InputText,
    Select,
    Toast,
    RichEditorComponent
  ],
  providers: [MessageService],
  template: `
    <div class="template-list-page animate-fade-in">
      <p-toast></p-toast>

      <div class="page-header">
        <div>
          <h1>Plantillas y Machotes Oficiales</h1>
          <p>Consulta, descarga o administra formatos aprobados para la redacción de documentos formales</p>
        </div>
        <p-button 
          *ngIf="isAdmin()"
          label="Nueva Plantilla" 
          icon="pi pi-plus" 
          styleClass="p-button-primary btn-create"
          (click)="openNew()"
        ></p-button>
      </div>

      <!-- Tabla de Plantillas -->
      <div class="table-card">
        <p-table [value]="templates" [rows]="10" [paginator]="true" styleClass="p-datatable-sm custom-table">
          <ng-template pTemplate="header">
            <tr>
              <th>Nombre</th>
              <th>Tipo de Documento</th>
              <th>Alcance</th>
              <th>Descripción</th>
              <th>Creado por</th>
              <th style="width: 120px; text-align: center;">Acciones</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-temp>
            <tr>
              <td class="font-semibold text-white">{{ temp.name }}</td>
              <td>{{ temp.type?.name || temp.typeId }}</td>
              <td>
                <span class="scope-badge" [ngClass]="temp.scope === 'GLOBAL' ? 'scope-global' : 'scope-dept'">
                  {{ temp.scope }}
                </span>
              </td>
              <td>{{ temp.description }}</td>
              <td>{{ temp.createdBy }}</td>
              <td>
                <div class="action-buttons">
                  <p-button 
                    icon="pi pi-file-edit" 
                    styleClass="p-button-rounded p-button-text p-button-info" 
                    title="Ver/Editar"
                    (click)="openEdit(temp)"
                  ></p-button>
                  <p-button 
                    *ngIf="isAdmin()"
                    icon="pi pi-trash" 
                    styleClass="p-button-rounded p-button-text p-button-danger" 
                    title="Eliminar"
                    (click)="onDelete(temp.id)"
                  ></p-button>
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptystate">
            <tr>
              <td colspan="6" style="text-align: center; padding: 3rem;">No se encontraron plantillas oficiales.</td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <!-- DIALOGO: CREAR/EDITAR PLANTILLA -->
      <p-dialog 
        [header]="dialogHeader" 
        [(visible)]="showDialog" 
        [modal]="true" 
        [style]="{width: '1150px'}"
      >
        <div class="template-form">
          <div class="form-field">
            <label for="name">Nombre de la Plantilla *</label>
            <input 
              type="text" 
              id="name" 
              [(ngModel)]="name" 
              pInputText 
              required 
              placeholder="Ej. Plantilla de Memorando RRHH"
              class="w-full"
            />
          </div>

          <div class="form-grid">
            <div class="form-field">
              <label for="doc-type">Tipo de Documento *</label>
              <p-select 
                [options]="docTypes" 
                [(ngModel)]="selectedDocType" 
                optionLabel="name" 
                optionValue="id"
                placeholder="Seleccionar tipo"
                styleClass="w-full"
              ></p-select>
            </div>

            <div class="form-field">
              <label for="scope">Alcance *</label>
              <p-select 
                [options]="scopes" 
                [(ngModel)]="selectedScope" 
                placeholder="Seleccionar alcance"
                styleClass="w-full"
              ></p-select>
            </div>
          </div>

          <div class="form-field">
            <label for="description">Descripción</label>
            <input 
              type="text" 
              id="description" 
              [(ngModel)]="description" 
              pInputText 
              placeholder="Ej. Formato oficial para circulares de Recursos Humanos"
              class="w-full"
            />
          </div>

          <div class="form-field">
            <label for="content">Cuerpo de la Plantilla *</label>
            <app-rich-editor [(ngModel)]="content"></app-rich-editor>
          </div>
        </div>

        <ng-template pTemplate="footer">
          <p-button label="Cancelar" icon="pi pi-times" styleClass="p-button-text" (click)="showDialog = false"></p-button>
          <p-button label="Guardar Plantilla" icon="pi pi-check" styleClass="p-button-primary" (click)="onSave()"></p-button>
        </ng-template>
      </p-dialog>
    </div>
  `,
  styles: [`
    .template-list-page {
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

    /* Table */
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

    /* Scope badges */
    .scope-badge {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
    }
    .scope-global { background: rgba(99, 102, 241, 0.15); color: #818cf8; }
    .scope-dept { background: rgba(168, 85, 247, 0.15); color: #c084fc; }

    /* Actions */
    .action-buttons {
      display: flex;
      gap: 0.25rem;
      justify-content: center;
    }

    /* Form */
    .template-form {
      display: flex;
      flex-direction: column;
      gap: 1.2rem;
      padding: 0.5rem 0;
      color: #cbd5e1;
    }
    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.2rem;
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
    :host ::ng-deep .template-form input {
      background: rgba(15, 23, 42, 0.6) !important;
      border: 1px solid rgba(255, 255, 255, 0.1) !important;
      color: #f8fafc !important;
      border-radius: 8px !important;
    }
    :host ::ng-deep .template-form .p-dropdown {
      background: rgba(15, 23, 42, 0.6) !important;
      border: 1px solid rgba(255, 255, 255, 0.1) !important;
      border-radius: 8px !important;
    }
    :host ::ng-deep .template-form .p-dropdown .p-dropdown-label {
      color: #f8fafc !important;
    }
    .form-textarea {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #f8fafc;
      border-radius: 8px;
      padding: 0.8rem;
      font-family: inherit;
      resize: vertical;
      outline: none;
    }
    .font-mono {
      font-family: 'Courier New', Courier, monospace;
      font-size: 0.9rem;
    }
    .font-semibold { font-weight: 600; }
    .text-white { color: #ffffff; }
  `]
})
export class TemplateListComponent implements OnInit {
  templates: any[] = [];
  docTypes: any[] = [];
  scopes: string[] = ['GLOBAL', 'DEPARTMENT'];

  // Form Fields
  name = '';
  selectedDocType = null;
  selectedScope = 'GLOBAL';
  description = '';
  content = '';

  // Dialog management
  showDialog = false;
  editingId: string | null = null;
  dialogHeader = 'Crear Plantilla Base';

  constructor(
    private authService: AuthService,
    private templateService: TemplateService,
    private catalogService: CatalogService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadTemplates();
    this.loadDocTypes();
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  loadTemplates() {
    this.templateService.getTemplates().subscribe({
      next: (res) => { this.templates = res; this.cdr.detectChanges(); }
    });
  }

  loadDocTypes() {
    this.catalogService.getDocumentTypes().subscribe({
      next: (res) => { this.docTypes = res; this.cdr.detectChanges(); }
    });
  }

  openNew() {
    this.editingId = null;
    this.name = '';
    this.selectedDocType = null;
    this.selectedScope = 'GLOBAL';
    this.description = '';
    this.content = '';
    this.dialogHeader = 'Crear Plantilla Base';
    this.showDialog = true;
    this.cdr.detectChanges();
  }

  openEdit(template: any) {
    this.editingId = template.id;
    this.name = template.name;
    this.selectedDocType = template.typeId;
    this.selectedScope = template.scope;
    this.description = template.description;
    this.content = template.content;
    this.dialogHeader = this.isAdmin() ? 'Editar Plantilla Base' : 'Ver Formato Base (Solo Lectura)';
    this.showDialog = true;
    this.cdr.detectChanges();
  }

  onSave() {
    if (!this.isAdmin()) {
      this.showDialog = false;
      return; // No guardar para empleados
    }

    if (!this.name || !this.selectedDocType || !this.content) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atención',
        detail: 'Por favor complete todos los campos obligatorios (*).'
      });
      return;
    }

    const templateObj = {
      name: this.name,
      typeId: this.selectedDocType,
      scope: this.selectedScope,
      description: this.description,
      content: this.content
    };

    if (this.editingId) {
      this.templateService.updateTemplate(this.editingId, templateObj).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Actualizado',
            detail: 'Plantilla base modificada con éxito.'
          });
          this.showDialog = false;
          this.loadTemplates();
        }
      });
    } else {
      this.templateService.createTemplate(templateObj).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Creado',
            detail: 'Plantilla base registrada con éxito.'
          });
          this.showDialog = false;
          this.loadTemplates();
        }
      });
    }
  }

  onDelete(id: string) {
    this.templateService.deleteTemplate(id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Eliminado',
          detail: 'Plantilla oficial removida del sistema.'
        });
        this.loadTemplates();
      }
    });
  }
}
