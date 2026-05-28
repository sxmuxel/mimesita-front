import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RestauranteService } from '../../core/services/api.service';
import { Restaurante } from '../../shared/models';

const DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];

@Component({
  selector: 'app-restaurante',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Restaurante</h1>
          <p class="page-subtitle">Configura la informacion publica y los horarios</p>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-container"><div class="spinner"></div></div>
      } @else {
        @if (exito()) { <div class="alert alert-success">{{ exito() }}</div> }
        @if (error()) { <div class="alert alert-danger">{{ error() }}</div> }

        <form class="rest-grid" [formGroup]="form" (ngSubmit)="guardar()">
          <div class="card">
            <h3>Datos generales</h3>
            <div class="form-group">
              <label class="form-label">Nombre</label>
              <input class="form-control" formControlName="nombre">
            </div>
            <div class="form-group">
              <label class="form-label">Descripcion</label>
              <textarea class="form-control" rows="3" formControlName="descripcion"></textarea>
            </div>
            <div class="grid-2">
              <div class="form-group">
                <label class="form-label">Telefono</label>
                <input class="form-control" formControlName="telefono">
              </div>
              <div class="form-group">
                <label class="form-label">Email</label>
                <input class="form-control" type="email" formControlName="email">
              </div>
            </div>
            <div class="grid-2">
              <div class="form-group">
                <label class="form-label">Tipo de cocina</label>
                <input class="form-control" formControlName="tipoCocina">
              </div>
              <div class="form-group">
                <label class="form-label">Capacidad total</label>
                <input class="form-control" type="number" min="1" formControlName="capacidadTotal">
              </div>
            </div>
          </div>

          <div class="card" formGroupName="direccion">
            <h3>Direccion</h3>
            <div class="form-group">
              <label class="form-label">Calle</label>
              <input class="form-control" formControlName="calle">
            </div>
            <div class="grid-2">
              <div class="form-group">
                <label class="form-label">Ciudad</label>
                <input class="form-control" formControlName="ciudad">
              </div>
              <div class="form-group">
                <label class="form-label">Departamento</label>
                <input class="form-control" formControlName="departamento">
              </div>
            </div>
          </div>

          <div class="card horarios-card">
            <h3>Horarios</h3>
            <div formArrayName="horarios" class="horarios-list">
              @for (horario of horarios.controls; track $index; let i = $index) {
                <div class="horario-row" [formGroupName]="i">
                  <strong>{{ dias[i] }}</strong>
                  <label class="checkbox-label"><input type="checkbox" formControlName="cerrado"> Cerrado</label>
                  <input class="form-control" type="time" formControlName="apertura">
                  <input class="form-control" type="time" formControlName="cierre">
                </div>
              }
            </div>
          </div>

          <div class="actions">
            <button class="btn btn-primary" type="submit" [disabled]="guardando() || form.invalid">
              {{ guardando() ? 'Guardando...' : (restaurante() ? 'Guardar cambios' : 'Crear restaurante') }}
            </button>
          </div>
        </form>
      }
    </div>
  `,
  styles: [`
    .rest-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
    .card h3 { margin-bottom: 1rem; }
    .horarios-card { grid-column: 1 / -1; }
    .horarios-list { display: grid; gap: 0.75rem; }
    .horario-row { display: grid; grid-template-columns: 120px 110px 1fr 1fr; align-items: center; gap: 0.75rem; }
    .checkbox-label { display: flex; align-items: center; gap: 0.4rem; font-size: 0.875rem; }
    .actions { grid-column: 1 / -1; display: flex; justify-content: flex-end; }
    @media (max-width: 768px) {
      .rest-grid { grid-template-columns: 1fr; }
      .horario-row { grid-template-columns: 1fr; }
    }
  `]
})
export class RestauranteComponent implements OnInit {
  private restauranteService = inject(RestauranteService);
  private fb = inject(FormBuilder);

  dias = DIAS;
  restaurante = signal<Restaurante | null>(null);
  loading = signal(true);
  guardando = signal(false);
  exito = signal('');
  error = signal('');

  form = this.fb.group({
    nombre: ['', Validators.required],
    descripcion: [''],
    direccion: this.fb.group({
      calle: ['', Validators.required],
      ciudad: ['', Validators.required],
      departamento: ['']
    }),
    telefono: ['', Validators.required],
    email: [''],
    tipoCocina: [''],
    capacidadTotal: [1, [Validators.required, Validators.min(1)]],
    horarios: this.fb.array(DIAS.map(dia => this.crearHorario(dia)))
  });

  get horarios(): FormArray {
    return this.form.get('horarios') as FormArray;
  }

  ngOnInit() {
    this.restauranteService.getPrincipal().subscribe({
      next: res => {
        this.restaurante.set(res.restaurante);
        this.form.patchValue(res.restaurante as any);
        this.reemplazarHorarios(res.restaurante.horarios ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No hay restaurante configurado. Completa el formulario para crear uno.');
        this.loading.set(false);
      }
    });
  }

  guardar() {
    if (this.form.invalid) return;
    this.guardando.set(true);
    this.exito.set('');
    this.error.set('');
    const data = this.form.getRawValue();
    const op = this.restauranteService.guardarPrincipal(data as any);

    op.subscribe({
      next: res => {
        this.restaurante.set(res.restaurante);
        this.guardando.set(false);
        this.exito.set('Restaurante guardado correctamente.');
      },
      error: err => {
        this.guardando.set(false);
        this.error.set(err.error?.mensaje ?? 'Error al guardar restaurante');
      }
    });
  }

  private crearHorario(dia: string) {
    return this.fb.group({
      dia: [dia, Validators.required],
      apertura: ['08:00', Validators.required],
      cierre: ['22:00', Validators.required],
      cerrado: [false]
    });
  }

  private reemplazarHorarios(horarios: any[]) {
    this.horarios.clear();
    for (const dia of DIAS) {
      const existente = horarios.find(h => h.dia === dia);
      this.horarios.push(this.fb.group({
        dia: [dia, Validators.required],
        apertura: [existente?.apertura ?? '08:00', Validators.required],
        cierre: [existente?.cierre ?? '22:00', Validators.required],
        cerrado: [existente?.cerrado ?? false]
      }));
    }
  }
}
