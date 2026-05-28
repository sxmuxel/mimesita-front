import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { MesaService } from '../../core/services/api.service';
import { Mesa } from '../../shared/models';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-mesas',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Gestión de Mesas</h1>
          <p class="page-subtitle">{{ mesas().length }} mesas registradas</p>
        </div>
        @if (auth.isAdmin()) {
          <button class="btn btn-primary" (click)="abrirModal()">+ Nueva mesa</button>
        }
      </div>

      @if (loading()) {
        <div class="loading-container"><div class="spinner"></div></div>
      } @else if (mesas().length === 0) {
        <div class="empty-state">
          <div class="empty-icon">🪑</div>
          <p>No hay mesas registradas</p>
          @if (auth.isAdmin()) {
            <button class="btn btn-primary" style="margin-top:1rem" (click)="abrirModal()">Crear primera mesa</button>
          }
        </div>
      } @else {
        <!-- Vista visual de mesas -->
        <div class="ubicacion-tabs">
          <button class="cat-tab" [class.active]="ubicacionActiva === ''" (click)="ubicacionActiva=''">Todas</button>
          @for (u of ubicaciones; track u) {
            <button class="cat-tab" [class.active]="ubicacionActiva===u" (click)="ubicacionActiva=u">{{ u }}</button>
          }
        </div>

        <div class="mesas-visual">
          @for (m of mesasFiltradas(); track m._id) {
            <div class="mesa-vis-card" [class.disponible]="m.disponible" [class.ocupada]="!m.disponible">
              <div class="mesa-vis-num">#{{ m.numero }}</div>
              <div class="mesa-vis-info">
                <span>Para {{ m.capacidad }} personas en {{ m.ubicacion }} </span>
              </div>
              <div class="mesa-vis-estado">{{ m.disponible ? 'Disponible' : 'Ocupada' }}
              </div>
              <div class="mesa-vis-actions">
                <button class="btn btn-sm" [class.btn-danger]="m.disponible" [class.btn-success]="!m.disponible"
                        (click)="toggleDisponible(m)">
                  {{ m.disponible ? 'Marcar ocupada' : 'Marcar libre' }}
                </button>
                @if (auth.isAdmin()) {
                  <button class="btn btn-secondary btn-sm" (click)="abrirModal(m)">✏️</button>
                  <button class="btn btn-danger btn-sm" (click)="eliminar(m)">🗑️</button>
                }
              </div>
            </div>
          }
        </div>
      }

      <!-- Modal -->
      @if (modalAbierto()) {
        <div class="modal-overlay" (click)="cerrarModal()">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3 class="modal-title">{{ editando() ? 'Editar mesa' : 'Nueva mesa' }}</h3>
              <button class="modal-close" (click)="cerrarModal()">×</button>
            </div>

            @if (modalError()) { <div class="alert alert-danger">{{ modalError() }}</div> }

            <form [formGroup]="form" (ngSubmit)="guardar()">
              <div class="grid-2">
                <div class="form-group">
                  <label class="form-label">Número de mesa *</label>
                  <input type="number" formControlName="numero" class="form-control" min="1">
                </div>
                <div class="form-group">
                  <label class="form-label">Capacidad (personas) *</label>
                  <input type="number" formControlName="capacidad" class="form-control" min="1" max="30">
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Ubicación *</label>
                <select formControlName="ubicacion" class="form-control">
                  <option value="interior">Interior</option>
                  <option value="exterior">Exterior</option>
                  <option value="terraza">Terraza</option>
                  <option value="privado">Privado</option>
                  <option value="barra">Barra</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Descripción</label>
                <input type="text" formControlName="descripcion" class="form-control" placeholder="Ej: Junto a la ventana">
              </div>
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
    .ubicacion-tabs { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
    .cat-tab { padding: 0.4rem 1rem; border-radius: 999px; border: 1.5px solid var(--gray-200); background: var(--white); font-size: 0.82rem; font-weight: 500; cursor: pointer; transition: var(--transition); color: var(--gray-600); }
    .cat-tab:hover { border-color: var(--primary); color: var(--primary); }
    .cat-tab.active { background: var(--primary); border-color: var(--primary); color: var(--white); }
    .mesas-visual { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; }
    .mesa-vis-card {
      background: var(--white); border-radius: var(--radius-lg);
      border: 2px solid var(--gray-200); padding: 1.25rem;
      box-shadow: var(--shadow-sm); transition: var(--transition);
    }
    .mesa-vis-card.disponible { border-color: var(--success); }
    .mesa-vis-card.ocupada { border-color: var(--danger); opacity: 0.85; }
    .mesa-vis-num { font-size: 1.9rem; font-weight: 700; color: var(--gray-700); line-height: 1; margin-bottom: 0.5rem; font-family: var(--font-body); }
    .mesa-vis-info { display: flex; gap: 0.75rem; font-size: 0.8rem; color: var(--gray-500); margin-bottom: 0.5rem; }
    .mesa-vis-estado { font-size: 0.78rem; font-weight: 600; margin-bottom: 0.75rem; }
    .mesa-vis-actions { display: flex; gap: 0.4rem; flex-wrap: wrap; }
  `]
})
export class MesasComponent implements OnInit {
  auth = inject(AuthService);
  private mesaService = inject(MesaService);
  private fb = inject(FormBuilder);

  mesas = signal<Mesa[]>([]);
  loading = signal(true);
  modalAbierto = signal(false);
  editando = signal<Mesa | null>(null);
  guardando = signal(false);
  modalError = signal('');
  ubicacionActiva = '';
  ubicaciones = ['interior', 'exterior', 'terraza', 'privado', 'barra'];

  form = this.fb.group({
    numero: [null, [Validators.required, Validators.min(1)]],
    capacidad: [4, [Validators.required, Validators.min(1), Validators.max(30)]],
    ubicacion: ['interior', Validators.required],
    descripcion: ['']
  });

  ngOnInit() { this.cargar(); }

  cargar() {
    this.loading.set(true);
    this.mesaService.getMesasDeRestaurante().subscribe({
      next: res => { this.mesas.set(res.mesas); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  mesasFiltradas() {
    if (!this.ubicacionActiva) return this.mesas();
    return this.mesas().filter(m => m.ubicacion === this.ubicacionActiva);
  }

  toggleDisponible(m: Mesa) {
    this.mesaService.actualizar(m._id, { disponible: !m.disponible }).subscribe({ next: () => this.cargar() });
  }

  abrirModal(m?: Mesa) {
    this.editando.set(m ?? null);
    this.modalError.set('');
    if (m) { this.form.patchValue({ ...m } as any); }
    else { this.form.reset({ capacidad: 4, ubicacion: 'interior' }); }
    this.modalAbierto.set(true);
  }

  cerrarModal() { this.modalAbierto.set(false); this.editando.set(null); }

  guardar() {
    if (this.form.invalid) return;
    this.guardando.set(true);
    this.modalError.set('');
    const data: any = { ...this.form.value };
    if (!this.editando()) data.restaurante = environment.restauranteId;
    const op = this.editando()
      ? this.mesaService.actualizar(this.editando()!._id, data as any)
      : this.mesaService.crear(data as any);

    op.subscribe({
      next: () => { this.guardando.set(false); this.cerrarModal(); this.cargar(); },
      error: err => { this.guardando.set(false); this.modalError.set(err.error?.mensaje ?? 'Error'); }
    });
  }

  eliminar(m: Mesa) {
    if (!confirm(`¿Eliminar mesa ${m.numero}?`)) return;
    this.mesaService.eliminar(m._id).subscribe({ next: () => this.cargar() });
  }
}
