import { Component, Input, OnInit, ViewChild, ElementRef, forwardRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

@Component({
  selector: 'app-rich-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RichEditorComponent),
      multi: true
    }
  ],
  template: `
    <div class="rich-editor-wrapper">
      <!-- Modos: Edición o Previsualización PDF -->
      <div class="editor-modes mb-3">
        <button 
          type="button"
          class="mode-btn" 
          [class.active]="activeMode === 'edit'"
          (click)="setMode('edit')"
        >
          <i class="pi pi-pencil"></i> Redactar Documento
        </button>
        <button 
          type="button"
          class="mode-btn" 
          [class.active]="activeMode === 'preview'"
          (click)="setMode('preview')"
        >
          <i class="pi pi-file-pdf"></i> Previsualizar PDF
        </button>
      </div>

      <!-- MODO EDICIÓN -->
      <div *ngIf="activeMode === 'edit'" class="edit-mode-container animate-fade-in">
        <!-- Barra de Herramientas -->
        <div class="toolbar">
          <div class="toolbar-group">
            <button type="button" class="tool-btn" (click)="execCmd('bold')" title="Negrita"><i class="pi pi-bold"></i></button>
            <button type="button" class="tool-btn" (click)="execCmd('italic')" title="Cursiva"><i class="pi pi-italic"></i></button>
            <button type="button" class="tool-btn" (click)="execCmd('underline')" title="Subrayado"><i class="pi pi-underline"></i></button>
            <button type="button" class="tool-btn" (click)="execCmd('strikeThrough')" title="Tachado"><i class="pi pi-strikethrough"></i></button>
          </div>

          <div class="toolbar-group">
            <button type="button" class="tool-btn" (click)="execCmd('justifyLeft')" title="Alinear Izquierda"><i class="pi pi-align-left"></i></button>
            <button type="button" class="tool-btn" (click)="execCmd('justifyCenter')" title="Centrar"><i class="pi pi-align-center"></i></button>
            <button type="button" class="tool-btn" (click)="execCmd('justifyRight')" title="Alinear Derecha"><i class="pi pi-align-right"></i></button>
            <button type="button" class="tool-btn" (click)="execCmd('justifyFull')" title="Justificar"><i class="pi pi-align-justify"></i></button>
          </div>

          <div class="toolbar-group">
            <button type="button" class="tool-btn" (click)="execCmd('insertUnorderedList')" title="Lista Viñetas"><i class="pi pi-list"></i></button>
            <button type="button" class="tool-btn" (click)="execCmd('insertOrderedList')" title="Lista Numerada"><i class="pi pi-list-2"></i></button>
          </div>

          <div class="toolbar-group">
            <button type="button" class="tool-btn" (click)="promptTable()" title="Insertar Tabla"><i class="pi pi-table"></i></button>
            <button type="button" class="tool-btn" (click)="promptImage()" title="Insertar Imagen"><i class="pi pi-image"></i></button>
            <button type="button" class="tool-btn" (click)="promptLink()" title="Insertar Enlace"><i class="pi pi-link"></i></button>
          </div>

          <div class="toolbar-group">
            <select class="tool-select" (change)="changeLineHeight($event)" title="Interlineado">
              <option value="1">Normal (1.0)</option>
              <option value="1.15" selected>1.15</option>
              <option value="1.5">1.5</option>
              <option value="2.0">Doble (2.0)</option>
            </select>
            <button type="button" class="tool-btn text-red" (click)="execCmd('removeFormat')" title="Limpiar Formato"><i class="pi pi-trash"></i></button>
          </div>
        </div>

        <div class="editor-main-layout">
          <!-- Hojas A4 Simulación -->
          <div class="paper-container">
            <div 
              #editorRef
              class="a4-sheet"
              contenteditable="true"
              (input)="onEditorInput()"
              (blur)="onBlur()"
              [style.lineHeight]="currentLineHeight"
            ></div>
          </div>

          <!-- Variables Dinámicas Panel -->
          <div class="variables-panel">
            <h3>Variables de Plantilla</h3>
            <p>Haz clic en cualquier variable para insertarla en la posición actual del cursor:</p>
            <div class="variables-grid">
              <button type="button" class="var-badge badge-blue" (click)="insertVar('fecha')">
                <i class="pi pi-calendar"></i> Fecha Actual
              </button>
              <button type="button" class="var-badge badge-purple" (click)="insertVar('destinatario')">
                <i class="pi pi-user"></i> Destinatario
              </button>
              <button type="button" class="var-badge badge-green" (click)="insertVar('encabezado')">
                <i class="pi pi-bookmark"></i> Encabezado
              </button>
              <button type="button" class="var-badge badge-orange" (click)="insertVar('asunto')">
                <i class="pi pi-comment"></i> Asunto Trámite
              </button>
              <button type="button" class="var-badge badge-teal" (click)="insertVar('nombre_solicitante')">
                <i class="pi pi-id-card"></i> Solicitante
              </button>
              <button type="button" class="var-badge badge-red" (click)="insertVar('codigo_tramite')">
                <i class="pi pi-key"></i> Código Trámite
              </button>
            </div>
            <div class="mt-3 info-alert">
              <i class="pi pi-info-circle"></i> Las variables se procesarán y reemplazarán con los datos reales en el visor PDF.
            </div>
          </div>
        </div>
      </div>

      <!-- MODO PREVISUALIZACIÓN PDF -->
      <div *ngIf="activeMode === 'preview'" class="preview-mode-container animate-fade-in">
        <div class="preview-actions mb-3">
          <button type="button" class="p-button p-button-success" (click)="downloadPdf()">
            <i class="pi pi-download mr-1"></i> Descargar PDF Oficial
          </button>
          <span class="preview-note"><i class="pi pi-info-circle"></i> Previsualización A4 simulada con membrete oficial del GAD Cantonal Junín.</span>
        </div>

        <div class="paper-container">
          <div id="pdf-content-area" class="a4-sheet pdf-preview-sheet">
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
            <div class="pdf-body" [innerHTML]="processedContent" [style.lineHeight]="currentLineHeight"></div>

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
    </div>

    <!-- MODAL SIMPLE PARA INSERTAR TABLA -->
    <div class="modal-backdrop" *ngIf="showTableModal">
      <div class="modal-dialog">
        <h3>Insertar Tabla</h3>
        <div class="form-row">
          <label>Filas:</label>
          <input type="number" [(ngModel)]="tableRows" min="1" max="20" class="modal-input" />
        </div>
        <div class="form-row">
          <label>Columnas:</label>
          <input type="number" [(ngModel)]="tableCols" min="1" max="20" class="modal-input" />
        </div>
        <div class="modal-actions">
          <button type="button" class="btn-cancel" (click)="showTableModal = false">Cancelar</button>
          <button type="button" class="btn-success" (click)="insertTable()">Insertar</button>
        </div>
      </div>
    </div>

    <!-- MODAL SIMPLE PARA INSERTAR IMAGEN -->
    <div class="modal-backdrop" *ngIf="showImageModal">
      <div class="modal-dialog">
        <h3>Insertar Imagen</h3>
        <div class="form-row tabs-mini">
          <button type="button" [class.active]="imageTab === 'url'" (click)="imageTab = 'url'">Por URL</button>
          <button type="button" [class.active]="imageTab === 'file'" (click)="imageTab = 'file'">Subir Archivo</button>
        </div>
        <div *ngIf="imageTab === 'url'" class="form-row">
          <label>URL de Imagen:</label>
          <input type="text" [(ngModel)]="imageUrl" placeholder="https://ejemplo.com/imagen.png" class="modal-input w-full" />
        </div>
        <div *ngIf="imageTab === 'file'" class="form-row">
          <label>Seleccionar Archivo:</label>
          <input type="file" (change)="onImageFileSelect($event)" accept="image/*" class="modal-input w-full" />
        </div>
        <div class="modal-actions">
          <button type="button" class="btn-cancel" (click)="showImageModal = false">Cancelar</button>
          <button type="button" class="btn-success" (click)="insertImage()">Insertar</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .rich-editor-wrapper {
      display: flex;
      flex-direction: column;
      background: rgba(30, 41, 59, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 12px;
      padding: 1.5rem;
      color: #cbd5e1;
    }

    /* Modos de edición */
    .editor-modes {
      display: flex;
      gap: 1rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      padding-bottom: 1rem;
    }
    .mode-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(15, 23, 42, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #94a3b8;
      padding: 0.6rem 1.2rem;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .mode-btn:hover {
      background: rgba(15, 23, 42, 0.8);
      color: #ffffff;
    }
    .mode-btn.active {
      background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
      color: #ffffff;
      border-color: #818cf8;
      box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
    }

    /* Barra de Herramientas */
    .toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.08);
      padding: 0.5rem;
      border-radius: 8px 8px 0 0;
      align-items: center;
    }
    .toolbar-group {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      border-right: 1px solid rgba(255, 255, 255, 0.08);
      padding-right: 0.5rem;
    }
    .toolbar-group:last-child {
      border-right: none;
      padding-right: 0;
    }
    .tool-btn {
      background: transparent;
      border: none;
      color: #94a3b8;
      width: 32px;
      height: 32px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s;
    }
    .tool-btn:hover {
      background: rgba(255, 255, 255, 0.08);
      color: #ffffff;
    }
    .tool-btn:active {
      transform: scale(0.95);
    }
    .tool-select {
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #cbd5e1;
      padding: 0.3rem 0.6rem;
      border-radius: 6px;
      outline: none;
      font-size: 0.8rem;
    }
    .text-red { color: #f87171 !important; }

    /* Layout del Editor */
    .editor-main-layout {
      display: grid;
      grid-template-columns: 1fr 280px;
      gap: 1.5rem;
      background: rgba(15, 23, 42, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-top: none;
      border-radius: 0 0 8px 8px;
      padding: 1.5rem;
    }

    /* Hoja A4 */
    .paper-container {
      display: flex;
      justify-content: center;
      background: rgba(15, 23, 42, 0.4);
      padding: 2rem;
      border-radius: 8px;
      overflow-x: auto;
      max-height: 800px;
      overflow-y: auto;
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

    /* Panel de Variables */
    .variables-panel {
      background: rgba(15, 23, 42, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      padding: 1rem;
      height: fit-content;
    }
    .variables-panel h3 {
      font-size: 0.95rem;
      font-weight: 700;
      color: #f8fafc;
      margin-top: 0;
      margin-bottom: 0.5rem;
    }
    .variables-panel p {
      font-size: 0.8rem;
      color: #94a3b8;
      margin-bottom: 1rem;
    }
    .variables-grid {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .var-badge {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      width: 100%;
      padding: 0.5rem 0.8rem;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 600;
      border: none;
      cursor: pointer;
      text-align: left;
      transition: opacity 0.2s, transform 0.1s;
    }
    .var-badge:hover { opacity: 0.85; transform: translateX(2px); }
    .badge-blue { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
    .badge-purple { background: rgba(139, 92, 246, 0.15); color: #a78bfa; }
    .badge-green { background: rgba(16, 185, 129, 0.15); color: #34d399; }
    .badge-orange { background: rgba(249, 115, 22, 0.15); color: #fb923c; }
    .badge-teal { background: rgba(20, 184, 166, 0.15); color: #2dd4bf; }
    .badge-red { background: rgba(239, 68, 68, 0.15); color: #f87171; }
    .info-alert {
      background: rgba(99, 102, 241, 0.1);
      border: 1px solid rgba(99, 102, 241, 0.2);
      border-radius: 6px;
      padding: 0.6rem;
      font-size: 0.75rem;
      color: #818cf8;
      line-height: 1.4;
    }

    /* MODO PREVISUALIZACION PDF */
    .preview-mode-container {
      display: flex;
      flex-direction: column;
    }
    .preview-actions {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      background: rgba(15, 23, 42, 0.4);
      padding: 0.75rem 1.25rem;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }
    .preview-note {
      font-size: 0.85rem;
      color: #94a3b8;
    }
    .pdf-preview-sheet {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      color: #1e293b !important;
      position: relative;
    }

    /* Membrete */
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

    /* Pie de página */
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

    /* Modales */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(15, 23, 42, 0.85);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
      animation: fadeIn 0.2s ease-out;
    }
    .modal-dialog {
      background: #1e293b;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 1.5rem;
      width: 400px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
      color: #e2e8f0;
    }
    .modal-dialog h3 {
      margin-top: 0;
      font-size: 1.1rem;
      margin-bottom: 1.2rem;
      color: #ffffff;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      padding-bottom: 0.5rem;
    }
    .form-row {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      margin-bottom: 1rem;
    }
    .form-row label {
      font-size: 0.85rem;
      font-weight: 600;
      color: #94a3b8;
    }
    .modal-input {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #f8fafc;
      padding: 0.5rem 0.75rem;
      border-radius: 6px;
      outline: none;
    }
    .modal-input:focus { border-color: #818cf8; }
    .w-full { width: 100%; }
    .tabs-mini {
      flex-direction: row;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      padding-bottom: 0.5rem;
      margin-bottom: 1rem;
    }
    .tabs-mini button {
      background: transparent;
      border: none;
      color: #94a3b8;
      padding: 0.3rem 0.8rem;
      font-weight: 600;
      cursor: pointer;
      font-size: 0.8rem;
    }
    .tabs-mini button.active {
      color: #818cf8;
      border-bottom: 2px solid #818cf8;
    }
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      margin-top: 1.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      padding-top: 1rem;
    }
    .modal-actions button {
      padding: 0.5rem 1rem;
      border-radius: 6px;
      font-weight: 600;
      font-size: 0.85rem;
      cursor: pointer;
      border: none;
    }
    .btn-cancel { background: rgba(148, 163, 184, 0.1); color: #94a3b8; }
    .btn-cancel:hover { background: rgba(148, 163, 184, 0.15); }
    .btn-success { background: #22c55e; color: #ffffff; }
    .btn-success:hover { background: #16a34a; }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .animate-fade-in {
      animation: fadeIn 0.3s ease-out;
    }
    
    ::ng-deep .a4-sheet table {
      width: 100%;
      border-collapse: collapse;
      margin: 1rem 0;
    }
    ::ng-deep .a4-sheet td, ::ng-deep .a4-sheet th {
      border: 1px solid #cbd5e1;
      padding: 8px;
      min-height: 24px;
    }
    ::ng-deep .a4-sheet img {
      max-width: 100%;
      height: auto;
      margin: 0.5rem 0;
    }
  `]
})
export class RichEditorComponent implements ControlValueAccessor, OnInit {
  @ViewChild('editorRef') editorRef!: ElementRef<HTMLDivElement>;

  // Variables dinámicas para el reemplazo en PDF
  @Input() dynamicValues: {
    fecha?: string;
    destinatario?: string;
    encabezado?: string;
    asunto?: string;
    nombre_solicitante?: string;
    codigo_tramite?: string;
  } = {};

  activeMode: 'edit' | 'preview' = 'edit';
  currentLineHeight = '1.15';
  htmlContent = '';

  // Modal Tabla
  showTableModal = false;
  tableRows = 3;
  tableCols = 3;

  // Modal Imagen
  showImageModal = false;
  imageTab: 'url' | 'file' = 'url';
  imageUrl = '';
  imageFileBase64 = '';

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.loadHtml2PdfScript();
  }

  // C Value Accessor
  writeValue(value: string): void {
    this.htmlContent = value || '';
    if (this.editorRef && this.editorRef.nativeElement) {
      this.editorRef.nativeElement.innerHTML = this.htmlContent;
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  onEditorInput() {
    this.htmlContent = this.editorRef.nativeElement.innerHTML;
    this.onChange(this.htmlContent);
  }

  onBlur() {
    this.onTouched();
  }

  setMode(mode: 'edit' | 'preview') {
    this.activeMode = mode;
    this.cdr.detectChanges();
    
    if (mode === 'edit') {
      setTimeout(() => {
        if (this.editorRef && this.editorRef.nativeElement) {
          this.editorRef.nativeElement.innerHTML = this.htmlContent;
        }
      }, 0);
    }
  }

  // Obtener el HTML procesado con las variables reemplazadas en tiempo real
  get processedContent(): string {
    let result = this.htmlContent;

    const vals = {
      fecha: this.dynamicValues?.fecha || this.getCurrentDateFormatted(),
      destinatario: this.dynamicValues?.destinatario || 'Director(a) de Departamento Municipal',
      encabezado: this.dynamicValues?.encabezado || 'SOLICITUD FORMAL',
      asunto: this.dynamicValues?.asunto || '(Asunto del Trámite No Registrado)',
      nombre_solicitante: this.dynamicValues?.nombre_solicitante || 'Ciudadano del Cantón Junín',
      codigo_tramite: this.dynamicValues?.codigo_tramite || 'TRM-TEMPORAL'
    };

    result = result.replace(/\{\{fecha\}\}/g, vals.fecha);
    result = result.replace(/\{\{destinatario\}\}/g, vals.destinatario);
    result = result.replace(/\{\{encabezado\}\}/g, vals.encabezado);
    result = result.replace(/\{\{asunto\}\}/g, vals.asunto);
    result = result.replace(/\{\{nombre_solicitante\}\}/g, vals.nombre_solicitante);
    result = result.replace(/\{\{codigo_tramite\}\}/g, vals.codigo_tramite);

    return result;
  }

  getCurrentDateFormatted(): string {
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const d = new Date();
    return `Junín, ${d.getDate()} de ${meses[d.getMonth()]} de ${d.getFullYear()}`;
  }

  execCmd(command: string, value: string = '') {
    document.execCommand(command, false, value);
    this.onEditorInput();
  }

  changeLineHeight(event: any) {
    this.currentLineHeight = event.target.value;
    this.onEditorInput();
  }

  insertVar(variable: string) {
    this.editorRef.nativeElement.focus();
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      const node = document.createTextNode(`{{${variable}}}`);
      range.insertNode(node);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    } else {
      this.htmlContent += `{{${variable}}}`;
      this.editorRef.nativeElement.innerHTML = this.htmlContent;
    }
    this.onEditorInput();
  }

  // Modales
  promptTable() {
    this.tableRows = 3;
    this.tableCols = 3;
    this.showTableModal = true;
  }

  insertTable() {
    this.showTableModal = false;
    let html = '<table style="width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1; margin: 1rem 0;">';
    for (let r = 0; r < this.tableRows; r++) {
      html += '<tr>';
      for (let c = 0; c < this.tableCols; c++) {
        html += '<td style="border: 1px solid #cbd5e1; padding: 8px; min-height: 24px;">&nbsp;</td>';
      }
      html += '</tr>';
    }
    html += '</table><p>&nbsp;</p>';

    this.editorRef.nativeElement.focus();
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      const div = document.createElement('div');
      div.innerHTML = html;
      const frag = document.createDocumentFragment();
      let child;
      while ((child = div.firstChild)) {
        frag.appendChild(child);
      }
      range.insertNode(frag);
    }
    this.onEditorInput();
  }

  promptImage() {
    this.imageUrl = '';
    this.imageFileBase64 = '';
    this.imageTab = 'url';
    this.showImageModal = true;
  }

  onImageFileSelect(event: any) {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.imageFileBase64 = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  insertImage() {
    this.showImageModal = false;
    const src = this.imageTab === 'url' ? this.imageUrl : this.imageFileBase64;
    if (!src) return;

    this.editorRef.nativeElement.focus();
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      const img = document.createElement('img');
      img.src = src;
      img.style.maxWidth = '100%';
      img.style.height = 'auto';
      img.style.display = 'block';
      img.style.margin = '1rem auto';
      range.insertNode(img);
      
      const p = document.createElement('p');
      p.innerHTML = '&nbsp;';
      range.insertNode(p);
    }
    this.onEditorInput();
  }

  promptLink() {
    const url = prompt('Ingrese la URL del enlace:', 'https://');
    if (url) {
      this.execCmd('createLink', url);
    }
  }

  loadHtml2PdfScript() {
    if ((window as any).html2pdf) return;
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    script.async = true;
    document.body.appendChild(script);
  }

  downloadPdf() {
    const element = document.getElementById('pdf-content-area');
    if (!element) return;

    const opt = {
      margin:       10,
      filename:     `DOCUMENTO_${this.dynamicValues?.codigo_tramite || 'GDOC'}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    if ((window as any).html2pdf) {
      (window as any).html2pdf().from(element).set(opt).save();
    } else {
      alert('La biblioteca PDF aún se está cargando. Por favor, reintente en unos segundos.');
    }
  }
}
