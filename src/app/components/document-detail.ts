import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Card } from 'primeng/card';
import { Button } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { Dialog } from 'primeng/dialog';
import { Select } from 'primeng/select';
import { MessageService } from 'primeng/api';
import { Toast } from 'primeng/toast';
import { Timeline } from 'primeng/timeline';
import { AuthService } from '../services/auth.service.js';
import { DocumentService } from '../services/document.service.js';
import { DepartmentService } from '../services/department.service.js';

@Component({
  selector: 'app-document-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    Card,
    Button,
    TableModule,
    Dialog,
    Select,
    Toast,
    Timeline
  ],
  providers: [MessageService],
  template: `
    <div class="document-detail-page animate-fade-in" *ngIf="document">
      <p-toast></p-toast>
      
      <div class="page-header">
        <p-button 
          icon="pi pi-arrow-left" 
          styleClass="p-button-text p-button-secondary btn-back"
          routerLink="/documents"
          label="Volver"
        ></p-button>
        <div class="header-title-meta">
          <h1>Detalle del Documento</h1>
          <span class="doc-code-badge font-mono">{{ document.id.substring(0,8).toUpperCase() }}</span>
        </div>
      </div>

      <!-- ALERTA DE INTEGRIDAD CRIPTOGRÁFICA -->
      <div class="integrity-card" [ngClass]="document.integrity?.isValid ? 'integrity-ok' : 'integrity-fail'">
        <div class="integrity-icon">
          <i class="pi" [ngClass]="document.integrity?.isValid ? 'pi-verified' : 'pi-exclamation-triangle'"></i>
        </div>
        <div class="integrity-text">
          <h3>{{ document.integrity?.isValid ? 'Integridad Criptográfica Verificada' : '¡ALERTA DE INTEGRIDAD DETECTADA!' }}</h3>
          <p>{{ document.integrity?.isValid 
            ? 'El archivo físico coincide exactamente con el hash SHA256 registrado originalmente. No se han detectado modificaciones externas.' 
            : 'El archivo físico del documento ha sido alterado externamente de manera no autorizada. El hash SHA256 no coincide con el original.' }}</p>
          
          <div class="hash-details">
            <span><strong>Hash Registrado:</strong> <code>{{ document.integrity?.expectedHash || document.fileHash }}</code></span>
            <span *ngIf="!document.integrity?.isValid"><strong>Hash Físico Actual:</strong> <code>{{ document.integrity?.actualHash }}</code></span>
          </div>
        </div>
      </div>

      <!-- Tabs Navigation -->
      <div class="tabs-container">
        <button class="tab-btn" [class.active-tab]="activeTab === 'summary'" (click)="changeTab('summary')"><i class="pi pi-info-circle"></i> Resumen</button>
        <button class="tab-btn" [class.active-tab]="activeTab === 'viewer'" (click)="changeTab('viewer')"><i class="pi pi-eye"></i> Visor</button>
        <button class="tab-btn" [class.active-tab]="activeTab === 'timeline'" (click)="changeTab('timeline')"><i class="pi pi-map"></i> Recorrido (Timeline)</button>
        <button class="tab-btn" [class.active-tab]="activeTab === 'actions'" (click)="changeTab('actions')" *ngIf="showWorkflows()"><i class="pi pi-cog"></i> Acciones</button>
      </div>

      <!-- TAB CONTENT: RESUMEN -->
      <div *ngIf="activeTab === 'summary'" class="tab-pane-content">
        <div class="detail-grid">
          <div class="info-column">
            <p-card styleClass="info-card" header="Metadatos Generales">
              <div class="metadata-list">
                <div class="meta-row">
                  <span class="label">Título:</span>
                  <span class="val">{{ document.title }}</span>
                </div>
                <div class="meta-row" *ngIf="document.description">
                  <span class="label">Descripción:</span>
                  <span class="val">{{ document.description }}</span>
                </div>
                <div class="meta-row">
                  <span class="label">Categoría:</span>
                  <span class="val">{{ document.type?.name || document.typeId }}</span>
                </div>
                <div class="meta-row">
                  <span class="label">Departamento Origen:</span>
                  <span class="val">{{ document.department?.name }}</span>
                </div>
                <div class="meta-row">
                  <span class="label">Creador:</span>
                  <span class="val">{{ document.creator?.name }} ({{ document.creator?.email }})</span>
                </div>
                <div class="meta-row">
                  <span class="label">Estado Actual:</span>
                  <span class="val">
                    <span class="status-badge" [ngClass]="getStatusClass(document.status)">
                      {{ document.status }}
                    </span>
                  </span>
                </div>
                <div class="meta-row" *ngIf="document.rejectionNotes">
                  <span class="label text-red">Notas de Rechazo:</span>
                  <span class="val text-red font-semibold">"{{ document.rejectionNotes }}"</span>
                </div>
              </div>
            </p-card>
          </div>

          <div class="history-column">
            <p-card styleClass="history-card" header="Últimas Operaciones">
              <p-table [value]="document.history ? document.history.slice(0, 5) : []" styleClass="p-datatable-sm timeline-table">
                <ng-template pTemplate="header">
                  <tr>
                    <th>Fecha</th>
                    <th>Operador</th>
                    <th>Operación</th>
                  </tr>
                </ng-template>
                <ng-template pTemplate="body" let-hist>
                  <tr>
                    <td>{{ hist.createdAt | date:'short' }}</td>
                    <td>{{ hist.user?.name || 'Sistema' }}</td>
                    <td><span class="badge-op" [ngClass]="getOpClass(hist.action)">{{ hist.action }}</span></td>
                  </tr>
                </ng-template>
              </p-table>
            </p-card>
          </div>
        </div>
      </div>

      <!-- TAB CONTENT: VISOR -->
      <div *ngIf="activeTab === 'viewer'" class="tab-pane-content">
        <p-card styleClass="info-card" header="Previsualización del Documento">
          
          <!-- WYSIWYG Content -->
          <div class="internal-content-preview mb-3" *ngIf="document.content">
            <h4>Documento Redactado</h4>
            <div class="wysiwyg-box">{{ document.content }}</div>
          </div>

          <!-- Physical File iframe PDF viewer -->
          <div class="pdf-viewer-container" *ngIf="document.fileUrl">
            <iframe [src]="getSafePdfUrl()" width="100%" height="600px" style="border: none; border-radius: 8px;"></iframe>
          </div>

          <div class="download-section mt-3" *ngIf="document.fileUrl">
            <p-button 
              icon="pi pi-download" 
              label="Descargar Archivo Adjunto" 
              styleClass="p-button-outlined w-full"
              (click)="openFileUrl()"
            ></p-button>
          </div>

          <div *ngIf="!document.fileUrl && !document.content" class="empty-document-state">
            <i class="pi pi-file-excel text-muted" style="font-size: 3rem;"></i>
            <p>Este documento no tiene archivos adjuntos ni contenido redactado.</p>
          </div>
        </p-card>
      </div>

      <!-- TAB CONTENT: TIMELINE / RECORRIDO -->
      <div *ngIf="activeTab === 'timeline'" class="tab-pane-content">
        <p-card styleClass="info-card" header="Historial Cronológico de Ruta">
          <p-timeline [value]="document.history" layout="vertical" align="left">
            <ng-template pTemplate="marker" let-hist>
              <span class="timeline-marker" [ngClass]="getOpClass(hist.action)">
                <i class="pi" [ngClass]="getTimelineIcon(hist.action)"></i>
              </span>
            </ng-template>
            <ng-template pTemplate="content" let-hist>
              <div class="timeline-content-card">
                <span class="timeline-date">{{ hist.createdAt | date:'medium' }}</span>
                <h4 class="timeline-user">{{ hist.user?.name || 'Sistema' }}</h4>
                <div class="timeline-action">
                  <span class="badge-op" [ngClass]="getOpClass(hist.action)">{{ hist.action }}</span>
                </div>
                <p class="timeline-desc">{{ hist.changesDescription }}</p>
              </div>
            </ng-template>
          </p-timeline>
        </p-card>
      </div>

      <!-- TAB CONTENT: ACCIONES -->
      <div *ngIf="activeTab === 'actions' && showWorkflows()" class="tab-pane-content">
        <p-card styleClass="actions-card" header="Operaciones Administrativas del Trámite">
          <div class="workflow-actions-wrapper">
            
            <!-- 1. CREADOR: Enviar borrador a revisión -->
            <div *ngIf="canSubmit()" class="workflow-action-box">
              <p>Este documento se encuentra en borrador. Envíalo para que tu superior directo lo revise.</p>
              <p-button 
                label="Enviar a Revisión de Jefatura" 
                icon="pi pi-send" 
                styleClass="p-button-success w-full"
                (click)="onSubmitForApproval()"
                [loading]="loading"
              ></p-button>
            </div>

            <!-- 2. LIDER O ALCALDE: Aprobación y Firma o Devolución -->
            <div *ngIf="canApproveOrReject()" class="workflow-action-box">
              <p>Como autoridad evaluadora, debes validar y firmar digitalmente este documento, o devolverlo al creador.</p>
              <div class="firmar-upload-section mb-3">
                <label class="block mb-2 font-semibold">Cargar Archivo Firmado Digitalmente (PDF) *</label>
                <input type="file" (change)="onSignatureFileSelect($event)" accept=".pdf" class="mb-2" />
              </div>
              <div class="flex-row">
                <p-button 
                  label="Firmar y Aprobar" 
                  icon="pi pi-verified" 
                  styleClass="p-button-success flex-grow"
                  [disabled]="!signatureFile"
                  (click)="onSignAndApprove()"
                  [loading]="loading"
                ></p-button>
                <p-button 
                  label="Devolver para Correcciones" 
                  icon="pi pi-reply" 
                  styleClass="p-button-danger"
                  (click)="showRejectDialog = true"
                  [loading]="loading"
                ></p-button>
              </div>
            </div>

            <!-- 3. LIDER: Derivación Interdepartamental -->
            <div *ngIf="canSendInterdept()" class="workflow-action-box">
              <p>El documento está aprobado. Si requiere correspondencia externa, delégalo a otro departamento.</p>
              <p-select 
                [options]="departments" 
                [(ngModel)]="selectedDept" 
                optionLabel="name" 
                optionValue="id"
                placeholder="Seleccione Departamento Destino"
                styleClass="w-full mb-2"
                appendTo="body"
              ></p-select>
              <p-button 
                label="Derivar Solicitud" 
                icon="pi pi-share-alt" 
                styleClass="p-button-primary w-full"
                [disabled]="!selectedDept"
                (click)="onSendInterdept()"
                [loading]="loading"
              ></p-button>
            </div>

            <!-- 4. LIDER DESTINO: Asignar a Empleado -->
            <div *ngIf="canAssignInterdept()" class="workflow-action-box">
              <p>Este trámite fue derivado a tu área. Asígnalo a un funcionario operativo para que prepare la respuesta.</p>
              <p-select 
                [options]="deptUsers" 
                [(ngModel)]="selectedUser" 
                optionLabel="name" 
                optionValue="id"
                placeholder="Seleccionar Operador Asignado"
                styleClass="w-full mb-2"
                appendTo="body"
              ></p-select>
              <p-button 
                label="Asignar Tarea" 
                icon="pi pi-user-plus" 
                styleClass="p-button-primary w-full"
                [disabled]="!selectedUser"
                (click)="onAssignInterdept()"
                [loading]="loading"
              ></p-button>
            </div>

            <!-- 5. CORRECCIÓN / RE-SUBIDA DE ARCHIVO (CREADOR) -->
            <div *ngIf="canReupload()" class="workflow-action-box">
              <p class="text-red">El documento fue observado por jefatura. Suba una nueva versión corregida para reiniciar el flujo.</p>
              <input type="file" (change)="onFileSelect($event)" class="mb-2" />
              <p-button 
                label="Subir Versión Corregida" 
                icon="pi pi-upload" 
                styleClass="p-button-warning w-full"
                [disabled]="!correctionFile"
                (click)="onReupload()"
                [loading]="loading"
              ></p-button>
            </div>
          </div>
        </p-card>
      </div>

      <!-- DIALOGO DE NOTAS DE RECHAZO / DEVOLUCIÓN -->
      <p-dialog 
        header="Justificación de la Devolución" 
        [(visible)]="showRejectDialog" 
        [modal]="true" 
        [style]="{width: '450px'}"
      >
        <div class="dialog-content">
          <label for="reject-notes" class="block mb-2 font-semibold">Escriba los motivos o correcciones obligatorias requeridas:</label>
          <textarea 
            id="reject-notes" 
            [(ngModel)]="rejectionNotes" 
            rows="5" 
            class="w-full text-box"
            placeholder="Ej. Modificar cifra presupuestaria en sección de antecedentes..."
          ></textarea>
          
          <div class="dialog-actions mt-4 flex justify-content-end gap-2">
            <button pButton label="Cancelar" icon="pi pi-times" class="p-button-text p-button-secondary" (click)="showRejectDialog = false"></button>
            <button pButton label="Confirmar Devolución" icon="pi pi-check" class="p-button-danger" [disabled]="!rejectionNotes.trim()" (click)="onReject()"></button>
          </div>
        </div>
      </p-dialog>
    </div>
  `,
  styles: [`
    .document-detail-page {
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
    .header-title-meta {
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
    .doc-code-badge {
      background: rgba(99, 102, 241, 0.15);
      color: #818cf8;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
      font-size: 0.85rem;
      border: 1px solid rgba(99, 102, 241, 0.25);
    }
    :host ::ng-deep .btn-back {
      color: #94a3b8 !important;
      font-weight: 600 !important;
    }

    /* Integrity Alert Card */
    .integrity-card {
      display: flex;
      gap: 1.5rem;
      padding: 1.5rem;
      border-radius: 12px;
      border: 1px solid;
      align-items: flex-start;
    }
    .integrity-ok {
      background: rgba(34, 197, 94, 0.08);
      border-color: rgba(34, 197, 94, 0.25);
      color: #4ade80;
    }
    .integrity-fail {
      background: rgba(239, 68, 68, 0.08);
      border-color: rgba(239, 68, 68, 0.25);
      color: #f87171;
    }
    .integrity-icon i {
      font-size: 2.2rem;
    }
    .integrity-text h3 {
      font-size: 1.2rem;
      font-weight: 700;
      margin: 0 0 0.4rem;
    }
    .integrity-text p {
      font-size: 0.9rem;
      margin: 0 0 0.8rem;
      line-height: 1.5;
      color: #e2e8f0;
    }
    .hash-details {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
      font-size: 0.8rem;
      color: #94a3b8;
    }
    .hash-details code {
      font-family: 'Courier New', Courier, monospace;
      background: rgba(0, 0, 0, 0.3);
      padding: 0.1rem 0.4rem;
      border-radius: 4px;
      color: #cbd5e1;
    }

    /* Tabs Layout */
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

    /* Detail Grid Layout */
    .tab-pane-content {
      animation: fadeIn 0.3s ease-out;
    }
    .detail-grid {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 1.5rem;
      align-items: start;
    }
    .info-column, .history-column {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    :host ::ng-deep .info-card, 
    :host ::ng-deep .actions-card, 
    :host ::ng-deep .history-card {
      background: rgba(15, 23, 42, 0.4) !important;
      border: 1px solid rgba(255, 255, 255, 0.06) !important;
      border-radius: 12px !important;
      color: #ffffff !important;
    }
    :host ::ng-deep .p-card-title {
      font-size: 1.1rem !important;
      font-weight: 700 !important;
      color: #ffffff !important;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06) !important;
      padding-bottom: 0.8rem !important;
    }
    
    /* Metadata general */
    .metadata-list {
      display: flex;
      flex-direction: column;
      gap: 0.8rem;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255, 255, 255, 0.03);
      padding-bottom: 0.5rem;
      font-size: 0.9rem;
    }
    .meta-row .label {
      color: #94a3b8;
      font-weight: 500;
    }
    .meta-row .val {
      color: #ffffff;
      font-weight: 600;
      text-align: right;
    }
    .internal-content-preview h4 {
      font-size: 0.95rem;
      color: #cbd5e1;
      margin: 0 0 0.5rem;
    }
    .wysiwyg-box {
      background: rgba(0, 0, 0, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 1rem;
      font-family: 'Courier New', Courier, monospace;
      font-size: 0.9rem;
      white-space: pre-wrap;
      max-height: 400px;
      overflow-y: auto;
      color: #f1f5f9;
      line-height: 1.5;
    }

    /* Actions Panel */
    .workflow-actions-wrapper {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .workflow-action-box {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      padding: 1rem;
    }
    .workflow-action-box p {
      font-size: 0.85rem;
      color: #94a3b8;
      margin: 0 0 0.8rem;
    }
    .flex-row {
      display: flex;
      gap: 0.5rem;
    }
    .flex-grow {
      flex-grow: 1;
    }
    
    /* Document Timeline Marker styles */
    .timeline-marker {
      display: flex;
      width: 24px;
      height: 24px;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      border-radius: 50%;
      font-size: 0.75rem;
    }
    .timeline-content-card {
      background: rgba(30, 41, 59, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.05);
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1.5rem;
    }
    .timeline-date {
      font-size: 0.75rem;
      color: #64748b;
      display: block;
      margin-bottom: 0.25rem;
    }
    .timeline-user {
      font-size: 0.9rem;
      font-weight: 700;
      color: #ffffff;
      margin: 0 0 0.5rem 0;
    }
    .timeline-desc {
      font-size: 0.85rem;
      color: #cbd5e1;
      margin: 0.5rem 0 0 0;
      line-height: 1.4;
    }

    /* Table Styles */
    :host ::ng-deep .timeline-table .p-datatable-thead > tr > th {
      background: #1e293b !important;
      color: #cbd5e1 !important;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
      font-weight: 600 !important;
    }
    :host ::ng-deep .timeline-table .p-datatable-tbody > tr {
      background: transparent !important;
      color: #e2e8f0 !important;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
    }
    .badge-op {
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.1rem 0.4rem;
      border-radius: 4px;
      text-transform: uppercase;
    }
    .badge-create, .badge-create_internal { background: rgba(99, 102, 241, 0.15); color: #818cf8; }
    .badge-approve { background: rgba(34, 197, 94, 0.15); color: #4ade80; }
    .badge-reject { background: rgba(239, 68, 68, 0.15); color: #f87171; }
    .badge-alert, .badge-integrity_violation { background: rgba(251, 191, 36, 0.15); color: #fbbf24; }
    .badge-default { background: rgba(148, 163, 184, 0.15); color: #cbd5e1; }

    /* Dialog Text box */
    .dialog-content {
      display: flex;
      flex-direction: column;
    }
    .text-box {
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 6px;
      padding: 0.8rem;
      color: #ffffff;
      outline: none;
    }
    .text-red { color: #f87171; }
    .font-semibold { font-weight: 600; }
  `]
})
export class DocumentDetailComponent implements OnInit {
  activeTab = 'summary';
  document: any = null;
  departments: any[] = [];
  deptUsers: any[] = [];
  
  // Selection
  selectedDept = null;
  selectedUser = null;
  
  // Rejection Notes Dialog
  showRejectDialog = false;
  rejectionNotes = '';
  
  // Signature and corrections
  signatureFile: File | null = null;
  correctionFile: File | null = null;
  loading = false;

  constructor(
    private authService: AuthService,
    private documentService: DocumentService,
    private departmentService: DepartmentService,
    private route: ActivatedRoute,
    private router: Router,
    private messageService: MessageService,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadDocumentDetails(id);
    }
  }

  changeTab(tab: string) {
    this.activeTab = tab;
    this.cdr.detectChanges();
  }

  loadDocumentDetails(id: string) {
    this.documentService.getDocumentById(id).subscribe({
      next: (res) => {
        this.document = res;
        this.cdr.detectChanges();
        this.loadWorkflowContext();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar el documento.'
        });
      }
    });
  }

  loadWorkflowContext() {
    const user = this.authService.currentUser()!;
    
    if (this.canAssignInterdept()) {
      this.departmentService.getDepartmentUsers(user.department?.id).subscribe({
        next: (res) => this.deptUsers = res
      });
    }

    if (this.canSendInterdept()) {
      this.departmentService.getDepartments().subscribe({
        next: (res) => {
          this.departments = res.filter(d => d.id !== user.department?.id);
        }
      });
    }
  }

  getPdfUrl() {
    // Retorna la URL del PDF servido por el backend
    return `http://localhost:3001/${this.document.fileUrl}`;
  }

  getSafePdfUrl(): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(`http://localhost:3001/${this.document.fileUrl}`);
  }

  openFileUrl() {
    if (this.document.fileUrl) {
      window.open(this.getPdfUrl(), '_blank');
    }
  }

  showWorkflows(): boolean {
    return this.canSubmit() || this.canApproveOrReject() || this.canSendInterdept() || this.canAssignInterdept() || this.canReupload();
  }

  canSubmit(): boolean {
    const user = this.authService.currentUser()!;
    return this.document.status === 'DRAFT' && this.document.creatorId === user.id;
  }

  canApproveOrReject(): boolean {
    const user = this.authService.currentUser()!;
    const isConfidential = this.document.typeId === 'QUEJA' || this.document.typeId === 'RENUNCIA';

    if (isConfidential) {
      return this.document.status === 'PENDING_MAYOR' && this.authService.isMayor();
    } else {
      return this.document.status === 'PENDING_LEADER' && 
             this.authService.isLeader() && 
             this.document.departmentId === user.department?.id;
    }
  }

  canSendInterdept(): boolean {
    const user = this.authService.currentUser()!;
    return this.document.status === 'APPROVED' && 
           this.authService.isLeader() && 
           this.document.departmentId === user.department?.id &&
           !this.document.isConfidential;
  }

  canAssignInterdept(): boolean {
    const user = this.authService.currentUser()!;
    return this.document.status === 'SENT_TO_DEPT' && 
           this.authService.isLeader() && 
           this.document.targetDepartmentId === user.department?.id;
  }

  canReupload(): boolean {
    const user = this.authService.currentUser()!;
    return this.document.status === 'REJECTED' && this.document.creatorId === user.id;
  }

  onSignatureFileSelect(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.signatureFile = event.target.files[0];
    }
  }

  onFileSelect(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.correctionFile = event.target.files[0];
    }
  }

  // Workflow Handlers
  onSubmitForApproval() {
    this.loading = true;
    this.documentService.submitDocument(this.document.id).subscribe({
      next: () => {
        this.loading = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Enviado',
          detail: 'Documento enviado a revisión formal.'
        });
        this.loadDocumentDetails(this.document.id);
      },
      error: () => this.loading = false
    });
  }

  onSignAndApprove() {
    if (!this.signatureFile) return;
    this.loading = true;

    const formData = new FormData();
    formData.append('file', this.signatureFile);

    this.documentService.signAndApproveDocument(this.document.id, formData).subscribe({
      next: () => {
        this.loading = false;
        this.signatureFile = null;
        this.messageService.add({
          severity: 'success',
          summary: 'Aprobado',
          detail: 'Documento firmado digitalmente y aprobado.'
        });
        this.loadDocumentDetails(this.document.id);
      },
      error: (err) => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.error || 'No se pudo firmar el documento.'
        });
      }
    });
  }

  onReject() {
    if (!this.rejectionNotes.trim()) return;
    this.loading = true;
    this.showRejectDialog = false;

    this.documentService.rejectDocument(this.document.id, this.rejectionNotes).subscribe({
      next: () => {
        this.loading = false;
        this.rejectionNotes = '';
        this.messageService.add({
          severity: 'warn',
          summary: 'Devuelto',
          detail: 'El documento ha sido rechazado y devuelto al emisor.'
        });
        this.loadDocumentDetails(this.document.id);
      },
      error: () => this.loading = false
    });
  }

  onSendInterdept() {
    if (!this.selectedDept) return;
    this.loading = true;

    this.documentService.sendInterdepartmental(this.document.id, this.selectedDept).subscribe({
      next: () => {
        this.loading = false;
        this.selectedDept = null;
        this.messageService.add({
          severity: 'success',
          summary: 'Derivado',
          detail: 'Correspondencia interdepartamental enviada.'
        });
        this.loadDocumentDetails(this.document.id);
      },
      error: () => this.loading = false
    });
  }

  onAssignInterdept() {
    if (!this.selectedUser) return;
    this.loading = true;

    this.documentService.assignInterdepartmental(this.document.id, this.selectedUser).subscribe({
      next: () => {
        this.loading = false;
        this.selectedUser = null;
        this.messageService.add({
          severity: 'success',
          summary: 'Asignado',
          detail: 'Tarea asignada al operador seleccionado.'
        });
        this.loadDocumentDetails(this.document.id);
      },
      error: () => this.loading = false
    });
  }

  onReupload() {
    if (!this.correctionFile) return;
    this.loading = true;

    const formData = new FormData();
    formData.append('file', this.correctionFile);
    formData.append('submitImmediately', 'true');

    this.documentService.updateDocumentFile(this.document.id, formData).subscribe({
      next: () => {
        this.loading = false;
        this.correctionFile = null;
        this.messageService.add({
          severity: 'success',
          summary: 'Re-enviado',
          detail: 'Versión corregida subida y enviada a revisión.'
        });
        this.loadDocumentDetails(this.document.id);
      },
      error: () => this.loading = false
    });
  }

  // Styles Helpers
  getStatusClass(status: string): string {
    const s = status.toUpperCase();
    if (s.includes('APPROVED') || s.includes('RESPONDED')) return 'badge-approve';
    if (s.includes('REJECTED')) return 'badge-reject';
    if (s.includes('PENDING')) return 'badge-alert';
    return 'badge-default';
  }

  getOpClass(action: string): string {
    const act = action.toUpperCase();
    if (act.includes('CREATE')) return 'badge-create';
    if (act.includes('APPROVE')) return 'badge-approve';
    if (act.includes('REJECT')) return 'badge-reject';
    if (act.includes('VIOLATION')) return 'badge-alert';
    return 'badge-default';
  }

  getTimelineIcon(action: string): string {
    const act = action.toUpperCase();
    if (act.includes('CREATE')) return 'pi-plus';
    if (act.includes('APPROVE')) return 'pi-check-circle';
    if (act.includes('REJECT')) return 'pi-reply';
    if (act.includes('VIOLATION')) return 'pi-exclamation-triangle';
    return 'pi-info-circle';
  }
}
