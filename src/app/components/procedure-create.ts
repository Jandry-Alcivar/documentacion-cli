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
import { ProcedureService } from '../services/procedure.service.js';
import { CatalogService } from '../services/catalog.service.js';
import { DepartmentService } from '../services/department.service.js';

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
    Button,
    Toast
  ],
  providers: [MessageService],
  template: `
    <div class="procedure-create-page animate-fade-in">
      <p-toast></p-toast>
      
      <div class="page-header">
        <button 
          pButton 
          icon="pi pi-arrow-left" 
          class="p-button-text p-button-secondary btn-back"
          routerLink="/procedures"
        > Volver</button>
        <h1>Registrar e Iniciar Trámite</h1>
      </div>

      <div class="form-container">
        <p-card styleClass="form-card">
          <form (ngSubmit)="onSubmit()" class="create-form">
            <div class="form-grid">
              
              <!-- Sección: Datos del Trámite -->
              <div class="section-title full-width">Información del Expediente</div>

              <div class="form-field full-width">
                <label for="subject">Asunto / Tema Principal *</label>
                <input 
                  type="text" 
                  id="subject" 
                  name="subject" 
                  pInputText 
                  [(ngModel)]="subject" 
                  required 
                  placeholder="Ej. Solicitud de Mantenimiento de Alcantarillado Chone"
                  class="w-full"
                />
              </div>

              <div class="form-field">
                <label for="type">Tipo de Trámite *</label>
                <p-select 
                  [options]="types" 
                  [(ngModel)]="selectedType" 
                  name="type"
                  optionLabel="name" 
                  optionValue="id"
                  placeholder="Seleccionar tipo"
                  styleClass="w-full form-dropdown"
                  [required]="true"
                ></p-select>
              </div>

              <div class="form-field">
                <label for="priority">Prioridad *</label>
                <p-select 
                  [options]="priorities" 
                  [(ngModel)]="selectedPriority" 
                  name="priority"
                  placeholder="Seleccionar prioridad"
                  styleClass="w-full form-dropdown"
                  [required]="true"
                ></p-select>
              </div>

              <div class="form-field">
                <label for="department">Departamento Responsable *</label>
                <p-select 
                  [options]="departments" 
                  [(ngModel)]="selectedDept" 
                  name="department"
                  optionLabel="name" 
                  optionValue="id"
                  placeholder="Seleccionar área"
                  (onChange)="onDeptChange()"
                  styleClass="w-full form-dropdown"
                  [required]="true"
                ></p-select>
              </div>

              <div class="form-field">
                <label for="assignee">Asignar Operador (Opcional)</label>
                <p-select 
                  [options]="deptUsers" 
                  [(ngModel)]="selectedUser" 
                  name="assignee"
                  optionLabel="name" 
                  optionValue="id"
                  placeholder="Seleccionar funcionario"
                  styleClass="w-full form-dropdown"
                  [disabled]="!selectedDept"
                ></p-select>
              </div>

              <div class="form-field full-width">
                <label for="description">Descripción / Antecedentes</label>
                <textarea 
                  id="description" 
                  name="description" 
                  [(ngModel)]="description" 
                  rows="4" 
                  placeholder="Escribe los detalles y motivos del trámite aquí..."
                  class="w-full form-textarea"
                ></textarea>
              </div>

              <!-- Sección: Datos del Solicitante -->
              <div class="section-title full-width">Información del Solicitante (Ciudadano u Oficina)</div>

              <div class="form-field">
                <label for="app-name">Nombre del Solicitante *</label>
                <input 
                  type="text" 
                  id="app-name" 
                  name="app-name" 
                  pInputText 
                  [(ngModel)]="applicantName" 
                  required 
                  placeholder="Ej. Juan Pérez"
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

            </div>

            <div class="form-actions">
              <p-button 
                type="submit" 
                label="Iniciar e Inscribir Trámite" 
                icon="pi pi-check" 
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
      font-size: 1.6rem;
      font-weight: 800;
      margin: 0;
      color: #ffffff;
    }
    :host ::ng-deep .btn-back {
      color: #94a3b8 !important;
      font-weight: 600 !important;
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
    .section-title {
      font-size: 1.05rem;
      font-weight: 700;
      color: #818cf8;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding-bottom: 0.5rem;
      margin-top: 1rem;
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
    .form-actions {
      margin-top: 2rem;
      display: flex;
      justify-content: flex-end;
    }
  `]
})
export class ProcedureCreateComponent implements OnInit {
  types: any[] = [];
  departments: any[] = [];
  deptUsers: any[] = [];
  priorities: string[] = ['BAJA', 'NORMAL', 'ALTA', 'URGENTE'];

  // Form Model fields
  subject = '';
  selectedType = null;
  selectedPriority = 'NORMAL';
  selectedDept = null;
  selectedUser = null;
  description = '';

  applicantName = '';
  applicantId = '';
  applicantEmail = '';
  applicantPhone = '';

  loading = false;

  constructor(
    private procedureService: ProcedureService,
    private catalogService: CatalogService,
    private departmentService: DepartmentService,
    private router: Router,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.loadCatalogTypes();
    this.loadDepartments();
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

  onDeptChange() {
    this.selectedUser = null;
    this.deptUsers = [];
    if (this.selectedDept) {
      this.departmentService.getDepartmentUsers(this.selectedDept).subscribe({
        next: (res) => this.deptUsers = res
      });
    }
  }

  onSubmit() {
    if (!this.subject || !this.selectedType || !this.selectedPriority || !this.selectedDept || !this.applicantName) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atención',
        detail: 'Por favor complete todos los campos obligatorios (*).'
      });
      return;
    }

    this.loading = true;
    const procedureObj = {
      subject: this.subject,
      description: this.description,
      priority: this.selectedPriority,
      applicantName: this.applicantName,
      applicantId: this.applicantId || null,
      applicantEmail: this.applicantEmail || null,
      applicantPhone: this.applicantPhone || null,
      typeId: this.selectedType,
      departmentId: this.selectedDept,
      assigneeId: this.selectedUser || null
    };

    this.procedureService.createProcedure(procedureObj).subscribe({
      next: () => {
        this.loading = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Iniciado',
          detail: 'El trámite ha sido registrado e inscrito correctamente.'
        });
        setTimeout(() => this.router.navigate(['/procedures']), 1000);
      },
      error: (err) => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error al registrar',
          detail: err.error?.error || 'No se pudo crear el trámite.'
        });
      }
    });
  }
}
