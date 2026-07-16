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
import { UserService } from '../services/user.service.js';
import { DepartmentService } from '../services/department.service.js';
import { RoleService } from '../services/role.service.js';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    Button,
    Dialog,
    InputText,
    Select,
    Toast
  ],
  providers: [MessageService],
  template: `
    <div class="user-list-page animate-fade-in">
      <p-toast></p-toast>

      <div class="page-header">
        <div>
          <h1>Control de Usuarios Institucionales</h1>
          <p>Crea, modifica e inactiva credenciales y asignaciones departamentales del personal</p>
        </div>
        <p-button 
          label="Nuevo Usuario" 
          icon="pi pi-user-plus" 
          styleClass="p-button-primary btn-create"
          (click)="openNew()"
        ></p-button>
      </div>

      <!-- Tabla de Usuarios -->
      <div class="table-card">
        <p-table [value]="users" [rows]="10" [paginator]="true" styleClass="p-datatable-sm custom-table">
          <ng-template pTemplate="header">
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Departamento</th>
              <th>Rol</th>
              <th style="width: 120px; text-align: center;">Estado</th>
              <th style="width: 120px; text-align: center;">Acciones</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-u>
            <tr>
              <td class="font-semibold text-white">{{ u.name }}</td>
              <td>{{ u.email }}</td>
              <td>{{ u.department?.name }}</td>
              <td>{{ u.role?.name }}</td>
              <td class="text-center">
                <span class="status-badge" [ngClass]="u.isActive ? 'badge-active' : 'badge-inactive'">
                  {{ u.isActive ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td>
                <div class="action-buttons">
                  <p-button 
                    icon="pi pi-user-edit" 
                    styleClass="p-button-rounded p-button-text p-button-info" 
                    title="Editar"
                    (click)="openEdit(u)"
                  ></p-button>
                  <p-button 
                    icon="pi pi-user-minus" 
                    styleClass="p-button-rounded p-button-text p-button-danger" 
                    title="Desactivar"
                    [disabled]="!u.isActive"
                    (click)="onDelete(u.id)"
                  ></p-button>
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptystate">
            <tr>
              <td colspan="6" style="text-align: center; padding: 3rem;">No hay usuarios registrados en el sistema.</td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <!-- DIALOGO: CREAR/EDITAR USUARIO -->
      <p-dialog 
        [header]="dialogHeader" 
        [(visible)]="showDialog" 
        [modal]="true" 
        [style]="{width: '450px'}"
      >
        <div class="user-form">
          <div class="form-field">
            <label for="name">Nombre Completo *</label>
            <input 
              type="text" 
              id="name" 
              [(ngModel)]="name" 
              pInputText 
              required 
              placeholder="Ej. Ing. María Zambrano"
              class="w-full"
            />
          </div>

          <div class="form-field">
            <label for="email">Correo Institucional *</label>
            <input 
              type="email" 
              id="email" 
              [(ngModel)]="email" 
              pInputText 
              required 
              placeholder="ejemplo@gob.gob"
              class="w-full"
            />
          </div>

          <div class="form-field">
            <label for="password">Contraseña {{ editingId ? '(Dejar vacío para mantener actual)' : '*' }}</label>
            <input 
              type="password" 
              id="password" 
              [(ngModel)]="password" 
              pInputText 
              placeholder="••••••••"
              class="w-full"
            />
          </div>

          <div class="form-field">
            <label for="department">Departamento *</label>
            <p-select 
              [options]="departments" 
              [(ngModel)]="selectedDept" 
              optionLabel="name" 
              optionValue="id"
              placeholder="Seleccionar Departamento"
              styleClass="w-full"
            ></p-select>
          </div>

          <div class="form-field">
            <label for="role">Rol Asignado *</label>
            <p-select 
              [options]="roles" 
              [(ngModel)]="selectedRole" 
              optionLabel="name" 
              optionValue="id"
              placeholder="Seleccionar Rol"
              styleClass="w-full"
            ></p-select>
          </div>

          <div class="form-field flex-row align-center" *ngIf="editingId">
            <label for="isActive" class="mr-2">¿Usuario Activo?</label>
            <input type="checkbox" id="isActive" [(ngModel)]="isActive" />
          </div>
        </div>

        <ng-template pTemplate="footer">
          <p-button label="Cancelar" icon="pi pi-times" styleClass="p-button-text" (click)="showDialog = false"></p-button>
          <p-button label="Guardar Usuario" icon="pi pi-check" styleClass="p-button-primary" (click)="onSave()"></p-button>
        </ng-template>
      </p-dialog>
    </div>
  `,
  styles: [`
    .user-list-page {
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

    /* Badges */
    .status-badge {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
    }
    .badge-active { background: rgba(34, 197, 94, 0.15); color: #4ade80; }
    .badge-inactive { background: rgba(239, 68, 68, 0.15); color: #f87171; }

    /* Actions */
    .action-buttons {
      display: flex;
      gap: 0.25rem;
      justify-content: center;
    }

    /* Form */
    .user-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 0.5rem 0;
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
    :host ::ng-deep .user-form input[type="text"],
    :host ::ng-deep .user-form input[type="email"],
    :host ::ng-deep .user-form input[type="password"] {
      background: rgba(15, 23, 42, 0.6) !important;
      border: 1px solid rgba(255, 255, 255, 0.1) !important;
      color: #f8fafc !important;
      border-radius: 8px !important;
    }
    :host ::ng-deep .user-form .p-dropdown {
      background: rgba(15, 23, 42, 0.6) !important;
      border: 1px solid rgba(255, 255, 255, 0.1) !important;
      border-radius: 8px !important;
    }
    :host ::ng-deep .user-form .p-dropdown .p-dropdown-label {
      color: #f8fafc !important;
    }
    .flex-row {
      display: flex;
      flex-direction: row !important;
    }
    .align-center {
      align-items: center;
    }
    .mr-2 { margin-right: 0.5rem; }
    .text-center { text-align: center; }
    .font-semibold { font-weight: 600; }
    .text-white { color: #ffffff; }
  `]
})
export class UserListComponent implements OnInit {
  users: any[] = [];
  departments: any[] = [];
  roles: any[] = [];

  // Form fields
  name = '';
  email = '';
  password = '';
  selectedDept = null;
  selectedRole = null;
  isActive = true;

  // Dialog management
  showDialog = false;
  editingId: string | null = null;
  dialogHeader = 'Registrar Nuevo Usuario';

  constructor(
    private userService: UserService,
    private departmentService: DepartmentService,
    private roleService: RoleService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadUsers();
    this.loadDepartments();
    this.loadRoles();
  }

  loadUsers() {
    this.userService.getUsers().subscribe({
      next: (res) => { this.users = res; this.cdr.detectChanges(); }
    });
  }

  loadDepartments() {
    this.departmentService.getDepartments().subscribe({
      next: (res) => { this.departments = res; this.cdr.detectChanges(); }
    });
  }

  loadRoles() {
    this.roleService.getRoles().subscribe({
      next: (res) => { this.roles = res.filter((r: any) => r.isActive); this.cdr.detectChanges(); }
    });
  }

  openNew() {
    this.editingId = null;
    this.name = '';
    this.email = '';
    this.password = '';
    this.selectedDept = null;
    this.selectedRole = null;
    this.isActive = true;
    this.dialogHeader = 'Registrar Nuevo Usuario';
    this.showDialog = true;
  }

  openEdit(u: any) {
    this.editingId = u.id;
    this.name = u.name;
    this.email = u.email;
    this.password = '';
    this.selectedDept = u.departmentId;
    this.selectedRole = u.roleId;
    this.isActive = u.isActive;
    this.dialogHeader = 'Editar Usuario';
    this.showDialog = true;
  }

  onSave() {
    if (!this.name || !this.email || (!this.editingId && !this.password) || !this.selectedDept || !this.selectedRole) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atención',
        detail: 'Por favor complete todos los campos obligatorios (*).'
      });
      return;
    }

    const userObj: any = {
      name: this.name,
      email: this.email,
      departmentId: this.selectedDept,
      roleId: this.selectedRole
    };

    if (this.password) {
      userObj.password = this.password;
    }

    if (this.editingId) {
      userObj.isActive = this.isActive;
      this.userService.updateUser(this.editingId, userObj).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Actualizado',
            detail: 'Usuario modificado correctamente.'
          });
          this.showDialog = false;
          this.loadUsers();
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err.error?.error || 'No se pudo guardar el usuario.'
          });
        }
      });
    } else {
      this.userService.createUser(userObj).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Creado',
            detail: 'Usuario registrado e invitado con éxito.'
          });
          this.showDialog = false;
          this.loadUsers();
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err.error?.error || 'No se pudo registrar el usuario.'
          });
        }
      });
    }
  }

  onDelete(id: string) {
    this.userService.deleteUser(id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Inactivado',
          detail: 'El usuario ha sido desactivado en el sistema.'
        });
        this.loadUsers();
      }
    });
  }
}
