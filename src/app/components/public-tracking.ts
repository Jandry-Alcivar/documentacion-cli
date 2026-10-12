import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProcedureService } from '../services/procedure.service.js';

@Component({
  selector: 'app-public-tracking',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="tracking-page animate-fade-in">
      
      <!-- Top Institutional Navbar -->
      <header class="tracking-navbar">
        <div class="nav-brand">
          <div class="brand-icon">
            <i class="pi pi-shield"></i>
          </div>
          <div>
            <h1>Portal Ciudadano de Consulta</h1>
            <p>Sistema de Gestión Documental & Trámites Institucionales</p>
          </div>
        </div>
        
        <div class="nav-links">
          <a routerLink="/login" class="btn-staff-login">
            <i class="pi pi-lock mr-1"></i> Acceso Funcionarios
          </a>
        </div>
      </header>

      <main class="tracking-main-container">
        
        <!-- Hero Search Box -->
        <div class="search-hero-card">
          <div class="hero-badge">
            <i class="pi pi-search"></i> SEGUIMIENTO EN LÍNEA 24/7
          </div>
          <h2>Consulta el Estado de tu Trámite</h2>
          <p class="hero-subtext">Ingresa tu número de expediente y documento de identidad para conocer la etapa actual y descargar oficios de respuesta.</p>

          <div class="search-form-row">
            <div class="input-wrapper">
              <label>Número de Trámite / Expediente *</label>
              <div class="input-with-icon">
                <i class="pi pi-folder"></i>
                <input 
                  type="text" 
                  [(ngModel)]="searchCode" 
                  placeholder="Ej: TRM-2026-12345" 
                  (keyup.enter)="onSearch()"
                  class="tracking-input"
                />
              </div>
            </div>

            <div class="input-wrapper">
              <label>Cédula / RUC del Solicitante (Opcional)</label>
              <div class="input-with-icon">
                <i class="pi pi-id-card"></i>
                <input 
                  type="text" 
                  [(ngModel)]="searchApplicantId" 
                  placeholder="Ej: 1312345678" 
                  (keyup.enter)="onSearch()"
                  class="tracking-input"
                />
              </div>
            </div>

            <button 
              class="btn-search-tracking" 
              [disabled]="!searchCode || loading" 
              (click)="onSearch()"
            >
              <i class="pi" [ngClass]="loading ? 'pi-spin pi-spinner' : 'pi-search'"></i>
              <span>{{ loading ? 'Consultando...' : 'Consultar' }}</span>
            </button>
          </div>

          <!-- Error Alert -->
          <div *ngIf="errorMessage" class="error-banner animate-fade-in">
            <i class="pi pi-exclamation-triangle mr-2"></i>
            <span>{{ errorMessage }}</span>
          </div>
        </div>

        <!-- Result Card -->
        <div *ngIf="procedure" class="result-card animate-fade-in">
          
          <!-- Header of Result -->
          <div class="result-header">
            <div class="result-title-group">
              <div class="result-code-tag">
                <i class="pi pi-folder-open"></i> {{ procedure.code }}
              </div>
              <h3>{{ procedure.subject }}</h3>
              <p class="result-reg-date">
                <i class="pi pi-calendar mr-1"></i> Registrado el {{ procedure.createdAt | date:'dd/MM/yyyy, HH:mm' }}
              </p>
            </div>

            <div class="result-status-badge" [ngClass]="getStatusClass(procedure.status)">
              <i class="pi" [ngClass]="getStatusIcon(procedure.status)"></i>
              <span>{{ procedure.status }}</span>
            </div>
          </div>

          <!-- Progress Stepper -->
          <div class="progress-stepper">
            <div class="stepper-step" [class.completed]="isStepCompleted(1)" [class.current]="isStepCurrent(1)">
              <div class="step-circle"><i class="pi pi-check" *ngIf="isStepCompleted(1)"></i><span *ngIf="!isStepCompleted(1)">1</span></div>
              <span class="step-label">1. Registrado</span>
            </div>
            <div class="stepper-line" [class.completed]="isStepCompleted(2)"></div>
            <div class="stepper-step" [class.completed]="isStepCompleted(2)" [class.current]="isStepCurrent(2)">
              <div class="step-circle"><i class="pi pi-check" *ngIf="isStepCompleted(2)"></i><span *ngIf="!isStepCompleted(2)">2</span></div>
              <span class="step-label">2. En Revisión / Derivado</span>
            </div>
            <div class="stepper-line" [class.completed]="isStepCompleted(3)"></div>
            <div class="stepper-step" [class.completed]="isStepCompleted(3)" [class.current]="isStepCurrent(3)">
              <div class="step-circle"><i class="pi pi-check" *ngIf="isStepCompleted(3)"></i><span *ngIf="!isStepCompleted(3)">3</span></div>
              <span class="step-label">3. Oficios & Respuesta</span>
            </div>
            <div class="stepper-line" [class.completed]="isStepCompleted(4)"></div>
            <div class="stepper-step" [class.completed]="isStepCompleted(4)" [class.current]="isStepCurrent(4)">
              <div class="step-circle"><i class="pi pi-check" *ngIf="isStepCompleted(4)"></i><span *ngIf="!isStepCompleted(4)">4</span></div>
              <span class="step-label">4. Finalizado</span>
            </div>
          </div>

          <!-- Info Cards Grid -->
          <div class="info-summary-grid">
            <div class="info-box">
              <div class="box-icon"><i class="pi pi-user"></i></div>
              <div class="box-text">
                <small>Solicitante</small>
                <strong>{{ procedure.applicantName }}</strong>
                <span *ngIf="procedure.applicantInstitution">{{ procedure.applicantInstitution }}</span>
              </div>
            </div>

            <div class="info-box">
              <div class="box-icon text-indigo"><i class="pi pi-building"></i></div>
              <div class="box-text">
                <small>Departamento / Área Actual</small>
                <strong>{{ procedure.department?.name || 'Ventanilla General' }}</strong>
                <span>Tipo: {{ procedure.type?.name || 'General' }}</span>
              </div>
            </div>

            <div class="info-box">
              <div class="box-icon text-green"><i class="pi pi-flag"></i></div>
              <div class="box-text">
                <small>Prioridad y Tiempo Estimado</small>
                <strong>Prioridad: {{ procedure.priority }}</strong>
                <span *ngIf="procedure.type?.estimatedDays">Días estimados: {{ procedure.type.estimatedDays }} días</span>
              </div>
            </div>
          </div>

          <!-- Documentos & Oficios Disponibles para Descarga -->
          <div class="documents-section" *ngIf="procedure.documents && procedure.documents.length > 0">
            <h4><i class="pi pi-file-pdf mr-2"></i>Documentos & Oficios Emitidos</h4>
            <div class="doc-download-grid">
              <div class="doc-item-card" *ngFor="let doc of procedure.documents">
                <div class="doc-icon"><i class="pi pi-file-pdf"></i></div>
                <div class="doc-meta">
                  <strong>{{ doc.title }}</strong>
                  <small>{{ doc.type?.name || 'Documento Oficial' }} - {{ doc.createdAt | date:'dd/MM/yyyy' }}</small>
                  <span class="badge-doc-signed" *ngIf="doc.signatures && doc.signatures.length > 0">
                    <i class="pi pi-verified mr-1"></i> Documento Firmado Electrónicamente
                  </span>
                </div>
                <a 
                  *ngIf="doc.fileUrl" 
                  [href]="'http://localhost:3001' + doc.fileUrl" 
                  target="_blank" 
                  class="btn-download-doc"
                >
                  <i class="pi pi-download mr-1"></i> Descargar
                </a>
              </div>
            </div>
          </div>

          <!-- Historial de Avances Públicos (Timeline Agrupada por Estación Departamental) -->
          <div class="timeline-section" *ngIf="procedure.movements && procedure.movements.length > 0">
            <div class="timeline-header-row">
              <h4><i class="pi pi-history mr-2"></i>Historial de Movimientos y Flujo</h4>
              <span class="stage-count-badge">{{ procedure.movements.length }} eventos en {{ groupedMovementsByDepartment.length }} estaciones</span>
            </div>

            <div class="timeline-container-grouped">
              <ng-container *ngFor="let group of groupedMovementsByDepartment; let i = index; let isLast = last">
                <!-- Tarjeta de Estación Departamental -->
                <div 
                  class="dept-timeline-stage" 
                  [class.is-expanded]="isStageExpanded(group.departmentId)"
                >
                  <!-- Cabecera de la Estación (Clic para Colapsar/Expandir) -->
                  <div 
                    class="dept-stage-header clickable-stage" 
                    (click)="toggleStage(group.departmentId)"
                    title="Haga clic para expandir o colapsar las actividades"
                  >
                    <div class="dept-stage-badge">
                      <i class="pi pi-building"></i>
                    </div>
                    <div class="dept-stage-title-box">
                      <span class="stage-step-tag">{{ i === 0 ? 'Estación de Origen' : ('Estación ' + (i + 1)) }}</span>
                      <h5>{{ group.departmentName }}</h5>
                    </div>
                    <span class="dept-stage-count">{{ group.movements.length }} {{ group.movements.length === 1 ? 'acción' : 'acciones' }}</span>
                    <button type="button" class="stage-toggle-btn">
                      <i class="pi" [ngClass]="isStageExpanded(group.departmentId) ? 'pi-chevron-up' : 'pi-chevron-down'"></i>
                    </button>
                  </div>

                  <!-- Lista de Actividades de la Estación (Visible al Expandir) -->
                  <div class="dept-events-list animate-fade-in" *ngIf="isStageExpanded(group.departmentId)">
                    <div class="timeline-row" *ngFor="let m of group.movements">
                      <div class="time-point"></div>
                      <div class="time-content">
                        <div class="time-header">
                          <strong>{{ getPublicActionTitle(m.action) }}</strong>
                          <small>{{ m.createdAt | date:'dd/MM/yyyy HH:mm' }}</small>
                        </div>
                        <p *ngIf="m.toDepartment">
                          Ubicación: {{ m.fromDepartment?.name || 'Origen' }} <i class="pi pi-arrow-right text-xs"></i> {{ m.toDepartment?.name }}
                        </p>
                        <p class="time-notes" *ngIf="m.notes">{{ m.notes }}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Línea e Indicador de Flujo entre Estaciones -->
                <div class="dept-flow-connector" *ngIf="!isLast">
                  <div class="flow-line-vertical"></div>
                  <div class="flow-arrow-pill">
                    <i class="pi pi-arrow-down mr-1"></i>
                    <span>Flujo a Siguiente Estación</span>
                  </div>
                  <div class="flow-line-vertical"></div>
                </div>
              </ng-container>
            </div>
          </div>

        </div>

      </main>

      <footer class="tracking-footer">
        <p>© {{ currentYear }} Sistema de Gestión Documental y Trámites Institucionales. Transparencia y Atención Ciudadana.</p>
      </footer>
    </div>
  `,
  styles: [`
    .tracking-page {
      min-height: 100vh;
      background: #0b1120;
      color: #e2e8f0;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      display: flex;
      flex-direction: column;
    }
    .tracking-navbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.2rem 2.5rem;
      background: rgba(15, 23, 42, 0.85);
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      backdrop-filter: blur(12px);
    }
    .nav-brand {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .brand-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.4rem;
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);
    }
    .nav-brand h1 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 800;
      color: #ffffff;
    }
    .nav-brand p {
      margin: 0.1rem 0 0;
      font-size: 0.8rem;
      color: #94a3b8;
    }
    .btn-staff-login {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #cbd5e1;
      text-decoration: none;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.82rem;
      display: inline-flex;
      align-items: center;
      transition: all 0.2s;
    }
    .btn-staff-login:hover {
      background: rgba(79, 70, 229, 0.2);
      border-color: #6366f1;
      color: #ffffff;
    }

    .tracking-main-container {
      flex: 1;
      max-width: 1050px;
      width: 100%;
      margin: 2.5rem auto;
      padding: 0 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    /* Hero Search Card */
    .search-hero-card {
      background: #1e293b;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 2.5rem;
      text-align: center;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    }
    .hero-badge {
      display: inline-block;
      background: rgba(99, 102, 241, 0.15);
      color: #a5b4fc;
      border: 1px solid rgba(99, 102, 241, 0.3);
      padding: 0.35rem 0.9rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 700;
      margin-bottom: 1rem;
    }
    .search-hero-card h2 {
      margin: 0;
      font-size: 2rem;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.02em;
    }
    .hero-subtext {
      color: #94a3b8;
      font-size: 0.95rem;
      max-width: 600px;
      margin: 0.6rem auto 2rem;
      line-height: 1.5;
    }

    .search-form-row {
      display: flex;
      gap: 1rem;
      align-items: flex-end;
      flex-wrap: wrap;
      text-align: left;
    }
    .input-wrapper {
      flex: 1;
      min-width: 240px;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }
    .input-wrapper label {
      font-size: 0.8rem;
      font-weight: 600;
      color: #cbd5e1;
    }
    .input-with-icon {
      position: relative;
    }
    .input-with-icon i {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      color: #64748b;
    }
    .tracking-input {
      width: 100%;
      background: #0f172a;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 10px;
      padding: 0.8rem 1rem 0.8rem 2.5rem;
      color: #ffffff;
      font-size: 0.95rem;
      outline: none;
      transition: all 0.2s;
    }
    .tracking-input:focus {
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
    }
    .btn-search-tracking {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      border: none;
      color: #ffffff;
      padding: 0.85rem 1.8rem;
      border-radius: 10px;
      font-weight: 700;
      font-size: 0.95rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      height: 48px;
      transition: all 0.2s;
      box-shadow: 0 4px 14px rgba(79, 70, 229, 0.4);
    }
    .btn-search-tracking:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 6px 18px rgba(79, 70, 229, 0.6);
    }
    .btn-search-tracking:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .error-banner {
      margin-top: 1.5rem;
      background: rgba(220, 38, 38, 0.15);
      border: 1px solid rgba(220, 38, 38, 0.3);
      color: #fca5a5;
      padding: 0.8rem 1.2rem;
      border-radius: 8px;
      font-size: 0.88rem;
      display: inline-flex;
      align-items: center;
    }

    /* Result Card */
    .result-card {
      background: #1e293b;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 2rem;
      display: flex;
      flex-direction: column;
      gap: 2rem;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
    }
    .result-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 1rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding-bottom: 1.5rem;
    }
    .result-code-tag {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      background: rgba(99, 102, 241, 0.15);
      color: #818cf8;
      border: 1px solid rgba(99, 102, 241, 0.3);
      padding: 0.3rem 0.8rem;
      border-radius: 6px;
      font-weight: 800;
      font-size: 0.85rem;
      margin-bottom: 0.5rem;
    }
    .result-title-group h3 {
      margin: 0;
      font-size: 1.5rem;
      color: #ffffff;
    }
    .result-reg-date {
      margin: 0.3rem 0 0;
      font-size: 0.85rem;
      color: #94a3b8;
    }
    .result-status-badge {
      padding: 0.6rem 1.2rem;
      border-radius: 30px;
      font-size: 0.85rem;
      font-weight: 800;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      text-transform: uppercase;
    }
    .status-registrado { background: #0284c7; color: #ffffff; }
    .status-recibido { background: #2563eb; color: #ffffff; }
    .status-en-revision { background: #d97706; color: #ffffff; }
    .status-derivado { background: #7c3aed; color: #ffffff; }
    .status-observado { background: #dc2626; color: #ffffff; }
    .status-finalizado { background: #059669; color: #ffffff; }

    /* Progress Stepper */
    .progress-stepper {
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: relative;
      background: #0f172a;
      padding: 1.5rem 2rem;
      border-radius: 12px;
    }
    .stepper-step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      z-index: 2;
    }
    .step-circle {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #334155;
      color: #94a3b8;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.9rem;
      border: 2px solid transparent;
      transition: all 0.3s;
    }
    .stepper-step.completed .step-circle {
      background: #10b981;
      color: #ffffff;
    }
    .stepper-step.current .step-circle {
      background: #4f46e5;
      color: #ffffff;
      border-color: #818cf8;
      box-shadow: 0 0 12px rgba(99, 102, 241, 0.6);
    }
    .step-label {
      font-size: 0.78rem;
      font-weight: 600;
      color: #94a3b8;
    }
    .stepper-step.completed .step-label, .stepper-step.current .step-label {
      color: #ffffff;
    }
    .stepper-line {
      flex: 1;
      height: 3px;
      background: #334155;
      margin: 0 0.5rem;
      margin-bottom: 1.2rem;
    }
    .stepper-line.completed {
      background: #10b981;
    }

    /* Info Grid */
    .info-summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.2rem;
    }
    .info-box {
      background: #0f172a;
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 10px;
      padding: 1.2rem;
      display: flex;
      gap: 1rem;
      align-items: center;
    }
    .box-icon {
      width: 44px;
      height: 44px;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.05);
      color: #94a3b8;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
    }
    .text-indigo { color: #818cf8; }
    .text-green { color: #34d399; }
    .box-text {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }
    .box-text small {
      font-size: 0.72rem;
      color: #64748b;
      text-transform: uppercase;
      font-weight: 700;
    }
    .box-text strong {
      color: #f8fafc;
      font-size: 0.95rem;
    }
    .box-text span {
      font-size: 0.8rem;
      color: #94a3b8;
    }

    /* Documents Section */
    .documents-section h4, .timeline-section h4 {
      margin: 0 0 1rem;
      color: #ffffff;
      font-size: 1.1rem;
      display: flex;
      align-items: center;
    }
    .doc-download-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1rem;
    }
    .doc-item-card {
      background: #0f172a;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 10px;
      padding: 1rem;
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .doc-icon {
      font-size: 1.8rem;
      color: #ef4444;
    }
    .doc-meta {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }
    .doc-meta strong {
      color: #ffffff;
      font-size: 0.9rem;
    }
    .doc-meta small {
      color: #94a3b8;
      font-size: 0.75rem;
    }
    .badge-doc-signed {
      color: #34d399;
      font-size: 0.7rem;
      font-weight: 700;
    }
    .btn-download-doc {
      background: #4f46e5;
      color: #ffffff;
      text-decoration: none;
      padding: 0.45rem 0.8rem;
      border-radius: 6px;
      font-size: 0.78rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      transition: all 0.2s;
    }
    .btn-download-doc:hover {
      background: #4338ca;
    }

    /* Timeline Section */
    .timeline-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
    }
    .timeline-header-row h4 {
      margin: 0;
      color: #ffffff;
      font-size: 1.15rem;
    }
    .stage-count-badge {
      background: rgba(255, 255, 255, 0.08);
      color: #94a3b8;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.25rem 0.65rem;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }
    .timeline-container-grouped {
      display: flex;
      flex-direction: column;
      gap: 0;
    }
    .dept-timeline-stage {
      background: rgba(15, 23, 42, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 1rem 1.25rem;
      transition: all 0.2s ease;
    }
    .dept-timeline-stage:hover {
      border-color: rgba(99, 102, 241, 0.4);
      background: rgba(15, 23, 42, 0.9);
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
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding-bottom: 0.85rem;
      margin-bottom: 1rem;
    }
    .dept-stage-badge {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: rgba(99, 102, 241, 0.15);
      color: #818cf8;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      border: 1px solid rgba(99, 102, 241, 0.3);
    }
    .dept-stage-title-box {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }
    .stage-step-tag {
      font-size: 0.68rem;
      font-weight: 700;
      color: #a5b4fc;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .dept-stage-title-box h5 {
      margin: 0;
      font-size: 1.05rem;
      color: #ffffff;
      font-weight: 700;
    }
    .dept-stage-count {
      background: rgba(255, 255, 255, 0.08);
      color: #cbd5e1;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.25rem 0.65rem;
      border-radius: 12px;
    }
    .stage-toggle-btn {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #94a3b8;
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
      background: rgba(99, 102, 241, 0.25);
      border-color: #6366f1;
      color: #ffffff;
    }
    .dept-events-list {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
      padding-left: 1rem;
      position: relative;
    }
    .dept-events-list::before {
      content: '';
      position: absolute;
      left: 7px;
      top: 10px;
      bottom: 10px;
      width: 2px;
      background: rgba(255, 255, 255, 0.1);
    }
    .dept-flow-connector {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin: 0.35rem 0;
      user-select: none;
    }
    .flow-line-vertical {
      width: 2px;
      height: 18px;
      background: rgba(99, 102, 241, 0.5);
    }
    .flow-arrow-pill {
      display: inline-flex;
      align-items: center;
      background: rgba(30, 41, 59, 0.9);
      border: 1px solid rgba(99, 102, 241, 0.4);
      color: #c7d2fe;
      font-size: 0.72rem;
      font-weight: 700;
      padding: 0.25rem 0.8rem;
      border-radius: 20px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    }
    .flow-arrow-pill i {
      font-size: 0.75rem;
      color: #818cf8;
    }
    .timeline-row {
      display: flex;
      gap: 1rem;
      position: relative;
    }
    .time-point {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #6366f1;
      border: 3px solid #0f172a;
      z-index: 2;
      margin-top: 4px;
    }
    .time-content {
      flex: 1;
      background: #020617;
      padding: 0.8rem 1.2rem;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.06);
    }
    .time-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.3rem;
    }
    .time-header strong {
      color: #ffffff;
      font-size: 0.88rem;
    }
    .time-header small {
      color: #64748b;
      font-size: 0.75rem;
    }
    .time-content p {
      margin: 0.2rem 0;
      font-size: 0.82rem;
      color: #94a3b8;
    }
    .time-notes {
      color: #cbd5e1 !important;
      font-style: italic;
    }

    .tracking-footer {
      background: #0f172a;
      padding: 1.5rem;
      text-align: center;
      font-size: 0.8rem;
      color: #64748b;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      margin-top: auto;
    }
  `]
})
export class PublicTrackingComponent implements OnInit {
  searchCode = '';
  searchApplicantId = '';
  procedure: any = null;
  loading = false;
  errorMessage = '';
  currentYear = new Date().getFullYear();
  expandedStages: { [key: string]: boolean } = {};

  get groupedMovementsByDepartment(): any[] {
    if (!this.procedure || !this.procedure.movements) return [];
    const groupsMap = new Map<string, any>();
    const orderedGroups: any[] = [];

    for (const mov of this.procedure.movements) {
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

  isStageExpanded(stageKey: string): boolean {
    return !!this.expandedStages[stageKey];
  }

  toggleStage(stageKey: string): void {
    this.expandedStages[stageKey] = !this.expandedStages[stageKey];
    this.cdr.markForCheck();
  }

  constructor(
    private procedureService: ProcedureService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['code']) {
        this.searchCode = params['code'];
        if (params['applicantId']) this.searchApplicantId = params['applicantId'];
        this.onSearch();
      }
    });
  }

  onSearch(): void {
    if (!this.searchCode || this.searchCode.trim() === '') return;

    this.loading = true;
    this.errorMessage = '';
    this.procedure = null;
    this.expandedStages = {};

    this.procedureService.getPublicProcedureTrack(this.searchCode.trim(), this.searchApplicantId).subscribe({
      next: (proc) => {
        this.procedure = proc;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.error || 'No se encontró información con el código ingresado.';
        this.cdr.markForCheck();
      }
    });
  }

  isStepCompleted(step: number): boolean {
    if (!this.procedure) return false;
    const s = this.procedure.status;
    if (step === 1) return true;
    if (step === 2) return ['RECIBIDO', 'EN_REVISION', 'DERIVADO', 'FINALIZADO'].includes(s);
    if (step === 3) return (this.procedure.documents && this.procedure.documents.length > 0) || s === 'FINALIZADO';
    if (step === 4) return s === 'FINALIZADO';
    return false;
  }

  isStepCurrent(step: number): boolean {
    if (!this.procedure) return false;
    const s = this.procedure.status;
    if (step === 1 && s === 'REGISTRADO') return true;
    if (step === 2 && (s === 'RECIBIDO' || s === 'EN_REVISION' || s === 'DERIVADO')) return true;
    if (step === 3 && s === 'OBSERVADO') return true;
    if (step === 4 && s === 'FINALIZADO') return true;
    return false;
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

  getStatusIcon(status: string): string {
    switch (status) {
      case 'FINALIZADO': return 'pi-check-circle';
      case 'DERIVADO': return 'pi-send';
      case 'OBSERVADO': return 'pi-exclamation-circle';
      default: return 'pi-clock';
    }
  }

  getPublicActionTitle(action: string): string {
    switch (action) {
      case 'CREACION': return 'Ingreso y Registro de Trámite';
      case 'DERIVACION': return 'Derivación Interdepartamental';
      case 'AGREGAR_DOCUMENTO': return 'Documento / Anexo Incorporado';
      case 'FIRMA_DOCUMENTO': return 'Oficio / Documento Firmado Oficialmente';
      case 'FINALIZACION': return 'Trámite Concluido y Resuelto';
      case 'DEVOLUCION': return 'Devuelto con Observaciones';
      case 'REAPERTURA': return 'Trámite Reabierto';
      default: return action;
    }
  }
}
