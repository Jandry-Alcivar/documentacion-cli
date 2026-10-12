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
        <button 
          *ngIf="isAdmin()"
          class="btn-create-template"
          (click)="openNew()"
        >
          <i class="pi pi-plus mr-1"></i> Nueva Plantilla
        </button>
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
              <td class="font-semibold text-dark">{{ temp.name }}</td>
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
                  <button 
                    class="btn-action-icon text-blue" 
                    title="Ver/Editar"
                    (click)="openEdit(temp)"
                  >
                    <i class="pi pi-file-edit"></i>
                  </button>
                  <button 
                    *ngIf="isAdmin()"
                    class="btn-action-icon text-red" 
                    title="Eliminar"
                    (click)="onDelete(temp.id)"
                  >
                    <i class="pi pi-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptystate">
            <tr>
              <td colspan="6" style="text-align: center; padding: 3rem; color: #94a3b8;">No se encontraron plantillas oficiales.</td>
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
    .btn-create-template {
      background: #1d4ed8;
      color: #ffffff;
      border: none;
      border-radius: 8px;
      padding: 0.6rem 1.25rem;
      font-weight: 600;
      font-size: 0.88rem;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      transition: background 0.2s, transform 0.15s;
    }
    .btn-create-template:hover {
      background: #1e40af;
      transform: translateY(-1px);
    }

    /* Table */
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

    /* Scope badges */
    .scope-badge {
      font-size: 0.72rem;
      font-weight: 700;
      padding: 0.2rem 0.55rem;
      border-radius: 6px;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }
    .scope-global { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
    .scope-dept { background: #f5f3ff; color: #6d28d9; border: 1px solid #ddd6fe; }

    /* Actions */
    .action-buttons {
      display: flex;
      gap: 0.35rem;
      justify-content: center;
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
      transform: translateY(-1px);
    }
    .text-blue { color: #1d4ed8 !important; }
    .text-red { color: #b91c1c !important; }

    /* Form */
    .template-form {
      display: flex;
      flex-direction: column;
      gap: 1.2rem;
      padding: 0.5rem 0;
      color: #0f172a;
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
      color: #334155;
    }
    :host ::ng-deep .template-form input {
      background: #f8fafc !important;
      border: 1px solid #cbd5e1 !important;
      color: #0f172a !important;
      border-radius: 6px !important;
      height: 38px;
    }
    :host ::ng-deep .template-form .p-select {
      background: #f8fafc !important;
      border: 1px solid #cbd5e1 !important;
      border-radius: 6px !important;
      height: 38px;
    }
    .form-textarea {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      color: #0f172a;
      border-radius: 6px;
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
