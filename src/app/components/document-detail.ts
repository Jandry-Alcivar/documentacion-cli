import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Card } from 'primeng/card';
import { Button } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { Dialog } from 'primeng/dialog';
import { Select } from 'primeng/select';
import { MessageService } from 'primeng/api';
import { Toast } from 'primeng/toast';
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
    Toast
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
        <h1>Detalle del Documento</h1>
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

      <div class="detail-grid">
        <!-- Panel Izquierdo: Información general -->
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
                <span class="val">{{ document.typeId }}</span>
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

            <!-- CONTENIDO DE DOCUMENTO INTERNO (WYSIWYG) -->
            <div class="internal-content-preview" *ngIf="document.content">
              <h4>Contenido Redactado</h4>
              <div class="wysiwyg-box">{{ document.content }}</div>
            </div>

            <!-- Botón de descarga de archivo -->
            <div class="download-section" *ngIf="document.fileUrl">
              <p-button 
                icon="pi pi-external-link" 
                label="Abrir / Descargar Archivo Adjunto" 
                styleClass="p-button-outlined w-full"
                (click)="openFileUrl()"
              ></p-button>
            </div>
          </p-card>

          <!-- FLUJO DE TRABAJO Y ACCIONES -->
          <p-card styleClass="actions-card" header="Panel de Aprobación y Derivación" *ngIf="showWorkflows()">
            <div class="workflow-actions-wrapper">
              
              <!-- 1. CREADOR: Enviar borrador a revisión -->
              <div *ngIf="canSubmit()" class="workflow-action-box">
                <p>Este documento es un borrador. Envíalo para iniciar el flujo de aprobación.</p>
                <p-button 
                  label="Enviar a Aprobación" 
                  icon="pi pi-send" 
                  styleClass="p-button-success w-full"
                  (click)="onSubmitForApproval()"
                ></p-button>
              </div>

              <!-- 2. LIDER O ALCALDE: Aprobación o Rechazo -->
              <div *ngIf="canApproveOrReject()" class="workflow-action-box">
                <p>Eres autoridad evaluadora para este trámite. Toma una decisión administrativa.</p>
                <div class="flex-row">
                  <p-button 
                    label="Aprobar Trámite" 
                    icon="pi pi-check" 
                    styleClass="p-button-success flex-grow"
                    (click)="onApprove()"
                  ></p-button>
                  <p-button 
                    label="Rechazar" 
                    icon="pi pi-times" 
                    styleClass="p-button-danger"
                    (click)="showRejectDialog = true"
                  ></p-button>
                </div>
              </div>

              <!-- 3. LIDER: Derivación Interdepartamental -->
              <div *ngIf="canSendInterdept()" class="workflow-action-box">
                <p>El documento está aprobado. Puedes derivarlo formalmente a otro departamento.</p>
                <p-select 
                  [options]="departments" 
                  [(ngModel)]="selectedDept" 
                  optionLabel="name" 
                  optionValue="id"
                  placeholder="Selecciona Depto. Destino"
                  styleClass="w-full mb-2"
                ></p-select>
                <p-button 
                  label="Derivar Solicitud" 
                  icon="pi pi-share-alt" 
                  styleClass="p-button-primary w-full"
                  [disabled]="!selectedDept"
                  (click)="onSendInterdept()"
                ></p-button>
              </div>

              <!-- 4. LIDER DESTINO: Asignar a Empleado -->
              <div *ngIf="canAssignInterdept()" class="workflow-action-box">
                <p>Este trámite fue derivado a tu área. Asígnalo a un funcionario para que redacte la respuesta.</p>
                <p-select 
                  [options]="deptUsers" 
                  [(ngModel)]="selectedUser" 
                  optionLabel="name" 
                  optionValue="id"
                  placeholder="Selecciona Funcionario"
                  styleClass="w-full mb-2"
                ></p-select>
                <p-button 
                  label="Asignar Tarea" 
                  icon="pi pi-user-plus" 
                  styleClass="p-button-primary w-full"
                  [disabled]="!selectedUser"
                  (click)="onAssignInterdept()"
                ></p-button>
              </div>

              <!-- 5. CORRECCIÓN / RE-SUBIDA DE ARCHIVO (CREADOR) -->
              <div *ngIf="canReupload()" class="workflow-action-box">
                <p class="text-red">El documento fue rechazado. Sube una versión corregida para reactivar el trámite.</p>
                <input type="file" (change)="onFileSelect($event)" class="mb-2" />
                <p-button 
                  label="Subir Versión Corregida" 
                  icon="pi pi-upload" 
                  styleClass="p-button-warning w-full"
                  [disabled]="!correctionFile"
                  (click)="onReupload()"
                ></p-button>
              </div>
            </div>
          </p-card>
        </div>

        <!-- Panel Derecho: Historial / Traza de auditoría -->
        <div class="history-column">
          <p-card styleClass="history-card" header="Historial de Operaciones (Traza)">
            <p-table [value]="document.history" styleClass="p-datatable-sm timeline-table">
              <ng-template pTemplate="header">
                <tr>
                  <th>Fecha/Hora</th>
                  <th>Operador</th>
                  <th>Operación</th>
                  <th>Detalle</th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-hist>
                <tr>
                  <td>{{ hist.createdAt | date:'short' }}</td>
                  <td>{{ hist.user?.name || 'Sistema' }}</td>
                  <td>
                    <span class="badge-op" [ngClass]="getOpClass(hist.action)">{{ hist.action }}</span>
                  </td>
                  <td>{{ hist.changesDescription }}</td>
                </tr>
              </ng-template>
            </p-table>
          </p-card>
        </div>
      </div>

      <!-- DIALOGO DE NOTAS DE RECHAZO -->
      <p-dialog 
        header="Justificación del Rechazo" 
        [(visible)]="showRejectDialog" 
        [modal]="true" 
        [style]="{width: '450px'}"
      >
        <div class="dialog-content">
          <label for="reject-notes" class="block mb-2 font-semibold">Explica la razón del rechazo o correcciones requeridas:</label>
          <textarea 
            id="reject-notes" 
            [(ngModel)]="rejectionNotes" 
            rows="5" 
            class="w-full text-box"
            placeholder="Ej. Falta el sello digital o corregir la cifra en la página 3."
          ></textarea>
        </div>
        <ng-template pTemplate="footer">
          <p-button label="Cancelar" icon="pi pi-times" styleClass="p-button-text" (click)="showRejectDialog = false"></p-button>
          <p-button label="Confirmar Rechazo" icon="pi pi-check" styleClass="p-button-danger" (click)="onReject()"></p-button>
        </ng-template>
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

    /* Detail Grid Layout */
    .detail-grid {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 1.5rem;
      align-items: start;
    }
    .info-column {
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
    .internal-content-preview {
      margin-top: 1.5rem;
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
      max-height: 300px;
      overflow-y: auto;
      color: #f1f5f9;
    }
    .download-section {
      margin-top: 1.5rem;
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
    .mb-2 {
      margin-bottom: 0.5rem;
    }

    /* Table Styles in Right Panel */
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
    .badge-create { background: rgba(99, 102, 241, 0.15); color: #818cf8; }
    .badge-approve { background: rgba(34, 197, 94, 0.15); color: #4ade80; }
    .badge-reject { background: rgba(239, 68, 68, 0.15); color: #f87171; }
    .badge-alert { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
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
  document: any = null;
  departments: any[] = [];
  deptUsers: any[] = [];
  
  // Selection
  selectedDept = null;
  selectedUser = null;
  
  // Rejection Notes Dialog
  showRejectDialog = false;
  rejectionNotes = '';

  // Correction Upload
  correctionFile: File | null = null;
  loading = false;

  constructor(
    private authService: AuthService,
    private documentService: DocumentService,
    private departmentService: DepartmentService,
    private route: ActivatedRoute,
    private router: Router,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadDocumentDetails(id);
    }
  }

  loadDocumentDetails(id: string) {
    this.documentService.getDocumentById(id).subscribe({
      next: (res) => {
        this.document = res;
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
    
    // Si el usuario es el líder del departamento destino
    if (this.canAssignInterdept()) {
      this.departmentService.getDepartmentUsers(user.department?.id).subscribe({
        next: (res) => this.deptUsers = res
      });
    }

    // Si el usuario es líder de departamento y el documento está aprobado en su área
    if (this.canSendInterdept()) {
      this.departmentService.getDepartments().subscribe({
        next: (res) => {
          // Filtrar el departamento propio
          this.departments = res.filter(d => d.id !== user.department?.id);
        }
      });
    }
  }

  showWorkflows(): boolean {
    return this.canSubmit() || this.canApproveOrReject() || this.canSendInterdept() || this.canAssignInterdept() || this.canReupload();
  }

  // 1. Can submit for approval
  canSubmit(): boolean {
    const user = this.authService.currentUser()!;
    return this.document.status === 'DRAFT' && this.document.creatorId === user.id;
  }

  // 2. Can approve/reject
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

  // 3. Can send interdepartmental request
  canSendInterdept(): boolean {
    const user = this.authService.currentUser()!;
    return this.document.status === 'APPROVED' && 
           this.authService.isLeader() && 
           this.document.departmentId === user.department?.id &&
           !this.document.isConfidential;
  }

  // 4. Can assign incoming interdept task
  canAssignInterdept(): boolean {
    const user = this.authService.currentUser()!;
    return this.document.status === 'SENT_TO_DEPT' && 
           this.authService.isLeader() && 
           this.document.targetDepartmentId === user.department?.id;
  }

  // 5. Can re-upload to correct rejection
  canReupload(): boolean {
    const user = this.authService.currentUser()!;
    return this.document.status === 'REJECTED' && this.document.creatorId === user.id;
  }

  // Workflow Handlers
  onSubmitForApproval() {
    this.documentService.submitDocument(this.document.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Enviado',
          detail: 'Documento enviado a revisión formal.'
        });
        this.loadDocumentDetails(this.document.id);
      }
    });
  }

  openFileUrl() {
    window.open('http://localhost:3001' + this.document.fileUrl, '_blank');
  }

  onApprove() {
    this.documentService.approveDocument(this.document.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Aprobado',
          detail: 'El documento ha sido aprobado y firmado oficialmente.'
        });
        this.loadDocumentDetails(this.document.id);
      }
    });
  }

  onReject() {
    if (!this.rejectionNotes) return;
    this.documentService.rejectDocument(this.document.id, this.rejectionNotes).subscribe({
      next: () => {
        this.showRejectDialog = false;
        this.messageService.add({
          severity: 'info',
          summary: 'Rechazado',
          detail: 'Documento rechazado con observaciones.'
        });
        this.loadDocumentDetails(this.document.id);
      }
    });
  }

  onSendInterdept() {
    if (!this.selectedDept) return;
    this.documentService.sendInterdepartmental(this.document.id, this.selectedDept).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Derivado',
          detail: 'El documento fue enviado formalmente al departamento de destino.'
        });
        this.loadDocumentDetails(this.document.id);
      }
    });
  }

  onAssignInterdept() {
    if (!this.selectedUser) return;
    this.documentService.assignInterdepartmental(this.document.id, this.selectedUser).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Asignado',
          detail: 'Tarea asignada correctamente al funcionario.'
        });
        this.loadDocumentDetails(this.document.id);
      }
    });
  }

  onFileSelect(event: any) {
    this.correctionFile = event.target.files[0];
  }

  onReupload() {
    if (!this.correctionFile) return;
    const formData = new FormData();
    formData.append('file', this.correctionFile);
    formData.append('submitImmediately', 'true'); // Enviar a revisión inmediatamente al corregir

    this.documentService.updateDocumentFile(this.document.id, formData).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Archivo Actualizado',
          detail: 'Nueva versión subida e ingresada a revisión.'
        });
        this.correctionFile = null;
        this.loadDocumentDetails(this.document.id);
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.error || 'No se pudo subir la corrección.'
        });
      }
    });
  }

  // Styles formatting helpers
  getStatusClass(status: string): string {
    const s = status.toUpperCase();
    if (s.includes('DRAFT')) return 'badge-draft';
    if (s.includes('PENDING')) return 'badge-pending';
    if (s.includes('APPROVED') || s.includes('RESPONDED')) return 'badge-approved';
    if (s.includes('REJECTED')) return 'badge-rejected';
    if (s.includes('SENT') || s.includes('ASSIGNED')) return 'badge-sent';
    return 'badge-draft';
  }

  getOpClass(action: string): string {
    const act = action.toUpperCase();
    if (act.includes('CREATE')) return 'badge-create';
    if (act.includes('APPROVE')) return 'badge-approve';
    if (act.includes('REJECT')) return 'badge-reject';
    if (act.includes('VIOLATION') || act.includes('ALERT')) return 'badge-alert';
    return 'badge-default';
  }
}
