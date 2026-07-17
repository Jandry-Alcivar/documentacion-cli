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
      <div *ngIf="document.fileUrl" class="integrity-card" [ngClass]="document.integrity?.isValid ? 'integrity-ok' : 'integrity-fail'">
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
          
          <!-- WYSIWYG Content (Simulado A4 con membrete oficial del GAD Junín) -->
          <div class="internal-content-preview mb-3" *ngIf="document.content && !document.fileUrl">
            <h4 class="mb-3 text-muted">Previsualización de Impresión Oficial (Borrador)</h4>
            
            <div class="paper-container">
              <div id="pdf-visor-preview-area" class="a4-sheet pdf-preview-sheet" (click)="onSheetClick($event)">
                <!-- MEMBRETE OFJUNÍN -->
                <div class="pdf-header">
                  <div class="header-top">
                    <svg width="60" height="60" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M50 5C25 5 20 20 20 50C20 80 50 95 50 95C50 95 80 80 80 50C80 20 75 5 50 5Z" fill="#1e3a8a" stroke="#fbbf24" stroke-width="4"/>
                      <path d="M50 15L60 35H40L50 15Z" fill="#fbbf24"/>
                      <circle cx="50" cy="55" r="15" fill="#22c55e" stroke="#ffffff" stroke-width="2"/>
                      <path d="M50 40V70M35 55H65" stroke="#ffffff" stroke-width="3"/>
                    </svg>
                    <div class="header-text">
                      <h2>GOBIERNO AUTÓNOMO DESCENTRALIZADO</h2>
                      <h1>MUNICIPAL DEL CANTÓN JUNÍN</h1>
                      <p>GAD Junín — Sistema de Gestión Documental Inteligente (G-DOC)</p>
                    </div>
                  </div>
                  <div class="header-divider"></div>
                </div>

                <!-- CUERPO DE DOCUMENTO PROCESADO -->
                <div class="pdf-body" [innerHTML]="processedContent"></div>

                <!-- PIE DE PÁGINA OFICIAL JUNÍN -->
                <div class="pdf-footer">
                  <div class="footer-divider"></div>
                  <div class="footer-bottom">
                    <div class="footer-info">
                      <p>Dirección: Calle Bolívar y Pichincha, Junín, Manabí, Ecuador</p>
                      <p>Teléfono: (05) 2695-123 | Correo: correspondencia&#64;junin.gob.ec</p>
                      <p class="bold-text">Administración Cantonal Junín 2023-2027</p>
                    </div>
                    <div class="footer-qr">
                      <div class="qr-mock">
                        <div class="qr-box"></div>
                        <span>Criptografía SHA256</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
              <p>Como autoridad evaluadora, debes validar y firmar digitalmente este documento con tu certificado de firma electrónica (.p12), o devolverlo al creador.</p>
              <p class="text-sm mb-3" style="font-size: 0.85rem; color: #94a3b8; line-height: 1.4; background: rgba(59, 130, 246, 0.1); padding: 0.6rem; border-radius: 6px; border: 1px solid rgba(59, 130, 246, 0.2);">
                <i class="pi pi-info-circle" style="color: #60a5fa; margin-right: 4px;"></i>
                <strong>Firma Visual:</strong> Para estampar tu firma en un sitio específico de la hoja, ve primero a la pestaña <strong>Visor</strong> y haz clic sobre el lugar exacto. Verás el sello verde de verificación. Luego regresa aquí para completar la firma.
              </p>
              
              <div class="firmar-upload-section mb-3">
                <label class="block mb-2 font-semibold">Cargar Firma Electrónica (.p12) *</label>
                <input type="file" (change)="onCertificateFileSelect($event)" accept=".p12" class="mb-3 block" />
                
                <label class="block mb-2 font-semibold">Contraseña del Certificado *</label>
                <div class="input-icon-wrapper w-full mb-3" style="position: relative;">
                  <i class="pi pi-lock" style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #64748b;"></i>
                  <input 
                    type="password" 
                    [(ngModel)]="certPassword" 
                    placeholder="Contraseña de tu firma .p12" 
                    class="w-full text-box" 
                    style="padding-left: 2.5rem;"
                  />
                </div>
              </div>
              
              <div class="flex-row">
                <p-button 
                  label="Firmar y Aprobar" 
                  icon="pi pi-verified" 
                  styleClass="p-button-success flex-grow"
                  [disabled]="!certificateFile || !certPassword"
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

      <!-- DIÁLOGO PARA UBICAR LA FIRMA VISUAL Y CONFIRMAR -->
      <p-dialog 
        header="Ubicar Firma Electrónica en el Documento" 
        [(visible)]="showSignaturePlacementDialog" 
        [modal]="true" 
        [style]="{width: '850px'}" 
        [contentStyle]="{maxHeight: '650px', overflowY: 'auto'}"
        (onHide)="onPlacementDialogHide()"
      >
        <div class="dialog-placement-content" style="text-align: center;">
          <p class="mb-3 text-muted" style="font-size: 0.9rem; text-align: left; background: rgba(59, 130, 246, 0.1); padding: 0.6rem; border-radius: 6px; border: 1px solid rgba(59, 130, 246, 0.2);">
            <i class="pi pi-info-circle" style="color: #60a5fa; margin-right: 4px;"></i>
            <strong>Instrucción:</strong> Haz clic sobre la hoja del documento en el lugar exacto donde deseas colocar tu firma. Una vez que aparezca el sello verde en la posición deseada, haz clic en <strong>Confirmar Firma y Enviar</strong>.
          </p>

          <div class="paper-container" style="background: #1e293b; padding: 1.5rem; border-radius: 8px; max-height: 500px; display: inline-flex; justify-content: center; width: 100%;">
            <div id="pdf-modal-content-area" class="a4-sheet pdf-preview-sheet" (click)="onModalSheetClick($event)" style="position: relative; box-shadow: 0 4px 20px rgba(0,0,0,0.5); cursor: crosshair;">
              <!-- MEMBRETE OFICIAL JUNÍN -->
              <div class="pdf-header">
                <div class="header-top">
                  <svg width="60" height="60" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M50 5C25 5 20 20 20 50C20 80 50 95 50 95C50 95 80 80 80 50C80 20 75 5 50 5Z" fill="#1e3a8a" stroke="#fbbf24" stroke-width="4"/>
                    <path d="M50 15L60 35H40L50 15Z" fill="#fbbf24"/>
                    <circle cx="50" cy="55" r="15" fill="#22c55e" stroke="#ffffff" stroke-width="2"/>
                    <path d="M50 40V70M35 55H65" stroke="#ffffff" stroke-width="3"/>
                  </svg>
                  <div class="header-text">
                    <h2>GOBIERNO AUTÓNOMO DESCENTRALIZADO</h2>
                    <h1>MUNICIPAL DEL CANTÓN JUNÍN</h1>
                    <p>GAD Junín — Sistema de Gestión Documental Inteligente (G-DOC)</p>
                  </div>
                </div>
                <div class="header-divider"></div>
              </div>

              <!-- CUERPO DE DOCUMENTO PROCESADO -->
              <div class="pdf-body" [innerHTML]="processedContent"></div>

              <!-- FIRMA ELECTRÓNICA VISUAL DENTRO DE LA HOJA (DENTRO DEL MODAL) -->
              <div 
                *ngIf="signaturePos" 
                class="visual-signature-stamp-overlay" 
                [style.left.%]="signaturePos.x" 
                [style.top.%]="signaturePos.y"
                style="transform: translate(-50%, -50%);"
              >
                <div class="stamp-box">
                  <div class="stamp-qr" style="display: flex; align-items: center;">
                    <img *ngIf="signatureDate" [src]="getQrCodeUrl()" alt="QR" style="width: 55px; height: 55px; border: 1px solid #a7f3d0; border-radius: 4px;" />
                  </div>
                  <div class="stamp-details">
                    <span class="stamp-title">FIRMADO ELECTRÓNICAMENTE</span>
                    <strong class="stamp-name">{{ getCurrentUser()?.name }}</strong>
                    <span class="stamp-meta">Cargo: {{ getCurrentUser()?.role?.name || 'Autoridad' }}</span>
                    <span class="stamp-meta">Fecha: {{ signatureDate | date:'yyyy-MM-dd HH:mm' }}</span>
                    <span class="stamp-meta">Entidad: GAD Municipal Junín</span>
                  </div>
                </div>
              </div>

              <!-- PIE DE PÁGINA OFICIAL JUNÍN -->
              <div class="pdf-footer">
                <div class="footer-divider"></div>
                <div class="footer-bottom">
                  <div class="footer-info">
                    <p>Dirección: Calle Bolívar y Pichincha, Junín, Manabí, Ecuador</p>
                    <p>Teléfono: (05) 2695-123 | Correo: correspondencia&#64;junin.gob.ec</p>
                    <p class="bold-text">Administración Cantonal Junín 2023-2027</p>
                  </div>
                  <div class="footer-qr">
                    <div class="qr-mock">
                      <div class="qr-box"></div>
                      <span>Criptografía SHA256</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="dialog-actions mt-4 flex justify-content-end gap-2">
          <p-button label="Cancelar" icon="pi pi-times" styleClass="p-button-text p-button-secondary" (click)="showSignaturePlacementDialog = false"></p-button>
          <p-button 
            label="Confirmar Firma y Enviar" 
            icon="pi pi-check" 
            styleClass="p-button-success" 
            [disabled]="!signaturePos || loading" 
            (click)="executeSigning()"
          ></p-button>
        </div>
      </p-dialog>

      <!-- CONTENEDOR OCULTO PARA GENERACIÓN DE PDF (Con layout activo para html2pdf) -->
      <div style="position: absolute; left: -9999px; top: -9999px; overflow: hidden; width: 210mm; min-height: 297mm; background: #ffffff;">
        <div id="pdf-content-area" class="a4-sheet pdf-preview-sheet" style="box-shadow: none !important; border-radius: 0 !important; width: 210mm; min-height: 297mm; padding: 25mm; box-sizing: border-box; background: #ffffff; color: #1e293b;">
          <!-- MEMBRETE OFICIAL JUNÍN -->
          <div class="pdf-header">
            <div class="header-top">
              <svg width="60" height="60" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M50 5C25 5 20 20 20 50C20 80 50 95 50 95C50 95 80 80 80 50C80 20 75 5 50 5Z" fill="#1e3a8a" stroke="#fbbf24" stroke-width="4"/>
                <path d="M50 15L60 35H40L50 15Z" fill="#fbbf24"/>
                <circle cx="50" cy="55" r="15" fill="#22c55e" stroke="#ffffff" stroke-width="2"/>
                <path d="M50 40V70M35 55H65" stroke="#ffffff" stroke-width="3"/>
              </svg>
              <div class="header-text">
                <h2>GOBIERNO AUTÓNOMO DESCENTRALIZADO</h2>
                <h1>MUNICIPAL DEL CANTÓN JUNÍN</h1>
                <p>GAD Junín — Sistema de Gestión Documental Inteligente (G-DOC)</p>
              </div>
            </div>
            <div class="header-divider"></div>
          </div>

          <!-- CUERPO DE DOCUMENTO PROCESADO -->
          <div class="pdf-body" [innerHTML]="processedContent"></div>

          <!-- FIRMA ELECTRÓNICA VISUAL DENTRO DE LA HOJA -->
          <div 
            *ngIf="signaturePos" 
            class="visual-signature-stamp-overlay" 
            [style.left.%]="signaturePos.x" 
            [style.top.%]="signaturePos.y"
            style="transform: translate(-50%, -50%);"
          >
            <div class="stamp-box">
              <div class="stamp-qr" style="display: flex; align-items: center;">
                <img *ngIf="signatureDate" [src]="getQrCodeUrl()" alt="QR" style="width: 55px; height: 55px; border: 1px solid #a7f3d0; border-radius: 4px;" />
              </div>
              <div class="stamp-details">
                <span class="stamp-title">FIRMADO ELECTRÓNICAMENTE</span>
                <strong class="stamp-name">{{ getCurrentUser()?.name }}</strong>
                <span class="stamp-meta">Cargo: {{ getCurrentUser()?.role?.name || 'Autoridad' }}</span>
                <span class="stamp-meta">Fecha: {{ signatureDate | date:'yyyy-MM-dd HH:mm' }}</span>
                <span class="stamp-meta">Entidad: GAD Municipal Junín</span>
              </div>
            </div>
          </div>

          <!-- PIE DE PÁGINA OFICIAL JUNÍN -->
          <div class="pdf-footer">
            <div class="footer-divider"></div>
            <div class="footer-bottom">
              <div class="footer-info">
                <p>Dirección: Calle Bolívar y Pichincha, Junín, Manabí, Ecuador</p>
                <p>Teléfono: (05) 2695-123 | Correo: correspondencia&#64;junin.gob.ec</p>
                <p class="bold-text">Administración Cantonal Junín 2023-2027</p>
              </div>
              <div class="footer-qr">
                <div class="qr-mock">
                  <div class="qr-box"></div>
                  <span>Criptografía SHA256</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
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

    /* Estilos Hoja A4 y Membrete GAD Junín */
    .paper-container {
      display: flex;
      justify-content: center;
      background: rgba(15, 23, 42, 0.4);
      padding: 2rem;
      border-radius: 8px;
      overflow-x: auto;
      max-height: 800px;
      overflow-y: auto;
      border: 1px solid rgba(255, 255, 255, 0.08);
      margin-top: 1rem;
    }
    .a4-sheet {
      width: 210mm;
      min-height: 297mm;
      padding: 25mm;
      background: #ffffff;
      color: #1e293b;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
      border-radius: 4px;
      font-family: 'Arial', sans-serif;
      font-size: 11pt;
      outline: none;
      box-sizing: border-box;
      text-align: justify;
    }
    .pdf-preview-sheet {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      color: #1e293b !important;
      position: relative;
    }
    .pdf-header {
      display: flex;
      flex-direction: column;
      margin-bottom: 2rem;
    }
    .header-top {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .header-text {
      display: flex;
      flex-direction: column;
      text-align: left;
    }
    .header-text h2 {
      font-size: 8.5pt;
      margin: 0;
      color: #475569;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    .header-text h1 {
      font-size: 13.5pt;
      margin: 0;
      color: #1e3a8a;
      font-weight: 800;
      letter-spacing: 1px;
    }
    .header-text p {
      font-size: 7.5pt;
      margin: 2px 0 0;
      color: #64748b;
    }
    .header-divider {
      height: 3px;
      background: linear-gradient(90deg, #1e3a8a 0%, #fbbf24 50%, #22c55e 100%);
      margin-top: 0.75rem;
      border-radius: 2px;
    }
    .pdf-body {
      flex: 1;
      padding: 0.5rem 0;
      font-size: 11pt;
      color: #0f172a;
      line-height: 1.5;
    }
    .pdf-body ::ng-deep table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #cbd5e1;
      margin: 1rem 0;
    }
    .pdf-body ::ng-deep td {
      border: 1px solid #cbd5e1;
      padding: 8px;
      min-height: 24px;
    }
    .pdf-footer {
      display: flex;
      flex-direction: column;
      margin-top: 2rem;
    }
    .footer-divider {
      height: 1px;
      background: #cbd5e1;
      margin-bottom: 0.5rem;
    }
    .footer-bottom {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .footer-info {
      font-size: 7.5pt;
      color: #64748b;
      line-height: 1.3;
      text-align: left;
    }
    .footer-info p {
      margin: 0;
    }
    .bold-text {
      font-weight: 700;
      color: #475569;
    }
    .footer-qr {
      display: flex;
      align-items: center;
    }
    .qr-mock {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3px;
    }
    .qr-box {
      width: 40px;
      height: 40px;
      border: 1px solid #94a3b8;
      background-image: 
        radial-gradient(#1e293b 25%, transparent 25%),
        radial-gradient(#1e293b 25%, transparent 25%);
      background-size: 8px 8px;
      background-position: 0 0, 4px 4px;
    }
    .qr-mock span {
      font-size: 6pt;
      color: #94a3b8;
    }

    /* Estilo del Sello de Firma Visual */
    .visual-signature-stamp-overlay {
      position: absolute;
      width: 260px;
      height: 90px;
      background: rgba(255, 255, 255, 0.95);
      border: 2px dashed #059669;
      border-radius: 6px;
      padding: 6px;
      color: #047857;
      font-family: 'Courier New', Courier, monospace;
      font-size: 7.5pt;
      line-height: 1.2;
      z-index: 10;
      box-shadow: 0 4px 10px rgba(0,0,0,0.15);
      cursor: pointer;
      text-align: left;
    }
    .stamp-box {
      display: flex;
      gap: 6px;
      align-items: center;
    }
    .stamp-logo {
      color: #059669;
      font-size: 1.6rem;
    }
    .stamp-details {
      display: flex;
      flex-direction: column;
    }
    .stamp-title {
      font-weight: 800;
      font-size: 6.5pt;
      color: #065f46;
      border-bottom: 1px solid #a7f3d0;
      margin-bottom: 2px;
      padding-bottom: 2px;
      letter-spacing: 0.5px;
    }
    .stamp-name {
      font-size: 7.5pt;
      color: #064e3b;
    }
    .stamp-meta {
      font-size: 6.5pt;
      color: #374151;
    }
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
  certificateFile: File | null = null;
  certPassword = '';
  signaturePos: { x: number, y: number } | null = null;
  signatureDate: Date | null = null;
  showSignaturePlacementDialog = false;
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

  get processedContent(): string {
    if (!this.document || !this.document.content) return '';
    let result = this.document.content;

    const d = new Date(this.document.createdAt || new Date());
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const fechaFormatted = `Junín, ${d.getDate()} de ${meses[d.getMonth()]} de ${d.getFullYear()}`;

    const vals = {
      fecha: fechaFormatted,
      destinatario: 'Director(a) de Departamento Municipal',
      encabezado: 'SOLICITUD FORMAL',
      asunto: this.document.title || '(Asunto del Trámite No Registrado)',
      nombre_solicitante: this.document.creator?.name || 'Ciudadano del Cantón Junín',
      codigo_tramite: this.document.procedureId ? `TRM-${this.document.procedureId.substring(0,8).toUpperCase()}` : 'TRM-DETALLE'
    };

    result = result.replace(/\{\{fecha\}\}/g, vals.fecha);
    result = result.replace(/\{\{destinatario\}\}/g, vals.destinatario);
    result = result.replace(/\{\{encabezado\}\}/g, vals.encabezado);
    result = result.replace(/\{\{asunto\}\}/g, vals.asunto);
    result = result.replace(/\{\{nombre_solicitante\}\}/g, vals.nombre_solicitante);
    result = result.replace(/\{\{codigo_tramite\}\}/g, vals.codigo_tramite);

    return result;
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
    if (!this.document || !this.document.fileUrl) return '';
    const cleanUrl = this.document.fileUrl.startsWith('/') 
      ? this.document.fileUrl.replace(/^\/+/, '') 
      : this.document.fileUrl;
    return `http://localhost:3001/${cleanUrl}`;
  }

  getSafePdfUrl(): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(this.getPdfUrl());
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

  onCertificateFileSelect(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.certificateFile = event.target.files[0];
    }
  }

  getCurrentUser() {
    return this.authService.currentUser();
  }

  onSheetClick(event: MouseEvent) {
    if (!this.canApproveOrReject()) return;
    this.onSignAndApprove();
  }

  onModalSheetClick(event: MouseEvent) {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Calcular coordenadas porcentuales relativas al tamaño del contenedor para precisión perfecta
    this.signaturePos = { 
      x: (x / rect.width) * 100, 
      y: (y / rect.height) * 100 
    };
    this.signatureDate = new Date();
    this.cdr.detectChanges();
  }

  onPlacementDialogHide() {
    this.showSignaturePlacementDialog = false;
  }

  getQrCodeUrl(): string {
    if (!this.document) return '';
    const user = this.getCurrentUser();
    const dateStr = this.signatureDate ? this.signatureDate.toISOString() : new Date().toISOString();
    const qrData = `FIRMADO ELECTRONICAMENTE\nFirmante: ${user?.name || ''}\nFecha: ${dateStr}\nValidador: G-DOC GAD JUNIN\nDocID: ${this.document.id}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}`;
  }

  onSignAndApprove() {
    if (!this.certificateFile || !this.certPassword) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Datos Faltantes',
        detail: 'Carga tu archivo de firma .p12 e ingresa la contraseña antes de proceder.'
      });
      return;
    }
    
    // Cargar la librería si aún no se ha cargado
    this.loadHtml2PdfScript();

    // Limpiar firmas previas y abrir el diálogo
    this.signaturePos = null;
    this.signatureDate = null;
    this.showSignaturePlacementDialog = true;
    this.cdr.detectChanges();
  }

  executeSigning() {
    if (!this.certificateFile || !this.certPassword || !this.signaturePos) return;
    this.loading = true;

    const element = document.getElementById('pdf-content-area');
    if (!element) {
      this.loading = false;
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo encontrar el área de impresión del documento.'
      });
      return;
    }

    const opt = {
      margin:       0,
      filename:     `DOCUMENTO_${this.document.id.substring(0,8).toUpperCase()}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    if (!(window as any).html2pdf) {
      setTimeout(() => this.executeSigning(), 1000);
      return;
    }

    // Generar el PDF en memoria y subirlo junto con el certificado .p12 y contraseña
    (window as any).html2pdf().from(element).set(opt).toPdf().outputPdf('arraybuffer').then((arrayBuffer: ArrayBuffer) => {
      const pdfBlob = new Blob([arrayBuffer], { type: 'application/pdf' });
      
      const formData = new FormData();
      formData.append('file', pdfBlob, `DOCUMENTO_${this.document.id.substring(0,8).toUpperCase()}.pdf`);
      formData.append('certificate', this.certificateFile!);
      formData.append('password', this.certPassword);

      this.documentService.signAndApproveDocument(this.document.id, formData).subscribe({
        next: () => {
          this.loading = false;
          this.showSignaturePlacementDialog = false;
          this.certificateFile = null;
          this.certPassword = '';
          this.signaturePos = null;
          this.signatureDate = null;

          this.messageService.add({
            severity: 'success',
            summary: 'Firmado y Aprobado',
            detail: 'El documento ha sido firmado digitalmente (.p12) y aprobado.'
          });
          this.loadDocumentDetails(this.document.id);
          this.activeTab = 'viewer'; // Redirigir al visor para ver el PDF firmado
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
    }).catch((err: any) => {
      this.loading = false;
      console.error('Error al generar PDF:', err);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al compilar el PDF para firma.'
      });
    });
  }

  onFileSelect(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.correctionFile = event.target.files[0];
    }
  }

  loadHtml2PdfScript() {
    if ((window as any).html2pdf) return;
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    script.async = true;
    document.body.appendChild(script);
  }

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
