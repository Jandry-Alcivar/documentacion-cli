import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Toast } from 'primeng/toast';
import { Dialog } from 'primeng/dialog';
import { MessageService, TreeNode } from 'primeng/api';
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
    Dialog
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
            <div style="font-size: 0.85rem; color: #94a3b8; margin-top: 2px; display: flex; align-items: center; gap: 0.25rem;">
              <i class="pi pi-briefcase" style="color: #6366f1;"></i> 
              Trámite Relacionado: <strong style="color: #cbd5e1;">{{ selectedFlow.procedureType?.name || 'No especificado' }}</strong>
            </div>
            <span class="save-status-badge mt-1"><i class="pi pi-cloud-upload"></i> Guardado Automático Activo</span>
          </div>
          <div class="canvas-actions">
            <button class="p-button p-button-sm p-button-info mr-2" (click)="openAddNodeDialog()">
              <i class="pi pi-plus-circle mr-1"></i> Agregar Nodo al Flujo
            </button>
            <button class="p-button p-button-sm p-button-warning mr-2" (click)="openEditFlowDialog()">
              <i class="pi pi-pencil mr-1"></i> Editar Flujo
            </button>
            <button class="p-button p-button-sm p-button-danger mr-2" 
                    [disabled]="selectedFlow.inUse" 
                    [title]="selectedFlow.inUse ? 'No se puede eliminar porque ya tiene trámites' : 'Eliminar Flujo Completamente'"
                    (click)="deleteFlow()">
              <i class="pi pi-trash mr-1"></i> Eliminar Flujo
            </button>
            <button class="p-button p-button-sm p-button-danger p-button-outlined mr-2" *ngIf="selectedFlow.isActive" (click)="toggleFlowStatus(false)">
              <i class="pi pi-ban mr-1"></i> Desactivar Flujo
            </button>
            <button class="p-button p-button-sm p-button-success p-button-outlined mr-2" *ngIf="!selectedFlow.isActive" (click)="toggleFlowStatus(true)">
              <i class="pi pi-check mr-1"></i> Activar Flujo
            </button>
          </div>
        </div>

        <div class="canvas-toolbar">
          <span><i class="pi pi-arrows-alt"></i> Arrastre los nodos con el mouse para reorganizar el diagrama</span>
          <button class="p-button p-button-sm p-button-text" (click)="resetLayout()"><i class="pi pi-refresh mr-1"></i> Reordenar automáticamente</button>
        </div>
        <div class="flow-canvas" #canvas
             [style.height.px]="canvasHeight">
          <svg class="flow-links" [attr.width]="canvasWidth" [attr.height]="canvasHeight">
            <defs>
              <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
                <path d="M0,0 L10,5 L0,10 z" fill="#6366f1"></path>
              </marker>
            </defs>
            <path *ngFor="let l of links" [attr.d]="l" class="flow-link" marker-end="url(#arrow)"></path>
          </svg>

          <div *ngIf="orderedNodes.length === 0" class="empty-canvas">
            <i class="pi pi-sitemap"></i>
            <p>Este flujo aún no tiene nodos. Use “Agregar Nodo al Flujo”.</p>
          </div>

          <div *ngFor="let node of orderedNodes; let i = index"
               class="node-box"
               [class.node-start]="node.isStart" [class.node-end]="node.isEnd"
               [class.dragging]="dragId === node.id"
               [style.left.px]="pos[node.id]?.x" [style.top.px]="pos[node.id]?.y"
               (mousedown)="startDrag($event, node)">
            <div class="node-head">
              <span class="node-step">{{ i + 1 }}</span>
              <span class="node-badge start" *ngIf="node.isStart"><i class="pi pi-play"></i> INICIO</span>
              <span class="node-badge end" *ngIf="node.isEnd"><i class="pi pi-flag"></i> FIN</span>
            </div>
            <h4 class="node-name">{{ node.name }}</h4>
            <div class="node-dept"><i class="pi pi-building"></i> {{ node.department?.name || 'Sin departamento' }}</div>
            <div class="node-details">
              <span><i class="pi pi-clock"></i> {{ node.maxHours || 0 }} hrs</span>
              <span><i class="pi pi-file"></i> Req: {{ node.requiredDocTypes?.length || 0 }}</span>
              <span><i class="pi pi-send"></i> {{ node.typeEnvio || 'PARA' }}</span>
            </div>
            <div class="node-actions">
              <button class="icon-btn edit" (mousedown)="$event.stopPropagation()" (click)="openEditNodeDialog(node)" title="Editar"><i class="pi pi-pencil"></i></button>
              <button class="icon-btn del" (mousedown)="$event.stopPropagation()" (click)="deleteNode(node.id)" title="Eliminar"><i class="pi pi-trash"></i></button>
            </div>
          </div>
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

      <!-- Diálogo: Editar Flujo Existente -->
      <p-dialog header="Editar Flujo de Trámite" [(visible)]="showEditFlowDialog" [modal]="true" [style]="{width: '500px'}">
        <div class="dialog-form">
          <div class="form-field mb-2">
            <label>Nombre del Flujo *</label>
            <input type="text" pInputText [(ngModel)]="editFlowForm.name" placeholder="Nombre del flujo..." class="w-full" />
          </div>
          <div class="form-field mb-2">
            <label>Descripción</label>
            <input type="text" pInputText [(ngModel)]="editFlowForm.description" placeholder="Descripción..." class="w-full" />
          </div>
          <div class="form-field mb-3">
            <label>Tipo de Trámite Asociado *</label>
            <p-select [options]="procedureTypes" [(ngModel)]="editFlowForm.procedureTypeId" optionLabel="name" optionValue="id" placeholder="Asociar a trámite..." styleClass="w-full" appendTo="body"></p-select>
          </div>
          
          <div class="dialog-actions mt-4">
            <button class="p-button p-button-text p-button-secondary mr-2" (click)="showEditFlowDialog = false">
              <i class="pi pi-times mr-1"></i> Cancelar
            </button>
            <button class="p-button p-button-primary" [disabled]="!editFlowForm.name || !editFlowForm.procedureTypeId" (click)="updateFlow()">
              <i class="pi pi-check mr-1"></i> Guardar Cambios
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
          <div class="form-field mb-2">
            <label>Tipo de Documento Oficial Requerido para este Paso</label>
            <p-select 
              [options]="allDocTypes" 
              [(ngModel)]="selectedRequiredDocType" 
              optionLabel="name" 
              optionValue="id" 
              placeholder="Seleccionar tipo de documento requerido" 
              styleClass="w-full" 
              appendTo="body"
              (onChange)="onRequiredDocTypeChange()"
            ></p-select>
            <small class="text-muted block mt-1" *ngIf="nodeForm.requiredDocTypes && nodeForm.requiredDocTypes.length > 0">
              Documento obligatorio asignado al paso.
            </small>
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
    .workflow-designer-page { display: flex; flex-direction: column; gap: 1.25rem; font-family: 'Inter', system-ui, sans-serif; color: #0f172a; }
    .page-header { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; border-radius: 14px;
      background: linear-gradient(135deg, #1e3a8a 0%, #4f46e5 60%, #7c3aed 100%); box-shadow: 0 10px 25px -10px rgba(79,70,229,.55); }
    .page-header h1 { font-size: 1.6rem; font-weight: 800; color: #fff; margin: 0; }
    .page-header p { color: #e0e7ff; font-size: .92rem; margin: .3rem 0 0; }

    .flow-selector-card { background: #fff; border: 1px solid #e2e8f0; padding: 1.25rem; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,.05); }
    .flow-selector-card label { color: #1e293b; }

    .canvas-wrapper { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 1.5rem; box-shadow: 0 4px 12px rgba(15,23,42,.06); }
    .canvas-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;
      border-bottom: 1px solid #e2e8f0; padding-bottom: 1rem; margin-bottom: 1rem; }
    .canvas-title-group { display: flex; flex-direction: column; gap: .25rem; }
    .canvas-header h3 { margin: 0; color: #0f172a; font-weight: 800; }
    .canvas-title-group > div { color: #475569 !important; }
    .canvas-title-group strong { color: #1e293b !important; }
    .canvas-actions { display: flex; flex-wrap: wrap; gap: .4rem; }
    .save-status-badge { font-size: .75rem; color: #047857; display: flex; align-items: center; gap: .25rem; font-weight: 700; }
    .dialog-actions { display: flex; justify-content: flex-end; gap: .5rem; }

    .canvas-toolbar { display: flex; justify-content: space-between; align-items: center; font-size: .82rem; color: #475569; margin-bottom: .6rem; }
    .canvas-toolbar i { color: #4f46e5; }

    .flow-canvas { position: relative; overflow: auto; min-height: 420px; border-radius: 12px; border: 1px dashed #c7d2fe;
      background-color: #f8fafc;
      background-image: radial-gradient(#cbd5e1 1px, transparent 1px); background-size: 20px 20px; user-select: none; }
    .flow-links { position: absolute; top: 0; left: 0; pointer-events: none; }
    .flow-link { fill: none; stroke: #6366f1; stroke-width: 2.5; stroke-dasharray: 6 4; animation: dash 1s linear infinite; }
    @keyframes dash { to { stroke-dashoffset: -20; } }
    .empty-canvas { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #64748b; }
    .empty-canvas i { font-size: 2.5rem; color: #a5b4fc; }

    .node-box { position: absolute; width: 230px; background: #fff; border: 2px solid #cbd5e1; border-left: 6px solid #3b82f6;
      border-radius: 12px; padding: .8rem .9rem; color: #0f172a; cursor: grab;
      box-shadow: 0 6px 16px -6px rgba(15,23,42,.18); transition: box-shadow .2s; will-change: left, top; }
    .node-box:hover { box-shadow: 0 12px 24px -8px rgba(79,70,229,.35); }
    .node-box.dragging { cursor: grabbing; outline: 3px solid #a5b4fc; box-shadow: 0 18px 30px -10px rgba(79,70,229,.5); z-index: 10; transition: none; }
    .node-start { border-left-color: #4f46e5; background: linear-gradient(180deg, #eef2ff, #fff); }
    .node-end { border-left-color: #059669; background: linear-gradient(180deg, #ecfdf5, #fff); }
    .node-head { display: flex; align-items: center; gap: .4rem; margin-bottom: .35rem; }
    .node-step { width: 22px; height: 22px; border-radius: 50%; background: #1e293b; color: #fff; font-size: .72rem; font-weight: 800;
      display: inline-flex; align-items: center; justify-content: center; }
    .node-badge { font-size: .65rem; font-weight: 800; padding: .15rem .45rem; border-radius: 999px; color: #fff; display: inline-flex; gap: .25rem; align-items: center; }
    .node-badge.start { background: #4f46e5; }
    .node-badge.end { background: #059669; }
    .node-name { margin: 0 0 .25rem; font-size: 1rem; font-weight: 800; color: #0f172a; }
    .node-dept { font-size: .8rem; color: #334155; font-weight: 600; margin-bottom: .5rem; display: flex; gap: .3rem; align-items: center; }
    .node-dept i { color: #4f46e5; }
    .node-details { display: flex; justify-content: space-between; font-size: .72rem; color: #475569; font-weight: 600;
      border-top: 1px solid #e2e8f0; padding-top: .45rem; }
    .node-actions { display: flex; justify-content: flex-end; gap: .35rem; margin-top: .55rem; }
    .icon-btn { width: 30px; height: 30px; border-radius: 8px; border: 1px solid transparent; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; }
    .icon-btn.edit { background: #eff6ff; color: #1d4ed8; border-color: #bfdbfe; }
    .icon-btn.del { background: #fef2f2; color: #b91c1c; border-color: #fecaca; }
    .icon-btn:hover { filter: brightness(.95); }

    .dialog-form { display: flex; flex-direction: column; gap: 1rem; color: #1e293b; }
    .form-field { display: flex; flex-direction: column; gap: .4rem; }
    .form-field label { font-size: .85rem; font-weight: 600; }
    .flex-align { display: flex; align-items: center; }
    .ml-2 { margin-left: .5rem; }
    .mr-2 { margin-right: .5rem; }
    .mt-2 { margin-top: .5rem; }
  `]
})
export class WorkflowDesignerComponent implements OnInit {
  workflows: any[] = [];
  procedureTypes: any[] = [];
  departments: any[] = [];
  allDocTypes: any[] = [];
  selectedRequiredDocType: string | null = null;
  envioTypes: string[] = ['PARA', 'COPIA'];

  selectedFlowId: string | null = null;
  selectedFlow: any = null;
  chartData: TreeNode[] = [];
  orderedNodes: any[] = [];
  pos: Record<string, { x: number; y: number }> = {};
  links: string[] = [];
  canvasWidth = 900;
  canvasHeight = 420;
  dragId: string | null = null;
  private dragOffset = { x: 0, y: 0 };
  private readonly NODE_W = 230;
  private readonly NODE_H = 150;

  // Dialog states
  showCreateFlowDialog = false;
  showNodeDialog = false;
  showEditFlowDialog = false;

  newFlow = {
    name: '',
    description: '',
    procedureTypeId: ''
  };

  editFlowForm = {
    id: '',
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
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadWorkflows();
    this.loadProcedureTypes();
    this.loadDepartments();
    this.loadDocTypes();
  }

  loadDocTypes() {
    this.catalogService.getDocumentTypes().subscribe({
      next: (res) => {
        this.allDocTypes = res.filter(d => d.isActive);
        this.cdr.detectChanges();
      }
    });
  }

  loadWorkflows() {
    this.http.get<any[]>('http://localhost:3001/api/workflows').subscribe({
      next: (res) => {
        this.workflows = res;
        this.cdr.detectChanges();
      }
    });
  }

  loadProcedureTypes() {
    this.catalogService.getProcedureTypes().subscribe({
      next: (res) => {
        this.procedureTypes = res.filter(t => t.isActive);
        this.cdr.detectChanges();
      }
    });
  }

  loadDepartments() {
    this.departmentService.getDepartments().subscribe({
      next: (res) => {
        this.departments = res;
        this.cdr.detectChanges();
      }
    });
  }

  onFlowSelect() {
    if (this.selectedFlowId) {
      this.http.get<any>(`http://localhost:3001/api/workflows/${this.selectedFlowId}`).subscribe({
        next: (flow) => {
          this.selectedFlow = flow;
          this.buildChartData();
          this.cdr.detectChanges();
        }
      });
    } else {
      this.selectedFlow = null;
      this.chartData = [];
      this.cdr.detectChanges();
    }
  }

  buildChartData() {
    if (!this.selectedFlow || !this.selectedFlow.nodes || this.selectedFlow.nodes.length === 0) {
      this.chartData = [];
      this.orderedNodes = [];
      this.links = [];
      return;
    }

    // Orden lineal: inicio primero, fin al final, resto por orden/creación
    const sorted = [...this.selectedFlow.nodes].sort((a: any, b: any) => {
      if (a.isStart !== b.isStart) return a.isStart ? -1 : 1;
      if (a.isEnd !== b.isEnd) return a.isEnd ? 1 : -1;
      const oa = a.order ?? a.stepOrder ?? 0, ob = b.order ?? b.stepOrder ?? 0;
      if (oa !== ob) return oa - ob;
      return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
    });
    this.orderedNodes = sorted;
    this.loadPositions();

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

  private storageKey() { return `wf-layout-${this.selectedFlow?.id}`; }

  private defaultPos(i: number) {
    // Zig-zag en filas de 3 columnas
    const cols = 3, gapX = 90, gapY = 70;
    const row = Math.floor(i / cols);
    let col = i % cols;
    if (row % 2 === 1) col = cols - 1 - col;
    return { x: 40 + col * (this.NODE_W + gapX), y: 30 + row * (this.NODE_H + gapY) };
  }

  private loadPositions() {
    let saved: any = {};
    try { saved = JSON.parse(localStorage.getItem(this.storageKey()) || '{}'); } catch {}
    this.pos = {};
    this.orderedNodes.forEach((n, i) => this.pos[n.id] = saved[n.id] || this.defaultPos(i));
    this.updateLinks();
  }

  resetLayout() {
    localStorage.removeItem(this.storageKey());
    this.loadPositions();
    this.cdr.detectChanges();
  }

  private updateLinks() {
    let maxX = 0, maxY = 0;
    Object.values(this.pos).forEach(p => { maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y); });
    this.canvasWidth = Math.max(900, maxX + this.NODE_W + 60);
    this.canvasHeight = Math.max(420, maxY + this.NODE_H + 60);
    this.links = [];
    for (let i = 0; i < this.orderedNodes.length - 1; i++) {
      const a = this.pos[this.orderedNodes[i].id], b = this.pos[this.orderedNodes[i + 1].id];
      if (!a || !b) continue;
      const ac = { x: a.x + this.NODE_W / 2, y: a.y + this.NODE_H / 2 };
      const bc = { x: b.x + this.NODE_W / 2, y: b.y + this.NODE_H / 2 };
      let s, e, d;
      if (Math.abs(bc.x - ac.x) > Math.abs(bc.y - ac.y)) {
        const dir = bc.x > ac.x ? 1 : -1;
        s = { x: ac.x + dir * this.NODE_W / 2, y: ac.y };
        e = { x: bc.x - dir * (this.NODE_W / 2 + 4), y: bc.y };
        const mx = (s.x + e.x) / 2;
        d = `M${s.x},${s.y} C${mx},${s.y} ${mx},${e.y} ${e.x},${e.y}`;
      } else {
        const dir = bc.y > ac.y ? 1 : -1;
        s = { x: ac.x, y: ac.y + dir * this.NODE_H / 2 };
        e = { x: bc.x, y: bc.y - dir * (this.NODE_H / 2 + 4) };
        const my = (s.y + e.y) / 2;
        d = `M${s.x},${s.y} C${s.x},${my} ${e.x},${my} ${e.x},${e.y}`;
      }
      this.links.push(d);
    }
  }

  private dragStart = { mx: 0, my: 0, x: 0, y: 0 };
  private rafPending = false;
  private lastEv: MouseEvent | null = null;
  private moveHandler = (ev: MouseEvent) => this.onDrag(ev);
  private upHandler = () => this.endDrag();

  startDrag(ev: MouseEvent, node: any) {
    if (ev.button !== 0) return;
    const p = this.pos[node.id];
    this.dragId = node.id;
    this.dragStart = { mx: ev.clientX, my: ev.clientY, x: p.x, y: p.y };
    window.addEventListener('mousemove', this.moveHandler);
    window.addEventListener('mouseup', this.upHandler);
    document.body.style.cursor = 'grabbing';
    ev.preventDefault();
    this.cdr.detectChanges();
  }

  onDrag(ev: MouseEvent) {
    if (!this.dragId) return;
    this.lastEv = ev;
    if (this.rafPending) return;
    this.rafPending = true;
    requestAnimationFrame(() => {
      this.rafPending = false;
      const e = this.lastEv;
      if (!this.dragId || !e) return;
      this.pos[this.dragId] = {
        x: Math.max(0, this.dragStart.x + e.clientX - this.dragStart.mx),
        y: Math.max(0, this.dragStart.y + e.clientY - this.dragStart.my)
      };
      this.updateLinks();
      this.cdr.detectChanges();
    });
  }

  endDrag() {
    window.removeEventListener('mousemove', this.moveHandler);
    window.removeEventListener('mouseup', this.upHandler);
    document.body.style.cursor = '';
    if (!this.dragId) return;
    this.dragId = null;
    localStorage.setItem(this.storageKey(), JSON.stringify(this.pos));
    this.cdr.detectChanges();
  }

  toggleFlowStatus(status: boolean) {
    if (!this.selectedFlow) return;
    this.http.put(`http://localhost:3001/api/workflows/${this.selectedFlow.id}`, { isActive: status }).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Estado Actualizado', detail: `El flujo ha sido ${status ? 'activado' : 'desactivado'}.` });
        this.cdr.detectChanges();
        this.loadWorkflows();
        this.onFlowSelect();
      }
    });
  }

  openCreateFlowDialog() {
    this.newFlow = { name: '', description: '', procedureTypeId: '' };
    this.showCreateFlowDialog = true;
    this.cdr.detectChanges();
  }

  createFlow() {
    this.http.post('http://localhost:3001/api/workflows', this.newFlow).subscribe({
      next: (res: any) => {
        this.showCreateFlowDialog = false;
        this.messageService.add({ severity: 'success', summary: 'Creado', detail: 'Flujo de trámite creado con éxito.' });
        this.cdr.detectChanges();
        this.loadWorkflows();
        this.selectedFlowId = res.id;
        this.onFlowSelect();
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.error || 'No se pudo crear.' });
        this.cdr.detectChanges();
      }
    });
  }

  openEditFlowDialog() {
    if (!this.selectedFlow) return;
    this.editFlowForm = {
      id: this.selectedFlow.id,
      name: this.selectedFlow.name,
      description: this.selectedFlow.description || '',
      procedureTypeId: this.selectedFlow.procedureTypeId
    };
    this.showEditFlowDialog = true;
    this.cdr.detectChanges();
  }

  updateFlow() {
    this.http.put(`http://localhost:3001/api/workflows/${this.editFlowForm.id}`, this.editFlowForm).subscribe({
      next: () => {
        this.showEditFlowDialog = false;
        this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: 'Flujo de trámite actualizado con éxito.' });
        this.cdr.detectChanges();
        this.loadWorkflows();
        this.onFlowSelect();
      },
      error: (err: any) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.error || 'No se pudo actualizar el flujo.' });
        this.cdr.detectChanges();
      }
    });
  }

  openAddNodeDialog() {
    this.editingNodeId = null;
    this.selectedRequiredDocType = null;
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
    this.cdr.detectChanges();
  }

  openEditNodeDialog(node: any) {
    this.editingNodeId = node.id;
    this.selectedRequiredDocType = (node.requiredDocTypes && node.requiredDocTypes.length > 0) ? node.requiredDocTypes[0] : null;
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
    this.cdr.detectChanges();
  }

  onRequiredDocTypeChange() {
    if (this.selectedRequiredDocType) {
      this.nodeForm.requiredDocTypes = [this.selectedRequiredDocType];
    } else {
      this.nodeForm.requiredDocTypes = [];
    }
    this.cdr.detectChanges();
  }

  saveNode() {
    if (!this.selectedFlow) return;

    if (this.editingNodeId) {
      // Actualizar
      this.http.put(`http://localhost:3001/api/workflows/${this.selectedFlow.id}/nodes/${this.editingNodeId}`, this.nodeForm).subscribe({
        next: () => {
          this.showNodeDialog = false;
          this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: 'Nodo de flujo modificado.' });
          this.cdr.detectChanges();
          this.onFlowSelect();
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.error || 'No se pudo actualizar.' });
          this.cdr.detectChanges();
        }
      });
    } else {
      // Agregar
      this.http.post(`http://localhost:3001/api/workflows/${this.selectedFlow.id}/nodes`, this.nodeForm).subscribe({
        next: () => {
          this.showNodeDialog = false;
          this.messageService.add({ severity: 'success', summary: 'Agregado', detail: 'Nodo de flujo agregado al final.' });
          this.cdr.detectChanges();
          this.onFlowSelect();
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.error || 'No se pudo guardar.' });
          this.cdr.detectChanges();
        }
      });
    }
  }

  deleteNode(nodeId: string) {
    if (!this.selectedFlow) return;
    this.http.delete(`http://localhost:3001/api/workflows/${this.selectedFlow.id}/nodes/${nodeId}`).subscribe({
      next: () => {
        this.messageService.add({ severity: 'warn', summary: 'Eliminado', detail: 'El nodo ha sido removido de la ruta.' });
        this.cdr.detectChanges();
        this.onFlowSelect();
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.error || 'No se pudo eliminar.' });
        this.cdr.detectChanges();
      }
    });
  }

  deleteFlow() {
    if (!this.selectedFlow) return;
    if (confirm(`¿Estás seguro de que deseas eliminar permanentemente el flujo "${this.selectedFlow.name}"?`)) {
      this.http.delete(`http://localhost:3001/api/workflows/${this.selectedFlow.id}`).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'El flujo ha sido eliminado.' });
          this.selectedFlow = null;
          this.selectedFlowId = null;
          this.loadWorkflows();
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.error || 'No se pudo eliminar el flujo.' });
          this.cdr.detectChanges();
        }
      });
    }
  }
}
