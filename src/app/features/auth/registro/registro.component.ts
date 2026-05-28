import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { RestauranteService } from '../../../core/services/api.service';

@Component({
  selector: 'app-registro',
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
      </div>

      <div class="auth-right">
        <div class="auth-card">
          <h2>Crear cuenta</h2>
          <p class="auth-sub">Registrate para hacer tus reservas</p>

          @if (error()) {
            <div class="alert alert-danger">{{ error() }}</div>
          }
          @if (exito()) {
            <div class="alert alert-success">{{ exito() }}</div>
          }

          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="grid-2">
              <div class="form-group">
                <label class="form-label">Nombre</label>
                <input type="text" formControlName="nombre" class="form-control"
                       [class.is-invalid]="submitted && form.get('nombre')?.invalid"
                       placeholder="Maria">
                @if (submitted && form.get('nombre')?.invalid) {
                  <span class="form-error">Nombre requerido</span>
                }
              </div>
              <div class="form-group">
                <label class="form-label">Apellido</label>
                <input type="text" formControlName="apellido" class="form-control"
                       [class.is-invalid]="submitted && form.get('apellido')?.invalid"
                       placeholder="Garcia">
                @if (submitted && form.get('apellido')?.invalid) {
                  <span class="form-error">Apellido requerido</span>
                }
              </div>
            </div>

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
              <label class="form-label">Telefono <span class="optional">(opcional)</span></label>
              <input type="tel" formControlName="telefono" class="form-control" placeholder="3001234567">
            </div>

            <div class="form-group">
              <label class="form-label">Contrasena</label>
              <input type="password" formControlName="password" class="form-control"
                     [class.is-invalid]="submitted && form.get('password')?.invalid"
                     placeholder="Minimo 6 caracteres">
              @if (submitted && form.get('password')?.invalid) {
                <span class="form-error">Minimo 6 caracteres</span>
              }
            </div>

            <button type="submit" class="btn btn-primary btn-block btn-lg" [disabled]="loading()">
              @if (loading()) { Creando cuenta... }
              @else { Crear cuenta }
            </button>
          </form>

          <p class="auth-footer">
            Ya tienes cuenta?
            <a routerLink="/login">Inicia sesion</a>
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
    .auth-brand p { color: rgba(255,255,255,0.8); }
    .restaurant-name {
      margin-top: 1rem; display: inline-flex; align-items: center;
      padding: 0.45rem 0.9rem; border-radius: 999px;
      background: rgba(255,255,255,0.14); border: 1px solid rgba(255,255,255,0.24);
      font-weight: 700; font-size: 0.95rem;
    }
    .auth-right {
      width: 520px; display: flex; align-items: center;
      justify-content: center; padding: 2rem; background: var(--gray-50);
    }
    .auth-card { width: 100%; max-width: 420px; }
    .auth-card h2 { font-family: var(--font-display); font-size: 1.7rem; margin-bottom: 0.3rem; }
    .auth-sub { color: var(--gray-500); font-size: 0.9rem; margin-bottom: 1.5rem; }
    .optional { color: var(--gray-400); font-weight: 400; font-size: 0.78rem; }
    .auth-footer { text-align: center; margin-top: 1.25rem; font-size: 0.875rem; color: var(--gray-500); }
    .auth-footer a { color: var(--primary); font-weight: 500; text-decoration: none; }
    @media (max-width: 768px) {
      .auth-page { flex-direction: column; }
      .auth-left { min-height: 220px; padding: 2rem; }
      .auth-brand h1 { font-size: 2rem; }
      .auth-right { width: 100%; padding: 1.5rem 1rem; }
    }
  `]
})
export class RegistroComponent implements OnInit {
  private auth = inject(AuthService);
  private restauranteService = inject(RestauranteService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  form = this.fb.group({
    nombre: ['', Validators.required],
    apellido: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    telefono: [''],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  loading = signal(false);
  error = signal('');
  exito = signal('');
  restauranteNombre = signal('Restaurante sin configurar');
  submitted = false;

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

    this.auth.registro(this.form.value as any).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: err => {
        this.loading.set(false);
        this.error.set(err.error?.mensaje ?? 'Error al registrarse');
      }
    });
  }
}
