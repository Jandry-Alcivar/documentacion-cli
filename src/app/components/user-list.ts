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
        <button 
          class="btn-create-user"
          (click)="openNew()"
        >
          <i class="pi pi-user-plus mr-1"></i> Nuevo Usuario
        </button>
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
              <td class="font-semibold text-dark">{{ u.name }}</td>
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
                  <button 
                    class="btn-action-icon text-blue" 
                    title="Editar"
                    (click)="openEdit(u)"
                  >
                    <i class="pi pi-user-edit"></i>
                  </button>
                  <button 
                    class="btn-action-icon text-red" 
                    title="Desactivar"
                    [disabled]="!u.isActive"
                    (click)="onDelete(u.id)"
                  >
                    <i class="pi pi-user-minus"></i>
                  </button>
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptystate">
            <tr>
              <td colspan="6" style="text-align: center; padding: 3rem; color: #94a3b8;">No hay usuarios registrados en el sistema.</td>
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
    .btn-create-user {
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
    .btn-create-user:hover {
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

    /* Badges */
    .status-badge {
      font-size: 0.72rem;
      font-weight: 700;
      padding: 0.2rem 0.55rem;
      border-radius: 6px;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }
    .badge-active { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
    .badge-inactive { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }

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
    .btn-action-icon:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .text-blue { color: #1d4ed8 !important; }
    .text-red { color: #b91c1c !important; }

    /* Form */
    .user-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 0.5rem 0;
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
    :host ::ng-deep .user-form input[type="text"],
    :host ::ng-deep .user-form input[type="email"],
    :host ::ng-deep .user-form input[type="password"] {
      background: #f8fafc !important;
      border: 1px solid #cbd5e1 !important;
      color: #0f172a !important;
      border-radius: 6px !important;
      height: 38px;
    }
    :host ::ng-deep .user-form .p-select {
      background: #f8fafc !important;
      border: 1px solid #cbd5e1 !important;
      border-radius: 6px !important;
      height: 38px;
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
