import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Card } from 'primeng/card';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ProcedureService } from '../services/procedure.service.js';
import { CatalogService } from '../services/catalog.service.js';
import { DepartmentService } from '../services/department.service.js';
import { DocumentService } from '../services/document.service.js';
import { TemplateService } from '../services/template.service.js';
import { AuthService } from '../services/auth.service.js';
import { RichEditorComponent } from './rich-editor.js';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-procedure-create',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    Card,
    InputText,
    Select,
    Toast,
    RichEditorComponent
  ],
  providers: [MessageService],
  template: `
    <div class="procedure-create-page animate-fade-in">
      <p-toast></p-toast>
      
      <div class="page-header">
        <button 
          class="p-button p-button-text p-button-secondary btn-back"
          routerLink="/procedures"
        >
          <i class="pi pi-arrow-left mr-1"></i> Volver
        </button>
        <h1>Registrar e Iniciar Trámite <span style="color: #818cf8; font-weight: 500;" *ngIf="selectedTypeObj"> - {{ selectedTypeObj.name }}</span></h1>
      </div>

      <!-- Stepper / Wizard Progress Bar -->
      <div class="stepper-wrapper">
        <div class="step-item" [class.active]="currentStep >= 1" [class.completed]="currentStep > 1">
          <div class="step-circle">1</div>
          <span class="step-label">Configuración</span>
        </div>
        <div class="step-line" [class.active]="currentStep > 1"></div>
        <div class="step-item" [class.active]="currentStep >= 2" [class.completed]="currentStep > 2">
          <div class="step-circle">2</div>
          <span class="step-label">Información</span>
        </div>
        <div class="step-line" [class.active]="currentStep > 2"></div>
        <div class="step-item" [class.active]="currentStep >= 3" [class.completed]="currentStep > 3">
          <div class="step-circle">3</div>
          <span class="step-label">Documentos</span>
        </div>
        <div class="step-line" [class.active]="currentStep > 3"></div>
        <div class="step-item" [class.active]="currentStep >= 4">
          <div class="step-circle">4</div>
          <span class="step-label">Confirmación</span>
        </div>
      </div>

      <div class="form-container">
        <p-card styleClass="form-card">
          
          <!-- STEP 1: CONFIGURACION -->
          <div *ngIf="currentStep === 1" class="wizard-step">
            <h3 class="step-title">Paso 1: Seleccione el Tipo de Trámite</h3>
            <div class="form-grid">
              <div class="form-field full-width">
                <label for="type">Tipo de Trámite *</label>
                <p-select 
                  [options]="availableTypes" 
                  [(ngModel)]="selectedType" 
                  name="type"
                  optionLabel="name" 
                  optionValue="id"
                  placeholder="Seleccionar tipo"
                  styleClass="w-full form-dropdown"
                  appendTo="body"
                  (onChange)="onTypeChange()"
                ></p-select>
              </div>

              <!-- Detalles del Flujo Encontrado -->
              <div class="full-width flow-info-card" *ngIf="selectedTypeObj">
                <div class="info-title"><i class="pi pi-info-circle"></i> Detalles del Trámite Seleccionado</div>
                <p class="description">{{ selectedTypeObj.description || 'Sin descripción disponible.' }}</p>
                <div class="flow-meta">
                  <span><strong>Días Estimados de Atención:</strong> {{ selectedTypeObj.estimatedDays }} días</span>
                  <span *ngIf="activeWorkflow">
                    <strong class="text-indigo"><i class="pi pi-directions"></i> Flujo Preconfigurado:</strong> 
                    Sí (Ruta Automática)
                  </span>
                  <span *ngIf="!activeWorkflow">
                    <strong class="text-orange"><i class="pi pi-user-edit"></i> Flujo Libre:</strong> 
                    No tiene flujo predefinido, podrá asignar la ruta manualmente en el Paso 2.
                  </span>
                </div>
                <div class="route-preview" *ngIf="activeWorkflow?.nodes?.length">
                  <div class="route-title"><i class="pi pi-sitemap"></i> Ruta del flujo: {{ activeWorkflow.name }}</div>
                  <div class="route-steps">
                    <ng-container *ngFor="let n of workflowRoute; let last = last; let i = index">
                      <div class="route-step" [class.start]="n.isStart" [class.end]="n.isEnd">
                        <span class="rs-num">{{ i + 1 }}</span>
                        <div><strong>{{ n.name }}</strong><small>{{ n.department?.name }} · {{ n.maxHours }}h</small></div>
                      </div>
                      <i class="pi pi-arrow-right route-arrow" *ngIf="!last"></i>
                    </ng-container>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="wizard-actions">
              <button class="p-button p-button-primary" [disabled]="!selectedType" (click)="nextStep()">
                Siguiente <i class="pi pi-arrow-right ml-1"></i>
              </button>
            </div>
          </div>

          <!-- STEP 2: INFORMACION GENERAL -->
          <div *ngIf="currentStep === 2" class="wizard-step">
            <h3 class="step-title">Paso 2: Información General y del Solicitante</h3>
            <div class="form-grid">
              
              <div class="section-title full-width">Detalles del Expediente</div>

              <div class="form-field full-width">
                <label for="subject">Asunto / Tema Principal *</label>
                <input 
                  type="text" 
                  id="subject" 
                  name="subject" 
                  pInputText 
                  [(ngModel)]="subject" 
                  placeholder="Ej. Solicitud de Mantenimiento de Alcantarillado Junín"
                  class="w-full"
                />
              </div>

              <div class="form-field">
                <label for="priority">Prioridad *</label>
                <p-select 
                  [options]="priorities" 
                  [(ngModel)]="selectedPriority" 
                  name="priority"
                  placeholder="Seleccionar prioridad"
                  styleClass="w-full form-dropdown"
                  appendTo="body"
                ></p-select>
              </div>

              <div class="form-field">
                <label for="department">Departamento Responsable de Destino *</label>
                <p-select 
                  [options]="departments" 
                  [(ngModel)]="selectedDept" 
                  name="department"
                  optionLabel="name" 
                  optionValue="id"
                  placeholder="Seleccionar área"
                  styleClass="w-full form-dropdown"
                  appendTo="body"
                  (onChange)="onDeptChange()"
                  [disabled]="activeWorkflow !== null && activeWorkflow.nodes && activeWorkflow.nodes.length > 0"
                ></p-select>
                <small class="help-text" style="color: #94a3b8;" *ngIf="activeWorkflow && activeWorkflow.nodes && activeWorkflow.nodes.length > 0">
                  <i class="pi pi-lock"></i> El departamento destino está fijado por el flujo de este trámite.
                </small>
              </div>

              <div class="form-field">
                <label for="assignee">Asignar Funcionario Operador Responsable *</label>
                <p-select 
                  [options]="deptUsers" 
                  [(ngModel)]="selectedUser" 
                  name="assignee"
                  optionLabel="name" 
                  optionValue="id"
                  placeholder="Seleccionar funcionario"
                  styleClass="w-full form-dropdown"
                  [disabled]="!selectedDept"
                  appendTo="body"
                ></p-select>
                <small class="help-text" *ngIf="activeWorkflow && activeWorkflow.nodes && activeWorkflow.nodes.length > 0">
                  <i class="pi pi-info-circle"></i> * Obligatorio: Seleccione el funcionario responsable que revisará e iniciará el trámite.
                </small>
              </div>

              <div class="form-field full-width">
                <label for="description">Descripción / Antecedentes</label>
                <textarea 
                  id="description" 
                  name="description" 
                  [(ngModel)]="description" 
                  rows="3" 
                  placeholder="Escribe los detalles y motivos del trámite aquí..."
                  class="w-full form-textarea"
                ></textarea>
              </div>

              <div class="section-title full-width">Información del Solicitante (Opcional)</div>

              <div class="form-field">
                <label for="app-name">Nombre del Solicitante (Opcional)</label>
                <input 
                  type="text" 
                  id="app-name" 
                  name="app-name" 
                  pInputText 
                  [(ngModel)]="applicantName" 
                  placeholder="Ej. Juan Pérez (Dejar vacío para Trámite Interno)"
                  class="w-full"
                />
              </div>

              <div class="form-field">
                <label for="app-id">Identificación / Cédula / RUC</label>
                <input 
                  type="text" 
                  id="app-id" 
                  name="app-id" 
                  pInputText 
                  [(ngModel)]="applicantId" 
                  placeholder="Ej. 1312345678"
                  class="w-full"
                />
              </div>

              <div class="form-field">
                <label for="app-email">Correo Electrónico</label>
                <input 
                  type="email" 
                  id="app-email" 
                  name="app-email" 
                  pInputText 
                  [(ngModel)]="applicantEmail" 
                  placeholder="Ej. juan.perez@correo.com"
                  class="w-full"
                />
              </div>

              <div class="form-field">
                <label for="app-phone">Teléfono de Contacto</label>
                <input 
                  type="text" 
                  id="app-phone" 
                  name="app-phone" 
                  pInputText 
                  [(ngModel)]="applicantPhone" 
                  placeholder="Ej. 0998765432"
                  class="w-full"
                />
              </div>

              <div class="form-field">
                <label for="app-inst">Institución / Empresa / Organización</label>
                <input 
                  type="text" 
                  id="app-inst" 
                  name="app-inst" 
                  pInputText 
                  [(ngModel)]="applicantInstitution" 
                  placeholder="Ej. Barrio Central / GAD Municipal / Empresa ABC"
                  class="w-full"
                />
              </div>

              <div class="form-field full-width">
                <label for="app-addr">Dirección Domiciliaria / Institucional</label>
                <input 
                  type="text" 
                  id="app-addr" 
                  name="app-addr" 
                  pInputText 
                  [(ngModel)]="applicantAddress" 
                  placeholder="Ej. Av. Principal #123 y Calle Secundaria"
                  class="w-full"
                />
              </div>
            </div>

            <div class="wizard-actions">
              <button class="p-button p-button-secondary p-button-text mr-2" (click)="prevStep()">
                <i class="pi pi-arrow-left mr-1"></i> Anterior
              </button>
              <button class="p-button p-button-primary" [disabled]="!subject || !selectedDept || !selectedUser || !applicantName" (click)="nextStep()">
                Siguiente <i class="pi pi-arrow-right ml-1"></i>
              </button>
            </div>
          </div>

          <!-- STEP 3: CREACION / CARGA DE DOCUMENTOS -->
          <div *ngIf="currentStep === 3" class="wizard-step">
            <h3 class="step-title">Paso 3: Redactar Documento Principal y Adjuntar Anexos</h3>
            <div class="form-grid">
              
              <div class="section-title full-width">Documento Principal</div>

              <div class="form-field full-width">
                <label for="template-select">Seleccionar Plantilla de Redacción (Opcional)</label>
                <p-select 
                  [options]="templates" 
                  [(ngModel)]="selectedTemplate" 
                  name="template-select"
                  optionLabel="name" 
                  optionValue="id"
                  placeholder="Elegir plantilla institucional para autocompletar..."
                  styleClass="w-full form-dropdown"
                  appendTo="body"
                  (onChange)="onTemplateChange()"
                ></p-select>
              </div>

              <div class="form-field">
                <label for="doc-type">Categoría del Documento Principal *</label>
                <p-select 
                  [options]="docTypes" 
                  [(ngModel)]="selectedDocType" 
                  name="doc-type"
                  optionLabel="name" 
                  optionValue="id"
                  placeholder="Seleccionar tipo de documento"
                  styleClass="w-full form-dropdown"
                  appendTo="body"
                ></p-select>
              </div>

              <div class="form-field">
                <label for="doc-title">Título del Documento *</label>
                <input 
                  type="text" 
                  id="doc-title" 
                  name="doc-title" 
                  pInputText 
                  [(ngModel)]="docTitle" 
                  placeholder="Ej. Oficio de Solicitud de Obras"
                  class="w-full"
                />
              </div>

              <div class="form-field full-width">
                <label for="doc-content">Cuerpo del Documento (Contenido Principal) *</label>
                <app-rich-editor [(ngModel)]="docContent" [dynamicValues]="editorVars"></app-rich-editor>
              </div>

              <div class="section-title full-width">Archivos Anexos (Opcional)</div>
              
              <div class="full-width upload-control-wrapper">
                <div class="anexo-inputs-grid">
                  <div class="form-field">
                    <label>Título del Anexo</label>
                    <input type="text" pInputText [(ngModel)]="newAnexoTitle" placeholder="Ej. Copia de Cédula" />
                  </div>
                  <div class="form-field">
                    <label>Tipo de Documento</label>
                    <p-select [options]="docTypes" [(ngModel)]="newAnexoType" optionLabel="name" optionValue="id" placeholder="Tipo" styleClass="w-full" appendTo="body"></p-select>
                  </div>
                  <div class="form-field">
                    <label>Archivo (PDF / Word)</label>
                    <input type="file" (change)="onFileSelect($event)" class="file-input-raw" />
                  </div>
                  <div class="form-field flex-end-btn">
                    <button class="p-button p-button-sm p-button-info" [disabled]="!newAnexoTitle || !newAnexoType || !selectedFile" (click)="addAnexoToList()">
                      <i class="pi pi-plus mr-1"></i> Agregar Anexo
                    </button>
                  </div>
                </div>

                <!-- Lista de Anexos agregados -->
                <div class="anexo-list-wrapper mt-3" *ngIf="anexosList.length > 0">
                  <h4>Anexos a Cargar:</h4>
                  <div class="anexo-badge" *ngFor="let item of anexosList; let idx = index">
                    <i class="pi pi-file-pdf"></i>
                    <div class="anexo-meta">
                      <strong>{{ item.title }}</strong>
                      <span>{{ item.fileName }} ({{ item.typeName }})</span>
                    </div>
                    <button class="p-button p-button-text p-button-danger p-button-sm" (click)="removeAnexoFromList(idx)">
                      <i class="pi pi-trash"></i>
                    </button>
                  </div>
                </div>
              </div>

            </div>

            <div class="wizard-actions">
              <button class="p-button p-button-secondary p-button-text mr-2" (click)="prevStep()">
                <i class="pi pi-arrow-left mr-1"></i> Anterior
              </button>
              <button class="p-button p-button-primary" [disabled]="!selectedDocType || !docTitle || !docContent" (click)="nextStep()">
                Siguiente <i class="pi pi-arrow-right ml-1"></i>
              </button>
            </div>
          </div>

          <!-- STEP 4: CONFIRMACION -->
          <div *ngIf="currentStep === 4" class="wizard-step">
            <h3 class="step-title">Paso 4: Resumen de Envío</h3>
            
            <div class="summary-wrapper animate-fade-in">
              <div class="summary-grid">
                <div class="summary-item">
                  <span class="label">Asunto:</span>
                  <span class="val">{{ subject }}</span>
                </div>
                <div class="summary-item">
                  <span class="label">Tipo de Trámite:</span>
                  <span class="val">{{ selectedTypeObj?.name }}</span>
                </div>
                <div class="summary-item">
                  <span class="label">Prioridad:</span>
                  <span class="val status-badge" [ngClass]="'badge-' + selectedPriority.toLowerCase()">{{ selectedPriority }}</span>
                </div>
                <div class="summary-item">
                  <span class="label">Departamento Destino:</span>
                  <span class="val">{{ selectedDeptObj?.name }}</span>
                </div>
                <div class="summary-item">
                  <span class="label">Solicitante:</span>
                  <span class="val">{{ applicantName }} (ID: {{ applicantId || 'N/A' }})</span>
                </div>
                <div class="summary-item full-width">
                  <span class="label">Documento Principal:</span>
                  <span class="val"><strong>{{ docTitle }}</strong> ({{ selectedDocTypeObj?.name }})</span>
                </div>
                <div class="summary-item full-width" *ngIf="anexosList.length > 0">
                  <span class="label">Anexos Adjuntos:</span>
                  <div class="val">
                    <ul>
                      <li *ngFor="let item of anexosList">{{ item.title }} ({{ item.fileName }})</li>
                    </ul>
                  </div>
                </div>
              </div>

              <!-- Skeleton/Loading overlay during submission -->
              <div class="loading-overlay" *ngIf="loading">
                <i class="pi pi-spin pi-spinner spinner-large"></i>
                <p>Registrando expediente y subiendo documentos oficiales...</p>
              </div>
            </div>

            <div class="wizard-actions">
              <button class="p-button p-button-secondary p-button-text mr-2" [disabled]="loading" (click)="prevStep()">
                <i class="pi pi-arrow-left mr-1"></i> Anterior
              </button>
              <button class="p-button p-button-success" [disabled]="loading" (click)="onSubmit()">
                <i class="pi pi-check-circle mr-1"></i> Confirmar e Iniciar Trámite
              </button>
            </div>
          </div>

        </p-card>
      </div>
    </div>
  `,
  styles: [`
    .procedure-create-page {
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
      font-size: 1.5rem;
      font-weight: 800;
      margin: 0;
      color: #0f172a;
    }
    :host ::ng-deep .btn-back {
      color: #64748b !important;
      font-weight: 600 !important;
    }

    /* Stepper Wizard Progress */
    .stepper-wrapper {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #ffffff;
      padding: 1.25rem 2.5rem;
      border-radius: 10px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }
    .step-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.45rem;
      z-index: 2;
    }
    .step-circle {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: #f1f5f9;
      color: #64748b;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.88rem;
      border: 2px solid #cbd5e1;
      transition: all 0.3s;
    }
    .step-label {
      font-size: 0.78rem;
      font-weight: 600;
      color: #64748b;
      transition: color 0.3s;
    }
    .step-item.active .step-circle {
      background: #1d4ed8;
      color: #ffffff;
      border-color: #1d4ed8;
      box-shadow: 0 0 0 3px rgba(29, 78, 216, 0.15);
    }
    .step-item.active .step-label {
      color: #1d4ed8;
      font-weight: 700;
    }
    .step-item.completed .step-circle {
      background: #047857;
      color: #ffffff;
      border-color: #047857;
    }
    .step-item.completed .step-label {
      color: #047857;
    }
    .step-line {
      flex: 1;
      height: 2px;
      background: #e2e8f0;
      margin: 0 1rem;
      margin-top: -1.2rem;
      transition: background 0.3s;
    }
    .step-line.active {
      background: #1d4ed8;
    }

      /* Flow Card */
      .route-preview { margin-top: .9rem; background: #f8fafc; border: 1px solid #e0e7ff; border-radius: 10px; padding: .8rem; }
      .route-title { font-weight: 700; color: #3730a3; font-size: .85rem; margin-bottom: .6rem; display: flex; gap: .35rem; align-items: center; }
      .route-steps { display: flex; flex-wrap: wrap; align-items: center; gap: .5rem; }
      .route-step { display: flex; align-items: center; gap: .5rem; background: #fff; border: 1px solid #cbd5e1; border-left: 4px solid #3b82f6; border-radius: 8px; padding: .4rem .6rem; }
      .route-step.start { border-left-color: #4f46e5; }
      .route-step.end { border-left-color: #059669; }
      .route-step strong { display: block; font-size: .82rem; color: #0f172a; }
      .route-step small { font-size: .72rem; color: #475569; }
      .rs-num { width: 20px; height: 20px; border-radius: 50%; background: #1e293b; color: #fff; font-size: .7rem; font-weight: 800; display: inline-flex; align-items: center; justify-content: center; }
      .route-arrow { color: #6366f1; }
    .flow-info-card {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 8px;
      padding: 1.15rem;
      margin-top: 1rem;
    }
    .info-title {
      font-weight: 700;
      font-size: 0.92rem;
      color: #1d4ed8;
      margin-bottom: 0.4rem;
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    .flow-info-card p {
      margin: 0 0 0.8rem 0;
      font-size: 0.85rem;
      color: #334155;
    }
    .flow-meta {
      display: flex;
      gap: 1.5rem;
      font-size: 0.82rem;
      color: #475569;
      flex-wrap: wrap;
    }
    .text-indigo { color: #1d4ed8; }
    .text-orange { color: #b45309; }

    /* Form Container */
    :host ::ng-deep .form-card {
      background: #ffffff !important;
      border: 1px solid #e2e8f0 !important;
      border-radius: 10px !important;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04) !important;
      color: #0f172a !important;
    }
    .wizard-step {
      padding: 0.5rem;
    }
    .step-title {
      font-size: 1.15rem;
      font-weight: 700;
      margin-top: 0;
      margin-bottom: 1.25rem;
      color: #0f172a;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 0.75rem;
    }
    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.25rem;
    }
    .full-width {
      grid-column: span 2;
    }
    .section-title {
      font-size: 0.98rem;
      font-weight: 700;
      color: #1d4ed8;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 0.4rem;
      margin-top: 0.8rem;
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
    .help-text {
      font-size: 0.75rem;
      color: #64748b;
    }
    :host ::ng-deep .form-field input {
      background: #f8fafc !important;
      border: 1px solid #cbd5e1 !important;
      color: #0f172a !important;
      border-radius: 6px !important;
      padding: 0.55rem 0.8rem !important;
      height: 38px;
    }
    :host ::ng-deep .form-dropdown {
      background: #f8fafc !important;
      border: 1px solid #cbd5e1 !important;
      border-radius: 6px !important;
      height: 38px;
    }
    :host ::ng-deep .form-dropdown .p-select-label {
      color: #0f172a !important;
      padding: 0.55rem 0.8rem !important;
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
      transition: border-color 0.2s;
    }
    .form-textarea:focus {
      border-color: #1d4ed8;
    }
    
    /* Anexos */
    .anexo-inputs-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr) auto;
      gap: 1rem;
      background: #f8fafc;
      padding: 1rem;
      border-radius: 8px;
      border: 1px dashed #cbd5e1;
    }
    .file-input-raw {
      padding: 0.4rem;
      color: #475569;
    }
    .flex-end-btn {
      display: flex;
      align-items: flex-end;
    }
    .anexo-list-wrapper h4 {
      font-size: 0.88rem;
      margin-bottom: 0.5rem;
      color: #0f172a;
      font-weight: 700;
    }
    .anexo-badge {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      margin-bottom: 0.5rem;
    }
    .anexo-meta {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .anexo-meta strong {
      font-size: 0.85rem;
      color: #0f172a;
    }
    .anexo-meta span {
      font-size: 0.75rem;
      color: #64748b;
    }

    /* Summary Step */
    .summary-wrapper {
      position: relative;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.25rem;
    }
    .summary-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .summary-item .label {
      font-size: 0.8rem;
      font-weight: 600;
      color: #64748b;
    }
    .summary-item .val {
      font-size: 0.92rem;
      font-weight: 600;
      color: #0f172a;
    }
    .summary-item ul {
      margin: 0;
      padding-left: 1.2rem;
      font-size: 0.85rem;
      color: #334155;
    }

    /* Status badges for summary */
    .status-badge {
      font-size: 0.72rem;
      font-weight: 700;
      padding: 0.2rem 0.55rem;
      border-radius: 6px;
      text-transform: uppercase;
      display: inline-block;
      width: fit-content;
    }
    .badge-baja { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }
    .badge-normal { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
    .badge-alta { background: #fff7ed; color: #c2410c; border: 1px solid #ffedd5; }
    .badge-urgente { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }

    /* Loading Overlay */
    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.9);
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      color: #0f172a;
      z-index: 10;
    }
    .spinner-large {
      font-size: 2rem;
      color: #1d4ed8;
    }

    /* Actions buttons */
    .wizard-actions {
      margin-top: 1.5rem;
      display: flex;
      justify-content: space-between;
      border-top: 1px solid #f1f5f9;
      padding-top: 1.25rem;
    }
  `]
})
export class ProcedureCreateComponent implements OnInit {
  currentStep = 1;

  types: any[] = [];
  docTypes: any[] = [];
  departments: any[] = [];
  deptUsers: any[] = [];
  priorities: string[] = ['BAJA', 'NORMAL', 'ALTA', 'URGENTE'];

  // Form Fields
  selectedType: string | null = null;
  subject = '';
  selectedPriority = 'NORMAL';
  selectedDept: string | null = null;
  selectedUser: string | null = null;
  description = '';

  applicantName = '';
  applicantId = '';
  applicantEmail = '';
  applicantPhone = '';
  applicantInstitution = '';
  applicantAddress = '';

  // Step 3 Document Creation
  selectedDocType: string | null = null;
  docTitle = '';
  docContent = '';

  // Anexos creation helper
  newAnexoTitle = '';
  newAnexoType: string | null = null;
  selectedFile: File | null = null;
  anexosList: Array<{ title: string; typeId: string; typeName: string; file: File; fileName: string }> = [];

  loading = false;

  // Active Workflow Info
  activeWorkflow: any = null;
  workflows: any[] = [];
  templates: any[] = [];
  selectedTemplate: string | null = null;

  constructor(
    private procedureService: ProcedureService,
    private catalogService: CatalogService,
    private departmentService: DepartmentService,
    private documentService: DocumentService,
    private templateService: TemplateService,
    private authService: AuthService,
    private http: HttpClient,
    private router: Router,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadCatalogTypes();
    this.loadDepartments();
    this.loadDocumentTypes();
    this.loadWorkflows();
    this.loadTemplates();
  }

  loadCatalogTypes() {
    this.catalogService.getProcedureTypes().subscribe({
      next: (res) => this.types = res.filter(t => t.isActive)
    });
  }

  loadDepartments() {
    this.departmentService.getDepartments().subscribe({
      next: (res) => this.departments = res
    });
  }

  loadDocumentTypes() {
    this.catalogService.getDocumentTypes().subscribe({
      next: (res) => this.docTypes = res.filter(d => d.isActive)
    });
  }

  loadWorkflows() {
    this.http.get<any[]>('http://localhost:3001/api/workflows').subscribe({
      next: (res) => {
        this.workflows = res.filter(w => w.isActive);
        if (this.selectedType) this.onTypeChange();
        this.cdr.detectChanges();
      }
    });
  }

  loadTemplates() {
    this.templateService.getTemplates().subscribe({
      next: (res) => { this.templates = res; this.cdr.detectChanges(); }
    });
  }

  get availableTypes() {
    if (!this.types || !this.workflows) return [];
    const user = this.authService.currentUser();
    if (!user) return [];
    
    if (user.role.name === 'Administrador' || this.authService.hasPermission('all')) {
      return this.types;
    }

    return this.types.filter(type => {
      const workflow = this.workflows.find(w => w.procedureTypeId === type.id);
      
      if (!workflow) return true;

      const belongsToDept = workflow.nodes?.some((n: any) => n.departmentId === user.department.id);
      return belongsToDept;
    });
  }

  get selectedTypeObj() {
    return this.types.find(t => t.id === this.selectedType);
  }

  get selectedDeptObj() {
    return this.departments.find(d => d.id === this.selectedDept);
  }

  get selectedDocTypeObj() {
    return this.docTypes.find(d => d.id === this.selectedDocType);
  }

  get workflowRoute(): any[] {
    const nodes = this.activeWorkflow?.nodes || [];
    return [...nodes].sort((a: any, b: any) => {
      if (a.isStart !== b.isStart) return a.isStart ? -1 : 1;
      if (a.isEnd !== b.isEnd) return a.isEnd ? 1 : -1;
      return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
    });
  }

  onTypeChange() {
    // Buscar si existe un flujo preconfigurado para este tipo de trámite
    const candidates = this.workflows.filter(w => w.procedureTypeId === this.selectedType);
    this.activeWorkflow = candidates.find(w => w.nodes?.length > 0) || candidates[0] || null;
    this.selectedDept = null;
    this.selectedUser = null;
    this.deptUsers = [];

    if (this.activeWorkflow && this.activeWorkflow.nodes && this.activeWorkflow.nodes.length > 0) {
      // Tomar el nodo inicial (o el primero si no hay marcado)
      const route = this.workflowRoute;
      const startNode = route[0];
      if (startNode) {
        this.selectedDept = startNode.departmentId;
        // Asignar automáticamente el departamento y bloquear su modificación
        this.onDeptChange();

        // Concordancia con documentos requeridos del flujo
        if (startNode.requiredDocTypes && startNode.requiredDocTypes.length > 0) {
          const reqDocTypeId = startNode.requiredDocTypes[0];
          if (this.docTypes.some(dt => dt.id === reqDocTypeId)) {
            this.selectedDocType = reqDocTypeId;
          }
        }
      }
    }
  }

  onDeptChange() {
    this.selectedUser = null;
    this.deptUsers = [];
    if (this.selectedDept) {
      this.departmentService.getDepartmentUsers(this.selectedDept).subscribe({
        next: (res) => { this.deptUsers = res; this.cdr.detectChanges(); }
      });
    }
  }

  onTemplateChange() {
    if (this.selectedTemplate) {
      const template = this.templates.find(t => t.id === this.selectedTemplate);
      if (template) {
        this.docContent = template.content || '';
        if (template.typeId) {
          this.selectedDocType = template.typeId;
        }
        this.cdr.detectChanges();
      }
    }
  }

  get editorVars() {
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const d = new Date();
    const fecha = `Junín, ${d.getDate()} de ${meses[d.getMonth()]} de ${d.getFullYear()}`;
    return {
      fecha: fecha,
      destinatario: this.selectedDeptObj ? `Director/a Departamental de ${this.selectedDeptObj.name}` : undefined,
      asunto: this.subject || '(Asunto no especificado)',
      nombre_solicitante: this.applicantName || 'Ciudadano Solicitante',
      codigo_tramite: 'TRM-NUEVO'
    };
  }

  nextStep() {
    if (this.currentStep === 1 && !this.selectedType) return;
    if (this.currentStep === 2 && (!this.subject || !this.selectedDept || !this.selectedUser)) return;
    if (this.currentStep === 3 && (!this.selectedDocType || !this.docTitle || !this.docContent)) return;

    this.currentStep++;
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  onFileSelect(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
    }
  }

  addAnexoToList() {
    if (!this.newAnexoTitle || !this.newAnexoType || !this.selectedFile) return;

    const typeObj = this.docTypes.find(d => d.id === this.newAnexoType);
    this.anexosList.push({
      title: this.newAnexoTitle,
      typeId: this.newAnexoType,
      typeName: typeObj ? typeObj.name : 'Anexo',
      file: this.selectedFile,
      fileName: this.selectedFile.name
    });

    // Reset inputs
    this.newAnexoTitle = '';
    this.newAnexoType = null;
    this.selectedFile = null;
    // Limpiar input file
    const fileInput = document.querySelector('.file-input-raw') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  removeAnexoFromList(index: number) {
    this.anexosList.splice(index, 1);
  }

  onSubmit() {
    this.loading = true;

    const procedureObj = {
      subject: this.subject,
      description: this.description,
      priority: this.selectedPriority,
      applicantName: this.applicantName?.trim() || 'Trámite Interno',
      applicantId: this.applicantId || null,
      applicantEmail: this.applicantEmail || null,
      applicantPhone: this.applicantPhone || null,
      applicantInstitution: this.applicantInstitution || null,
      applicantAddress: this.applicantAddress || null,
      typeId: this.selectedType,
      departmentId: this.selectedDept,
      assigneeId: this.selectedUser || null
    };

    // 1. Crear el Trámite
    this.procedureService.createProcedure(procedureObj).subscribe({
      next: (proc) => {
        const procedureId = proc.id;

        // 2. Crear Documento Principal (WYSIWYG/Internal)
        const mainDocObj = {
          title: this.docTitle,
          description: `Documento principal del trámite ${proc.code}`,
          category: this.selectedDocType,
          content: this.docContent,
          procedureId
        };

        this.documentService.createInternalDocument(mainDocObj).subscribe({
          next: () => {
            // 3. Subir Anexos si los hay
            if (this.anexosList.length === 0) {
              this.finishSubmission();
            } else {
              let uploadedCount = 0;
              this.anexosList.forEach((anexo) => {
                const formData = new FormData();
                formData.append('file', anexo.file);
                formData.append('title', anexo.title);
                formData.append('category', anexo.typeId);
                formData.append('procedureId', procedureId);
                formData.append('submitImmediately', 'true');

                this.documentService.createDocument(formData).subscribe({
                  next: () => {
                    uploadedCount++;
                    if (uploadedCount === this.anexosList.length) {
                      this.finishSubmission();
                    }
                  },
                  error: (err) => {
                    this.loading = false;
                    this.messageService.add({
                      severity: 'error',
                      summary: 'Error en Anexo',
                      detail: `No se pudo cargar el anexo ${anexo.title}.`
                    });
                  }
                });
              });
            }
          },
          error: (err) => {
            this.loading = false;
            this.messageService.add({
              severity: 'error',
              summary: 'Error Documento Principal',
              detail: err.error?.error || 'No se pudo crear el documento principal.'
            });
          }
        });
      },
      error: (err) => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error al Registrar Trámite',
          detail: err.error?.error || 'No se pudo crear el expediente.'
        });
      }
    });
  }

  finishSubmission() {
    this.loading = false;
    this.messageService.add({
      severity: 'success',
      summary: 'Éxito',
      detail: 'El expediente de trámite y sus documentos se registraron con éxito.'
    });
    setTimeout(() => this.router.navigate(['/procedures']), 1500);
  }
}
