import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsuarioService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Usuario } from '../../shared/models';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Usuarios</h1>
          <p class="page-subtitle">{{ total() }} usuarios registrados</p>
        </div>
        <button class="btn btn-primary" (click)="abrirModal()">+ Nuevo usuario</button>
      </div>

      <div class="card filtros">
        <div class="filtros-inner">
          <div class="form-group">
            <label class="form-label">Buscar</label>
            <input class="form-control" [(ngModel)]="buscar" (keyup.enter)="cargar()" placeholder="Nombre, apellido o email">
          </div>
          <div class="form-group">
            <label class="form-label">Rol</label>
            <select class="form-control" [(ngModel)]="rol" (change)="cargar()">
              <option value="">Todos</option>
              <option value="admin">Admin</option>
              <option value="empleado">Empleado</option>
              <option value="cliente">Cliente</option>
            </select>
          </div>
          <button class="btn btn-secondary" (click)="cargar()">Filtrar</button>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-container"><div class="spinner"></div></div>
      } @else {
        <div class="card">
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Email</th>
                  <th>Telefono</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (u of usuarios(); track u._id) {
                  <tr>
                    <td>{{ u.nombre }} {{ u.apellido }}</td>
                    <td>{{ u.email }}</td>
                    <td>{{ u.telefono || '-' }}</td>
                    <td><span class="badge badge-{{ u.rol }}">{{ u.rol }}</span></td>
                    <td>{{ u.activo ? 'Activo' : 'Inactivo' }}</td>
                    <td>
                      <button class="btn btn-secondary btn-sm" (click)="abrirModal(u)">Editar</button>
                      <button class="btn btn-danger btn-sm" (click)="desactivar(u)" [disabled]="!u.activo">Desactivar</button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      @if (modalAbierto()) {
        <div class="modal-overlay" (click)="cerrarModal()">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3 class="modal-title">{{ editando() ? 'Editar usuario' : 'Nuevo usuario' }}</h3>
              <button class="modal-close" (click)="cerrarModal()">x</button>
            </div>

            @if (modalError()) { <div class="alert alert-danger">{{ modalError() }}</div> }

            <form [formGroup]="form" (ngSubmit)="guardar()">
              <div class="grid-2">
                <div class="form-group">
                  <label class="form-label">Nombre</label>
                  <input class="form-control" formControlName="nombre">
                </div>
                <div class="form-group">
                  <label class="form-label">Apellido</label>
                  <input class="form-control" formControlName="apellido">
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Email</label>
                <input class="form-control" formControlName="email" type="email" [readonly]="!!editando()">
              </div>
              @if (!editando()) {
                <div class="form-group">
                  <label class="form-label">Password</label>
                  <input class="form-control" formControlName="password" type="password">
                </div>
              }
              <div class="grid-2">
                <div class="form-group">
                  <label class="form-label">Telefono</label>
                  <input class="form-control" formControlName="telefono">
                </div>
                <div class="form-group">
                  <label class="form-label">Rol</label>
                <select class="form-control" formControlName="rol" [disabled]="esUsuarioActual()">
                    <option value="cliente">Cliente</option>
                    <option value="empleado">Empleado</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              @if (editando()) {
                <div class="form-group">
                  <label class="form-label">Estado</label>
                  <select class="form-control" formControlName="activo" [disabled]="esUsuarioActual()">
                    <option [ngValue]="true">Activo</option>
                    <option [ngValue]="false">Inactivo</option>
                  </select>
                </div>
              }
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="cerrarModal()">Cancelar</button>
                <button type="submit" class="btn btn-primary" [disabled]="guardando()">
                  {{ guardando() ? 'Guardando...' : 'Guardar' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .filtros { margin-bottom: 1.5rem; }
    .filtros-inner { display: flex; gap: 1rem; align-items: flex-end; flex-wrap: wrap; }
    .filtros .form-group { margin: 0; min-width: 180px; flex: 1; }
    td .btn + .btn { margin-left: 0.4rem; }
  `]
})
export class UsuariosComponent implements OnInit {
  private usuarioService = inject(UsuarioService);
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);

  usuarios = signal<Usuario[]>([]);
  loading = signal(true);
  total = signal(0);
  modalAbierto = signal(false);
  editando = signal<Usuario | null>(null);
  guardando = signal(false);
  modalError = signal('');
  buscar = '';
  rol = '';

  form = this.fb.group({
    nombre: ['', Validators.required],
    apellido: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: [''],
    telefono: [''],
    rol: ['cliente', Validators.required],
    activo: [true]
  });

  ngOnInit() { this.cargar(); }

  cargar() {
    this.loading.set(true);
    const params = { buscar: this.buscar, rol: this.rol, limit: 100 };
    this.usuarioService.getUsuarios(params).subscribe({
      next: res => {
        this.usuarios.set(res.usuarios ?? []);
        this.total.set(res.total ?? 0);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  abrirModal(usuario?: Usuario) {
    this.editando.set(usuario ?? null);
    this.modalError.set('');
    if (usuario) {
      this.form.patchValue({ ...usuario, password: '' });
      this.form.get('password')?.clearValidators();
    } else {
      this.form.reset({ rol: 'cliente', activo: true });
      this.form.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    }
    this.form.get('password')?.updateValueAndValidity();
    this.modalAbierto.set(true);
  }

  cerrarModal() {
    this.modalAbierto.set(false);
    this.editando.set(null);
  }

  guardar() {
    if (this.form.invalid) return;
    this.guardando.set(true);
    this.modalError.set('');
    const raw = this.form.getRawValue();
    const data: any = { ...raw };
    if (this.editando()) delete data.password;
    if (this.esUsuarioActual()) {
      delete data.rol;
      delete data.activo;
    }

    const op = this.editando()
      ? this.usuarioService.actualizar(this.editando()!._id, data)
      : this.usuarioService.crear(data);

    op.subscribe({
      next: () => { this.guardando.set(false); this.cerrarModal(); this.cargar(); },
      error: err => { this.guardando.set(false); this.modalError.set(err.error?.mensaje ?? 'Error al guardar usuario'); }
    });
  }

  desactivar(usuario: Usuario) {
    if (!confirm(`Desactivar a ${usuario.nombre} ${usuario.apellido}?`)) return;
    this.usuarioService.eliminar(usuario._id).subscribe({ next: () => this.cargar() });
  }

  esUsuarioActual() {
    return this.editando()?._id === this.auth.usuario()?._id;
  }
}
