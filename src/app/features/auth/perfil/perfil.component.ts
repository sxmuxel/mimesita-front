import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Mi Perfil</h1>
          <p class="page-subtitle">Gestiona tu información personal</p>
        </div>
      </div>

      <div class="perfil-grid">
        <div class="card">
          <div class="perfil-header">
            <div class="perfil-avatar">{{ inicial() }}</div>
            <div>
              <h3>{{ auth.usuario()?.nombre }} {{ auth.usuario()?.apellido }}</h3>
              <span class="badge badge-{{ auth.usuario()?.rol }}">{{ auth.usuario()?.rol }}</span>
            </div>
          </div>

          @if (exitoPerfil()) { <div class="alert alert-success">{{ exitoPerfil() }}</div> }
          @if (errorPerfil()) { <div class="alert alert-danger">{{ errorPerfil() }}</div> }

          <form [formGroup]="perfilForm" (ngSubmit)="guardarPerfil()">
            <div class="grid-2">
              <div class="form-group">
                <label class="form-label">Nombre</label>
                <input type="text" formControlName="nombre" class="form-control">
              </div>
              <div class="form-group">
                <label class="form-label">Apellido</label>
                <input type="text" formControlName="apellido" class="form-control">
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Teléfono</label>
              <input type="tel" formControlName="telefono" class="form-control">
            </div>
            <button type="submit" class="btn btn-primary" [disabled]="loadingPerfil()">
              {{ loadingPerfil() ? 'Guardando...' : 'Guardar cambios' }}
            </button>
          </form>
        </div>

        <div class="card">
          <h3 style="margin-bottom:1.25rem">Cambiar contraseña</h3>

          @if (exitoPw()) { <div class="alert alert-success">{{ exitoPw() }}</div> }
          @if (errorPw()) { <div class="alert alert-danger">{{ errorPw() }}</div> }

          <form [formGroup]="pwForm" (ngSubmit)="cambiarPassword()">
            <div class="form-group">
              <label class="form-label">Contraseña actual</label>
              <input type="password" formControlName="passwordActual" class="form-control">
            </div>
            <div class="form-group">
              <label class="form-label">Nueva contraseña</label>
              <input type="password" formControlName="passwordNueva" class="form-control">
            </div>
            <button type="submit" class="btn btn-outline" [disabled]="loadingPw()">
              {{ loadingPw() ? 'Cambiando...' : 'Cambiar contraseña' }}
            </button>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .perfil-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
    .perfil-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; }
    .perfil-avatar {
      width: 56px; height: 56px; border-radius: 50%;
      background: var(--primary); color: white;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.4rem; font-weight: 700; flex-shrink: 0;
    }
    @media (max-width: 768px) { .perfil-grid { grid-template-columns: 1fr; } }
  `]
})
export class PerfilComponent {
  auth = inject(AuthService);
  private fb = inject(FormBuilder);

  perfilForm = this.fb.group({
    nombre: [this.auth.usuario()?.nombre ?? ''],
    apellido: [this.auth.usuario()?.apellido ?? ''],
    telefono: [this.auth.usuario()?.telefono ?? '']
  });

  pwForm = this.fb.group({
    passwordActual: ['', Validators.required],
    passwordNueva: ['', [Validators.required, Validators.minLength(6)]]
  });

  loadingPerfil = signal(false);
  loadingPw = signal(false);
  exitoPerfil = signal('');
  errorPerfil = signal('');
  exitoPw = signal('');
  errorPw = signal('');

  inicial = () => this.auth.usuario()?.nombre?.charAt(0).toUpperCase() ?? '?';

  guardarPerfil() {
    this.loadingPerfil.set(true);
    this.exitoPerfil.set(''); this.errorPerfil.set('');
    this.auth.actualizarPerfil(this.perfilForm.value as any).subscribe({
      next: () => { this.loadingPerfil.set(false); this.exitoPerfil.set('Perfil actualizado correctamente.'); },
      error: err => { this.loadingPerfil.set(false); this.errorPerfil.set(err.error?.mensaje ?? 'Error'); }
    });
  }

  cambiarPassword() {
    if (this.pwForm.invalid) return;
    this.loadingPw.set(true);
    this.exitoPw.set(''); this.errorPw.set('');
    const { passwordActual, passwordNueva } = this.pwForm.value;
    this.auth.cambiarPassword(passwordActual!, passwordNueva!).subscribe({
      next: () => { this.loadingPw.set(false); this.exitoPw.set('Contraseña cambiada.'); this.pwForm.reset(); },
      error: err => { this.loadingPw.set(false); this.errorPw.set(err.error?.mensaje ?? 'Error'); }
    });
  }
}