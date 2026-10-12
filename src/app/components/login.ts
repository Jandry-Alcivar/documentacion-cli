import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Card } from 'primeng/card';
import { InputText } from 'primeng/inputtext';
import { Password } from 'primeng/password';
import { Button } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { Toast } from 'primeng/toast';
import { AuthService } from '../services/auth.service.js';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    Card,
    InputText,
    Password,
    Toast
  ],
  providers: [MessageService],
  template: `
    <div class="login-container">
      <p-toast></p-toast>
      <div class="login-card-wrapper">
        <p-card styleClass="p-shadow-6 login-card">
          <ng-template pTemplate="header">
            <div class="login-header">
              <span class="logo-icon"><i class="pi pi-building"></i></span>
              <h2>G-DOC</h2>
              <p>Sistema de Gestión Documental y Expedientes Digitales</p>
              <div class="sub-district">Gobierno Autónomo Descentralizado Junín</div>
            </div>
          </ng-template>
          
          <form (ngSubmit)="onSubmit()" #loginForm="ngForm" class="login-form">
            <div class="form-group">
              <label for="email">Correo Institucional</label>
              <div class="input-icon-wrapper">
                <i class="pi pi-envelope"></i>
                <input 
                  type="email" 
                  id="email" 
                  name="email" 
                  pInputText 
                  [(ngModel)]="email" 
                  required 
                  placeholder="ejemplo@junin.gob.ec" 
                  class="w-full"
                />
              </div>
            </div>
            
            <div class="form-group">
              <label for="password">Contraseña de Acceso</label>
              <div class="input-icon-wrapper">
                <i class="pi pi-lock"></i>
                <p-password 
                  id="password" 
                  name="password" 
                  [(ngModel)]="password" 
                  [feedback]="false" 
                  [toggleMask]="true"
                  styleClass="w-full"
                  inputStyleClass="w-full"
                  placeholder="••••••••"
                  [required]="true"
                ></p-password>
              </div>
            </div>
            
            <div class="form-action">
              <button 
                type="submit" 
                class="btn-submit-login"
                [disabled]="loading"
              >
                <i class="pi pi-sign-in mr-2" *ngIf="!loading"></i>
                <i class="pi pi-spin pi-spinner mr-2" *ngIf="loading"></i>
                <span>{{ loading ? 'Autenticando...' : 'Acceder al Sistema' }}</span>
              </button>
            </div>
          </form>

          <div class="citizen-track-section">
            <div class="divider">
              <span>Consulta Pública</span>
            </div>
            <a routerLink="/seguimiento" class="btn-citizen-track">
              <i class="pi pi-search mr-2"></i> Consultar Estado de Trámite Ciudadano
            </a>
          </div>
        </p-card>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #0a1626 0%, #0f2137 50%, #1e3a5f 100%);
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      padding: 1.5rem;
    }
    .login-card-wrapper {
      width: 100%;
      max-width: 440px;
      animation: fadeInUp 0.4s ease-out;
    }
    :host ::ng-deep .login-card {
      background: #ffffff !important;
      border: 1px solid #e2e8f0 !important;
      border-radius: 12px !important;
      box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.25) !important;
      color: #0f172a !important;
      overflow: hidden;
    }
    .login-header {
      text-align: center;
      padding: 2.2rem 1.5rem 1.2rem;
      border-bottom: 1px solid #f1f5f9;
      background: #f8fafc;
    }
    .logo-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 52px;
      height: 52px;
      background: #1d4ed8;
      color: #ffffff;
      border-radius: 10px;
      font-size: 1.6rem;
      margin-bottom: 0.8rem;
      box-shadow: 0 4px 12px rgba(29, 78, 216, 0.25);
    }
    .login-header h2 {
      font-size: 1.6rem;
      font-weight: 800;
      margin: 0;
      color: #0f172a;
      letter-spacing: 0.02em;
    }
    .login-header p {
      font-size: 0.85rem;
      color: #64748b;
      margin: 0.35rem 0 0.5rem;
      font-weight: 500;
    }
    .sub-district {
      display: inline-block;
      font-size: 0.72rem;
      font-weight: 700;
      color: #1d4ed8;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      padding: 0.2rem 0.65rem;
      border-radius: 100px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .login-form {
      padding: 1.5rem 2rem 1rem;
    }
    .form-group {
      margin-bottom: 1.25rem;
    }
    .form-group label {
      display: block;
      font-size: 0.82rem;
      font-weight: 600;
      color: #334155;
      margin-bottom: 0.4rem;
    }
    .input-icon-wrapper {
      position: relative;
    }
    .input-icon-wrapper i {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: #94a3b8;
      font-size: 0.95rem;
      z-index: 1;
    }
    :host ::ng-deep .input-icon-wrapper input {
      width: 100% !important;
      padding-left: 2.35rem !important;
      background: #f8fafc !important;
      border: 1px solid #cbd5e1 !important;
      color: #0f172a !important;
      border-radius: 6px !important;
      height: 40px !important;
      font-size: 0.88rem !important;
      transition: all 0.2s;
    }
    :host ::ng-deep .input-icon-wrapper input:focus {
      border-color: #1d4ed8 !important;
      box-shadow: 0 0 0 3px rgba(29, 78, 216, 0.12) !important;
      background: #ffffff !important;
    }
    :host ::ng-deep .p-password-input {
      width: 100% !important;
    }
    :host ::ng-deep .p-password {
      width: 100%;
    }
    .form-action {
      margin-top: 1.5rem;
    }
    .btn-submit-login {
      width: 100%;
      background: #1d4ed8;
      color: #ffffff;
      border: none;
      border-radius: 6px;
      padding: 0.75rem;
      font-weight: 700;
      font-size: 0.92rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s, transform 0.15s;
    }
    .btn-submit-login:hover:not(:disabled) {
      background: #1e40af;
      transform: translateY(-1px);
    }
    .btn-submit-login:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
    .citizen-track-section {
      padding: 0 2rem 1.8rem;
      text-align: center;
    }
    .divider {
      display: flex;
      align-items: center;
      margin-bottom: 1rem;
      color: #94a3b8;
      font-size: 0.72rem;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.04em;
    }
    .divider::before, .divider::after {
      content: '';
      flex: 1;
      border-bottom: 1px solid #e2e8f0;
    }
    .divider span {
      padding: 0 0.6rem;
    }
    .btn-citizen-track {
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      color: #1d4ed8;
      text-decoration: none;
      padding: 0.65rem 1rem;
      border-radius: 6px;
      font-weight: 600;
      font-size: 0.82rem;
      transition: all 0.2s;
    }
    .btn-citizen-track:hover {
      background: #eff6ff;
      border-color: #bfdbfe;
    }
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(12px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `]
})
export class LoginComponent {
  email = '';
  password = '';
  loading = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private messageService: MessageService
  ) {}

  onSubmit() {
    if (!this.email || !this.password) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atención',
        detail: 'Por favor complete todos los campos.'
      });
      return;
    }

    this.loading = true;
    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error de ingreso',
          detail: err.error?.error || 'No se pudo iniciar sesión. Verifique sus credenciales.'
        });
      }
    });
  }
}
