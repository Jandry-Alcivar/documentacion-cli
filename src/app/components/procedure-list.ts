import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { Select } from 'primeng/select';
import { Dialog } from 'primeng/dialog';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../services/auth.service.js';
import { ProcedureService } from '../services/procedure.service.js';
import { DepartmentService } from '../services/department.service.js';
import { CatalogService } from '../services/catalog.service.js';
import { TemplateService } from '../services/template.service.js';
import { RichEditorComponent } from './rich-editor.js';

@Component({
  selector: 'app-procedure-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    TableModule,
    Select,
    Dialog,
    Toast,
    RichEditorComponent
  ],
  providers: [MessageService],
  template: `
    <div class="procedure-list-page animate-fade-in">
      <p-toast></p-toast>

      <!-- Encabezado Principal -->
      <div class="page-header">
        <div>
          <h1>Gestión de Trámites & Expedientes Digitales</h1>
          <p>Control centralizado de carpetas de trámites, flujo interdepartamental, firmas electrónicas y trazabilidad</p>
        </div>
        <div class="header-actions">
          <button 
            *ngIf="canCreate()"
            class="p-button p-button-primary btn-create"
            routerLink="create"
          >
            <i class="pi pi-folder-plus mr-2"></i> Iniciar Nuevo Expediente
          </button>
        </div>
      </div>

      <!-- Tarjetas de Métricas Rápidas -->
      <div class="stats-grid">
        <div class="stat-card stat-pending">
          <div class="stat-icon"><i class="pi pi-clock"></i></div>
          <div class="stat-info">
            <span class="stat-value">{{ inboxCounts.pending || 0 }}</span>
            <span class="stat-label">En Revisión / Pendientes</span>
          </div>
        </div>
        <div class="stat-card stat-received">
          <div class="stat-icon"><i class="pi pi-inbox"></i></div>
          <div class="stat-info">
            <span class="stat-value">{{ inboxCounts.received || 0 }}</span>
            <span class="stat-label">Ingresados / Recibidos</span>
          </div>
        </div>
        <div class="stat-card stat-derived">
          <div class="stat-icon"><i class="pi pi-send"></i></div>
          <div class="stat-info">
            <span class="stat-value">{{ inboxCounts.derived || 0 }}</span>
            <span class="stat-label">Derivados a Otros Deptos</span>
          </div>
        </div>
        <div class="stat-card stat-finished">
          <div class="stat-icon"><i class="pi pi-check-circle"></i></div>
          <div class="stat-info">
            <span class="stat-value">{{ inboxCounts.finished || 0 }}</span>
            <span class="stat-label">Finalizados / Resueltos</span>
          </div>
        </div>
      </div>

      <!-- Barra de Filtros y Vistas -->
      <div class="toolbar-card">
        <div class="tabs-container">
          <button 
            class="tab-btn" 
            [class.active-tab]="activeView === 'inbox'" 
            (click)="changeView('inbox')"
          >
            <i class="pi pi-inbox mr-1"></i> Mi Bandeja Activa (Inbox)
          </button>
          <button 
            class="tab-btn" 
            [class.active-tab]="activeView === 'all'" 
            (click)="changeView('all')"
          >
            <i class="pi pi-globe mr-1"></i> Historial General del Departamento
          </button>
        </div>

        <div class="search-box">
          <i class="pi pi-search search-icon"></i>
          <input 
            type="text" 
            [(ngModel)]="searchQuery" 
            (input)="onSearch()" 
            placeholder="Buscar por código, solicitante, cédula o asunto..." 
            class="search-input"
          />
        </div>
      </div>

      <!-- Tabla Principal de Expedientes / Trámites -->
      <div class="table-card">
        <p-table [value]="procedures" [rows]="10" [paginator]="true" styleClass="p-datatable-sm custom-table">
          <ng-template pTemplate="header">
            <tr>
              <th>Expediente</th>
              <th>Asunto & Solicitante</th>
              <th>Prioridad</th>
              <th>Asignado / Depto</th>
              <th>Folder (Documentos)</th>
              <th>Fecha Ingreso</th>
              <th>Estado</th>
              <th style="width: 140px; text-align: center;">Acciones</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-proc>
            <tr>
              <td>
                <div class="proc-code-cell">
                  <i class="pi pi-folder text-blue-600"></i>
                  <span class="proc-code-text">{{ proc.code }}</span>
                </div>
              </td>
              <td>
                <div class="proc-subject-cell">
                  <span class="subject-text">{{ proc.subject }}</span>
                  <small class="applicant-meta">
                    <i class="pi pi-user mr-1"></i> {{ proc.applicantName }}
                    <span *ngIf="proc.applicantInstitution" class="institution-tag">({{ proc.applicantInstitution }})</span>
                  </small>
                </div>
              </td>
              <td>
                <span class="p-priority" [ngClass]="getPriorityClass(proc.priority)">
                  {{ proc.priority }}
                </span>
              </td>
              <td>
                <div class="assignee-cell">
                  <span class="assignee-name">{{ proc.assignee?.name || 'Bandeja General' }}</span>
                  <small class="dept-name">{{ proc.department?.name }}</small>
                </div>
              </td>
              <td>
                <span class="badge-docs" [class.has-docs]="proc.documents && proc.documents.length > 0">
                  <i class="pi pi-file mr-1"></i> {{ proc.documents?.length || 0 }} docs
                </span>
              </td>
              <td class="proc-date-cell">{{ proc.createdAt | date:'dd/MM/yyyy' }}</td>
              <td>
                <span class="status-badge" [ngClass]="getStatusClass(proc.status)">
                  <i class="pi pi-lock mr-1" *ngIf="proc.status === 'FINALIZADO' || proc.sealHash" title="Expediente Sellado (Inmutable)"></i>
                  {{ proc.status }}
                </span>
              </td>
              <td class="text-center">
                <div class="table-actions-cell">
                  <button 
                    class="btn-open-folder" 
                    (click)="showDetail(proc.id)"
                    title="Abrir Expediente Digital"
                  >
                    <i class="pi pi-folder-open mr-1"></i> Abrir
                  </button>
                  <button 
                    *ngIf="proc.status === 'REGISTRADO'"
                    class="btn-delete-folder" 
                    (click)="confirmDeleteProcedure(proc)"
                    title="Eliminar Expediente Completo (Solo en estado REGISTRADO)"
                  >
                    <i class="pi pi-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptystate">
            <tr>
              <td colspan="8" style="text-align: center; padding: 3rem; color: #94a3b8;">
                <i class="pi pi-inbox" style="font-size: 2.5rem; margin-bottom: 0.5rem; display: block; opacity: 0.5;"></i>
                No se encontraron trámites en esta bandeja.
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <!-- ========================================================================= -->
      <!-- MODAL PRINCIPAL: EXPEDIENTE DIGITAL / FOLDER CONTENEDOR -->
      <!-- ========================================================================= -->
      <p-dialog 
        header="Expediente Digital" 
        [(visible)]="showDetailDialog" 
        [modal]="true" 
        [style]="{ width: '92vw', maxWidth: '1200px', height: '90vh' }"
        appendTo="body"
        [closable]="true"
      >
        <div class="expediente-container" *ngIf="selectedProcedure">
          
          <!-- Banner Superior del Expediente -->
          <div class="expediente-header">
            <div class="header-left">
              <div class="folder-badge">
                <i class="pi pi-folder-open"></i> EXPEDIENTE
              </div>
              <div>
                <h2>{{ selectedProcedure.code }}</h2>
                <p class="exp-subject">{{ selectedProcedure.subject }}</p>
              </div>
            </div>
            
            <div class="header-right">
              <span class="p-priority mr-2" [ngClass]="getPriorityClass(selectedProcedure.priority)">
                {{ selectedProcedure.priority }}
              </span>
              <span class="status-badge" [ngClass]="getStatusClass(selectedProcedure.status)">
                <i class="pi pi-lock mr-1" *ngIf="selectedProcedure.status === 'FINALIZADO' || selectedProcedure.sealHash" title="Sellado"></i>
                {{ selectedProcedure.status }}
              </span>
            </div>
          </div>

          <!-- BANNER DE INMUTABILIDAD Y SELLO CRIPTOGRÁFICO -->
          <div class="immutability-banner" *ngIf="selectedProcedure.status === 'FINALIZADO' || selectedProcedure.sealHash" 
               [ngClass]="{'seal-valid': sealVerification?.valid, 'seal-invalid': sealVerification && !sealVerification.valid, 'seal-loading': verifyingSeal}">
            <div class="seal-banner-left">
              <div class="seal-icon-box">
                <i class="pi pi-spin pi-spinner" *ngIf="verifyingSeal"></i>
                <i class="pi pi-shield text-green-600" *ngIf="!verifyingSeal && sealVerification?.valid"></i>
                <i class="pi pi-exclamation-triangle text-red-600" *ngIf="!verifyingSeal && sealVerification && !sealVerification.valid"></i>
                <i class="pi pi-lock" *ngIf="!verifyingSeal && !sealVerification"></i>
              </div>
              <div class="seal-info-text">
                <div class="seal-title">
                  <span *ngIf="verifyingSeal">Verificando sello criptográfico SHA-256 e integridad del expediente...</span>
                  <span *ngIf="!verifyingSeal && sealVerification?.valid">
                    <i class="pi pi-check-circle mr-1"></i> Expediente Inmutable y Sellado · Integridad Verificada
                  </span>
                  <span *ngIf="!verifyingSeal && sealVerification && !sealVerification.valid">
                    <i class="pi pi-times-circle mr-1"></i> ¡ALERTA! Integridad Comprometida / Los documentos fueron alterados
                  </span>
                  <span *ngIf="!verifyingSeal && !sealVerification">
                    Expediente Concluido y Sellado
                  </span>
                </div>
                <div class="seal-hash-display" *ngIf="selectedProcedure.sealHash || sealVerification?.sealHash">
                  <code>SHA-256: {{ selectedProcedure.sealHash || sealVerification?.sealHash }}</code>
                  <span class="seal-date" *ngIf="selectedProcedure.sealedAt || sealVerification?.sealedAt">
                    · Sellado el: {{ (selectedProcedure.sealedAt || sealVerification?.sealedAt) | date:'dd/MM/yyyy HH:mm' }}
                  </span>
                </div>
                <div class="seal-alert-note" *ngIf="sealVerification && !sealVerification.valid">
                  El cálculo de la huella digital actual ({{ sealVerification.currentHash?.substring(0, 16) }}...) no coincide con el sello criptográfico almacenado en la finalización.
                </div>
              </div>
            </div>
            <div class="seal-banner-actions">
              <button type="button" class="btn-seal-action" (click)="copySealHash()" title="Copiar Hash SHA-256" *ngIf="selectedProcedure.sealHash || sealVerification?.sealHash">
                <i class="pi pi-copy mr-1"></i> Copiar Hash
              </button>
              <button type="button" class="btn-seal-action" (click)="verifyCurrentProcedureSeal()" [disabled]="verifyingSeal" title="Re-verificar integridad">
                <i class="pi pi-refresh mr-1" [class.pi-spin]="verifyingSeal"></i> Verificar
              </button>
            </div>
          </div>

          <!-- Barra de Acciones del Expediente -->
          <div class="folder-actions-bar">
            <button class="action-btn btn-add-doc" (click)="openAddDocModal()" *ngIf="selectedProcedure.status !== 'FINALIZADO'">
              <i class="pi pi-file-plus mr-1"></i> Agregar Documento / Oficio
            </button>
            <button class="action-btn btn-derive" (click)="openDeriveModal()" *ngIf="selectedProcedure.status !== 'FINALIZADO'">
              <i class="pi pi-send mr-1"></i> Derivar Expediente (Para / CC)
            </button>
            <button class="action-btn btn-email" (click)="openEmailModal()">
              <i class="pi pi-envelope mr-1"></i> Enviar por Correo
            </button>
            <button class="action-btn btn-return" (click)="openReturnModal()" *ngIf="selectedProcedure.status !== 'FINALIZADO'">
              <i class="pi pi-replay mr-1"></i> Devolver / Observar
            </button>
            <button class="action-btn btn-finalize" (click)="openFinalizeModal()" *ngIf="selectedProcedure.status !== 'FINALIZADO'">
              <i class="pi pi-check mr-1"></i> Finalizar Trámite
            </button>
            <button class="action-btn btn-verify-seal" (click)="verifyCurrentProcedureSeal()" *ngIf="selectedProcedure.status === 'FINALIZADO' || selectedProcedure.sealHash" [disabled]="verifyingSeal">
              <i class="pi pi-shield mr-1" [class.pi-spin]="verifyingSeal"></i> Verificar Integridad
            </button>
            <button class="action-btn btn-reopen" (click)="openReopenModal()" *ngIf="selectedProcedure.status === 'FINALIZADO' && canReopen()">
              <i class="pi pi-undo mr-1"></i> Reabrir Expediente
            </button>
            <button 
              type="button"
              class="action-btn btn-zip"
              [disabled]="downloadingZip"
              (click)="downloadDossierZip(selectedProcedure)"
              title="Descargar todos los oficios y la hoja de ruta en un archivo .ZIP"
            >
              <i class="pi pi-spin pi-spinner mr-1" *ngIf="downloadingZip"></i>
              <i class="pi pi-download mr-1" *ngIf="!downloadingZip"></i> Dossier (.ZIP)
            </button>
            <a 
              [routerLink]="['/seguimiento']" 
              [queryParams]="{ code: selectedProcedure.code, applicantId: selectedProcedure.applicantId }" 
              target="_blank" 
              class="action-btn btn-track"
              title="Ver cómo ve el ciudadano este trámite en el portal público"
            >
              <i class="pi pi-external-link mr-1"></i> Vista Ciudadana
            </a>
            <button 
              *ngIf="selectedProcedure.status === 'REGISTRADO'"
              class="action-btn btn-delete-folder-large" 
              (click)="confirmDeleteProcedure(selectedProcedure)"
              title="Eliminar permanentemente este trámite y sus documentos"
            >
              <i class="pi pi-trash mr-1"></i> Eliminar Expediente
            </button>
          </div>

          <!-- Pestañas Internas del Folder -->
          <div class="exp-tabs">
            <button class="exp-tab" [class.active]="activeFolderTab === 'docs'" (click)="activeFolderTab = 'docs'">
              <i class="pi pi-file"></i> Documentos & Oficios ({{ selectedProcedure.documents?.length || 0 }})
            </button>
            <button class="exp-tab" [class.active]="activeFolderTab === 'timeline'" (click)="activeFolderTab = 'timeline'">
              <i class="pi pi-history"></i> Trazabilidad & Línea de Tiempo ({{ selectedProcedure.movements?.length || 0 }})
            </button>
            <button class="exp-tab" [class.active]="activeFolderTab === 'applicant'" (click)="activeFolderTab = 'applicant'">
              <i class="pi pi-user"></i> Datos del Solicitante
            </button>
            <button class="exp-tab" [class.active]="activeFolderTab === 'manage'" (click)="activeFolderTab = 'manage'" *ngIf="canManage()">
              <i class="pi pi-cog"></i> Gestión Administrativa
            </button>
          </div>

          <!-- CONTENIDO DE PESTAÑAS -->
          <div class="tab-content-area">
            
            <!-- TAB 1: DOCUMENTOS Y OFICIOS EN EL FOLDER -->
            <div *ngIf="activeFolderTab === 'docs'" class="docs-folder-view animate-fade-in">
              <div class="section-title-row">
                <h3><i class="pi pi-folder mr-2"></i>Contenido del Folder Digital</h3>
                <span class="doc-count-tag">{{ selectedProcedure.documents?.length || 0 }} archivos acumulados</span>
              </div>

              <div class="doc-cards-grid" *ngIf="selectedProcedure.documents && selectedProcedure.documents.length > 0; else noDocsTpl">
                <div class="doc-card" *ngFor="let doc of selectedProcedure.documents">
                  <div class="doc-card-header">
                    <div class="doc-type-icon">
                      <i class="pi" [ngClass]="doc.fileUrl ? 'pi-file-pdf text-red-400' : 'pi-file-edit text-blue-400'"></i>
                    </div>
                    <div class="doc-title-info">
                      <h4>{{ doc.title }}</h4>
                      <small class="doc-type-name">{{ doc.type?.name || 'Documento / Anexo Institucional' }}</small>
                    </div>
                  </div>

                  <p class="doc-desc">{{ doc.description || 'Sin descripción adicional.' }}</p>

                  <!-- ESTADO DE FIRMAS ELECTRÓNICAS -->
                  <div class="signature-box">
                    <div class="sig-header">
                      <span class="sig-label">Firma Electrónica:</span>
                      <span *ngIf="doc.signatures && doc.signatures.length > 0" class="badge-signed">
                        <i class="pi pi-verified mr-1"></i> Firmado ({{ doc.signatures.length }})
                      </span>
                      <span *ngIf="!doc.signatures || doc.signatures.length === 0" class="badge-unsigned">
                        <i class="pi pi-exclamation-circle mr-1"></i> Pendiente de Firma
                      </span>
                    </div>

                    <!-- Lista de personas que han firmado este documento -->
                    <div class="signatures-list" *ngIf="doc.signatures && doc.signatures.length > 0">
                      <div class="sig-item" *ngFor="let sig of doc.signatures">
                        <i class="pi pi-check-circle text-green-400 mr-1"></i>
                        <strong>{{ sig.signerName }}</strong>
                        <small>({{ sig.signerRole }} - {{ sig.signedAt | date:'dd/MM/yy HH:mm' }})</small>
                      </div>
                    </div>
                  </div>

                  <!-- Botones de Acción por Documento -->
                  <div class="doc-card-actions">
                    <a 
                      *ngIf="doc.fileUrl" 
                      [href]="'http://localhost:3001' + doc.fileUrl" 
                      target="_blank" 
                      class="btn-doc-view"
                    >
                      <i class="pi pi-eye mr-1"></i> Ver / Descargar
                    </a>

                    <button 
                      class="btn-doc-sign" 
                      *ngIf="selectedProcedure.status !== 'FINALIZADO'"
                      (click)="openSignDocModal(doc)"
                    >
                      <i class="pi pi-file-edit mr-1"></i> Firmar Electrónicamente
                    </button>
                    <span class="badge-sealed-doc" *ngIf="selectedProcedure.status === 'FINALIZADO'">
                      <i class="pi pi-lock mr-1"></i> Documento Sellado
                    </span>
                  </div>
                </div>
              </div>

              <ng-template #noDocsTpl>
                <div class="empty-folder-state">
                  <i class="pi pi-folder-open" style="font-size: 3rem; color: #64748b; margin-bottom: 1rem;"></i>
                  <h4>El folder está vacío</h4>
                  <p>Aún no se han adjuntado oficios, resoluciones ni informes a este trámite.</p>
                  <button class="p-button p-button-primary mt-3" *ngIf="selectedProcedure.status !== 'FINALIZADO'" (click)="openAddDocModal()">
                    <i class="pi pi-plus mr-1"></i> Incorporar Primer Documento
                  </button>
                </div>
              </ng-template>
            </div>

            <!-- TAB 2: LÍNEA DE TIEMPO & TRAZABILIDAD (TIMELINE AGRUPADA POR NODO DEPARTAMENTAL) -->
            <div *ngIf="activeFolderTab === 'timeline'" class="timeline-view animate-fade-in">
              <div class="section-title-row">
                <h3><i class="pi pi-history mr-2"></i>Trazabilidad y Flujo por Departamento</h3>
                <span class="doc-count-tag">{{ selectedProcedure.movements?.length || 0 }} eventos en {{ groupedMovementsByDepartment.length }} estaciones</span>
              </div>

              <div class="timeline-container-grouped" *ngIf="groupedMovementsByDepartment && groupedMovementsByDepartment.length > 0; else noMovementsTpl">
                <ng-container *ngFor="let group of groupedMovementsByDepartment; let i = index; let isLast = last">
                  <!-- Bloque de Estación Departamental -->
                  <div 
                    class="dept-timeline-stage" 
                    [class.is-expanded]="isStageExpanded(group.departmentId)"
                  >
                    <!-- Nodo / Estación Departamental Unificada (Click para Colapsar/Expandir) -->
                    <div 
                      class="dept-stage-header clickable-stage" 
                      (click)="toggleStage(group.departmentId)"
                      title="Haga clic para ver o esconder las actividades de este departamento"
                    >
                      <div class="dept-stage-badge">
                        <i class="pi pi-building"></i>
                      </div>
                      <div class="dept-stage-title-box">
                        <span class="stage-step-tag">{{ i === 0 ? 'Estación de Origen' : ('Estación ' + (i + 1)) }}</span>
                        <h4>{{ group.departmentName }}</h4>
                      </div>
                      <span class="dept-stage-count">{{ group.movements.length }} {{ group.movements.length === 1 ? 'acción' : 'acciones' }}</span>
                      <button type="button" class="stage-toggle-btn">
                        <i class="pi" [ngClass]="isStageExpanded(group.departmentId) ? 'pi-chevron-up' : 'pi-chevron-down'"></i>
                      </button>
                    </div>

                    <!-- Actividades y Movimientos internos de esta Estación (Solo visibles al expandir) -->
                    <div class="dept-events-list animate-fade-in" *ngIf="isStageExpanded(group.departmentId)">
                      <div class="timeline-item" *ngFor="let mov of group.movements">
                        <div class="timeline-badge" [ngClass]="getMovementBadgeClass(mov.action)">
                          <i class="pi" [ngClass]="getMovementIcon(mov.action)"></i>
                        </div>

                        <div class="timeline-card">
                          <div class="mov-header">
                            <span class="mov-action-tag" [ngClass]="getMovementBadgeClass(mov.action)">
                              {{ getMovementActionName(mov.action) }}
                            </span>
                            <span class="mov-date"><i class="pi pi-clock mr-1"></i> {{ mov.createdAt | date:'dd/MM/yyyy HH:mm:ss' }}</span>
                          </div>

                          <div class="mov-actors">
                            <div class="actor-box">
                              <strong>Remitente / Responsable:</strong>
                              <span>{{ mov.fromUser?.name || 'Sistema' }} ({{ mov.fromDepartment?.name || 'General' }})</span>
                            </div>
                            <i class="pi pi-arrow-right text-indigo-400 mov-arrow" *ngIf="mov.toDepartment"></i>
                            <div class="actor-box" *ngIf="mov.toDepartment">
                              <strong>Derivado a:</strong>
                              <span>{{ mov.toUser?.name || 'Bandeja General' }} ({{ mov.toDepartment?.name }})</span>
                              <span class="envio-tag" *ngIf="mov.typeEnvio">[{{ mov.typeEnvio }}]</span>
                            </div>
                          </div>

                          <div class="mov-notes" *ngIf="mov.notes">
                            <strong>Proveído / Detalle:</strong>
                            <p>{{ mov.notes }}</p>
                          </div>

                          <!-- Notificación de Correo Registrada en el Movimiento -->
                          <div class="mov-email-alert" *ngIf="mov.sentEmail && mov.emailRecipients">
                            <i class="pi pi-envelope mr-1"></i> 
                            <span>Notificación enviada a: <strong>{{ mov.emailRecipients.to?.join(', ') }}</strong></span>
                            <span *ngIf="mov.emailRecipients.cc && mov.emailRecipients.cc.length > 0">
                              (CC: {{ mov.emailRecipients.cc.join(', ') }})
                            </span>
                          </div>

                          <!-- Documento vinculado al movimiento -->
                          <div class="mov-attached-doc" *ngIf="mov.attachedDocument">
                            <i class="pi pi-paperclip mr-1"></i> Documento asociado: 
                            <strong>{{ mov.attachedDocument.title }}</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Línea e Indicador de Flujo entre Estaciones -->
                  <div class="dept-flow-connector" *ngIf="!isLast">
                    <div class="flow-line-vertical"></div>
                    <div class="flow-arrow-pill">
                      <i class="pi pi-arrow-down mr-1"></i>
                      <span>Flujo / Derivación a Siguiente Estación</span>
                    </div>
                    <div class="flow-line-vertical"></div>
                  </div>
                </ng-container>
              </div>

              <ng-template #noMovementsTpl>
                <div class="empty-folder-state">
                  <p>No hay eventos de trazabilidad registrados.</p>
                </div>
              </ng-template>
            </div>

            <!-- TAB 3: DATOS DEL SOLICITANTE -->
            <div *ngIf="activeFolderTab === 'applicant'" class="applicant-view animate-fade-in">
              <div class="applicant-card-full">
                <div class="card-avatar">
                  <i class="pi pi-user"></i>
                </div>
                <div class="applicant-main-info">
                  <h3>{{ selectedProcedure.applicantName }}</h3>
                  <p class="inst-line" *ngIf="selectedProcedure.applicantInstitution">
                    <i class="pi pi-building mr-1"></i> {{ selectedProcedure.applicantInstitution }}
                  </p>
                </div>

                <div class="applicant-grid-details">
                  <div class="detail-item">
                    <label><i class="pi pi-id-card mr-1"></i> Identificación / Cédula / RUC</label>
                    <span>{{ selectedProcedure.applicantId || 'No especificada' }}</span>
                  </div>
                  <div class="detail-item">
                    <label><i class="pi pi-envelope mr-1"></i> Correo Electrónico</label>
                    <span>{{ selectedProcedure.applicantEmail || 'No especificado' }}</span>
                  </div>
                  <div class="detail-item">
                    <label><i class="pi pi-phone mr-1"></i> Teléfono / Celular</label>
                    <span>{{ selectedProcedure.applicantPhone || 'No especificado' }}</span>
                  </div>
                  <div class="detail-item">
                    <label><i class="pi pi-map-marker mr-1"></i> Dirección Domiciliaria / Institucional</label>
                    <span>{{ selectedProcedure.applicantAddress || 'No especificada' }}</span>
                  </div>
                </div>

                <div class="applicant-actions" *ngIf="selectedProcedure.applicantEmail">
                  <button class="p-button p-button-info" (click)="emailApplicantDirectly()">
                    <i class="pi pi-envelope mr-2"></i> Escribir Correo al Solicitante
                  </button>
                </div>
              </div>
            </div>

            <!-- TAB 4: GESTION ADMINISTRATIVA -->
            <div *ngIf="activeFolderTab === 'manage'" class="manage-view animate-fade-in">
              <div class="admin-panel-card">
                <h4>Reasignación y Control del Expediente</h4>
                <div class="admin-grid">
                  <div class="admin-field">
                    <label>Reasignar Funcionario Responsable:</label>
                    <p-select 
                      [options]="deptUsers" 
                      [(ngModel)]="newAssignee" 
                      optionLabel="name" 
                      optionValue="id"
                      placeholder="Selecciona empleado"
                      styleClass="w-full"
                      appendTo="body"
                    ></p-select>
                  </div>
                  <div class="admin-field">
                    <label>Modificar Estado:</label>
                    <p-select 
                      [options]="statuses" 
                      [(ngModel)]="newStatus" 
                      placeholder="Selecciona estado"
                      styleClass="w-full"
                      appendTo="body"
                    ></p-select>
                  </div>
                </div>
                <button 
                  class="p-button p-button-success mt-4 w-full"
                  (click)="onSaveChanges()"
                >
                  <i class="pi pi-save mr-2"></i> Guardar Cambios Administrativos
                </button>
              </div>
            </div>

          </div>

        </div>
      </p-dialog>

      <!-- ========================================================================= -->
      <!-- SUB-MODAL: AGREGAR DOCUMENTO / OFICIO AL FOLDER -->
      <!-- ========================================================================= -->
      <p-dialog 
        header="Incorporar Documento u Oficio al Expediente" 
        [(visible)]="showAddDocDialog" 
        [modal]="true" 
        [style]="{ width: '1150px', maxWidth: '98vw' }"
        [maximizable]="true"
        appendTo="body"
      >
        <div class="modal-form-content">
          <!-- Selector de Modo de Incorporación -->
          <div class="radio-options mb-2">
            <label class="radio-card" [class.selected]="newDocMode === 'template'">
              <input type="radio" [(ngModel)]="newDocMode" value="template" />
              <span><i class="pi pi-file-edit mr-1"></i> <strong>Redactar en Línea / Plantilla</strong></span>
            </label>
            <label class="radio-card" [class.selected]="newDocMode === 'upload'">
              <input type="radio" [(ngModel)]="newDocMode" value="upload" />
              <span><i class="pi pi-upload mr-1"></i> <strong>Subir Archivo Externo (PDF / Word)</strong></span>
            </label>
          </div>

          <div class="form-group" *ngIf="newDocMode === 'template'">
            <label>Plantilla Institucional (Opcional - Autocompletar Estructura)</label>
            <p-select 
              [options]="templates" 
              [(ngModel)]="newDocTemplateId" 
              optionLabel="name" 
              optionValue="id"
              placeholder="Seleccionar plantilla para autocompletar..."
              styleClass="w-full"
              appendTo="body"
              (onChange)="onNewDocTemplateChange()"
            ></p-select>
          </div>

          <div class="form-group">
            <label>Título del Documento / Oficio *</label>
            <input type="text" [(ngModel)]="newDocTitle" placeholder="Ej: Oficio Nro. 045-2026 / Informe Técnico Nro. 12" class="form-input" />
          </div>

          <div class="form-group">
            <label>Tipo de Documento</label>
            <p-select 
              [options]="documentTypes" 
              [(ngModel)]="newDocTypeId" 
              optionLabel="name" 
              optionValue="id"
              placeholder="Seleccione tipo (Oficio, Memorando, Informe, etc.)"
              styleClass="w-full"
              appendTo="body"
            ></p-select>
          </div>

          <!-- MODO 1: EDITOR DE TEXTO ENRIQUECIDO CON LA PLANTILLA -->
          <div class="form-group" *ngIf="newDocMode === 'template'">
            <label>Cuerpo del Documento / Contenido de la Plantilla *</label>
            <app-rich-editor [(ngModel)]="newDocContent" [dynamicValues]="newDocEditorVars"></app-rich-editor>
          </div>

          <!-- MODO 2: SUBIR ARCHIVO EXTERNO -->
          <div class="form-group" *ngIf="newDocMode === 'upload'">
            <label>Descripción / Contenido Breve</label>
            <textarea [(ngModel)]="newDocDesc" rows="3" class="form-input" placeholder="Resumen del documento..."></textarea>
          </div>

          <div class="form-group" *ngIf="newDocMode === 'upload'">
            <label>Archivo Adjunto (PDF / Word / Imagen)</label>
            <input type="file" (change)="onDocFileSelected($event)" class="file-input" />
          </div>

          <div class="modal-buttons">
            <button class="p-button p-button-text p-button-secondary" (click)="showAddDocDialog = false">Cancelar</button>
            <button class="p-button p-button-primary" [disabled]="!newDocTitle" (click)="saveNewDocument()">
              <i class="pi pi-check mr-1"></i> Incorporar al Folder
            </button>
          </div>
        </div>
      </p-dialog>

      <!-- ========================================================================= -->
      <!-- SUB-MODAL: FIRMA ELECTRÓNICA DE DOCUMENTO -->
      <!-- ========================================================================= -->
      <p-dialog 
        header="Firma Electrónica de Documento" 
        [(visible)]="showSignDialog" 
        [modal]="true" 
        [style]="{ width: '580px' }"
        appendTo="body"
      >
        <div class="modal-form-content" *ngIf="docToSign">
          <div class="signing-banner">
            <i class="pi pi-file-edit text-indigo-400"></i>
            <div>
              <strong>Documento a Firmar:</strong>
              <p>{{ docToSign.title }}</p>
            </div>
          </div>

          <div class="form-group">
            <label>Tipo de Firma</label>
            <div class="radio-options">
              <label class="radio-card" [class.selected]="signType === 'P12_DIGITAL'">
                <input type="radio" [(ngModel)]="signType" value="P12_DIGITAL" />
                <span>Certificado Digital (.p12 / .pfx)</span>
              </label>
              <label class="radio-card" [class.selected]="signType === 'ELECTRONICA_CRIPTOGRAFICA'">
                <input type="radio" [(ngModel)]="signType" value="ELECTRONICA_CRIPTOGRAFICA" />
                <span>Firma Electrónica Institucional</span>
              </label>
            </div>
          </div>

          <div *ngIf="signType === 'P12_DIGITAL'">
            <div class="form-group">
              <label>Archivo de Certificado (.p12 / .pfx) *</label>
              <input type="file" (change)="onCertFileSelected($event)" accept=".p12,.pfx" class="file-input" />
            </div>

            <div class="form-group">
              <label>Contraseña del Certificado *</label>
              <input type="password" [(ngModel)]="signPassword" placeholder="Ingrese clave privada del certificado" class="form-input" />
            </div>
          </div>

          <div class="form-group">
            <label>Motivo / Razón de la Firma</label>
            <input type="text" [(ngModel)]="signReason" placeholder="Ej: Aprobación de informe técnico / Emisión de oficio" class="form-input" />
          </div>

          <div class="modal-buttons">
            <button class="p-button p-button-text p-button-secondary" (click)="showSignDialog = false">Cancelar</button>
            <button class="p-button p-button-success" [disabled]="signingLoading" (click)="executeSignature()">
              <i class="pi pi-check-circle mr-1"></i> {{ signingLoading ? 'Sellando Firma...' : 'Estampar Firma Electrónica' }}
            </button>
          </div>
        </div>
      </p-dialog>

      <!-- ========================================================================= -->
      <!-- SUB-MODAL: DERIVAR TRÁMITE A OTRO DEPARTAMENTO (PARA / CC) -->
      <!-- ========================================================================= -->
      <p-dialog 
        header="Derivar Expediente a Otro Departamento" 
        [(visible)]="showDeriveDialog" 
        [modal]="true" 
        [style]="{ width: '650px' }"
        appendTo="body"
      >
        <div class="modal-form-content">
          <div class="form-group">
            <label>Departamento de Destino *</label>
            <p-select 
              [options]="availableDepartmentsForDerive" 
              [(ngModel)]="deriveDeptId" 
              optionLabel="name" 
              optionValue="id" 
              placeholder="Seleccione departamento destino"
              styleClass="w-full"
              appendTo="body"
              (onChange)="onDeriveDeptChange()"
            ></p-select>
          </div>

          <div class="form-group">
            <label>Funcionario Asignado (Opcional - Dejar vacío para Bandeja General)</label>
            <p-select 
              [options]="deriveUsers" 
              [(ngModel)]="deriveUserId" 
              optionLabel="name" 
              optionValue="id"
              placeholder="Seleccionar funcionario"
              styleClass="w-full"
              appendTo="body"
            ></p-select>
          </div>

          <div class="form-group">
            <label>Tipo de Envío</label>
            <div class="radio-options">
              <label class="radio-card" [class.selected]="deriveTypeEnvio === 'PARA'">
                <input type="radio" [(ngModel)]="deriveTypeEnvio" value="PARA" />
                <span><strong>PARA:</strong> Trámite / Acción Directa (Pasa Custodia)</span>
              </label>
              <label class="radio-card" [class.selected]="deriveTypeEnvio === 'COPIA'">
                <input type="radio" [(ngModel)]="deriveTypeEnvio" value="COPIA" />
                <span><strong>COPIA (CC):</strong> Conocimiento e Información</span>
              </label>
            </div>
          </div>

          <div class="form-group">
            <label>Proveído / Instrucciones *</label>
            <textarea [(ngModel)]="deriveNotes" rows="3" class="form-input" placeholder="Indique la acción que debe realizar el departamento destino..."></textarea>
          </div>

          <div class="form-group">
            <label>Copias de Notificación por Correo (CC adicionales)</label>
            <input type="text" [(ngModel)]="deriveCcEmails" placeholder="correos separados por coma: auditoria@gob.ec, legal@gob.ec" class="form-input" />
          </div>

          <div class="modal-buttons">
            <button class="p-button p-button-text p-button-secondary" (click)="showDeriveDialog = false">Cancelar</button>
            <button class="p-button p-button-primary" [disabled]="!deriveDeptId || !deriveNotes" (click)="executeDerivation()">
              <i class="pi pi-send mr-1"></i> Confirmar y Derivar
            </button>
          </div>
        </div>
      </p-dialog>

      <!-- ========================================================================= -->
      <!-- SUB-MODAL: ENVIAR CORREO ELECTRÓNICO CON ADJUNTOS -->
      <!-- ========================================================================= -->
      <p-dialog 
        header="Enviar Notificación por Correo Electrónico" 
        [(visible)]="showEmailDialog" 
        [modal]="true" 
        [style]="{ width: '650px' }"
        appendTo="body"
      >
        <div class="modal-form-content">
          <div class="form-group">
            <label>Destinatarios Principales (Para / TO) *</label>
            <input type="text" [(ngModel)]="emailTo" placeholder="ej: solicitante@gmail.com, usuario@empresa.com" class="form-input" />
          </div>

          <div class="form-group">
            <label>Con Copia (CC)</label>
            <input type="text" [(ngModel)]="emailCc" placeholder="ej: director@institucion.gob, jefe@institucion.gob" class="form-input" />
          </div>

          <div class="form-group">
            <label>Asunto *</label>
            <input type="text" [(ngModel)]="emailSubject" class="form-input" />
          </div>

          <div class="form-group">
            <label>Mensaje / Cuerpo del Correo *</label>
            <textarea [(ngModel)]="emailMessage" rows="4" class="form-input" placeholder="Escriba el comunicado o resolución..."></textarea>
          </div>

          <!-- Selección de Documentos del Folder a Adjuntar -->
          <div class="form-group" *ngIf="selectedProcedure && selectedProcedure.documents && selectedProcedure.documents.length > 0">
            <label>Adjuntar Documentos del Expediente:</label>
            <div class="attachment-selector">
              <div class="attachment-item" *ngFor="let d of selectedProcedure.documents">
                <input type="checkbox" [value]="d.id" (change)="toggleDocAttachment(d.id, $event)" />
                <span>{{ d.title }}</span>
              </div>
            </div>
          </div>

          <div class="modal-buttons">
            <button class="p-button p-button-text p-button-secondary" (click)="showEmailDialog = false">Cancelar</button>
            <button class="p-button p-button-info" [disabled]="!emailTo || !emailMessage" (click)="executeSendEmail()">
              <i class="pi pi-send mr-1"></i> Enviar Correo
            </button>
          </div>
        </div>
      </p-dialog>

      <!-- ========================================================================= -->
      <!-- SUB-MODAL: FINALIZAR TRÁMITE -->
      <!-- ========================================================================= -->
      <p-dialog 
        header="Finalizar Expediente / Conclusión" 
        [(visible)]="showFinalizeDialog" 
        [modal]="true" 
        [style]="{ width: '550px' }"
        appendTo="body"
      >
        <div class="modal-form-content">
          <p>Al finalizar el expediente, se cerrará el flujo de atención y se registrará la resolución final.</p>

          <div class="form-group">
            <label>Conclusión / Dictamen Final *</label>
            <textarea [(ngModel)]="finalizeConclusion" rows="4" class="form-input" placeholder="Describa el resultado o resolución del trámite..."></textarea>
          </div>

          <div class="form-checkbox">
            <input type="checkbox" id="chkNotify" [(ngModel)]="finalizeSendEmail" />
            <label for="chkNotify">Enviar resolución automáticamente por correo al solicitante</label>
          </div>

          <div class="modal-buttons">
            <button class="p-button p-button-text p-button-secondary" (click)="showFinalizeDialog = false">Cancelar</button>
            <button class="p-button p-button-success" [disabled]="!finalizeConclusion" (click)="executeFinalize()">
              <i class="pi pi-check-circle mr-1"></i> Finalizar Expediente
            </button>
          </div>
        </div>
      </p-dialog>

      <!-- ========================================================================= -->
      <!-- SUB-MODAL: DEVOLVER / OBSERVAR -->
      <!-- ========================================================================= -->
      <p-dialog 
        header="Devolver / Observar Expediente" 
        [(visible)]="showReturnDialog" 
        [modal]="true" 
        [style]="{ width: '550px' }"
        appendTo="body"
      >
        <div class="modal-form-content">
          <div class="form-group">
            <label>Motivo de Devolución u Observaciones Técnicas *</label>
            <textarea [(ngModel)]="returnNotes" rows="4" class="form-input" placeholder="Indique qué recaudos o correcciones son requeridos..."></textarea>
          </div>

          <div class="modal-buttons">
            <button class="p-button p-button-text p-button-secondary" (click)="showReturnDialog = false">Cancelar</button>
            <button class="p-button p-button-warn" [disabled]="!returnNotes" (click)="executeReturn()">
              <i class="pi pi-replay mr-1"></i> Devolver con Observaciones
            </button>
          </div>
        </div>
      </p-dialog>

      <!-- ========================================================================= -->
      <!-- SUB-MODAL: REABRIR EXPEDIENTE SELLADO (SOLO ADMINISTRADOR) -->
      <!-- ========================================================================= -->
      <p-dialog 
        header="Reapertura de Expediente Finalizado" 
        [(visible)]="showReopenDialog" 
        [modal]="true" 
        [style]="{ width: '560px' }"
        appendTo="body"
      >
        <div class="modal-form-content">
          <div class="reopen-alert-box mb-3">
            <i class="pi pi-exclamation-circle text-orange-500 mr-2" style="font-size: 1.4rem;"></i>
            <div>
              <strong style="color: #92400e;">Reapertura con Auditoría Criptográfica</strong>
              <p style="margin: 0.25rem 0 0; font-size: 0.83rem; color: #475569;">
                Esta acción removerá temporalmente el sello de inmutabilidad del expediente para permitir subsanaciones o firmas pendientes.
                El sello anterior quedará registrado en la bitácora junto con su justificación técnica obligatoria.
              </p>
            </div>
          </div>

          <div class="form-group">
            <label>Justificación Técnica Obligatoria * (mínimo 5 caracteres)</label>
            <textarea [(ngModel)]="reopenReason" rows="4" class="form-input" placeholder="Indique claramente el motivo legal o técnico por el cual se autoriza la reapertura de este expediente..."></textarea>
          </div>

          <div class="modal-buttons mt-3">
            <button class="p-button p-button-text p-button-secondary" (click)="showReopenDialog = false">Cancelar</button>
            <button class="p-button p-button-warning" [disabled]="!reopenReason || reopenReason.trim().length < 5 || reopening" (click)="executeReopen()">
              <i class="pi pi-spin pi-spinner mr-1" *ngIf="reopening"></i>
              <i class="pi pi-undo mr-1" *ngIf="!reopening"></i> Autorizar Reapertura
            </button>
          </div>
        </div>
      </p-dialog>

      <!-- ========================================================================= -->
      <!-- SUB-MODAL: CONFIRMAR ELIMINACIÓN DE EXPEDIENTE (SOLO REGISTRADO) -->
      <!-- ========================================================================= -->
      <p-dialog 
        header="Confirmar Eliminación Definitiva" 
        [(visible)]="showDeleteDialog" 
        [modal]="true" 
        [style]="{ width: '480px' }"
        appendTo="body"
      >
        <div class="modal-form-content" *ngIf="procToDelete">
          <div class="delete-warning-box">
            <i class="pi pi-exclamation-triangle delete-warn-icon"></i>
            <div>
              <h4 style="margin: 0 0 0.25rem 0; color: #b91c1c;">¿Desea eliminar este expediente?</h4>
              <p style="margin: 0; font-size: 0.85rem; color: #475569;">
                Se eliminará permanentemente el expediente <strong>{{ procToDelete.code }}</strong> y todos sus documentos anexos.
              </p>
            </div>
          </div>

          <p style="font-size: 0.8rem; color: #64748b; margin: 0.5rem 0;">
            <em>Nota: Esta acción solo está permitida mientras el trámite permanezca en estado <strong>REGISTRADO</strong> y no se puede deshacer.</em>
          </p>

          <div class="modal-buttons mt-3">
            <button class="p-button p-button-text p-button-secondary" (click)="showDeleteDialog = false">Cancelar</button>
            <button class="p-button p-button-danger" [disabled]="deletingLoading" (click)="executeDeleteProcedure()">
              <i class="pi pi-spin pi-spinner mr-1" *ngIf="deletingLoading"></i>
              <i class="pi pi-trash mr-1" *ngIf="!deletingLoading"></i> Eliminar Definitivamente
            </button>
          </div>
        </div>
      </p-dialog>

    </div>
  `,
  styles: [`
    .procedure-list-page {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    /* Encabezado */
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
      letter-spacing: -0.02em;
    }
    .page-header p {
      font-size: 0.88rem;
      color: #64748b;
      margin: 0.25rem 0 0;
    }
    :host ::ng-deep .btn-create {
      background: #1d4ed8 !important;
      border: 1px solid #1e40af !important;
      border-radius: 7px !important;
      padding: 0.55rem 1.15rem !important;
      font-weight: 600 !important;
      color: #ffffff !important;
      box-shadow: 0 2px 8px rgba(29, 78, 216, 0.25);
    }
    :host ::ng-deep .btn-create:hover {
      background: #1e40af !important;
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
    }
    .stat-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 1rem 1.2rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      transition: all 0.2s ease;
    }
    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);
    }
    .stat-icon {
      width: 44px;
      height: 44px;
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.3rem;
    }
    .stat-pending { border-left: 4px solid #f59e0b; }
    .stat-pending .stat-icon { background: #fef3c7; color: #d97706; }

    .stat-received { border-left: 4px solid #2563eb; }
    .stat-received .stat-icon { background: #eff6ff; color: #1d4ed8; }

    .stat-derived { border-left: 4px solid #7c3aed; }
    .stat-derived .stat-icon { background: #f5f3ff; color: #6d28d9; }

    .stat-finished { border-left: 4px solid #059669; }
    .stat-finished .stat-icon { background: #ecfdf5; color: #047857; }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.1;
      display: block;
    }
    .stat-label {
      font-size: 0.78rem;
      color: #64748b;
      margin-top: 0.2rem;
      font-weight: 500;
      display: block;
    }

    /* Toolbar & Search */
    .toolbar-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.8rem;
      background: #ffffff;
      padding: 0.75rem 1rem;
      border-radius: 10px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
    }
    .tabs-container {
      display: flex;
      gap: 0.4rem;
    }
    .tab-btn {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      color: #475569;
      padding: 0.5rem 0.9rem;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.82rem;
      display: flex;
      align-items: center;
      transition: all 0.15s ease;
    }
    .tab-btn:hover {
      color: #0f172a;
      background: #f1f5f9;
    }
    .tab-btn.active-tab {
      background: #1d4ed8;
      color: #ffffff;
      border-color: #1d4ed8;
    }
    .search-box {
      position: relative;
      flex: 1;
      max-width: 380px;
    }
    .search-icon {
      position: absolute;
      left: 10px;
      top: 50%;
      transform: translateY(-50%);
      color: #94a3b8;
    }
    .search-input {
      width: 100%;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 0.5rem 0.75rem 0.5rem 2rem;
      color: #0f172a;
      font-size: 0.82rem;
      outline: none;
    }
    .search-input:focus {
      background: #ffffff;
      border-color: #1d4ed8;
    }

    /* Table Styles */
    .table-card {
      background: #ffffff;
      border-radius: 10px;
      border: 1px solid #e2e8f0;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }
    .proc-code-cell {
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    .proc-code-text {
      color: #0f172a;
      font-weight: 700;
      font-size: 0.85rem;
    }
    .proc-subject-cell {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }
    .subject-text {
      font-weight: 600;
      color: #1e293b;
      font-size: 0.85rem;
    }
    .applicant-meta {
      color: #64748b;
      font-size: 0.75rem;
    }
    .institution-tag {
      color: #1d4ed8;
      font-weight: 600;
    }
    .assignee-cell {
      display: flex;
      flex-direction: column;
    }
    .assignee-name {
      color: #1e293b;
      font-weight: 500;
      font-size: 0.83rem;
    }
    .dept-name {
      color: #64748b;
      font-size: 0.72rem;
    }
    .proc-date-cell {
      color: #475569;
      font-size: 0.82rem;
    }
    .badge-docs {
      padding: 0.2rem 0.5rem;
      border-radius: 5px;
      font-size: 0.72rem;
      font-weight: 600;
      background: #f1f5f9;
      color: #475569;
      border: 1px solid #e2e8f0;
    }
    .badge-docs.has-docs {
      background: #eff6ff;
      color: #1d4ed8;
      border: 1px solid #bfdbfe;
    }
    .table-actions-cell {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
    }
    .btn-open-folder {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      color: #1d4ed8;
      padding: 0.35rem 0.75rem;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.78rem;
      transition: all 0.15s ease;
    }
    .btn-open-folder:hover {
      background: #1d4ed8;
      color: #ffffff;
      border-color: #1d4ed8;
    }
    .btn-delete-folder {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #dc2626;
      padding: 0.35rem 0.55rem;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.78rem;
      transition: all 0.15s ease;
    }
    .btn-delete-folder:hover {
      background: #dc2626;
      color: #ffffff;
      border-color: #dc2626;
    }
    .btn-delete-folder-large {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #dc2626;
    }
    .btn-delete-folder-large:hover {
      background: #dc2626;
      color: #ffffff;
      border-color: #dc2626;
    }
    .delete-warning-box {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      background: #fef2f2;
      border: 1px solid #fecaca;
      padding: 0.85rem 1rem;
      border-radius: 8px;
    }
    .delete-warn-icon {
      font-size: 1.8rem;
      color: #dc2626;
    }

    /* Modal Expediente */
    .expediente-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      height: 100%;
    }
    .expediente-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f8fafc;
      padding: 1rem 1.2rem;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      border-left: 4px solid #1d4ed8;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }
    .folder-badge {
      background: #1d4ed8;
      color: #ffffff;
      padding: 0.25rem 0.6rem;
      border-radius: 5px;
      font-weight: 700;
      font-size: 0.72rem;
    }
    .expediente-header h2 {
      margin: 0;
      font-size: 1.25rem;
      color: #0f172a;
      font-weight: 800;
    }
    .exp-subject {
      margin: 0.15rem 0 0;
      color: #475569;
      font-size: 0.85rem;
    }

    /* Immutability Banner */
    .immutability-banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      padding: 0.85rem 1.15rem;
      border-radius: 9px;
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      transition: all 0.2s ease;
    }
    .immutability-banner.seal-valid {
      background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%);
      border: 1.5px solid #6ee7b7;
      color: #065f46;
    }
    .immutability-banner.seal-invalid {
      background: linear-gradient(135deg, #fef2f2 0%, #fff1f2 100%);
      border: 1.5px solid #fca5a5;
      color: #991b1b;
      animation: pulseAlert 1.5s infinite alternate;
    }
    @keyframes pulseAlert {
      from { box-shadow: 0 0 0 rgba(239, 68, 68, 0); }
      to { box-shadow: 0 0 12px rgba(239, 68, 68, 0.35); }
    }
    .seal-banner-left {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      flex: 1;
    }
    .seal-icon-box {
      font-size: 1.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.85);
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      flex-shrink: 0;
    }
    .seal-info-text {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }
    .seal-title {
      font-size: 0.92rem;
      font-weight: 700;
    }
    .seal-hash-display {
      font-size: 0.78rem;
      color: #475569;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.4rem;
    }
    .seal-hash-display code {
      background: rgba(0, 0, 0, 0.05);
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
      font-family: monospace;
      font-weight: 600;
      word-break: break-all;
    }
    .seal-alert-note {
      font-size: 0.8rem;
      font-weight: 600;
      color: #b91c1c;
      margin-top: 0.2rem;
    }
    .seal-banner-actions {
      display: flex;
      gap: 0.4rem;
      flex-shrink: 0;
    }
    .btn-seal-action {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      padding: 0.35rem 0.75rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      color: #334155;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      transition: all 0.15s;
    }
    .btn-seal-action:hover {
      background: #f1f5f9;
      border-color: #94a3b8;
    }
    .btn-verify-seal {
      background: #047857;
      color: #ffffff;
    }
    .btn-verify-seal:hover {
      background: #065f46;
    }
    .btn-reopen {
      background: #d97706;
      color: #ffffff;
    }
    .btn-reopen:hover {
      background: #b45309;
    }
    .badge-sealed-doc {
      font-size: 0.72rem;
      font-weight: 700;
      color: #047857;
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      padding: 0.25rem 0.6rem;
      border-radius: 6px;
      display: inline-flex;
      align-items: center;
    }
    .reopen-alert-box {
      display: flex;
      align-items: flex-start;
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 8px;
      padding: 0.85rem;
    }

    /* Actions Bar */
    .folder-actions-bar {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      background: #f8fafc;
      padding: 0.65rem;
      border-radius: 7px;
      border: 1px solid #e2e8f0;
    }
    .action-btn {
      padding: 0.45rem 0.85rem;
      border-radius: 6px;
      border: none;
      font-weight: 600;
      font-size: 0.8rem;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      transition: all 0.15s ease;
    }
    .btn-add-doc { background: #1d4ed8; color: #ffffff; }
    .btn-add-doc:hover { background: #1e40af; }
    .btn-derive { background: #0284c7; color: #ffffff; }
    .btn-derive:hover { background: #0369a1; }
    .btn-email { background: #475569; color: #ffffff; }
    .btn-email:hover { background: #334155; }
    .btn-return { background: #d97706; color: #ffffff; }
    .btn-return:hover { background: #b45309; }
    .btn-finalize { background: #059669; color: #ffffff; }
    .btn-finalize:hover { background: #047857; }
    .btn-zip { background: #0f766e; color: #ffffff; text-decoration: none; }
    .btn-zip:hover { background: #115e59; }
    .btn-track { background: #4338ca; color: #ffffff; text-decoration: none; }
    .btn-track:hover { background: #3730a3; }

    /* Tabs */
    .exp-tabs {
      display: flex;
      gap: 0.35rem;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 0.2rem;
    }
    .exp-tab {
      background: transparent;
      border: none;
      color: #64748b;
      padding: 0.55rem 1rem;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.84rem;
      border-radius: 6px 6px 0 0;
      display: flex;
      align-items: center;
      gap: 0.35rem;
      transition: all 0.15s ease;
    }
    .exp-tab:hover {
      color: #0f172a;
      background: #f1f5f9;
    }
    .exp-tab.active {
      color: #1d4ed8;
      border-bottom: 2px solid #1d4ed8;
      background: #eff6ff;
    }

    .tab-content-area {
      flex: 1;
      overflow-y: auto;
      max-height: 52vh;
      padding-right: 0.3rem;
    }
    .section-title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.8rem;
    }
    .section-title-row h3 {
      margin: 0;
      font-size: 1rem;
      font-weight: 700;
      color: #0f172a;
      display: flex;
      align-items: center;
    }
    .doc-count-tag {
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      padding: 0.2rem 0.55rem;
      border-radius: 4px;
      font-size: 0.72rem;
      color: #475569;
      font-weight: 600;
    }

    /* Doc Cards Grid */
    .doc-cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 0.85rem;
    }
    .doc-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 0.9rem;
      display: flex;
      flex-direction: column;
      gap: 0.7rem;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
    }
    .doc-card-header {
      display: flex;
      gap: 0.75rem;
      align-items: flex-start;
    }
    .doc-type-icon {
      font-size: 1.6rem;
    }
    .doc-title-info h4 {
      margin: 0;
      font-size: 0.9rem;
      font-weight: 700;
      color: #0f172a;
    }
    .doc-type-name {
      color: #1d4ed8;
      font-size: 0.72rem;
      font-weight: 600;
    }
    .doc-desc {
      margin: 0;
      font-size: 0.8rem;
      color: #475569;
      line-height: 1.4;
    }
    .signature-box {
      background: #f8fafc;
      padding: 0.6rem;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
      border-left: 3px solid #059669;
    }
    .sig-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.3rem;
    }
    .sig-label {
      font-size: 0.72rem;
      color: #475569;
      font-weight: 600;
    }
    .badge-signed {
      background: #ecfdf5;
      color: #047857;
      border: 1px solid #a7f3d0;
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
      font-size: 0.68rem;
      font-weight: 700;
    }
    .badge-unsigned {
      background: #fffbeb;
      color: #b45309;
      border: 1px solid #fde68a;
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
      font-size: 0.68rem;
      font-weight: 700;
    }
    .signatures-list {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .sig-item {
      font-size: 0.72rem;
      color: #334155;
    }
    .doc-card-actions {
      display: flex;
      gap: 0.5rem;
      margin-top: auto;
    }
    .btn-doc-view {
      flex: 1;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      color: #1e293b;
      text-decoration: none;
      padding: 0.4rem;
      border-radius: 6px;
      text-align: center;
      font-size: 0.75rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .btn-doc-view:hover {
      background: #e2e8f0;
    }
    .btn-doc-sign {
      flex: 1;
      background: #1d4ed8;
      color: #ffffff;
      border: none;
      padding: 0.4rem;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.75rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .btn-doc-sign:hover {
      background: #1e40af;
    }
    .empty-folder-state {
      text-align: center;
      padding: 2.5rem 1rem;
      background: #f8fafc;
      border-radius: 8px;
      border: 1px dashed #cbd5e1;
    }
    .empty-folder-state h4 { margin: 0 0 0.4rem; color: #0f172a; font-weight: 700; }
    .empty-folder-state p { margin: 0; color: #64748b; font-size: 0.82rem; }

    /* Timeline */
    .timeline-container-grouped {
      display: flex;
      flex-direction: column;
      gap: 0;
    }
    .dept-flow-connector {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin: 0.25rem 0;
      user-select: none;
    }
    .flow-line-vertical {
      width: 2px;
      height: 16px;
      background: #94a3b8;
    }
    .flow-arrow-pill {
      display: inline-flex;
      align-items: center;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      color: #1d4ed8;
      font-size: 0.72rem;
      font-weight: 700;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }
    .flow-arrow-pill i {
      font-size: 0.75rem;
      color: #2563eb;
    }
    .dept-timeline-stage {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      padding: 1rem 1.25rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      transition: all 0.2s ease;
    }
    .dept-timeline-stage:hover {
      border-color: #94a3b8;
    }
    .dept-stage-header {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      user-select: none;
    }
    .clickable-stage {
      cursor: pointer;
    }
    .dept-timeline-stage.is-expanded .dept-stage-header {
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 0.85rem;
      margin-bottom: 1rem;
    }
    .dept-stage-badge {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: #eff6ff;
      color: #1d4ed8;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.15rem;
      border: 1px solid #bfdbfe;
    }
    .dept-stage-title-box {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }
    .stage-step-tag {
      font-size: 0.7rem;
      font-weight: 700;
      color: #4f46e5;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .dept-stage-title-box h4 {
      margin: 0;
      font-size: 1.05rem;
      color: #0f172a;
      font-weight: 800;
    }
    .dept-stage-count {
      background: #e2e8f0;
      color: #334155;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.25rem 0.65rem;
      border-radius: 12px;
    }
    .stage-toggle-btn {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      color: #475569;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s ease;
      font-size: 0.85rem;
    }
    .clickable-stage:hover .stage-toggle-btn {
      background: #eff6ff;
      border-color: #3b82f6;
      color: #1d4ed8;
    }
    .dept-events-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding-left: 2rem;
      position: relative;
    }
    .dept-events-list::before {
      content: '';
      position: absolute;
      left: 14px;
      top: 14px;
      bottom: 14px;
      width: 2px;
      background: #cbd5e1;
    }
    .timeline-item {
      position: relative;
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
    }
    .timeline-badge {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
      position: absolute;
      left: -33px;
      top: 10px;
      background: #ffffff;
      border: 2px solid #1d4ed8;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      z-index: 2;
    }
    .timeline-card {
      flex: 1;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }
    .mov-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .mov-action-tag {
      padding: 0.15rem 0.55rem;
      border-radius: 4px;
      font-size: 0.7rem;
      font-weight: 700;
    }
    .badge-creacion { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
    .badge-derivacion { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
    .badge-firma { background: #f5f3ff; color: #6d28d9; border: 1px solid #ddd6fe; }
    .badge-doc { background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; }
    .badge-correo { background: #fffbeb; color: #b45309; border: 1px solid #fde68a; }
    .badge-fin { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
    .badge-dev { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }

    .mov-date {
      color: #64748b;
      font-size: 0.72rem;
    }
    .mov-actors {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.8rem;
      color: #334155;
      background: #f8fafc;
      padding: 0.5rem 0.75rem;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
    }
    .actor-box {
      display: flex;
      flex-direction: column;
    }
    .actor-box strong {
      font-size: 0.7rem;
      color: #64748b;
    }
    .envio-tag {
      color: #b45309;
      font-weight: 700;
      margin-left: 0.3rem;
    }
    .mov-notes p {
      margin: 0.15rem 0 0;
      color: #334155;
      font-size: 0.8rem;
    }
    .mov-email-alert {
      background: #fffbeb;
      border-left: 3px solid #d97706;
      padding: 0.4rem 0.6rem;
      border-radius: 4px;
      font-size: 0.72rem;
      color: #92400e;
    }
    .mov-attached-doc {
      font-size: 0.75rem;
      color: #1d4ed8;
    }

    /* Applicant View */
    .applicant-card-full {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.2rem;
    }
    .card-avatar {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: #eff6ff;
      color: #1d4ed8;
      border: 1px solid #bfdbfe;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.6rem;
    }
    .applicant-main-info {
      text-align: center;
    }
    .applicant-main-info h3 {
      margin: 0;
      font-size: 1.2rem;
      color: #0f172a;
      font-weight: 800;
    }
    .inst-line {
      margin: 0.2rem 0 0;
      color: #1d4ed8;
      font-weight: 600;
      font-size: 0.85rem;
    }
    .applicant-grid-details {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 0.85rem;
      width: 100%;
    }
    .detail-item {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 0.75rem 0.9rem;
      border-radius: 6px;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .detail-item label {
      font-size: 0.72rem;
      color: #64748b;
      font-weight: 600;
    }
    .detail-item span {
      font-size: 0.88rem;
      color: #0f172a;
      font-weight: 600;
    }

    /* Forms */
    .modal-form-content {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .form-group label {
      font-size: 0.78rem;
      font-weight: 600;
      color: #334155;
    }
    .form-input {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 0.5rem 0.75rem;
      color: #0f172a;
      font-size: 0.82rem;
      outline: none;
    }
    .form-input:focus {
      border-color: #1d4ed8;
    }
    .file-input {
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      padding: 0.75rem;
      border-radius: 6px;
      color: #334155;
      font-size: 0.8rem;
    }
    .radio-options {
      display: flex;
      gap: 0.6rem;
    }
    .radio-card {
      flex: 1;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      padding: 0.65rem 0.8rem;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.8rem;
      color: #334155;
      transition: all 0.15s ease;
    }
    .radio-card.selected {
      border-color: #1d4ed8;
      background: #eff6ff;
      color: #1d4ed8;
    }
    .signing-banner {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      padding: 0.75rem;
      border-radius: 6px;
      font-size: 0.82rem;
      color: #1e40af;
    }
    .attachment-selector {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      max-height: 120px;
      overflow-y: auto;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      padding: 0.5rem;
      border-radius: 6px;
    }
    .attachment-item {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.78rem;
      color: #334155;
    }
    .form-checkbox {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.82rem;
      color: #334155;
    }
    .modal-buttons {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      margin-top: 0.6rem;
    }
    .admin-panel-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 1.2rem;
      border-radius: 8px;
    }
    .admin-panel-card h4 {
      margin: 0 0 0.85rem;
      color: #0f172a;
      font-weight: 700;
    }
    .admin-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
  `]
})
export class ProcedureListComponent implements OnInit {
  procedures: any[] = [];
  inboxCounts: any = {};
  activeView: 'inbox' | 'all' = 'inbox';
  searchQuery: string = '';

  // Expediente Activo
  showDetailDialog = false;
  selectedProcedure: any = null;
  activeFolderTab: 'docs' | 'timeline' | 'applicant' | 'manage' = 'docs';

  // Sub-Modales
  showAddDocDialog = false;
  showSignDialog = false;
  showDeriveDialog = false;
  showEmailDialog = false;
  showFinalizeDialog = false;
  showReturnDialog = false;
  showDeleteDialog = false;
  procToDelete: any = null;
  deletingLoading = false;
  downloadingZip = false;

  // Estado de colapso/expansión de estaciones de trazabilidad
  expandedStages: { [key: string]: boolean } = {};

  // Catálogos y datos auxiliares
  documentTypes: any[] = [];
  allDepartments: any[] = [];
  templates: any[] = [];
  deptUsers: any[] = [];
  deriveUsers: any[] = [];
  statuses = ['REGISTRADO', 'RECIBIDO', 'EN_REVISION', 'DERIVADO', 'OBSERVADO', 'FINALIZADO'];

  // Form State: Agregar Documento
  newDocMode: 'template' | 'upload' = 'template';
  newDocTemplateId: string | null = null;
  newDocTitle = '';
  newDocTypeId: string | null = null;
  newDocDesc = '';
  newDocContent = '';
  newDocFile: File | null = null;

  // Form State: Firma Electrónica
  docToSign: any = null;
  signType = 'ELECTRONICA_CRIPTOGRAFICA';
  signCertFile: File | null = null;
  signPassword = '';
  signReason = 'Aprobación y firma de documento institucional';
  signingLoading = false;

  // Form State: Derivar
  deriveDeptId: string | null = null;
  deriveUserId: string | null = null;
  deriveTypeEnvio = 'PARA';
  deriveNotes = '';
  deriveCcEmails = '';

  // Form State: Enviar Correo
  emailTo = '';
  emailCc = '';
  emailSubject = '';
  emailMessage = '';
  emailSelectedDocIds: string[] = [];

  // Form State: Finalizar & Devolver
  finalizeConclusion = '';
  finalizeSendEmail = true;
  returnNotes = '';

  // Form State: Admin
  newAssignee: string | null = null;
  newStatus: string = '';

  // Inmutabilidad y Sello
  sealVerification: any = null;
  verifyingSeal = false;
  immutabilityMode: 'REOPEN' | 'LOCKED' = 'REOPEN';
  showReopenDialog = false;
  reopenReason = '';
  reopening = false;

  constructor(
    private procedureService: ProcedureService,
    private departmentService: DepartmentService,
    private catalogService: CatalogService,
    private templateService: TemplateService,
    private authService: AuthService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  get availableDepartmentsForDerive(): any[] {
    if (!this.allDepartments) return [];
    if (!this.selectedProcedure || !this.selectedProcedure.departmentId) {
      return this.allDepartments;
    }
    return this.allDepartments.filter(d => d.id !== this.selectedProcedure.departmentId);
  }

  get groupedMovementsByDepartment(): any[] {
    if (!this.selectedProcedure || !this.selectedProcedure.movements) return [];
    const groupsMap = new Map<string, any>();
    const orderedGroups: any[] = [];

    for (const mov of this.selectedProcedure.movements) {
      // Si fue una derivación con destino, la estación que recibe el trámite es toDepartment
      // Para creación, agregado de documentos, etc., el departamento activo es toDepartment o fromDepartment
      const dept = mov.toDepartment || mov.fromDepartment;
      const deptKey = dept?.id || dept?.name || 'general';
      const deptName = dept?.name || 'Ventanilla General';

      if (!groupsMap.has(deptKey)) {
        const groupObj = {
          departmentId: deptKey,
          departmentName: deptName,
          movements: [mov]
        };
        groupsMap.set(deptKey, groupObj);
        orderedGroups.push(groupObj);
      } else {
        groupsMap.get(deptKey).movements.push(mov);
      }
    }
    return orderedGroups;
  }

  ngOnInit(): void {
    this.loadProcedures();
    this.loadInboxCounts();
    this.loadCatalogs();
    this.procedureService.getImmutabilityMode().subscribe({
      next: (res) => { if (res?.mode) this.immutabilityMode = res.mode; },
      error: () => {}
    });
  }

  loadProcedures(): void {
    this.procedureService.getProcedures(this.activeView, this.searchQuery).subscribe({
      next: (data) => {
        this.procedures = data;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los trámites.' });
      }
    });
  }

  loadInboxCounts(): void {
    this.procedureService.getInboxCounts().subscribe({
      next: (counts) => {
        this.inboxCounts = { ...(counts || {}) };
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error cargando contadores de trámites', err)
    });
  }

  loadCatalogs(): void {
    this.catalogService.getDocumentTypes().subscribe(types => {
      this.documentTypes = types;
      this.cdr.markForCheck();
    });
    this.departmentService.getDepartments().subscribe(depts => {
      this.allDepartments = depts;
      this.cdr.markForCheck();
    });
    this.templateService.getTemplates().subscribe(temps => {
      this.templates = temps;
      this.cdr.markForCheck();
    });
  }

  changeView(view: 'inbox' | 'all'): void {
    this.activeView = view;
    this.loadProcedures();
  }

  onSearch(): void {
    this.loadProcedures();
  }

  showDetail(id: string): void {
    this.procedureService.getProcedureById(id).subscribe({
      next: (proc) => {
        this.selectedProcedure = proc;
        this.newAssignee = proc.assigneeId;
        this.newStatus = proc.status;
        this.activeFolderTab = 'docs';
        this.expandedStages = {}; // Inician colapsadas por defecto
        this.showDetailDialog = true;
        this.sealVerification = null;

        if (proc.departmentId) {
          this.departmentService.getDepartmentUsers(proc.departmentId).subscribe(users => {
            this.deptUsers = users;
          });
        }

        if (proc.status === 'FINALIZADO' || proc.sealHash) {
          this.verifyCurrentProcedureSeal();
        }

        this.cdr.markForCheck();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el expediente.' });
      }
    });
  }

  isStageExpanded(stageKey: string): boolean {
    return !!this.expandedStages[stageKey];
  }

  toggleStage(stageKey: string): void {
    this.expandedStages[stageKey] = !this.expandedStages[stageKey];
    this.cdr.markForCheck();
  }

  get newDocEditorVars(): any {
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const d = new Date();
    const fecha = `Junín, ${d.getDate()} de ${meses[d.getMonth()]} de ${d.getFullYear()}`;
    return {
      fecha,
      destinatario: this.selectedProcedure?.department?.name ? `Director/a Departamental de ${this.selectedProcedure.department.name}` : undefined,
      asunto: this.newDocTitle || this.selectedProcedure?.subject || '(Asunto)',
      nombre_solicitante: this.selectedProcedure?.applicantName || 'Ciudadano Solicitante',
      codigo_tramite: this.selectedProcedure?.code || 'TRM-EXP'
    };
  }

  // --- SUB-MODAL 1: AGREGAR DOCUMENTO AL FOLDER ---
  openAddDocModal(): void {
    this.newDocMode = 'template';
    this.newDocTemplateId = null;
    this.newDocTitle = '';
    this.newDocTypeId = null;
    this.newDocDesc = '';
    this.newDocContent = '';
    this.newDocFile = null;
    if (this.templates.length === 0) {
      this.templateService.getTemplates().subscribe(t => {
        this.templates = t;
        this.cdr.markForCheck();
      });
    }
    this.showAddDocDialog = true;
  }

  onNewDocTemplateChange(): void {
    if (this.newDocTemplateId) {
      const selected = this.templates.find(t => t.id === this.newDocTemplateId);
      if (selected) {
        if (!this.newDocTitle) {
          this.newDocTitle = selected.name;
        }
        if (selected.typeId) {
          this.newDocTypeId = selected.typeId;
        }
        if (selected.description && !this.newDocDesc) {
          this.newDocDesc = selected.description;
        }
        if (selected.content) {
          this.newDocContent = selected.content;
        }
        this.cdr.markForCheck();
      }
    }
  }

  onDocFileSelected(event: any): void {
    if (event.target.files && event.target.files.length > 0) {
      this.newDocFile = event.target.files[0];
    }
  }

  saveNewDocument(): void {
    if (!this.selectedProcedure) return;

    const formData = new FormData();
    formData.append('title', this.newDocTitle);
    if (this.newDocTypeId) formData.append('typeId', this.newDocTypeId);
    if (this.newDocDesc) formData.append('description', this.newDocDesc);
    
    if (this.newDocMode === 'template' && this.newDocContent) {
      formData.append('content', this.newDocContent);
    }

    if (this.newDocMode === 'upload' && this.newDocFile) {
      formData.append('file', this.newDocFile);
    }

    this.procedureService.addDocumentToProcedure(this.selectedProcedure.id, formData).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Documento Anexado', detail: 'El documento se incorporó al expediente con éxito.' });
        this.showAddDocDialog = false;
        this.showDetail(this.selectedProcedure.id);
        this.loadProcedures();
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.error || 'No se pudo adjuntar el documento.' });
      }
    });
  }

  // --- SUB-MODAL 2: FIRMA ELECTRÓNICA INDIVIDUAL ---
  openSignDocModal(doc: any): void {
    this.docToSign = doc;
    this.signType = 'ELECTRONICA_CRIPTOGRAFICA';
    this.signCertFile = null;
    this.signPassword = '';
    this.signReason = 'Aprobación y firma de documento institucional';
    this.showSignDialog = true;
  }

  onCertFileSelected(event: any): void {
    if (event.target.files && event.target.files.length > 0) {
      this.signCertFile = event.target.files[0];
    }
  }

  executeSignature(): void {
    if (!this.selectedProcedure || !this.docToSign) return;

    this.signingLoading = true;
    const formData = new FormData();
    formData.append('signatureType', this.signType);
    formData.append('reason', this.signReason);
    if (this.signCertFile) formData.append('certificate', this.signCertFile);
    if (this.signPassword) formData.append('password', this.signPassword);

    this.procedureService.signDocumentInProcedure(this.selectedProcedure.id, this.docToSign.id, formData).subscribe({
      next: () => {
        this.signingLoading = false;
        this.showSignDialog = false;
        this.messageService.add({ severity: 'success', summary: 'Firma Exitosa', detail: 'Firma electrónica estampada y validada correctamente.' });
        this.showDetail(this.selectedProcedure.id);
      },
      error: (err) => {
        this.signingLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Firma Fallida', detail: err.error?.error || 'Error al firmar documento.' });
      }
    });
  }

  // --- SUB-MODAL 3: DERIVAR TRÁMITE ---
  openDeriveModal(): void {
    this.deriveDeptId = null;
    this.deriveUserId = null;
    this.deriveTypeEnvio = 'PARA';
    this.deriveNotes = '';
    this.deriveCcEmails = '';
    this.deriveUsers = [];

    // Recargar departamentos para garantizar actualización
    this.departmentService.getDepartments().subscribe(depts => {
      this.allDepartments = depts;
      this.cdr.markForCheck();
    });

    this.showDeriveDialog = true;
    this.cdr.markForCheck();
  }

  onDeriveDeptChange(): void {
    if (this.deriveDeptId) {
      this.departmentService.getDepartmentUsers(this.deriveDeptId).subscribe(users => {
        this.deriveUsers = users;
        this.cdr.markForCheck();
      });
    } else {
      this.deriveUsers = [];
      this.cdr.markForCheck();
    }
  }

  executeDerivation(): void {
    if (!this.selectedProcedure || !this.deriveDeptId) return;

    const ccList = this.deriveCcEmails
      .split(',')
      .map(e => e.trim())
      .filter(e => e.length > 0);

    const payload = {
      toDepartmentId: this.deriveDeptId,
      toUserId: this.deriveUserId,
      typeEnvio: this.deriveTypeEnvio,
      notes: this.deriveNotes,
      sendEmailNotification: true,
      recipients: {
        to: [],
        cc: ccList
      }
    };

    this.procedureService.deriveProcedure(this.selectedProcedure.id, payload).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Derivación Exitosa', detail: 'Expediente derivado y notificado a los destinatarios.' });
        this.showDeriveDialog = false;
        this.showDetail(this.selectedProcedure.id);
        this.loadProcedures();
        this.loadInboxCounts();
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.error || 'No se pudo derivar el trámite.' });
      }
    });
  }

  // --- SUB-MODAL 4: ENVIAR CORREO ---
  openEmailModal(): void {
    if (!this.selectedProcedure) return;
    this.emailTo = this.selectedProcedure.applicantEmail || '';
    this.emailCc = '';
    this.emailSubject = `Notificación sobre Trámite ${this.selectedProcedure.code}`;
    this.emailMessage = `Estimado(a),\n\nNos comunicamos respecto a su expediente ${this.selectedProcedure.code} (${this.selectedProcedure.subject}).`;
    this.emailSelectedDocIds = [];
    this.showEmailDialog = true;
  }

  emailApplicantDirectly(): void {
    this.openEmailModal();
  }

  toggleDocAttachment(docId: string, event: any): void {
    if (event.target.checked) {
      this.emailSelectedDocIds.push(docId);
    } else {
      this.emailSelectedDocIds = this.emailSelectedDocIds.filter(id => id !== docId);
    }
  }

  executeSendEmail(): void {
    if (!this.selectedProcedure) return;

    const toList = this.emailTo.split(',').map(e => e.trim()).filter(Boolean);
    const ccList = this.emailCc.split(',').map(e => e.trim()).filter(Boolean);

    const payload = {
      to: toList,
      cc: ccList,
      subject: this.emailSubject,
      message: this.emailMessage,
      documentIds: this.emailSelectedDocIds
    };

    this.procedureService.sendProcedureEmail(this.selectedProcedure.id, payload).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Correo Enviado', detail: 'Notificación oficial enviada exitosamente.' });
        this.showEmailDialog = false;
        this.showDetail(this.selectedProcedure.id);
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error de Envío', detail: err.error?.error || 'No se pudo enviar el correo.' });
      }
    });
  }

  // --- SUB-MODAL 5: FINALIZAR TRÁMITE ---
  openFinalizeModal(): void {
    this.finalizeConclusion = '';
    this.finalizeSendEmail = true;
    this.showFinalizeDialog = true;
  }

  executeFinalize(): void {
    if (!this.selectedProcedure) return;

    this.procedureService.finalizeProcedure(this.selectedProcedure.id, {
      conclusion: this.finalizeConclusion,
      sendEmailToApplicant: this.finalizeSendEmail
    }).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Trámite Finalizado', detail: 'El expediente ha sido cerrado y registrado en la bitácora.' });
        this.showFinalizeDialog = false;
        this.showDetail(this.selectedProcedure.id);
        this.loadProcedures();
        this.loadInboxCounts();
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.error || 'No se pudo finalizar el trámite.' });
      }
    });
  }

  // --- SUB-MODAL 6: DEVOLVER TRÁMITE ---
  openReturnModal(): void {
    this.returnNotes = '';
    this.showReturnDialog = true;
  }

  executeReturn(): void {
    if (!this.selectedProcedure) return;

    this.procedureService.returnProcedure(this.selectedProcedure.id, {
      notes: this.returnNotes
    }).subscribe({
      next: () => {
        this.messageService.add({ severity: 'warn', summary: 'Trámite Devuelto', detail: 'El expediente fue devuelto con observaciones.' });
        this.showReturnDialog = false;
        this.showDetail(this.selectedProcedure.id);
        this.loadProcedures();
        this.loadInboxCounts();
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.error || 'No se pudo devolver el trámite.' });
      }
    });
  }

  onSaveChanges(): void {
    if (!this.selectedProcedure) return;

    this.procedureService.updateProcedure(this.selectedProcedure.id, {
      assigneeId: this.newAssignee,
      status: this.newStatus
    }).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: 'Cambios administrativos guardados.' });
        this.showDetail(this.selectedProcedure.id);
        this.loadProcedures();
      }
    });
  }

  // Helpers de estilos y texto
  getPriorityClass(priority: string): string {
    switch (priority) {
      case 'URGENTE': return 'priority-urgente';
      case 'ALTA': return 'priority-alta';
      case 'NORMAL': return 'priority-normal';
      default: return 'priority-baja';
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'REGISTRADO': return 'status-registrado';
      case 'RECIBIDO': return 'status-recibido';
      case 'EN_REVISION': return 'status-en-revision';
      case 'DERIVADO': return 'status-derivado';
      case 'OBSERVADO': return 'status-observado';
      case 'FINALIZADO': return 'status-finalizado';
      default: return 'status-registrado';
    }
  }

  getMovementBadgeClass(action: string): string {
    switch (action) {
      case 'CREACION': return 'badge-creacion';
      case 'DERIVACION': return 'badge-derivacion';
      case 'FIRMA_DOCUMENTO': return 'badge-firma';
      case 'AGREGAR_DOCUMENTO': return 'badge-doc';
      case 'ENVIO_CORREO': return 'badge-correo';
      case 'FINALIZACION': return 'badge-fin';
      case 'DEVOLUCION': return 'badge-dev';
      default: return 'badge-creacion';
    }
  }

  getMovementIcon(action: string): string {
    switch (action) {
      case 'CREACION': return 'pi-folder-plus';
      case 'DERIVACION': return 'pi-send';
      case 'FIRMA_DOCUMENTO': return 'pi-verified';
      case 'AGREGAR_DOCUMENTO': return 'pi-file';
      case 'ENVIO_CORREO': return 'pi-envelope';
      case 'FINALIZACION': return 'pi-check-circle';
      case 'DEVOLUCION': return 'pi-replay';
      default: return 'pi-circle-fill';
    }
  }

  getMovementActionName(action: string): string {
    switch (action) {
      case 'CREACION': return 'Apertura de Expediente';
      case 'DERIVACION': return 'Derivación Interdepartamental';
      case 'FIRMA_DOCUMENTO': return 'Firma Electrónica Estampada';
      case 'AGREGAR_DOCUMENTO': return 'Documento Incorporado';
      case 'ENVIO_CORREO': return 'Notificación por Correo';
      case 'FINALIZACION': return 'Resolución y Cierre';
      case 'DEVOLUCION': return 'Devolución con Observaciones';
      case 'REAPERTURA': return 'Reapertura de Expediente';
      default: return action;
    }
  }

  canCreate(): boolean {
    return this.authService.hasAnyPermission(['procedures.create', 'all']) || this.authService.isAdmin();
  }

  canManage(): boolean {
    return this.authService.hasAnyPermission(['procedures.manage', 'all']) || this.authService.isAdmin();
  }

  // --- ELIMINAR EXPEDIENTE (SOLO REGISTRADO) ---
  confirmDeleteProcedure(proc: any): void {
    if (!proc || proc.status !== 'REGISTRADO') {
      this.messageService.add({
        severity: 'warn',
        summary: 'Acción no permitida',
        detail: 'Solo se pueden eliminar expedientes que se encuentren en estado REGISTRADO.'
      });
      return;
    }
    this.procToDelete = proc;
    this.showDeleteDialog = true;
    this.cdr.markForCheck();
  }

  executeDeleteProcedure(): void {
    if (!this.procToDelete) return;

    this.deletingLoading = true;
    this.procedureService.deleteProcedure(this.procToDelete.id).subscribe({
      next: (res) => {
        this.deletingLoading = false;
        this.showDeleteDialog = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Expediente Eliminado',
          detail: res.message || 'El expediente y sus documentos fueron eliminados completamente.'
        });

        // Si estaba abierto el detalle del expediente eliminado, cerrarlo
        if (this.selectedProcedure && this.selectedProcedure.id === this.procToDelete.id) {
          this.showDetailDialog = false;
          this.selectedProcedure = null;
        }

        this.procToDelete = null;
        this.loadProcedures();
        this.loadInboxCounts();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.deletingLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error al Eliminar',
          detail: err.error?.error || 'No se pudo eliminar el expediente.'
        });
        this.cdr.markForCheck();
      }
    });
  }

  // Descarga del expediente comprimido (.ZIP) con autenticación JWT
  downloadDossierZip(proc: any): void {
    if (!proc) return;

    this.downloadingZip = true;
    this.cdr.markForCheck();

    this.procedureService.downloadDossierZip(proc.id).subscribe({
      next: (blob) => {
        this.downloadingZip = false;
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Expediente_${proc.code}.zip`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.messageService.add({
          severity: 'success',
          summary: 'Dossier Descargado',
          detail: `Se descargó el expediente completo ${proc.code} en formato .ZIP`
        });
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.downloadingZip = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error de Descarga',
          detail: 'No se pudo generar el archivo ZIP del expediente.'
        });
        this.cdr.markForCheck();
      }
    });
  }

  // =========================================================================
  // MÉTODOS DE INMUTABILIDAD Y SELLO CRIPTOGRÁFICO (SHA-256)
  // =========================================================================
  verifyCurrentProcedureSeal(): void {
    if (!this.selectedProcedure) return;
    this.verifyingSeal = true;
    this.cdr.markForCheck();

    this.procedureService.verifyProcedure(this.selectedProcedure.id).subscribe({
      next: (res) => {
        this.sealVerification = res;
        this.verifyingSeal = false;
        if (res.sealHash && !this.selectedProcedure.sealHash) {
          this.selectedProcedure.sealHash = res.sealHash;
          this.selectedProcedure.sealedAt = res.sealedAt;
        }
        if (res.mode) {
          this.immutabilityMode = res.mode;
        }
        if (res.valid) {
          this.messageService.add({
            severity: 'success',
            summary: 'Integridad Verificada',
            detail: 'El expediente coincide íntegramente con su sello digital SHA-256.'
          });
        } else if (res.sealed && !res.valid) {
          this.messageService.add({
            severity: 'error',
            summary: 'Alerta de Integridad',
            detail: 'El contenido actual del expediente no coincide con el sello criptográfico almacenado.'
          });
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.verifyingSeal = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error de Verificación',
          detail: err.error?.error || 'No se pudo verificar el sello del expediente.'
        });
        this.cdr.markForCheck();
      }
    });
  }

  copySealHash(): void {
    const hash = this.selectedProcedure?.sealHash || this.sealVerification?.sealHash;
    if (hash) {
      navigator.clipboard.writeText(hash).then(() => {
        this.messageService.add({
          severity: 'info',
          summary: 'Hash Copiado',
          detail: 'El código hash SHA-256 se copió al portapapeles.'
        });
      });
    }
  }

  canReopen(): boolean {
    return this.authService.isAdmin() && this.immutabilityMode !== 'LOCKED';
  }

  openReopenModal(): void {
    this.reopenReason = '';
    this.showReopenDialog = true;
    this.cdr.markForCheck();
  }

  executeReopen(): void {
    if (!this.selectedProcedure || !this.reopenReason || this.reopenReason.trim().length < 5) return;
    this.reopening = true;
    this.cdr.markForCheck();

    this.procedureService.revertProcedure(this.selectedProcedure.id, { reason: this.reopenReason }).subscribe({
      next: () => {
        this.reopening = false;
        this.showReopenDialog = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Expediente Reabierto',
          detail: 'El trámite ha sido reabierto exitosamente para correcciones. Se auditó la acción.'
        });
        this.showDetail(this.selectedProcedure.id);
        this.loadProcedures();
        this.loadInboxCounts();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.reopening = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error al Reabrir',
          detail: err.error?.error || 'No se pudo reabrir el expediente.'
        });
        this.cdr.markForCheck();
      }
    });
  }
}
