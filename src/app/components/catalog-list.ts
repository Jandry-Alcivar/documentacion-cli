import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DepartmentService } from '../services/department.service.js';
import { RoleService } from '../services/role.service.js';
import { CatalogService } from '../services/catalog.service.js';

@Component({
  selector: 'app-catalog-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    Button,
    Dialog,
    InputText,
    Toast
  ],
  providers: [MessageService],
  template: `
    <div class="catalog-list-page animate-fade-in">
      <p-toast></p-toast>

      <div class="page-header">
        <div>
          <h1>Configuración General del Sistema</h1>
          <p>Gestiona áreas departamentales, roles institucionales, flujos de trámites y extensiones permitidas</p>
        </div>
      </div>

      <!-- Pestañas de Catálogos -->
      <div class="tabs-container">
        <button class="tab-btn" [class.active-tab]="activeTab === 'depts'" (click)="activeTab = 'depts'"><i class="pi pi-map"></i> Departamentos</button>
        <button class="tab-btn" [class.active-tab]="activeTab === 'roles'" (click)="activeTab = 'roles'"><i class="pi pi-key"></i> Roles e Id</button>
        <button class="tab-btn" [class.active-tab]="activeTab === 'doctypes'" (click)="activeTab = 'doctypes'"><i class="pi pi-file"></i> Tipos de Doc</button>
        <button class="tab-btn" [class.active-tab]="activeTab === 'proctypes'" (click)="activeTab = 'proctypes'"><i class="pi pi-folder"></i> Tipos de Trámite</button>
        <button class="tab-btn" [class.active-tab]="activeTab === 'exts'" (click)="activeTab = 'exts'"><i class="pi pi-file-excel"></i> Extensiones</button>
      </div>

      <div class="catalog-content-card">
        
        <!-- 1. DEPARTAMENTOS -->
        <div *ngIf="activeTab === 'depts'" class="catalog-pane">
          <div class="pane-header">
            <h3>Áreas Departamentales</h3>
            <button pButton label="Crear Departamento" icon="pi pi-plus" class="p-button-sm" (click)="openNewDept()"></button>
          </div>
          <p-table [value]="departments" styleClass="p-datatable-sm custom-table">
            <ng-template pTemplate="header">
              <tr>
                <th>Nombre</th>
                <th>Descripción</th>
                <th style="width: 120px; text-align: center;">Acciones</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-d>
              <tr>
                <td class="font-semibold text-white">{{ d.name }}</td>
                <td>{{ d.description }}</td>
                <td>
                  <div class="action-buttons">
                    <button pButton icon="pi pi-pencil" class="p-button-text p-button-sm p-button-info" (click)="openEditDept(d)"></button>
                    <button pButton icon="pi pi-trash" class="p-button-text p-button-sm p-button-danger" (click)="onDeleteDept(d.id)"></button>
                  </div>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>

        <!-- 2. ROLES -->
        <div *ngIf="activeTab === 'roles'" class="catalog-pane">
          <div class="pane-header">
            <h3>Roles de Acceso</h3>
            <button pButton label="Crear Rol" icon="pi pi-plus" class="p-button-sm" (click)="openNewRole()"></button>
          </div>
          <p-table [value]="roles" styleClass="p-datatable-sm custom-table">
            <ng-template pTemplate="header">
              <tr>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Permisos</th>
                <th style="width: 120px; text-align: center;">Acciones</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-r>
              <tr>
                <td class="font-semibold text-white">{{ r.name }}</td>
                <td>{{ r.description }}</td>
                <td class="perm-cell">
                  <span class="perm-token" *ngFor="let p of r.permissions">{{ p }}</span>
                </td>
                <td>
                  <div class="action-buttons">
                    <button pButton icon="pi pi-pencil" class="p-button-text p-button-sm p-button-info" (click)="openEditRole(r)"></button>
                    <button pButton icon="pi pi-trash" class="p-button-text p-button-sm p-button-danger" (click)="onDeleteRole(r.id)"></button>
                  </div>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>

        <!-- 3. TIPOS DE DOCUMENTO -->
        <div *ngIf="activeTab === 'doctypes'" class="catalog-pane">
          <div class="pane-header">
            <h3>Categorías de Archivo</h3>
            <button pButton label="Agregar Tipo" icon="pi pi-plus" class="p-button-sm" (click)="openNewDocType()"></button>
          </div>
          <p-table [value]="docTypes" styleClass="p-datatable-sm custom-table">
            <ng-template pTemplate="header">
              <tr>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Estado</th>
                <th style="width: 120px; text-align: center;">Acciones</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-dt>
              <tr>
                <td class="font-semibold text-white">{{ dt.name }}</td>
                <td>{{ dt.description }}</td>
                <td>{{ dt.isActive ? 'Activo' : 'Inactivo' }}</td>
                <td>
                  <div class="action-buttons">
                    <button pButton icon="pi pi-pencil" class="p-button-text p-button-sm p-button-info" (click)="openEditDocType(dt)"></button>
                  </div>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>

        <!-- 4. TIPOS DE TRÁMITE -->
        <div *ngIf="activeTab === 'proctypes'" class="catalog-pane">
          <div class="pane-header">
            <h3>Flujos de Trámite</h3>
            <button pButton label="Agregar Flujo" icon="pi pi-plus" class="p-button-sm" (click)="openNewProcType()"></button>
          </div>
          <p-table [value]="procTypes" styleClass="p-datatable-sm custom-table">
            <ng-template pTemplate="header">
              <tr>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Días Estimados</th>
                <th>Estado</th>
                <th style="width: 120px; text-align: center;">Acciones</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-pt>
              <tr>
                <td class="font-semibold text-white">{{ pt.name }}</td>
                <td>{{ pt.description }}</td>
                <td>{{ pt.estimatedDays }} días</td>
                <td>{{ pt.isActive ? 'Activo' : 'Inactivo' }}</td>
                <td>
                  <div class="action-buttons">
                    <button pButton icon="pi pi-pencil" class="p-button-text p-button-sm p-button-info" (click)="openEditProcType(pt)"></button>
                  </div>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>

        <!-- 5. EXTENSIONES PERMITIDAS -->
        <div *ngIf="activeTab === 'exts'" class="catalog-pane">
          <div class="pane-header">
            <h3>Extensiones de Archivos Permitidas</h3>
            <div class="add-ext-form">
              <input type="text" pInputText [(ngModel)]="newExtension" placeholder="Ej. .docx" class="p-inputtext-sm mr-2" />
              <button pButton label="Agregar" icon="pi pi-plus" class="p-button-sm" (click)="onAddExtension()"></button>
            </div>
          </div>
          <p-table [value]="fileTypes" styleClass="p-datatable-sm custom-table">
            <ng-template pTemplate="header">
              <tr>
                <th>Extensión</th>
                <th>Estado</th>
                <th style="width: 120px; text-align: center;">Acción</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-ft>
              <tr>
                <td class="font-semibold text-white uppercase">{{ ft.extension }}</td>
                <td>{{ ft.isActive ? 'Permitida' : 'Restringida' }}</td>
                <td class="text-center">
                  <p-button 
                    [icon]="ft.isActive ? 'pi pi-lock-open' : 'pi pi-lock'" 
                    [styleClass]="ft.isActive ? 'p-button-text p-button-success' : 'p-button-text p-button-danger'"
                    (click)="onToggleExtension(ft)"
                  ></p-button>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>

      </div>

      <!-- DIALOGO: DEPARTAMENTO -->
      <p-dialog [(visible)]="showDeptDialog" header="Guardar Departamento" [modal]="true" [style]="{width: '400px'}">
        <div class="form-vertical">
          <label>Nombre del Departamento *</label>
          <input type="text" pInputText [(ngModel)]="deptName" placeholder="Ej. Obras Públicas" class="w-full mb-3" />
          <label>Descripción</label>
          <input type="text" pInputText [(ngModel)]="deptDesc" placeholder="Descripción breve" class="w-full" />
        </div>
        <ng-template pTemplate="footer">
          <button pButton label="Guardar" icon="pi pi-check" (click)="onSaveDept()"></button>
        </ng-template>
      </p-dialog>

      <!-- DIALOGO: ROL -->
      <p-dialog [(visible)]="showRoleDialog" header="Guardar Rol y Permisos" [modal]="true" [style]="{width: '500px'}">
        <div class="form-vertical">
          <label>Nombre del Rol *</label>
          <input type="text" pInputText [(ngModel)]="roleName" placeholder="Ej. Auditor de Trámites" class="w-full mb-3" />
          <label>Descripción</label>
          <input type="text" pInputText [(ngModel)]="roleDesc" placeholder="Descripción" class="w-full mb-3" />
          <label>Permisos (Selecciona las claves requeridas):</label>
          <div class="permissions-checklist">
            <label *ngFor="let perm of availablePermissions" class="perm-check-row">
              <input type="checkbox" [checked]="rolePerms.includes(perm)" (change)="onTogglePerm(perm)" />
              <span>{{ perm }}</span>
            </label>
          </div>
        </div>
        <ng-template pTemplate="footer">
          <button pButton label="Guardar" icon="pi pi-check" (click)="onSaveRole()"></button>
        </ng-template>
      </p-dialog>

      <!-- DIALOGO: CATEGORIA / DOCUMENTO -->
      <p-dialog [(visible)]="showDocTypeDialog" header="Categoría de Documento" [modal]="true" [style]="{width: '400px'}">
        <div class="form-vertical">
          <label>Nombre *</label>
          <input type="text" pInputText [(ngModel)]="docTypeName" class="w-full mb-3" />
          <label>Descripción</label>
          <input type="text" pInputText [(ngModel)]="docTypeDesc" class="w-full mb-3" />
          <label class="flex-row"><input type="checkbox" [(ngModel)]="docTypeActive" class="mr-2" /> Categoría Activa</label>
        </div>
        <ng-template pTemplate="footer">
          <button pButton label="Guardar" icon="pi pi-check" (click)="onSaveDocType()"></button>
        </ng-template>
      </p-dialog>

      <!-- DIALOGO: TIPO DE TRÁMITE -->
      <p-dialog [(visible)]="showProcTypeDialog" header="Flujo de Trámite" [modal]="true" [style]="{width: '400px'}">
        <div class="form-vertical">
          <label>Nombre del Trámite *</label>
          <input type="text" pInputText [(ngModel)]="procTypeName" class="w-full mb-3" />
          <label>Descripción</label>
          <input type="text" pInputText [(ngModel)]="procTypeDesc" class="w-full mb-3" />
          <label>Días Estimados para Cierre *</label>
          <input type="number" pInputText [(ngModel)]="procTypeDays" class="w-full mb-3" />
          <label class="flex-row"><input type="checkbox" [(ngModel)]="procTypeActive" class="mr-2" /> Flujo Activo</label>
        </div>
        <ng-template pTemplate="footer">
          <button pButton label="Guardar" icon="pi pi-check" (click)="onSaveProcType()"></button>
        </ng-template>
      </p-dialog>

    </div>
  `,
  styles: [`
    .catalog-list-page {
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

    /* Tabs */
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

    /* Panel Content Card */
    .catalog-content-card {
      background: rgba(15, 23, 42, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 12px;
      padding: 1.5rem;
    }
    .pane-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.2rem;
    }
    .pane-header h3 {
      margin: 0;
      font-size: 1.1rem;
      color: #ffffff;
    }

    /* Tables */
    :host ::ng-deep .custom-table .p-datatable-thead > tr > th {
      background: #1e293b !important;
      color: #cbd5e1 !important;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
      font-weight: 600 !important;
    }
    :host ::ng-deep .custom-table .p-datatable-tbody > tr {
      background: transparent !important;
      color: #e2e8f0 !important;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
    }
    :host ::ng-deep .custom-table .p-datatable-tbody > tr:hover {
      background: rgba(255, 255, 255, 0.02) !important;
    }
    .action-buttons {
      display: flex;
      gap: 0.25rem;
      justify-content: center;
    }

    /* Roles layout */
    .perm-cell {
      max-width: 350px;
      display: flex;
      flex-wrap: wrap;
      gap: 0.3rem;
    }
    .perm-token {
      font-size: 0.7rem;
      font-weight: 600;
      color: #a5b4fc;
      background: rgba(99, 102, 241, 0.15);
      padding: 0.1rem 0.4rem;
      border-radius: 4px;
      border: 1px solid rgba(99, 102, 241, 0.2);
    }

    /* Add Extension Form */
    .add-ext-form {
      display: flex;
      align-items: center;
    }
    .mr-2 { margin-right: 0.5rem; }

    /* Dialog styling */
    .form-vertical {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      color: #cbd5e1;
    }
    .form-vertical label {
      font-size: 0.85rem;
      font-weight: 600;
    }
    :host ::ng-deep .form-vertical input[type="text"],
    :host ::ng-deep .form-vertical input[type="number"] {
      background: rgba(15, 23, 42, 0.6) !important;
      border: 1px solid rgba(255, 255, 255, 0.1) !important;
      color: #f8fafc !important;
      border-radius: 8px !important;
    }
    .mb-3 { margin-bottom: 0.8rem; }
    .flex-row {
      display: flex;
      flex-direction: row;
      align-items: center;
    }

    /* Checklist */
    .permissions-checklist {
      border: 1px solid rgba(255, 255, 255, 0.1);
      background: rgba(0, 0, 0, 0.2);
      border-radius: 8px;
      padding: 0.8rem;
      max-height: 200px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }
    .perm-check-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;
      cursor: pointer;
    }
    .font-semibold { font-weight: 600; }
    .text-white { color: #ffffff; }
    .text-center { text-align: center; }
  `]
})
export class CatalogListComponent implements OnInit {
  activeTab = 'depts';

  // Data arrays
  departments: any[] = [];
  roles: any[] = [];
  docTypes: any[] = [];
  procTypes: any[] = [];
  fileTypes: any[] = [];

  // 1. Department Forms
  showDeptDialog = false;
  deptId: string | null = null;
  deptName = '';
  deptDesc = '';

  // 2. Role Forms
  showRoleDialog = false;
  roleId: string | null = null;
  roleName = '';
  roleDesc = '';
  rolePerms: string[] = [];
  availablePermissions: string[] = [
    'all',
    'procedures.create',
    'procedures.manage',
    'documents.view',
    'documents.manage',
    'departments.manage',
    'roles.manage',
    'users.view',
    'users.manage',
    'system.manage',
    'catalogs.manage',
    'alerts.view',
    'audit-logs.view'
  ];

  // 3. DocType Forms
  showDocTypeDialog = false;
  docTypeId: string | null = null;
  docTypeName = '';
  docTypeDesc = '';
  docTypeActive = true;

  // 4. ProcType Forms
  showProcTypeDialog = false;
  procTypeId: string | null = null;
  procTypeName = '';
  procTypeDesc = '';
  procTypeDays = 3;
  procTypeActive = true;

  // 5. Extensions Forms
  newExtension = '';

  constructor(
    private departmentService: DepartmentService,
    private roleService: RoleService,
    private catalogService: CatalogService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.loadAll();
  }

  loadAll() {
    this.departmentService.getDepartments().subscribe({ next: (res) => this.departments = res });
    this.roleService.getRoles().subscribe({
      next: (res) => {
        this.roles = res.map(r => {
          let perms = [];
          try {
            perms = JSON.parse(r.permissions);
          } catch(e) {}
          return { ...r, permissions: perms };
        });
      }
    });
    this.catalogService.getDocumentTypes().subscribe({ next: (res) => this.docTypes = res });
    this.catalogService.getProcedureTypes().subscribe({ next: (res) => this.procTypes = res });
    this.catalogService.getFileTypes().subscribe({ next: (res) => this.fileTypes = res });
  }

  // --- DEPARTAMENTOS ---
  openNewDept() {
    this.deptId = null;
    this.deptName = '';
    this.deptDesc = '';
    this.showDeptDialog = true;
  }
  openEditDept(d: any) {
    this.deptId = d.id;
    this.deptName = d.name;
    this.deptDesc = d.description || '';
    this.showDeptDialog = true;
  }
  onSaveDept() {
    if (!this.deptName) return;
    const body = { name: this.deptName, description: this.deptDesc };
    if (this.deptId) {
      this.departmentService.updateDepartment(this.deptId, body).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Departamento modificado.' });
          this.showDeptDialog = false;
          this.loadAll();
        }
      });
    } else {
      this.departmentService.createDepartment(body).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Departamento creado.' });
          this.showDeptDialog = false;
          this.loadAll();
        }
      });
    }
  }
  onDeleteDept(id: string) {
    this.departmentService.deleteDepartment(id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Departamento removido.' });
        this.loadAll();
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.error || 'No se pudo eliminar.' });
      }
    });
  }

  // --- ROLES ---
  openNewRole() {
    this.roleId = null;
    this.roleName = '';
    this.roleDesc = '';
    this.rolePerms = [];
    this.showRoleDialog = true;
  }
  openEditRole(r: any) {
    this.roleId = r.id;
    this.roleName = r.name;
    this.roleDesc = r.description || '';
    this.rolePerms = r.permissions || [];
    this.showRoleDialog = true;
  }
  onTogglePerm(perm: string) {
    if (this.rolePerms.includes(perm)) {
      this.rolePerms = this.rolePerms.filter(p => p !== perm);
    } else {
      this.rolePerms.push(perm);
    }
  }
  onSaveRole() {
    if (!this.roleName) return;
    const body = { name: this.roleName, description: this.roleDesc, permissions: this.rolePerms };
    if (this.roleId) {
      this.roleService.updateRole(this.roleId, body).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Rol modificado.' });
          this.showRoleDialog = false;
          this.loadAll();
        }
      });
    } else {
      this.roleService.createRole(body).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Rol creado.' });
          this.showRoleDialog = false;
          this.loadAll();
        }
      });
    }
  }
  onDeleteRole(id: string) {
    this.roleService.deleteRole(id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Rol removido.' });
        this.loadAll();
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.error || 'No se pudo eliminar.' });
      }
    });
  }

  // --- TIPOS DE DOCUMENTO ---
  openNewDocType() {
    this.docTypeId = null;
    this.docTypeName = '';
    this.docTypeDesc = '';
    this.docTypeActive = true;
    this.showDocTypeDialog = true;
  }
  openEditDocType(dt: any) {
    this.docTypeId = dt.id;
    this.docTypeName = dt.name;
    this.docTypeDesc = dt.description || '';
    this.docTypeActive = dt.isActive;
    this.showDocTypeDialog = true;
  }
  onSaveDocType() {
    if (!this.docTypeName) return;
    const body = { name: this.docTypeName, description: this.docTypeDesc, isActive: this.docTypeActive };
    if (this.docTypeId) {
      this.catalogService.updateDocumentType(this.docTypeId, body).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Tipo de documento modificado.' });
          this.showDocTypeDialog = false;
          this.loadAll();
        }
      });
    } else {
      this.catalogService.createDocumentType(body).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Tipo de documento creado.' });
          this.showDocTypeDialog = false;
          this.loadAll();
        }
      });
    }
  }

  // --- TIPOS DE TRÁMITE ---
  openNewProcType() {
    this.procTypeId = null;
    this.procTypeName = '';
    this.procTypeDesc = '';
    this.procTypeDays = 3;
    this.procTypeActive = true;
    this.showProcTypeDialog = true;
  }
  openEditProcType(pt: any) {
    this.procTypeId = pt.id;
    this.procTypeName = pt.name;
    this.procTypeDesc = pt.description || '';
    this.procTypeDays = pt.estimatedDays;
    this.procTypeActive = pt.isActive;
    this.showProcTypeDialog = true;
  }
  onSaveProcType() {
    if (!this.procTypeName) return;
    const body = { name: this.procTypeName, description: this.procTypeDesc, estimatedDays: this.procTypeDays, isActive: this.procTypeActive };
    if (this.procTypeId) {
      this.catalogService.updateProcedureType(this.procTypeId, body).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Tipo de trámite modificado.' });
          this.showProcTypeDialog = false;
          this.loadAll();
        }
      });
    } else {
      this.catalogService.createProcedureType(body).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Tipo de trámite creado.' });
          this.showProcTypeDialog = false;
          this.loadAll();
        }
      });
    }
  }

  // --- EXTENSIONES ---
  onAddExtension() {
    if (!this.newExtension || !this.newExtension.startsWith('.')) {
      this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Debe iniciar con punto (ej. .pdf)' });
      return;
    }
    this.catalogService.addFileType(this.newExtension).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Agregado', detail: 'Nueva extensión permitida.' });
        this.newExtension = '';
        this.loadAll();
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.error || 'No se pudo agregar.' });
      }
    });
  }
  onToggleExtension(ft: any) {
    this.catalogService.toggleFileType(ft.id, !ft.isActive).subscribe({
      next: () => {
        this.messageService.add({ severity: 'info', summary: 'Actualizado', detail: 'Estado de extensión actualizado.' });
        this.loadAll();
      }
    });
  }
}
