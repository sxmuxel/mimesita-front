import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { RestauranteService } from '../../../core/services/api.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-left">
        <div class="auth-brand">
          <span class="auth-brand-icon">M</span>
          <h1>MiMesita</h1>
          <p>Sistema de gestion de reservas</p>
          <div class="restaurant-name">{{ restauranteNombre() }}</div>
        </div>
        <div class="auth-tagline">
          <blockquote>La mejor mesa te esta esperando</blockquote>
        </div>
      </div>

      <div class="auth-right">
        <div class="auth-card">
          <h2>Bienvenido de vuelta</h2>
          <p class="auth-sub">Ingresa tus credenciales para continuar</p>

          @if (error()) {
            <div class="alert alert-danger">{{ error() }}</div>
          }

          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label class="form-label">Correo electronico</label>
              <input type="email" formControlName="email" class="form-control"
                     [class.is-invalid]="submitted && form.get('email')?.invalid"
                     placeholder="correo@ejemplo.com">
              @if (submitted && form.get('email')?.invalid) {
                <span class="form-error">Email invalido</span>
              }
            </div>

            <div class="form-group">
              <label class="form-label">Contrasena</label>
              <div class="input-pw">
                <input [type]="showPw() ? 'text' : 'password'" formControlName="password"
                       class="form-control"
                       [class.is-invalid]="submitted && form.get('password')?.invalid"
                       placeholder="********">
                <button type="button" class="toggle-pw" (click)="showPw.set(!showPw())">
                  {{ showPw() ? 'Ocultar' : 'Ver' }}
                </button>
              </div>
              @if (submitted && form.get('password')?.invalid) {
                <span class="form-error">Contrasena requerida</span>
              }
            </div>

            <button type="submit" class="btn btn-primary btn-block btn-lg" [disabled]="loading()">
              @if (loading()) { <span class="btn-spinner"></span> Ingresando... }
              @else { Iniciar sesion }
            </button>
          </form>

          <p class="auth-footer">
            No tienes cuenta?
            <a routerLink="/registro">Registrate aqui</a>
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page { display: flex; min-height: 100vh; }
    .auth-left {
      flex: 1; background: linear-gradient(145deg, var(--primary-dark) 0%, var(--primary) 60%, #3b82f6 100%);
      display: flex; flex-direction: column; justify-content: center; align-items: center;
      padding: 3rem; color: white; position: relative; overflow: hidden;
    }
    .auth-left::before {
      content: ''; position: absolute; inset: 0;
      background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Ccircle cx='30' cy='30' r='20'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    }
    .auth-brand { text-align: center; position: relative; }
    .auth-brand-icon {
      width: 64px; height: 64px; border-radius: 18px;
      display: inline-flex; align-items: center; justify-content: center;
      background: rgba(255,255,255,0.16); border: 1px solid rgba(255,255,255,0.28);
      font-family: var(--font-display); font-size: 2rem; font-weight: 700;
      margin-bottom: 0.75rem;
    }
    .auth-brand h1 { font-family: var(--font-display); font-size: 2.8rem; color: white; margin-bottom: 0.5rem; }
    .auth-brand p { opacity: 0.8; font-size: 1rem; }
    .restaurant-name {
      margin-top: 1rem; display: inline-flex; align-items: center;
      padding: 0.45rem 0.9rem; border-radius: 999px;
      background: rgba(255,255,255,0.14); border: 1px solid rgba(255,255,255,0.24);
      font-weight: 700; font-size: 0.95rem;
    }
    .auth-tagline { margin-top: 3rem; position: relative; }
    .auth-tagline blockquote {
      font-family: var(--font-display); font-size: 1.1rem; font-style: italic;
      opacity: 0.75; text-align: center; max-width: 300px;
    }
    .auth-right {
      width: 480px; display: flex; align-items: center;
      justify-content: center; padding: 2rem; background: var(--gray-50);
    }
    .auth-card { width: 100%; max-width: 380px; }
    .auth-card h2 { font-family: var(--font-display); font-size: 1.7rem; margin-bottom: 0.3rem; }
    .auth-sub { color: var(--gray-500); font-size: 0.9rem; margin-bottom: 1.75rem; }
    .input-pw { position: relative; }
    .input-pw .form-control { padding-right: 4.1rem; }
    .toggle-pw {
      position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%);
      background: none; border: none; cursor: pointer; font-size: 0.78rem; line-height: 1;
      color: var(--primary); font-weight: 700;
    }
    .auth-footer { text-align: center; margin-top: 1.5rem; font-size: 0.875rem; color: var(--gray-500); }
    .auth-footer a { color: var(--primary); font-weight: 500; text-decoration: none; }
    .auth-footer a:hover { text-decoration: underline; }
    .btn-spinner {
      width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.4);
      border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block;
    }
    @media (max-width: 768px) {
      .auth-page { flex-direction: column; }
      .auth-left { padding: 2.5rem 1.5rem; min-height: 240px; }
      .auth-brand h1 { font-size: 2rem; }
      .auth-tagline { display: none; }
      .auth-right { width: 100%; padding: 2rem 1rem; }
    }
  `]
})
export class LoginComponent implements OnInit {
  private auth = inject(AuthService);
  private restauranteService = inject(RestauranteService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  loading = signal(false);
  error = signal('');
  restauranteNombre = signal('Restaurante sin configurar');
  submitted = false;
  showPw = signal(false);

  ngOnInit() {
    this.restauranteService.getPrincipal().subscribe({
      next: res => this.restauranteNombre.set(res.restaurante.nombre),
      error: () => this.restauranteNombre.set('Restaurante sin configurar')
    });
  }

  onSubmit() {
    this.submitted = true;
    if (this.form.invalid) return;

    this.loading.set(true);
    this.error.set('');

    this.auth.login(this.form.value as any).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: err => {
        this.loading.set(false);
        this.error.set(err.error?.mensaje ?? 'Error al iniciar sesion');
      }
    });
  }
}
