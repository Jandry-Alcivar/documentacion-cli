import { Component } from '@angular/core';
import { Router } from '@angular/router';
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
    FormsModule,
    Card,
    InputText,
    Password,
    Button,
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
              <span class="logo-icon"><i class="pi pi-briefcase"></i></span>
              <h2>G-DOC</h2>
              <p>Sistema de Gestión Documental Inteligente</p>
              <div class="sub-district">Distrito Chone</div>
            </div>
          </ng-template>
          
          <form (ngSubmit)="onSubmit()" #loginForm="ngForm" class="login-form">
            <div class="form-group">
              <label for="email">Correo Electrónico</label>
              <div class="input-icon-wrapper">
                <i class="pi pi-envelope"></i>
                <input 
                  type="email" 
                  id="email" 
                  name="email" 
                  pInputText 
                  [(ngModel)]="email" 
                  required 
                  placeholder="ejemplo@gob.gob" 
                  class="w-full"
                />
              </div>
            </div>
            
            <div class="form-group">
              <label for="password">Contraseña</label>
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
              <p-button 
                type="submit" 
                label="Iniciar Sesión" 
                icon="pi pi-sign-in" 
                styleClass="w-full btn-submit"
                [loading]="loading"
              ></p-button>
            </div>
          </form>
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
      background: linear-gradient(135deg, #1e1b4b 0%, #311042 50%, #0f172a 100%);
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      padding: 1.5rem;
    }
    .login-card-wrapper {
      width: 100%;
      max-width: 450px;
      animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    }
    :host ::ng-deep .login-card {
      background: rgba(255, 255, 255, 0.03) !important;
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.08) !important;
      border-radius: 16px !important;
      color: #f8fafc !important;
      overflow: hidden;
    }
    .login-header {
      text-align: center;
      padding: 2.5rem 1.5rem 1rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }
    .logo-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 60px;
      height: 60px;
      background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
      color: #ffffff;
      border-radius: 14px;
      font-size: 1.8rem;
      margin-bottom: 1rem;
      box-shadow: 0 8px 24px rgba(99, 102, 241, 0.3);
    }
    .login-header h2 {
      font-size: 1.8rem;
      font-weight: 800;
      margin: 0;
      letter-spacing: 0.05em;
      background: linear-gradient(to right, #ffffff, #c084fc);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .login-header p {
      font-size: 0.9rem;
      color: #94a3b8;
      margin: 0.4rem 0 0.6rem;
    }
    .sub-district {
      display: inline-block;
      font-size: 0.75rem;
      font-weight: 600;
      color: #ffffff;
      background: rgba(255, 255, 255, 0.1);
      padding: 0.2rem 0.6rem;
      border-radius: 100px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .login-form {
      padding: 1.5rem 2rem 2.5rem;
    }
    .form-group {
      margin-bottom: 1.5rem;
    }
    .form-group label {
      display: block;
      font-size: 0.85rem;
      font-weight: 500;
      color: #cbd5e1;
      margin-bottom: 0.5rem;
    }
    .input-icon-wrapper {
      position: relative;
    }
    .input-icon-wrapper i {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: #64748b;
      font-size: 1rem;
      z-index: 1;
    }
    :host ::ng-deep .input-icon-wrapper input {
      width: 100% !important;
      padding-left: 2.5rem !important;
      background: rgba(15, 23, 42, 0.6) !important;
      border: 1px solid rgba(255, 255, 255, 0.1) !important;
      color: #f8fafc !important;
      border-radius: 8px !important;
      transition: all 0.2s;
    }
    :host ::ng-deep .input-icon-wrapper input:focus {
      border-color: #818cf8 !important;
      box-shadow: 0 0 0 2px rgba(129, 140, 248, 0.2) !important;
    }
    :host ::ng-deep .p-password-input {
      width: 100% !important;
    }
    :host ::ng-deep .p-password {
      width: 100%;
    }
    .form-action {
      margin-top: 2rem;
    }
    :host ::ng-deep .btn-submit {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%) !important;
      border: none !important;
      border-radius: 8px !important;
      padding: 0.8rem !important;
      font-weight: 600 !important;
      transition: transform 0.2s, box-shadow 0.2s !important;
    }
    :host ::ng-deep .btn-submit:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4) !important;
    }
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
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
