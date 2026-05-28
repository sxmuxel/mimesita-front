import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReservaService, MesaService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { Mesa } from '../../../shared/models';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-nueva-reserva',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Nueva Reserva</h1>
          <p class="page-subtitle">Elige tu mesa y horario</p>
        </div>
      </div>

      @if (error()) { <div class="alert alert-danger">{{ error() }}</div> }
      @if (exito()) { <div class="alert alert-success">{{ exito() }}</div> }

      <div class="nueva-reserva-grid">
        <!-- Formulario -->
        <div class="card">
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="grid-2">
              <div class="form-group">
                <label class="form-label">Fecha *</label>
                <input type="date" formControlName="fecha" class="form-control"
                       [class.is-invalid]="submitted && form.get('fecha')?.invalid"
                       [min]="hoy">
                @if (submitted && form.get('fecha')?.invalid) {
                  <span class="form-error">Fecha requerida</span>
                }
              </div>
              <div class="form-group">
                <label class="form-label">Número de personas *</label>
                <input type="number" formControlName="numeroPersonas" class="form-control"
                       [class.is-invalid]="submitted && form.get('numeroPersonas')?.invalid"
                       min="1" max="30" placeholder="2">
                @if (submitted && form.get('numeroPersonas')?.invalid) {
                  <span class="form-error">Requerido (1–30)</span>
                }
              </div>
            </div>

            <div class="grid-2">
              <div class="form-group">
                <label class="form-label">Hora de inicio *</label>
                <input type="time" formControlName="horaInicio" class="form-control"
                       [class.is-invalid]="submitted && form.get('horaInicio')?.invalid">
                @if (submitted && form.get('horaInicio')?.invalid) {
                  <span class="form-error">Requerida</span>
                }
              </div>
              <div class="form-group">
                <label class="form-label">Hora de fin *</label>
                <input type="time" formControlName="horaFin" class="form-control"
                       [class.is-invalid]="submitted && form.get('horaFin')?.invalid">
                @if (submitted && form.get('horaFin')?.invalid) {
                  <span class="form-error">Requerida</span>
                }
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Ocasión especial</label>
              <select formControlName="ocasionEspecial" class="form-control">
                <option value="ninguna">Sin ocasión especial</option>
                <option value="cumpleanos">🎂 Cumpleaños</option>
                <option value="aniversario">💑 Aniversario</option>
                <option value="reunion_negocios">💼 Reunión de negocios</option>
                <option value="otra">🎉 Otra</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Peticiones especiales <span class="optional">(opcional)</span></label>
              <textarea formControlName="peticionesEspeciales" class="form-control"
                        rows="3" placeholder="Alergia a nueces, mesa cerca de la ventana..."></textarea>
            </div>

            <!-- Selector de mesa -->
            <div class="form-group">
              <label class="form-label">Selecciona una mesa *</label>
              @if (!mesaSeleccionada()) {
                <div class="mesa-hint">Elige una mesa de la lista de la derecha →</div>
              } @else {
                <div class="mesa-elegida">
                  <span>Mesa {{ mesaSeleccionada()!.numero }} · {{ mesaSeleccionada()!.ubicacion }} · {{ mesaSeleccionada()!.capacidad }} personas</span>
                  <button type="button" class="btn-cambiar" (click)="mesaSeleccionada.set(null)">Cambiar</button>
                </div>
              }
              @if (submitted && !mesaSeleccionada()) {
                <span class="form-error">Debes seleccionar una mesa</span>
              }
            </div>

            <button type="submit" class="btn btn-primary btn-block btn-lg" [disabled]="loading()">
              {{ loading() ? 'Creando reserva...' : 'Confirmar reserva' }}
            </button>
          </form>
        </div>

        <!-- Panel de mesas -->
        <div class="mesas-panel card">
          <h3 style="margin-bottom:1rem">Mesas disponibles</h3>
          @if (loadingMesas()) {
            <div class="loading-container"><div class="spinner"></div></div>
          } @else {
            <div class="mesas-grid">
              @for (m of mesas(); track m._id) {
                <div class="mesa-item"
                     [class.selected]="mesaSeleccionada()?._id === m._id"
                     [class.disabled]="!m.disponible"
                     (click)="seleccionarMesa(m)">
                  <div class="mesa-num">{{ m.numero }}</div>
                  <div class="mesa-cap">👥 {{ m.capacidad }}</div>
                  <div class="mesa-loc">{{ m.ubicacion }}</div>
                  @if (!m.disponible) { <div class="mesa-tag">No disponible</div> }
                </div>
              }
            </div>
            <p class="mesas-legend">
              <span class="dot available"></span> Disponible
              <span class="dot unavailable"></span> No disponible
            </p>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .nueva-reserva-grid { display: grid; grid-template-columns: 1fr 340px; gap: 1.5rem; align-items: start; }
    .optional { color: var(--gray-400); font-size: 0.78rem; font-weight: 400; }
    .mesa-hint { padding: 0.75rem 1rem; background: var(--gray-100); border-radius: var(--radius); font-size: 0.875rem; color: var(--gray-500); }
    .mesa-elegida {
      display: flex; align-items: center; justify-content: space-between;
      padding: 0.75rem 1rem; background: var(--primary-light); border-radius: var(--radius);
      border: 1.5px solid var(--primary); font-size: 0.875rem; color: var(--primary);
    }
    .btn-cambiar { background: none; border: none; color: var(--primary); cursor: pointer; font-size: 0.8rem; font-weight: 500; text-decoration: underline; }
    .mesas-panel { position: sticky; top: 80px; }
    .mesas-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.6rem; }
    .mesa-item {
      border: 2px solid var(--gray-200); border-radius: var(--radius);
      padding: 0.6rem 0.4rem; text-align: center; cursor: pointer;
      transition: var(--transition);
    }
    .mesa-item:hover:not(.disabled) { border-color: var(--primary); background: var(--primary-light); }
    .mesa-item.selected { border-color: var(--primary); background: var(--primary-light); }
    .mesa-item.disabled { opacity: 0.45; cursor: not-allowed; background: var(--gray-100); }
    .mesa-num { font-size: 1.1rem; font-weight: 700; color: var(--gray-800); }
    .mesa-cap { font-size: 0.72rem; color: var(--gray-500); margin: 0.15rem 0; }
    .mesa-loc { font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--gray-400); }
    .mesa-tag { font-size: 0.65rem; color: var(--danger); margin-top: 0.2rem; }
    .mesas-legend { display: flex; gap: 1rem; margin-top: 1rem; font-size: 0.78rem; color: var(--gray-500); }
    .dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 0.3rem; }
    .dot.available { background: var(--primary); }
    .dot.unavailable { background: var(--gray-300); }
    @media (max-width: 900px) { .nueva-reserva-grid { grid-template-columns: 1fr; } .mesas-panel { position: static; } }
  `]
})
export class NuevaReservaComponent implements OnInit {
  private fb = inject(FormBuilder);
  private reservaService = inject(ReservaService);
  private mesaService = inject(MesaService);
  private auth = inject(AuthService);
  private router = inject(Router);

  hoy = new Date().toISOString().split('T')[0];

  form = this.fb.group({
    fecha: ['', Validators.required],
    horaInicio: ['', Validators.required],
    horaFin: ['', Validators.required],
    numeroPersonas: [2, [Validators.required, Validators.min(1), Validators.max(30)]],
    ocasionEspecial: ['ninguna'],
    peticionesEspeciales: ['']
  });

  mesas = signal<Mesa[]>([]);
  mesaSeleccionada = signal<Mesa | null>(null);
  loading = signal(false);
  loadingMesas = signal(true);
  error = signal('');
  exito = signal('');
  submitted = false;

  ngOnInit() {
    this.mesaService.getMesasDeRestaurante().subscribe({
      next: res => { this.mesas.set(res.mesas); this.loadingMesas.set(false); },
      error: () => this.loadingMesas.set(false)
    });
  }

  seleccionarMesa(m: Mesa) {
    if (!m.disponible) return;
    this.mesaSeleccionada.set(m);
  }

  onSubmit() {
    this.submitted = true;
    if (this.form.invalid || !this.mesaSeleccionada()) return;

    this.loading.set(true);
    this.error.set('');

    const mesa = this.mesaSeleccionada()!;
    const restauranteId = typeof mesa.restaurante === 'object' ? mesa.restaurante._id : mesa.restaurante;
    const payload = {
      ...this.form.value,
      restaurante: restauranteId || environment.restauranteId,
      mesa: mesa._id
    };

    this.reservaService.crear(payload as any).subscribe({
      next: res => {
        this.loading.set(false);
        this.exito.set(`¡Reserva creada! Tu código es: ${res.reserva.codigoReserva}`);
        setTimeout(() => this.router.navigate(['/reservas']), 2500);
      },
      error: err => {
        this.loading.set(false);
        this.error.set(err.error?.mensaje ?? 'Error al crear la reserva');
      }
    });
  }
}
