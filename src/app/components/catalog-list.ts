import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TableModule } from 'primeng/table';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { Toast } from 'primeng/toast';
import { Select } from 'primeng/select';
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
    Dialog,
    InputText,
    Toast,
    Select
  ],
  providers: [MessageService],
  template: `
    <div class="catalog-list-page animate-fade-in">
      <p-toast></p-toast>

      <div class="page-header">
        <div>
          <h1>Configuración General del Sistema</h1>
          <p>Gestiona áreas departamentales, roles, catálogos, archivo físico y formatos de impresión</p>
        </div>
      </div>

      <!-- Pestañas de Catálogos -->
      <div class="tabs-container">
        <button class="tab-btn" [class.active-tab]="activeTab === 'depts'" (click)="activeTab = 'depts'"><i class="pi pi-map"></i> Departamentos</button>
        <button class="tab-btn" [class.active-tab]="activeTab === 'roles'" (click)="activeTab = 'roles'"><i class="pi pi-key"></i> Roles</button>
        <button class="tab-btn" [class.active-tab]="activeTab === 'doctypes'" (click)="activeTab = 'doctypes'"><i class="pi pi-file"></i> Tipos de Doc</button>
        <button class="tab-btn" [class.active-tab]="activeTab === 'proctypes'" (click)="activeTab = 'proctypes'"><i class="pi pi-folder"></i> Tipos de Trámite</button>
        <button class="tab-btn" [class.active-tab]="activeTab === 'physical'" (click)="activeTab = 'physical'"><i class="pi pi-box"></i> Bodegas</button>
        <button class="tab-btn" [class.active-tab]="activeTab === 'format'" (click)="activeTab = 'format'"><i class="pi pi-sliders-h"></i> Formato de Hoja</button>
        <button class="tab-btn" [class.active-tab]="activeTab === 'periods'" (click)="activeTab = 'periods'"><i class="pi pi-calendar"></i> Periodos</button>
        <button class="tab-btn" [class.active-tab]="activeTab === 'exts'" (click)="activeTab = 'exts'"><i class="pi pi-file-excel"></i> Extensiones</button>
      </div>

      <div class="catalog-content-card">
        
        <!-- 1. DEPARTAMENTOS -->
        <div *ngIf="activeTab === 'depts'" class="catalog-pane">
          <div class="pane-header">
            <h3>Áreas Departamentales</h3>
            <button class="p-button p-button-primary p-button-sm" (click)="openNewDept()">
              <i class="pi pi-plus mr-1"></i> Crear Departamento
            </button>
          </div>
          <p-table [value]="departments" styleClass="p-datatable-sm custom-table">
            <ng-template pTemplate="header">
              <tr>
                <th>Nombre</th>
                <th>Descripción</th>
                <th style="width: 220px; text-align: center;">Acciones</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-d>
              <tr>
                <td class="font-semibold text-white">{{ d.name }}</td>
                <td>{{ d.description }}</td>
                <td>
                  <div class="action-buttons flex gap-2 justify-content-center">
                    <button class="p-button p-button-text p-button-sm p-button-info" (click)="openEditDept(d)">
                      <i class="pi pi-pencil mr-1"></i> Editar
                    </button>
                    <button class="p-button p-button-text p-button-sm p-button-danger" (click)="onDeleteDept(d.id)">
                      <i class="pi pi-trash mr-1"></i> Eliminar
                    </button>
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
            <button class="p-button p-button-primary p-button-sm" (click)="openNewRole()">
              <i class="pi pi-plus mr-1"></i> Crear Rol
            </button>
          </div>
          <p-table [value]="roles" styleClass="p-datatable-sm custom-table">
            <ng-template pTemplate="header">
              <tr>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Permisos</th>
                <th style="width: 220px; text-align: center;">Acciones</th>
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
                  <div class="action-buttons flex gap-2 justify-content-center">
                    <button class="p-button p-button-text p-button-sm p-button-info" (click)="openEditRole(r)">
                      <i class="pi pi-pencil mr-1"></i> Editar
                    </button>
                    <button class="p-button p-button-text p-button-sm p-button-danger" (click)="onDeleteRole(r.id)">
                      <i class="pi pi-trash mr-1"></i> Eliminar
                    </button>
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
            <button class="p-button p-button-primary p-button-sm" (click)="openNewDocType()">
              <i class="pi pi-plus mr-1"></i> Agregar Tipo
            </button>
          </div>
          <p-table [value]="docTypes" styleClass="p-datatable-sm custom-table">
            <ng-template pTemplate="header">
              <tr>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Estado</th>
                <th style="width: 150px; text-align: center;">Acciones</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-dt>
              <tr>
                <td class="font-semibold text-white">{{ dt.name }}</td>
                <td>{{ dt.description }}</td>
                <td>{{ dt.isActive ? 'Activo' : 'Inactivo' }}</td>
                <td>
                  <div class="action-buttons flex justify-content-center">
                    <button class="p-button p-button-text p-button-sm p-button-info" (click)="openEditDocType(dt)">
                      <i class="pi pi-pencil mr-1"></i> Editar
                    </button>
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
            <button class="p-button p-button-primary p-button-sm" (click)="openNewProcType()">
              <i class="pi pi-plus mr-1"></i> Agregar Flujo
            </button>
          </div>
          <p-table [value]="procTypes" styleClass="p-datatable-sm custom-table">
            <ng-template pTemplate="header">
              <tr>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Días Estimados</th>
                <th>Estado</th>
                <th style="width: 150px; text-align: center;">Acciones</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-pt>
              <tr>
                <td class="font-semibold text-white">{{ pt.name }}</td>
                <td>{{ pt.description }}</td>
                <td>{{ pt.estimatedDays }} días</td>
                <td>{{ pt.isActive ? 'Activo' : 'Inactivo' }}</td>
                <td>
                  <div class="action-buttons flex justify-content-center">
                    <button class="p-button p-button-text p-button-sm p-button-info" (click)="openEditProcType(pt)">
                      <i class="pi pi-pencil mr-1"></i> Editar
                    </button>
                  </div>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>

        <!-- 5. ARCHIVO FÍSICO / BODEGAS -->
        <div *ngIf="activeTab === 'physical'" class="catalog-pane animate-fade-in">
          <div class="pane-header">
            <h3>Bodegas Físicas (Almacenamiento)</h3>
            <button class="p-button p-button-primary p-button-sm" (click)="openNewWarehouse()">
              <i class="pi pi-plus mr-1"></i> Agregar Bodega
            </button>
          </div>
          <p-table [value]="warehouses" styleClass="p-datatable-sm custom-table">
            <ng-template pTemplate="header">
              <tr>
                <th>Nombre</th>
                <th>Ubicación</th>
                <th>Tipo</th>
                <th style="width: 180px; text-align: center;">Configurar</th>
                <th style="width: 220px; text-align: center;">Acciones</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-w>
              <tr>
                <td class="font-semibold text-white">{{ w.name }}</td>
                <td>{{ w.location }}</td>
                <td>{{ w.type }}</td>
                <td class="text-center">
                  <button class="p-button p-button-text p-button-sm p-button-info" (click)="openSectorsConfig(w)">
                    <i class="pi pi-plus mr-1"></i> Sectores/Estantes
                  </button>
                </td>
                <td>
                  <div class="action-buttons flex gap-2 justify-content-center">
                    <button class="p-button p-button-text p-button-sm p-button-info" (click)="openEditWarehouse(w)">
                      <i class="pi pi-pencil mr-1"></i> Editar
                    </button>
                    <button class="p-button p-button-text p-button-sm p-button-danger" (click)="onDeleteWarehouse(w.id)">
                      <i class="pi pi-trash mr-1"></i> Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>

        <!-- 6. FORMATO DE HOJA / MÁRGENES -->
        <div *ngIf="activeTab === 'format'" class="catalog-pane animate-fade-in">
          <div class="pane-header">
            <h3>Formato y Márgenes de Impresión (PDF)</h3>
          </div>
          <div class="format-layout-grid">
            <div class="sliders-panel">
              <div class="slider-field">
                <label>Margen Superior: {{ formatConfig.top }}px</label>
                <input type="range" min="10" max="150" [(ngModel)]="formatConfig.top" class="custom-slider" />
              </div>
              <div class="slider-field">
                <label>Margen Inferior: {{ formatConfig.bottom }}px</label>
                <input type="range" min="10" max="150" [(ngModel)]="formatConfig.bottom" class="custom-slider" />
              </div>
              <div class="slider-field">
                <label>Margen Izquierdo: {{ formatConfig.left }}px</label>
                <input type="range" min="10" max="150" [(ngModel)]="formatConfig.left" class="custom-slider" />
              </div>
              <div class="slider-field">
                <label>Margen Derecho: {{ formatConfig.right }}px</label>
                <input type="range" min="10" max="150" [(ngModel)]="formatConfig.right" class="custom-slider" />
              </div>
              <div class="slider-field">
                <label>Alto de Cabecera: {{ formatConfig.header }}px</label>
                <input type="range" min="20" max="200" [(ngModel)]="formatConfig.header" class="custom-slider" />
              </div>
              <div class="slider-field">
                <label>Alto de Pie de Página: {{ formatConfig.footer }}px</label>
                <input type="range" min="20" max="200" [(ngModel)]="formatConfig.footer" class="custom-slider" />
              </div>
              <button class="p-button p-button-success w-full mt-3" (click)="saveFormatConfig()">
                <i class="pi pi-save mr-2"></i> Guardar Configuración de Hoja
              </button>
            </div>
            
            <!-- Live Preview Mockup Sheet -->
            <div class="preview-panel">
              <div class="mock-sheet" [style.padding-top.px]="formatConfig.top" [style.padding-bottom.px]="formatConfig.bottom" [style.padding-left.px]="formatConfig.left" [style.padding-right.px]="formatConfig.right">
                <div class="mock-header" [style.height.px]="formatConfig.header">
                  <div class="mock-logo">G-DOC LOGO</div>
                  <div class="mock-subtitle">DISTRITO CHONE</div>
                </div>
                <div class="mock-body">
                  <h5>ASUNTO DEL DOCUMENTO</h5>
                  <p>Este es un mockup que simula la distribución física de los márgenes configurados en el generador de PDF institucional. A medida que se desplazan los sliders del panel de control, los márgenes de la hoja se actualizan de forma interactiva.</p>
                </div>
                <div class="mock-footer" [style.height.px]="formatConfig.footer">
                  <span>Página 1 de 1</span>
                  <span>Distrito Chone 2026 - Todos los derechos reservados.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 7. PERIODOS -->
        <div *ngIf="activeTab === 'periods'" class="catalog-pane animate-fade-in">
          <div class="pane-header">
            <h3>Periodos Institucionales</h3>
            <button class="p-button p-button-primary p-button-sm" (click)="openNewPeriod()">
              <i class="pi pi-plus mr-1"></i> Crear Periodo
            </button>
          </div>
          <p-table [value]="periods" styleClass="p-datatable-sm custom-table">
            <ng-template pTemplate="header">
              <tr>
                <th>Fecha de Inicio</th>
                <th>Fecha de Fin</th>
                <th>Estado</th>
                <th style="width: 220px; text-align: center;">Acciones</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-p>
              <tr>
                <td class="font-semibold text-white">{{ p.startDate | date:'shortDate' }}</td>
                <td>{{ p.endDate | date:'shortDate' }}</td>
                <td><span class="status-badge" [ngClass]="p.status === 'ACTIVO' ? 'badge-active' : 'badge-inactive'">{{ p.status }}</span></td>
                <td>
                  <div class="action-buttons flex gap-2 justify-content-center">
                    <button class="p-button p-button-text p-button-sm p-button-info" (click)="openEditPeriod(p)">
                      <i class="pi pi-pencil mr-1"></i> Editar
                    </button>
                    <button class="p-button p-button-text p-button-sm p-button-danger" (click)="onDeletePeriod(p.id)">
                      <i class="pi pi-trash mr-1"></i> Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>

        <!-- 8. EXTENSIONES PERMITIDAS -->
        <div *ngIf="activeTab === 'exts'" class="catalog-pane">
          <div class="pane-header">
            <h3>Extensiones de Archivos Permitidas</h3>
            <div class="add-ext-form">
              <input type="text" pInputText [(ngModel)]="newExtension" placeholder="Ej. .docx" class="p-inputtext-sm mr-2" />
              <button class="p-button p-button-primary p-button-sm" (click)="onAddExtension()">
                <i class="pi pi-plus mr-1"></i> Agregar Extensión
              </button>
            </div>
          </div>
          <p-table [value]="fileTypes" styleClass="p-datatable-sm custom-table">
            <ng-template pTemplate="header">
              <tr>
                <th>Extensión</th>
                <th>Estado</th>
                <th style="width: 150px; text-align: center;">Acción</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-ft>
              <tr>
                <td class="font-semibold text-white uppercase">{{ ft.extension }}</td>
                <td>{{ ft.isActive ? 'Permitida' : 'Restringida' }}</td>
                <td class="text-center">
                  <button 
                    class="p-button p-button-text p-button-sm" 
                    [class.p-button-success]="ft.isActive" 
                    [class.p-button-danger]="!ft.isActive" 
                    (click)="onToggleExtension(ft)"
                  >
                    <i class="pi" [ngClass]="ft.isActive ? 'pi-lock-open mr-1' : 'pi-lock mr-1'"></i> 
                    {{ ft.isActive ? 'Desactivar' : 'Activar' }}
                  </button>
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
          
          <div class="dialog-actions mt-4 flex justify-content-end gap-2">
            <button class="p-button p-button-text p-button-secondary" (click)="showDeptDialog = false">Cancelar</button>
            <button class="p-button p-button-primary" (click)="onSaveDept()">
              <i class="pi pi-check mr-1"></i> Guardar Departamento
            </button>
          </div>
        </div>
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
          
          <div class="dialog-actions mt-4 flex justify-content-end gap-2">
            <button class="p-button p-button-text p-button-secondary" (click)="showRoleDialog = false">Cancelar</button>
            <button class="p-button p-button-primary" (click)="onSaveRole()">
              <i class="pi pi-check mr-1"></i> Guardar Rol
            </button>
          </div>
        </div>
      </p-dialog>

      <!-- DIALOGO: CATEGORIA / DOCUMENTO -->
      <p-dialog [(visible)]="showDocTypeDialog" header="Categoría de Documento" [modal]="true" [style]="{width: '400px'}">
        <div class="form-vertical">
          <label>Nombre *</label>
          <input type="text" pInputText [(ngModel)]="docTypeName" class="w-full mb-3" />
          <label>Descripción</label>
          <input type="text" pInputText [(ngModel)]="docTypeDesc" class="w-full mb-3" />
          <label class="flex-row"><input type="checkbox" [(ngModel)]="docTypeActive" class="mr-2" /> Categoría Activa</label>
          
          <div class="dialog-actions mt-4 flex justify-content-end gap-2">
            <button class="p-button p-button-text p-button-secondary" (click)="showDocTypeDialog = false">Cancelar</button>
            <button class="p-button p-button-primary" (click)="onSaveDocType()">
              <i class="pi pi-check mr-1"></i> Guardar Categoría
            </button>
          </div>
        </div>
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
          
          <div class="dialog-actions mt-4 flex justify-content-end gap-2">
            <button class="p-button p-button-text p-button-secondary" (click)="showProcTypeDialog = false">Cancelar</button>
            <button class="p-button p-button-primary" (click)="onSaveProcType()">
              <i class="pi pi-check mr-1"></i> Guardar Flujo
            </button>
          </div>
        </div>
      </p-dialog>

      <!-- DIALOGO: BODEGA -->
      <p-dialog [(visible)]="showWhDialog" header="Guardar Bodega" [modal]="true" [style]="{width: '400px'}">
        <div class="form-vertical">
          <label>Nombre de la Bodega *</label>
          <input type="text" pInputText [(ngModel)]="whName" placeholder="Ej. Bodega General Chone" class="w-full mb-3" />
          <label>Ubicación *</label>
          <input type="text" pInputText [(ngModel)]="whLocation" placeholder="Ej. Planta Baja, Sector Sur" class="w-full mb-3" />
          <label>Tipo de Bodega *</label>
          <p-select [options]="['GENERAL', 'AREA']" [(ngModel)]="whType" placeholder="Tipo" styleClass="w-full" appendTo="body"></p-select>
          
          <div class="dialog-actions mt-4 flex justify-content-end gap-2">
            <button class="p-button p-button-text p-button-secondary" (click)="showWhDialog = false">Cancelar</button>
            <button class="p-button p-button-primary" (click)="onSaveWarehouse()">
              <i class="pi pi-check mr-1"></i> Guardar Bodega
            </button>
          </div>
        </div>
      </p-dialog>

      <!-- DIALOGO: SECTORES CONFIG (BODEGA SELECCIONADA) -->
      <p-dialog [(visible)]="showSectorsDialog" header="Sectores y Estantes" [modal]="true" [style]="{width: '550px'}" appendTo="body">
        <div class="form-vertical" *ngIf="selectedWh">
          <h4>Sectores de la Bodega: {{ selectedWh.name }}</h4>
          <div class="add-sector-row mb-3">
            <input type="text" pInputText [(ngModel)]="newSectorName" placeholder="Ej. Sector A" class="p-inputtext-sm mr-2" />
            <button class="p-button p-button-success p-button-sm" (click)="onAddSector()">
              <i class="pi pi-plus mr-1"></i> Agregar Sector
            </button>
          </div>
          <p-table [value]="selectedWh.sectors || []" styleClass="p-datatable-sm custom-table">
            <ng-template pTemplate="header">
              <tr>
                <th>Nombre del Sector</th>
                <th style="width: 150px; text-align: center;">Configurar</th>
                <th style="width: 120px; text-align: center;">Borrar</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-s>
              <tr>
                <td style="color: #1e293b; font-weight: 600;">{{ s.name }}</td>
                <td class="text-center">
                  <button class="p-button p-button-text p-button-sm p-button-info" (click)="openSectionsConfig(s)" title="Configurar Secciones de este Sector">
                    <i class="pi pi-plus mr-1"></i> Secciones
                  </button>
                </td>
                <td class="text-center">
                  <button class="p-button p-button-text p-button-danger p-button-sm" (click)="onDeleteSector(s.id)" title="Eliminar Sector">
                    <i class="pi pi-trash mr-1"></i> Eliminar
                  </button>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>
      </p-dialog>

      <p-dialog [(visible)]="showSectionsDialog" header="Secciones y Niveles" [modal]="true" [style]="{width: '500px'}" appendTo="body">
        <div class="form-vertical" *ngIf="selectedSector">
          <h4>Secciones de Sector: {{ selectedSector.name }}</h4>
          <div class="add-section-row mb-3">
            <input type="text" pInputText [(ngModel)]="newSectionName" placeholder="Ej. Sección 3" class="p-inputtext-sm mr-2" />
            <button class="p-button p-button-success p-button-sm" (click)="onAddSection()">
              <i class="pi pi-plus mr-1"></i> Agregar Sección
            </button>
          </div>
          <p-table [value]="selectedSector.sections || []" styleClass="p-datatable-sm custom-table">
            <ng-template pTemplate="header">
              <tr>
                <th>Nombre de la Sección</th>
                <th style="width: 120px; text-align: center;">Borrar</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-sec>
              <tr>
                <td style="color: #1e293b; font-weight: 600;">{{ sec.name }}</td>
                <td class="text-center">
                  <button class="p-button p-button-text p-button-danger p-button-sm" (click)="onDeleteSection(sec.id)" title="Eliminar Sección">
                    <i class="pi pi-trash mr-1"></i> Eliminar
                  </button>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>
      </p-dialog>

      <!-- DIALOGO: PERIODO -->
      <p-dialog [(visible)]="showPeriodDialog" header="Guardar Periodo" [modal]="true" [style]="{width: '400px'}">
        <div class="form-vertical">
          <label>Fecha de Inicio *</label>
          <input type="date" pInputText [(ngModel)]="periodStartDate" class="w-full mb-3" />
          <label>Fecha de Fin *</label>
          <input type="date" pInputText [(ngModel)]="periodEndDate" class="w-full mb-3" />
          <label>Estado</label>
          <p-select [options]="['ACTIVO', 'INACTIVO']" [(ngModel)]="periodStatus" placeholder="Estado" styleClass="w-full" appendTo="body"></p-select>
          
          <div class="dialog-actions mt-4 flex justify-content-end gap-2">
            <button class="p-button p-button-text p-button-secondary" (click)="showPeriodDialog = false">Cancelar</button>
            <button class="p-button p-button-primary" (click)="onSavePeriod()">
              <i class="pi pi-check mr-1"></i> Guardar Periodo
            </button>
          </div>
        </div>
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
      overflow-x: auto;
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
      white-space: nowrap;
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

    /* Live pre-visualization format panel grid */
    .format-layout-grid {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 2rem;
      align-items: start;
    }
    .sliders-panel {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      background: rgba(30, 41, 59, 0.3);
      padding: 1.5rem;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }
    .slider-field {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .slider-field label {
      font-size: 0.85rem;
      font-weight: 600;
      color: #cbd5e1;
    }
    .custom-slider {
      width: 100%;
      cursor: pointer;
      accent-color: #6366f1;
    }
    .preview-panel {
      display: flex;
      justify-content: center;
    }
    .mock-sheet {
      width: 320px;
      height: 440px;
      background: #ffffff;
      color: #1e293b;
      border-radius: 6px;
      box-shadow: var(--shadow-premium);
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      position: relative;
    }
    .mock-header {
      border-bottom: 2px solid #cbd5e1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-size: 0.6rem;
      font-weight: 700;
      color: #64748b;
    }
    .mock-logo {
      font-size: 0.85rem;
      font-weight: 800;
      color: #3b82f6;
    }
    .mock-body {
      flex: 1;
      padding: 1rem 0;
      font-size: 0.55rem;
      line-height: 1.4;
    }
    .mock-body h5 {
      margin: 0 0 0.5rem 0;
      font-size: 0.7rem;
      font-weight: 800;
      color: #0f172a;
    }
    .mock-footer {
      border-top: 1px solid #cbd5e1;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.5rem;
      color: #94a3b8;
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
      max-width: 300px;
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
    :host ::ng-deep .form-vertical input[type="number"],
    :host ::ng-deep .form-vertical input[type="date"] {
      background: rgba(15, 23, 42, 0.6) !important;
      border: 1px solid rgba(255, 255, 255, 0.1) !important;
      color: #f8fafc !important;
      border-radius: 8px !important;
      padding: 0.5rem 0.8rem !important;
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
    .status-badge {
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.1rem 0.4rem;
      border-radius: 4px;
      text-transform: uppercase;
    }
    .badge-active { background: rgba(34, 197, 94, 0.15); color: #4ade80; }
    .badge-inactive { background: rgba(239, 68, 68, 0.15); color: #f87171; }
    
    .font-semibold { font-weight: 600; }
    .font-mono { font-family: 'Courier New', Courier, monospace; }
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
  warehouses: any[] = [];
  periods: any[] = [];

  // Form formats/margins config (default values)
  formatConfig = {
    top: 50,
    bottom: 50,
    left: 40,
    right: 40,
    header: 80,
    footer: 50
  };

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
    'procedures.create',
    'procedures.manage',
    'documents.view',
    'documents.create',
    'catalogs.manage',
    'users.view',
    'users.manage',
    'all'
  ];

  // 3. Category Forms
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

  // 6. Warehouses Forms
  showWhDialog = false;
  whId: string | null = null;
  whName = '';
  whLocation = '';
  whType = 'GENERAL';

  // Sectors configure
  showSectorsDialog = false;
  selectedWh: any = null;
  newSectorName = '';

  // Sections configure
  showSectionsDialog = false;
  selectedSector: any = null;
  newSectionName = '';

  // 7. Periods Forms
  showPeriodDialog = false;
  periodId: string | null = null;
  periodStartDate = '';
  periodEndDate = '';
  periodStatus = 'ACTIVO';

  constructor(
    private departmentService: DepartmentService,
    private roleService: RoleService,
    private catalogService: CatalogService,
    private http: HttpClient,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadDepartments();
    this.loadRoles();
    this.loadDocTypes();
    this.loadProcTypes();
    this.loadFileTypes();
    this.loadWarehouses();
    this.loadPeriods();
    this.loadFormatConfig();
  }

  // --- API LOADERS ---
  loadDepartments() {
    this.departmentService.getDepartments().subscribe({ next: (res) => { this.departments = res; this.cdr.detectChanges(); } });
  }
  loadRoles() {
    this.roleService.getRoles().subscribe({ next: (res) => { this.roles = res; this.cdr.detectChanges(); } });
  }
  loadDocTypes() {
    this.catalogService.getDocumentTypes().subscribe({ next: (res) => { this.docTypes = res; this.cdr.detectChanges(); } });
  }
  loadProcTypes() {
    this.catalogService.getProcedureTypes().subscribe({ next: (res) => { this.procTypes = res; this.cdr.detectChanges(); } });
  }
  loadFileTypes() {
    this.catalogService.getFileTypes().subscribe({ next: (res: any) => { this.fileTypes = res; this.cdr.detectChanges(); } });
  }
  loadWarehouses() {
    this.http.get<any[]>('http://localhost:3001/api/archives/warehouses').subscribe({ next: (res) => { this.warehouses = res; this.cdr.detectChanges(); } });
  }
  loadPeriods() {
    this.http.get<any[]>('http://localhost:3001/api/archives/periods').subscribe({ next: (res) => { this.periods = res; this.cdr.detectChanges(); } });
  }
  loadFormatConfig() {
    this.http.get<any>('http://localhost:3001/api/config').subscribe({
      next: (res) => {
        if (res && res.margins) {
          this.formatConfig = res.margins;
          this.cdr.detectChanges();
        }
      }
    });
  }

  // --- CRUD: DEPARTAMENTOS ---
  openNewDept() {
    this.deptId = null; this.deptName = ''; this.deptDesc = ''; this.showDeptDialog = true;
  }
  openEditDept(d: any) {
    this.deptId = d.id; this.deptName = d.name; this.deptDesc = d.description || ''; this.showDeptDialog = true;
  }
  onSaveDept() {
    if (!this.deptName) return;
    const body = { name: this.deptName, description: this.deptDesc };
    if (this.deptId) {
      this.departmentService.updateDepartment(this.deptId, body).subscribe({
        next: () => { this.showDeptDialog = false; this.loadDepartments(); this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Departamento modificado.' }); }
      });
    } else {
      this.departmentService.createDepartment(body).subscribe({
        next: () => { this.showDeptDialog = false; this.loadDepartments(); this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Departamento creado.' }); }
      });
    }
  }
  onDeleteDept(id: string) {
    this.departmentService.deleteDepartment(id).subscribe({
      next: () => { this.loadDepartments(); this.messageService.add({ severity: 'warn', summary: 'Removido', detail: 'Departamento eliminado.' }); }
    });
  }

  // --- CRUD: ROLES ---
  openNewRole() {
    this.roleId = null; this.roleName = ''; this.roleDesc = ''; this.rolePerms = []; this.showRoleDialog = true;
  }
  openEditRole(r: any) {
    this.roleId = r.id; this.roleName = r.name; this.roleDesc = r.description || ''; this.rolePerms = r.permissions || []; this.showRoleDialog = true;
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
        next: () => { this.showRoleDialog = false; this.loadRoles(); this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Rol modificado.' }); }
      });
    } else {
      this.roleService.createRole(body).subscribe({
        next: () => { this.showRoleDialog = false; this.loadRoles(); this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Rol creado.' }); }
      });
    }
  }
  onDeleteRole(id: string) {
    this.roleService.deleteRole(id).subscribe({
      next: () => { this.loadRoles(); this.messageService.add({ severity: 'warn', summary: 'Removido', detail: 'Rol eliminado.' }); }
    });
  }

  // --- CRUD: TIPOS DE DOCUMENTO ---
  openNewDocType() {
    this.docTypeId = null; this.docTypeName = ''; this.docTypeDesc = ''; this.docTypeActive = true; this.showDocTypeDialog = true;
  }
  openEditDocType(dt: any) {
    this.docTypeId = dt.id; this.docTypeName = dt.name; this.docTypeDesc = dt.description || ''; this.docTypeActive = dt.isActive; this.showDocTypeDialog = true;
  }
  onSaveDocType() {
    if (!this.docTypeName) return;
    const body = { name: this.docTypeName, description: this.docTypeDesc, isActive: this.docTypeActive };
    if (this.docTypeId) {
      this.catalogService.updateDocumentType(this.docTypeId, body).subscribe({
        next: () => { this.showDocTypeDialog = false; this.loadDocTypes(); this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Tipo de documento modificado.' }); }
      });
    } else {
      this.catalogService.createDocumentType(body).subscribe({
        next: () => { this.showDocTypeDialog = false; this.loadDocTypes(); this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Tipo de documento creado.' }); }
      });
    }
  }

  // --- CRUD: TIPOS DE TRÁMITE ---
  openNewProcType() {
    this.procTypeId = null; this.procTypeName = ''; this.procTypeDesc = ''; this.procTypeDays = 3; this.procTypeActive = true; this.showProcTypeDialog = true;
  }
  openEditProcType(pt: any) {
    this.procTypeId = pt.id; this.procTypeName = pt.name; this.procTypeDesc = pt.description || ''; this.procTypeDays = pt.estimatedDays; this.procTypeActive = pt.isActive; this.showProcTypeDialog = true;
  }
  onSaveProcType() {
    if (!this.procTypeName) return;
    const body = { name: this.procTypeName, description: this.procTypeDesc, estimatedDays: this.procTypeDays, isActive: this.procTypeActive };
    if (this.procTypeId) {
      this.catalogService.updateProcedureType(this.procTypeId, body).subscribe({
        next: () => { this.showProcTypeDialog = false; this.loadProcTypes(); this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Tipo de trámite modificado.' }); }
      });
    } else {
      this.catalogService.createProcedureType(body).subscribe({
        next: () => { this.showProcTypeDialog = false; this.loadProcTypes(); this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Tipo de trámite creado.' }); }
      });
    }
  }

  // --- CRUD: BODEGAS, SECTORES Y SECCIONES ---
  openNewWarehouse() {
    this.whId = null; this.whName = ''; this.whLocation = ''; this.whType = 'GENERAL'; this.showWhDialog = true;
  }
  openEditWarehouse(w: any) {
    this.whId = w.id; this.whName = w.name; this.whLocation = w.location; this.whType = w.type; this.showWhDialog = true;
  }
  onSaveWarehouse() {
    if (!this.whName || !this.whLocation) return;
    const body = { name: this.whName, location: this.whLocation, type: this.whType };
    if (this.whId) {
      this.http.put(`http://localhost:3001/api/archives/warehouses/${this.whId}`, body).subscribe({
        next: () => { this.showWhDialog = false; this.loadWarehouses(); this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Bodega modificada.' }); }
      });
    } else {
      this.http.post('http://localhost:3001/api/archives/warehouses', body).subscribe({
        next: () => { this.showWhDialog = false; this.loadWarehouses(); this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Bodega registrada.' }); }
      });
    }
  }
  onDeleteWarehouse(id: string) {
    this.http.delete(`http://localhost:3001/api/archives/warehouses/${id}`).subscribe({
      next: () => { this.loadWarehouses(); this.messageService.add({ severity: 'warn', summary: 'Removida', detail: 'Bodega física eliminada.' }); }
    });
  }

  openSectorsConfig(w: any) {
    this.selectedWh = w;
    this.newSectorName = '';
    this.showSectorsDialog = true;
  }
  onAddSector() {
    if (!this.newSectorName || !this.selectedWh) return;
    const body = { name: this.newSectorName, warehouseId: this.selectedWh.id };
    this.http.post('http://localhost:3001/api/archives/sectors', body).subscribe({
      next: () => {
        this.newSectorName = '';
        this.messageService.add({ severity: 'success', summary: 'Sector Guardado', detail: 'Sector agregado a bodega.' });
        this.loadWarehouses();
        // Recargar diálogo
        setTimeout(() => {
          this.selectedWh = this.warehouses.find(w => w.id === this.selectedWh.id);
        }, 300);
      }
    });
  }
  onDeleteSector(id: string) {
    this.http.delete(`http://localhost:3001/api/archives/sectors/${id}`).subscribe({
      next: () => {
        this.messageService.add({ severity: 'warn', summary: 'Removido', detail: 'Sector eliminado.' });
        this.loadWarehouses();
        setTimeout(() => {
          this.selectedWh = this.warehouses.find(w => w.id === this.selectedWh.id);
        }, 300);
      }
    });
  }

  openSectionsConfig(sector: any) {
    this.selectedSector = sector;
    this.newSectionName = '';
    this.showSectionsDialog = true;
  }
  onAddSection() {
    if (!this.newSectionName || !this.selectedSector) return;
    const body = { name: this.newSectionName, sectorId: this.selectedSector.id };
    this.http.post('http://localhost:3001/api/archives/sections', body).subscribe({
      next: () => {
        this.newSectionName = '';
        this.messageService.add({ severity: 'success', summary: 'Sección Guardada', detail: 'Nivel/Sección registrada.' });
        this.loadWarehouses();
        setTimeout(() => {
          // Recargar árbol
          const wh = this.warehouses.find(w => w.id === this.selectedWh.id);
          this.selectedSector = wh.sectors.find((s: any) => s.id === this.selectedSector.id);
        }, 300);
      }
    });
  }
  onDeleteSection(id: string) {
    this.http.delete(`http://localhost:3001/api/archives/sections/${id}`).subscribe({
      next: () => {
        this.messageService.add({ severity: 'warn', summary: 'Removido', detail: 'Sección eliminada.' });
        this.loadWarehouses();
        setTimeout(() => {
          const wh = this.warehouses.find(w => w.id === this.selectedWh.id);
          this.selectedSector = wh.sectors.find((s: any) => s.id === this.selectedSector.id);
        }, 300);
      }
    });
  }

  // --- CRUD: PERIODOS ---
  openNewPeriod() {
    this.periodId = null; this.periodStartDate = ''; this.periodEndDate = ''; this.periodStatus = 'ACTIVO'; this.showPeriodDialog = true;
  }
  openEditPeriod(p: any) {
    this.periodId = p.id;
    this.periodStartDate = p.startDate.split('T')[0];
    this.periodEndDate = p.endDate.split('T')[0];
    this.periodStatus = p.status;
    this.showPeriodDialog = true;
  }
  onSavePeriod() {
    if (!this.periodStartDate || !this.periodEndDate) return;
    const body = { startDate: this.periodStartDate, endDate: this.periodEndDate, status: this.periodStatus };
    if (this.periodId) {
      this.http.put(`http://localhost:3001/api/archives/periods/${this.periodId}`, body).subscribe({
        next: () => { this.showPeriodDialog = false; this.loadPeriods(); this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Periodo institucional actualizado.' }); }
      });
    } else {
      this.http.post('http://localhost:3001/api/archives/periods', body).subscribe({
        next: () => { this.showPeriodDialog = false; this.loadPeriods(); this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Periodo registrado.' }); }
      });
    }
  }
  onDeletePeriod(id: string) {
    this.http.delete(`http://localhost:3001/api/archives/periods/${id}`).subscribe({
      next: () => { this.loadPeriods(); this.messageService.add({ severity: 'warn', summary: 'Removido', detail: 'Periodo eliminado.' }); }
    });
  }

  // --- FORMAT CONFIG SAVE ---
  saveFormatConfig() {
    this.http.post('http://localhost:3001/api/config', { margins: this.formatConfig }).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'La distribución de hoja de plantillas PDF ha sido registrada.' });
      }
    });
  }

  // --- EXTENSIONES ---
  onAddExtension() {
    if (!this.newExtension.trim()) return;
    const ext = this.newExtension.trim().toLowerCase();
    this.catalogService.addFileType(ext).subscribe({
      next: () => { this.newExtension = ''; this.loadFileTypes(); this.messageService.add({ severity: 'success', summary: 'Agregada', detail: 'Extensión agregada.' }); },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'La extensión ya existe o no se pudo registrar.' })
    });
  }
  onToggleExtension(ft: any) {
    this.catalogService.toggleFileType(ft.id, !ft.isActive).subscribe({
      next: () => { this.loadFileTypes(); this.messageService.add({ severity: 'info', summary: 'Actualizada', detail: 'Estado de extensión modificado.' }); }
    });
  }
}
