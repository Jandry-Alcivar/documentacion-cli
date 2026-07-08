import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Card } from 'primeng/card';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Button } from 'primeng/button';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DocumentService } from '../services/document.service.js';
import { CatalogService } from '../services/catalog.service.js';
import { TemplateService } from '../services/template.service.js';

@Component({
  selector: 'app-document-create',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    Card,
    InputText,
    Select,
    Button,
    Toast
  ],
  providers: [MessageService],
  template: `
    <div class="document-create-page animate-fade-in">
      <p-toast></p-toast>
      
      <div class="page-header">
        <button 
          pButton 
          icon="pi pi-arrow-left" 
          class="p-button-text p-button-secondary btn-back"
          routerLink="/documents"
        > Volver</button>
        <h1>Crear o Registrar Documento</h1>
      </div>

      <div class="create-type-selection">
        <button 
          class="btn-select-type" 
          [class.active]="createMode === 'upload'" 
          (click)="createMode = 'upload'"
        >
          <i class="pi pi-upload"></i> Subir Archivo Físico
        </button>
        <button 
          class="btn-select-type" 
          [class.active]="createMode === 'internal'" 
          (click)="createMode = 'internal'"
        >
          <i class="pi pi-pencil"></i> Redactar Documento Interno
        </button>
      </div>

      <!-- FORMULARIO 1: SUBIR ARCHIVO -->
      <div *ngIf="createMode === 'upload'" class="form-container">
        <p-card styleClass="form-card">
          <form (ngSubmit)="onUploadSubmit()" class="create-form">
            <div class="form-grid">
              <div class="form-field full-width">
                <label for="title">Título del Documento *</label>
                <input 
                  type="text" 
                  id="title" 
                  name="title" 
                  pInputText 
                  [(ngModel)]="title" 
                  required 
                  placeholder="Ej. Oficio de Requerimiento Tecnológico"
                  class="w-full"
                />
              </div>

              <div class="form-field">
                <label for="category">Categoría (Tipo de Documento) *</label>
                <p-select 
                  [options]="categories" 
                  [(ngModel)]="selectedCategory" 
                  name="category"
                  optionLabel="name" 
                  optionValue="id"
                  placeholder="Selecciona Categoría"
                  styleClass="w-full form-dropdown"
                  [required]="true"
                ></p-select>
              </div>

              <div class="form-field">
                <label for="tags">Etiquetas (Separadas por comas)</label>
                <input 
                  type="text" 
                  id="tags" 
                  name="tags" 
                  pInputText 
                  [(ngModel)]="tagsString" 
                  placeholder="Ej. urgente, rrhh, reporte"
                  class="w-full"
                />
              </div>

              <div class="form-field full-width">
                <label for="description">Descripción del Contenido</label>
                <textarea 
                  id="description" 
                  name="description" 
                  [(ngModel)]="description" 
                  rows="3" 
                  placeholder="Escribe un breve resumen del documento..."
                  class="w-full form-textarea"
                ></textarea>
              </div>

              <div class="form-field full-width">
                <label for="file">Adjuntar Archivo Físico *</label>
                <div class="file-upload-zone">
                  <input 
                    type="file" 
                    id="file" 
                    (change)="onFileSelect($event)" 
                    class="file-input"
                  />
                  <div class="upload-prompt" *ngIf="!selectedFile">
                    <i class="pi pi-cloud-upload"></i>
                    <span>Haz clic o arrastra un archivo aquí</span>
                    <p>Formatos aceptados: PDF, DOCX, XLSX, PNG, JPG (Ver extensiones en administración)</p>
                  </div>
                  <div class="selected-file-info" *ngIf="selectedFile">
                    <i class="pi pi-file-pdf"></i>
                    <span class="file-name">{{ selectedFile.name }}</span>
                    <span class="file-size">{{ getFileSize() }}</span>
                    <button pButton icon="pi pi-trash" class="p-button-text p-button-danger" (click)="selectedFile = null"></button>
                  </div>
                </div>
              </div>
            </div>

            <div class="form-actions">
              <p-button 
                type="submit" 
                label="Registrar y Guardar Borrador" 
                icon="pi pi-save" 
                styleClass="p-button-primary"
                [loading]="loading"
              ></p-button>
            </div>
          </form>
        </p-card>
      </div>

      <!-- FORMULARIO 2: REDACTAR INTERNO -->
      <div *ngIf="createMode === 'internal'" class="form-container">
        <p-card styleClass="form-card">
          <form (ngSubmit)="onInternalSubmit()" class="create-form">
            <div class="form-grid">
              <div class="form-field full-width">
                <label for="title-int">Título del Documento *</label>
                <input 
                  type="text" 
                  id="title-int" 
                  name="title-int" 
                  pInputText 
                  [(ngModel)]="title" 
                  required 
                  placeholder="Ej. Oficio Circular Interno"
                  class="w-full"
                />
              </div>

              <div class="form-field">
                <label for="category-int">Categoría (Tipo de Documento) *</label>
                <p-select 
                  [options]="categories" 
                  [(ngModel)]="selectedCategory" 
                  name="category-int"
                  optionLabel="name" 
                  optionValue="id"
                  placeholder="Selecciona Categoría"
                  styleClass="w-full form-dropdown"
                  [required]="true"
                ></p-select>
              </div>

              <div class="form-field">
                <label for="template-select">Cargar desde Plantilla</label>
                <p-select 
                  [options]="templates" 
                  [(ngModel)]="selectedTemplate" 
                  name="template-select"
                  optionLabel="name" 
                  placeholder="Seleccionar plantilla base"
                  (onChange)="onTemplateChange()"
                  styleClass="w-full form-dropdown"
                ></p-select>
              </div>

              <div class="form-field full-width">
                <label for="description-int">Descripción del Contenido</label>
                <textarea 
                  id="description-int" 
                  name="description-int" 
                  [(ngModel)]="description" 
                  rows="2" 
                  placeholder="Escribe un breve resumen..."
                  class="w-full form-textarea"
                ></textarea>
              </div>

              <div class="form-field full-width">
                <label for="content">Cuerpo del Documento *</label>
                <!-- Editor de texto plano / WYSIWYG minimalista para robustez -->
                <textarea 
                  id="content" 
                  name="content" 
                  [(ngModel)]="content" 
                  rows="12" 
                  required 
                  placeholder="Escribe el contenido oficial del documento. Puedes usar variables de plantilla..."
                  class="w-full form-textarea font-mono"
                ></textarea>
              </div>
            </div>

            <div class="form-actions">
              <p-button 
                type="submit" 
                label="Crear y Guardar Borrador" 
                icon="pi pi-save" 
                styleClass="p-button-primary"
                [loading]="loading"
              ></p-button>
            </div>
          </form>
        </p-card>
      </div>
    </div>
  `,
  styles: [`
    .document-create-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      font-family: 'Inter', system-ui, sans-serif;
    }
    .page-header {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .page-header h1 {
      font-size: 1.6rem;
      font-weight: 800;
      margin: 0;
      color: #ffffff;
    }
    :host ::ng-deep .btn-back {
      color: #94a3b8 !important;
      font-weight: 600 !important;
    }

    /* Create Type Selector */
    .create-type-selection {
      display: flex;
      gap: 1rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding-bottom: 1rem;
    }
    .btn-select-type {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: #94a3b8;
      padding: 0.8rem 1.5rem;
      font-size: 0.95rem;
      font-weight: 600;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.6rem;
      transition: all 0.2s;
    }
    .btn-select-type:hover {
      background: rgba(255, 255, 255, 0.05);
      color: #ffffff;
    }
    .btn-select-type.active {
      background: rgba(99, 102, 241, 0.1);
      border-color: #6366f1;
      color: #818cf8;
    }

    /* Form Container */
    :host ::ng-deep .form-card {
      background: rgba(15, 23, 42, 0.4) !important;
      border: 1px solid rgba(255, 255, 255, 0.06) !important;
      border-radius: 12px !important;
      color: #ffffff !important;
    }
    .create-form {
      padding: 1rem;
    }
    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }
    .full-width {
      grid-column: span 2;
    }
    .form-field {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .form-field label {
      font-size: 0.85rem;
      font-weight: 600;
      color: #cbd5e1;
    }
    :host ::ng-deep .form-field input {
      background: rgba(15, 23, 42, 0.6) !important;
      border: 1px solid rgba(255, 255, 255, 0.1) !important;
      color: #f8fafc !important;
      border-radius: 8px !important;
      padding: 0.6rem 0.8rem !important;
    }
    :host ::ng-deep .form-dropdown {
      background: rgba(15, 23, 42, 0.6) !important;
      border: 1px solid rgba(255, 255, 255, 0.1) !important;
      border-radius: 8px !important;
    }
    :host ::ng-deep .form-dropdown .p-dropdown-label {
      color: #f8fafc !important;
      padding: 0.6rem 0.8rem !important;
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
      transition: border-color 0.2s;
    }
    .form-textarea:focus {
      border-color: #818cf8;
    }
    .font-mono {
      font-family: 'Courier New', Courier, monospace;
      font-size: 0.9rem;
      line-height: 1.5;
    }

    /* File Upload Zone */
    .file-upload-zone {
      position: relative;
      border: 2px dashed rgba(255, 255, 255, 0.15);
      border-radius: 10px;
      padding: 2.5rem 1.5rem;
      text-align: center;
      background: rgba(15, 23, 42, 0.4);
      cursor: pointer;
      transition: all 0.2s;
    }
    .file-upload-zone:hover {
      border-color: #6366f1;
      background: rgba(99, 102, 241, 0.02);
    }
    .file-input {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      opacity: 0;
      cursor: pointer;
      z-index: 2;
    }
    .upload-prompt {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.6rem;
      color: #94a3b8;
    }
    .upload-prompt i {
      font-size: 2.5rem;
      color: #6366f1;
    }
    .upload-prompt span {
      font-size: 1rem;
      font-weight: 600;
      color: #cbd5e1;
    }
    .upload-prompt p {
      font-size: 0.75rem;
      margin: 0;
    }
    .selected-file-info {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      color: #f8fafc;
      z-index: 3;
      position: relative;
    }
    .selected-file-info i {
      font-size: 2rem;
      color: #f43f5e;
    }
    .file-name {
      font-weight: 600;
      font-size: 0.95rem;
    }
    .file-size {
      font-size: 0.8rem;
      color: #94a3b8;
      background: rgba(255, 255, 255, 0.08);
      padding: 0.1rem 0.4rem;
      border-radius: 4px;
    }

    /* Actions */
    .form-actions {
      margin-top: 2rem;
      display: flex;
      justify-content: flex-end;
    }
  `]
})
export class DocumentCreateComponent implements OnInit {
  createMode = 'upload'; // 'upload' or 'internal'
  categories: any[] = [];
  templates: any[] = [];
  
  // Fields
  title = '';
  selectedCategory = null;
  tagsString = '';
  description = '';
  selectedFile: File | null = null;
  content = '';

  selectedTemplate: any = null;
  loading = false;

  constructor(
    private documentService: DocumentService,
    private catalogService: CatalogService,
    private templateService: TemplateService,
    private router: Router,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.loadCategories();
    this.loadTemplates();
  }

  loadCategories() {
    this.catalogService.getDocumentTypes().subscribe({
      next: (res) => this.categories = res
    });
  }

  loadTemplates() {
    this.templateService.getTemplates().subscribe({
      next: (res) => this.templates = res
    });
  }

  onFileSelect(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  getFileSize(): string {
    if (!this.selectedFile) return '';
    const bytes = this.selectedFile.size;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  }

  onTemplateChange() {
    if (this.selectedTemplate) {
      this.content = this.selectedTemplate.content || '';
    }
  }

  onUploadSubmit() {
    if (!this.title || !this.selectedCategory || !this.selectedFile) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atención',
        detail: 'Por favor complete todos los campos obligatorios y adjunte un archivo.'
      });
      return;
    }

    this.loading = true;
    const formData = new FormData();
    formData.append('title', this.title);
    formData.append('category', this.selectedCategory);
    formData.append('description', this.description);
    
    // Parse tags to array
    const tags = this.tagsString
      ? this.tagsString.split(',').map(t => t.trim()).filter(t => t.length > 0)
      : [];
    formData.append('tags', JSON.stringify(tags));
    formData.append('file', this.selectedFile);
    formData.append('submitImmediately', 'false'); // Guardar como borrador

    this.documentService.createDocument(formData).subscribe({
      next: () => {
        this.loading = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Documento borrador guardado correctamente.'
        });
        setTimeout(() => this.router.navigate(['/documents']), 1000);
      },
      error: (err) => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error al registrar',
          detail: err.error?.error || 'No se pudo subir el archivo.'
        });
      }
    });
  }

  onInternalSubmit() {
    if (!this.title || !this.selectedCategory || !this.content) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atención',
        detail: 'Por favor ingrese el título, categoría y contenido del documento.'
      });
      return;
    }

    this.loading = true;
    const docObj = {
      title: this.title,
      category: this.selectedCategory,
      description: this.description,
      content: this.content,
      tags: [] // Opcional expandir en UI
    };

    this.documentService.createInternalDocument(docObj).subscribe({
      next: () => {
        this.loading = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Documento interno borrador creado correctamente.'
        });
        setTimeout(() => this.router.navigate(['/documents']), 1000);
      },
      error: (err) => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.error || 'No se pudo registrar el documento interno.'
        });
      }
    });
  }
}
