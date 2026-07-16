import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Toast } from 'primeng/toast';
import { Dialog } from 'primeng/dialog';
import { MessageService, TreeNode } from 'primeng/api';
import { OrganizationChart } from 'primeng/organizationchart';
import { DepartmentService } from '../services/department.service.js';
import { CatalogService } from '../services/catalog.service.js';

@Component({
  selector: 'app-workflow-designer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputText,
    Select,
    Toast,
    Dialog,
    OrganizationChart
  ],
  providers: [MessageService],
  template: `
    <div class="workflow-designer-page animate-fade-in">
      <p-toast></p-toast>

      <div class="page-header">
        <div>
          <h1>Diseñador Visual de Flujos</h1>
          <p>Orquesta de forma gráfica la ruta departamental, tiempos límites y requisitos para cada trámite</p>
        </div>
        <div class="header-actions">
          <button class="p-button p-button-success" (click)="openCreateFlowDialog()">
            <i class="pi pi-plus mr-1"></i> Crear Flujo
          </button>
        </div>
      </div>

      <!-- Selector de Flujo -->
      <div class="flow-selector-card mb-3">
        <label class="font-semibold block mb-2">Seleccione el Flujo de Trámite a Diseñar:</label>
        <p-select 
          [options]="workflows" 
          [(ngModel)]="selectedFlowId" 
          optionLabel="name" 
          optionValue="id"
          placeholder="Seleccionar flujo institucional"
          styleClass="w-full form-dropdown"
          (onChange)="onFlowSelect()"
        ></p-select>
      </div>

      <!-- Lienzo Visual (Canvas) -->
      <div class="canvas-wrapper" *ngIf="selectedFlow">
        <div class="canvas-header">
          <div class="canvas-title-group">
            <h3>Diseño de Ruta: {{ selectedFlow.name }}</h3>
            <span class="save-status-badge"><i class="pi pi-cloud-upload"></i> Guardado Automático Activo</span>
          </div>
          <div class="canvas-actions">
            <button class="p-button p-button-sm p-button-info mr-2" (click)="openAddNodeDialog()">
              <i class="pi pi-plus-circle mr-1"></i> Agregar Nodo al Flujo
            </button>
            <button class="p-button p-button-sm p-button-danger p-button-outlined mr-2" *ngIf="selectedFlow.isActive" (click)="toggleFlowStatus(false)">
              <i class="pi pi-ban mr-1"></i> Desactivar Flujo
            </button>
            <button class="p-button p-button-sm p-button-success p-button-outlined mr-2" *ngIf="!selectedFlow.isActive" (click)="toggleFlowStatus(true)">
              <i class="pi pi-check mr-1"></i> Activar Flujo
            </button>
          </div>
        </div>

        <div class="chart-container">
          <p-organizationchart [value]="chartData" styleClass="custom-org-chart">
            <ng-template let-node pTemplate="default">
              <div class="node-box" [class.node-start]="node.data.isStart" [class.node-end]="node.data.isEnd">
                <div class="node-badge" *ngIf="node.data.isStart"><i class="pi pi-play-circle"></i> INICIO</div>
                <div class="node-badge" *ngIf="node.data.isEnd"><i class="pi pi-stop-circle"></i> FIN</div>
                
                <h4 class="node-name">{{ node.label }}</h4>
                <div class="node-dept"><i class="pi pi-map-marker"></i> {{ node.data.department?.name || 'Cargando...' }}</div>
                
                <div class="node-details">
                  <span><i class="pi pi-clock"></i> Máx: {{ node.data.maxHours }} hrs</span>
                  <span><i class="pi pi-file"></i> Req: {{ node.data.requiredDocTypes?.length || 0 }}</span>
                </div>

                <div class="node-actions mt-2">
                  <button class="p-button p-button-text p-button-sm p-button-info mr-1" (click)="openEditNodeDialog(node.data)" title="Editar Paso del Flujo">
                    <i class="pi pi-pencil"></i>
                  </button>
                  <button class="p-button p-button-text p-button-sm p-button-danger" (click)="deleteNode(node.data.id)" title="Eliminar Paso de la Ruta">
                    <i class="pi pi-trash"></i>
                  </button>
                </div>
              </div>
            </ng-template>
          </p-organizationchart>
        </div>
      </div>

      <!-- Diálogo: Crear Nuevo Flujo -->
      <p-dialog header="Crear Nuevo Flujo de Trámite" [(visible)]="showCreateFlowDialog" [modal]="true" [style]="{width: '500px'}">
        <div class="dialog-form">
          <div class="form-field mb-2">
            <label>Nombre del Flujo *</label>
            <input type="text" pInputText [(ngModel)]="newFlow.name" placeholder="Ej. Flujo de Certificación de Bienes" class="w-full" />
          </div>
          <div class="form-field mb-2">
            <label>Descripción</label>
            <input type="text" pInputText [(ngModel)]="newFlow.description" placeholder="Breve explicación del flujo..." class="w-full" />
          </div>
          <div class="form-field mb-3">
            <label>Tipo de Trámite Asociado *</label>
            <p-select [options]="procedureTypes" [(ngModel)]="newFlow.procedureTypeId" optionLabel="name" optionValue="id" placeholder="Asociar a trámite..." styleClass="w-full" appendTo="body"></p-select>
          </div>
          
          <div class="dialog-actions mt-4">
            <button class="p-button p-button-text p-button-secondary mr-2" (click)="showCreateFlowDialog = false">
              <i class="pi pi-times mr-1"></i> Cancelar
            </button>
            <button class="p-button p-button-success" [disabled]="!newFlow.name || !newFlow.procedureTypeId" (click)="createFlow()">
              <i class="pi pi-check mr-1"></i> Crear y Guardar Flujo
            </button>
          </div>
        </div>
      </p-dialog>

      <!-- Diálogo: Agregar / Editar Nodo -->
      <p-dialog [header]="editingNodeId ? 'Editar Nodo del Flujo' : 'Agregar Nodo al Flujo'" [(visible)]="showNodeDialog" [modal]="true" [style]="{width: '550px'}">
        <div class="dialog-form">
          <div class="form-field mb-2">
            <label>Nombre del Paso / Nodo *</label>
            <input type="text" pInputText [(ngModel)]="nodeForm.name" placeholder="Ej. Revisión Técnica" class="w-full" />
          </div>
          <div class="form-field mb-2">
            <label>Departamento Ejecutor *</label>
            <p-select [options]="departments" [(ngModel)]="nodeForm.departmentId" optionLabel="name" optionValue="id" placeholder="Seleccionar departamento" styleClass="w-full" appendTo="body"></p-select>
          </div>
          <div class="form-field mb-2">
            <label>Tiempo Máximo de Respuesta (Horas) *</label>
            <input type="number" pInputText [(ngModel)]="nodeForm.maxHours" class="w-full" />
          </div>
          <div class="form-field mb-2">
            <label>Tipo de Envío *</label>
            <p-select [options]="envioTypes" [(ngModel)]="nodeForm.typeEnvio" placeholder="Envío" styleClass="w-full" appendTo="body"></p-select>
          </div>
          <div class="flex-field-row mb-2">
            <div class="flex-align">
              <input type="checkbox" id="chk-start" [(ngModel)]="nodeForm.isStart" />
              <label for="chk-start" class="ml-2 font-semibold">¿Es el Nodo Inicial del Flujo?</label>
            </div>
            <div class="flex-align mt-2">
              <input type="checkbox" id="chk-end" [(ngModel)]="nodeForm.isEnd" />
              <label for="chk-end" class="ml-2 font-semibold">¿Es el Nodo Final (Cierre)?</label>
            </div>
          </div>
          
          <div class="dialog-actions mt-4">
            <button class="p-button p-button-text p-button-secondary mr-2" (click)="showNodeDialog = false">
              <i class="pi pi-times mr-1"></i> Cancelar
            </button>
            <button class="p-button p-button-primary" [disabled]="!nodeForm.name || !nodeForm.departmentId" (click)="saveNode()">
              <i class="pi pi-check mr-1"></i> Guardar Nodo en la Ruta
            </button>
          </div>
        </div>
      </p-dialog>
    </div>
  `,
  styles: [`
    .workflow-designer-page {
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
      color: #ffffff;
      margin: 0;
    }
    .page-header p {
      color: #94a3b8;
      font-size: 0.95rem;
      margin: 0.3rem 0 0;
    }

    .flow-selector-card {
      background: rgba(30, 41, 59, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.05);
      padding: 1.25rem;
      border-radius: 12px;
    }

    /* Canvas */
    .canvas-wrapper {
      background: rgba(15, 23, 42, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 12px;
      padding: 1.5rem;
    }
    .canvas-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding-bottom: 0.8rem;
      margin-bottom: 1.5rem;
    }
    .canvas-title-group {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .canvas-header h3 {
      margin: 0;
      color: #ffffff;
    }
    .save-status-badge {
      font-size: 0.75rem;
      color: #10b981;
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-weight: 600;
    }
    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
    }

    /* Org Chart Node Styling */
    .chart-container {
      display: flex;
      justify-content: center;
      overflow-x: auto;
      padding: 2rem 0;
    }
    .node-box {
      background: #1e293b;
      border: 2px solid #334155;
      padding: 1rem;
      border-radius: 10px;
      color: #ffffff;
      min-width: 180px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
      position: relative;
    }
    .node-start {
      border-color: #6366f1;
      background: rgba(99, 102, 241, 0.15);
    }
    .node-end {
      border-color: #22c55e;
      background: rgba(34, 197, 94, 0.15);
    }
    .node-badge {
      font-size: 0.65rem;
      font-weight: 800;
      padding: 0.1rem 0.3rem;
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.1);
      width: fit-content;
      margin-bottom: 0.4rem;
    }
    .node-start .node-badge { background: #6366f1; }
    .node-end .node-badge { background: #22c55e; }
    .node-name {
      margin: 0 0 0.25rem 0;
      font-size: 0.95rem;
      font-weight: 700;
    }
    .node-dept {
      font-size: 0.75rem;
      color: #94a3b8;
      margin-bottom: 0.5rem;
    }
    .node-details {
      display: flex;
      justify-content: space-between;
      font-size: 0.7rem;
      color: #64748b;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      padding-top: 0.4rem;
    }
    .node-actions {
      display: flex;
      justify-content: center;
      gap: 0.25rem;
    }

    /* Custom Org Chart connections override for premium look */
    ::ng-deep .custom-org-chart .p-organizationchart-line-down {
      background-color: #475569 !important;
    }
    ::ng-deep .custom-org-chart .p-organizationchart-line-left,
    ::ng-deep .custom-org-chart .p-organizationchart-line-right {
      border-color: #475569 !important;
    }
    ::ng-deep .custom-org-chart .p-organizationchart-line-top {
      border-color: #475569 !important;
    }

    /* Dialog field adjustments */
    .dialog-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
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
    .flex-align {
      display: flex;
      align-items: center;
    }
    .ml-2 { margin-left: 0.5rem; }
    .mr-2 { margin-right: 0.5rem; }
    .mt-2 { margin-top: 0.5rem; }
  `]
})
export class WorkflowDesignerComponent implements OnInit {
  workflows: any[] = [];
  procedureTypes: any[] = [];
  departments: any[] = [];
  envioTypes: string[] = ['PARA', 'COPIA'];

  selectedFlowId: string | null = null;
  selectedFlow: any = null;
  chartData: TreeNode[] = [];

  // Dialog states
  showCreateFlowDialog = false;
  showNodeDialog = false;

  newFlow = {
    name: '',
    description: '',
    procedureTypeId: ''
  };

  nodeForm = {
    name: '',
    departmentId: '',
    maxHours: 24,
    isStart: false,
    isEnd: false,
    requiredDocTypes: [] as string[],
    requiredActivities: [] as string[],
    typeEnvio: 'PARA'
  };

  editingNodeId: string | null = null;

  constructor(
    private http: HttpClient,
    private departmentService: DepartmentService,
    private catalogService: CatalogService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.loadWorkflows();
    this.loadProcedureTypes();
    this.loadDepartments();
  }

  loadWorkflows() {
    this.http.get<any[]>('http://localhost:3001/api/workflows').subscribe({
      next: (res) => this.workflows = res
    });
  }

  loadProcedureTypes() {
    this.catalogService.getProcedureTypes().subscribe({
      next: (res) => this.procedureTypes = res.filter(t => t.isActive)
    });
  }

  loadDepartments() {
    this.departmentService.getDepartments().subscribe({
      next: (res) => this.departments = res
    });
  }

  onFlowSelect() {
    if (this.selectedFlowId) {
      this.http.get<any>(`http://localhost:3001/api/workflows/${this.selectedFlowId}`).subscribe({
        next: (flow) => {
          this.selectedFlow = flow;
          this.buildChartData();
        }
      });
    } else {
      this.selectedFlow = null;
      this.chartData = [];
    }
  }

  buildChartData() {
    if (!this.selectedFlow || !this.selectedFlow.nodes || this.selectedFlow.nodes.length === 0) {
      this.chartData = [];
      return;
    }

    // Sort nodes linear order
    const sorted = [...this.selectedFlow.nodes].sort((a: any, b: any) => a.isStart ? -1 : b.isStart ? 1 : 0);

    const rootNode: TreeNode = {
      label: sorted[0].name,
      expanded: true,
      data: sorted[0],
      children: []
    };

    let current = rootNode;
    for (let i = 1; i < sorted.length; i++) {
      const nextNode: TreeNode = {
        label: sorted[i].name,
        expanded: true,
        data: sorted[i],
        children: []
      };
      current.children!.push(nextNode);
      current = nextNode;
    }

    this.chartData = [rootNode];
  }

  toggleFlowStatus(status: boolean) {
    if (!this.selectedFlow) return;
    this.http.put(`http://localhost:3001/api/workflows/${this.selectedFlow.id}`, { isActive: status }).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Estado Actualizado', detail: `El flujo ha sido ${status ? 'activado' : 'desactivado'}.` });
        this.loadWorkflows();
        this.onFlowSelect();
      }
    });
  }

  openCreateFlowDialog() {
    this.newFlow = { name: '', description: '', procedureTypeId: '' };
    this.showCreateFlowDialog = true;
  }

  createFlow() {
    this.http.post('http://localhost:3001/api/workflows', this.newFlow).subscribe({
      next: (res: any) => {
        this.showCreateFlowDialog = false;
        this.messageService.add({ severity: 'success', summary: 'Creado', detail: 'Flujo de trámite creado con éxito.' });
        this.loadWorkflows();
        this.selectedFlowId = res.id;
        this.onFlowSelect();
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.error || 'No se pudo crear.' });
      }
    });
  }

  openAddNodeDialog() {
    this.editingNodeId = null;
    this.nodeForm = {
      name: '',
      departmentId: '',
      maxHours: 24,
      isStart: false,
      isEnd: false,
      requiredDocTypes: [],
      requiredActivities: [],
      typeEnvio: 'PARA'
    };
    this.showNodeDialog = true;
  }

  openEditNodeDialog(node: any) {
    this.editingNodeId = node.id;
    this.nodeForm = {
      name: node.name,
      departmentId: node.departmentId,
      maxHours: node.maxHours,
      isStart: node.isStart,
      isEnd: node.isEnd,
      requiredDocTypes: node.requiredDocTypes || [],
      requiredActivities: node.requiredActivities || [],
      typeEnvio: node.typeEnvio || 'PARA'
    };
    this.showNodeDialog = true;
  }

  saveNode() {
    if (!this.selectedFlow) return;

    if (this.editingNodeId) {
      // Actualizar
      this.http.put(`http://localhost:3001/api/workflows/${this.selectedFlow.id}/nodes/${this.editingNodeId}`, this.nodeForm).subscribe({
        next: () => {
          this.showNodeDialog = false;
          this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: 'Nodo de flujo modificado.' });
          this.onFlowSelect();
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.error || 'No se pudo actualizar.' });
        }
      });
    } else {
      // Agregar
      this.http.post(`http://localhost:3001/api/workflows/${this.selectedFlow.id}/nodes`, this.nodeForm).subscribe({
        next: () => {
          this.showNodeDialog = false;
          this.messageService.add({ severity: 'success', summary: 'Agregado', detail: 'Nodo de flujo agregado al final.' });
          this.onFlowSelect();
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.error || 'No se pudo guardar.' });
        }
      });
    }
  }

  deleteNode(nodeId: string) {
    if (!this.selectedFlow) return;
    this.http.delete(`http://localhost:3001/api/workflows/${this.selectedFlow.id}/nodes/${nodeId}`).subscribe({
      next: () => {
        this.messageService.add({ severity: 'warn', summary: 'Eliminado', detail: 'El nodo ha sido removido de la ruta.' });
        this.onFlowSelect();
      }
    });
  }
}
