import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { MenuService } from '../../core/services/api.service';
import { ItemMenu, CategoriaMenu } from '../../shared/models';
import { environment } from '../../../environments/environment';

const CATEGORIAS: { value: CategoriaMenu; label: string; icon: string }[] = [
  { value: 'entrada', label: 'Entradas', icon: '🥗' },
  { value: 'sopa', label: 'Sopas', icon: '🍲' },
  { value: 'ensalada', label: 'Ensaladas', icon: '🥙' },
  { value: 'plato_principal', label: 'Platos principales', icon: '🍽️' },
  { value: 'postre', label: 'Postres', icon: '🍮' },
  { value: 'bebida', label: 'Bebidas', icon: '🥤' },
  { value: 'especial', label: 'Especiales', icon: '⭐' },
];

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Menú</h1>
          <p class="page-subtitle">Descubre nuestros platos</p>
        </div>
        @if (auth.isStaff()) {
          <button class="btn btn-primary" (click)="abrirModal()">+ Agregar plato</button>
        }
      </div>

      <!-- Filtro categorías -->
      <div class="cat-tabs">
        <button class="cat-tab" [class.active]="catActiva === ''" (click)="catActiva='';filtrar()">Todos</button>
        @for (c of categorias; track c.value) {
          <button class="cat-tab" [class.active]="catActiva === c.value" (click)="catActiva=c.value;filtrar()">
            {{ c.icon }} {{ c.label }}
          </button>
        }
      </div>

      @if (loading()) {
        <div class="loading-container"><div class="spinner"></div></div>
      } @else {
        @for (cat of categoriasFiltradas(); track cat.value) {
          @if (itemsPorCategoria(cat.value).length > 0) {
            <div class="cat-section">
              <h2 class="cat-title">{{ cat.icon }} {{ cat.label }}</h2>
              <div class="menu-grid">
                @for (item of itemsPorCategoria(cat.value); track item._id) {
                  <div class="menu-card card" [class.unavailable]="!item.disponible">
                    <div class="menu-card-top">
                      <div class="menu-name">{{ item.nombre }}</div>
                      <div class="menu-price">{{ item.precio | currency:'COP':'symbol':'1.0-0' }}</div>
                    </div>
                    @if (item.descripcion) {
                      <p class="menu-desc">{{ item.descripcion }}</p>
                    }
                    <div class="menu-tags">
                      @if (item.vegetariano) { <span class="tag green">🌱 Vegetariano</span> }
                      @if (item.vegano) { <span class="tag green">🌿 Vegano</span> }
                      @if (item.sinGluten) { <span class="tag yellow">🌾 Sin gluten</span> }
                      @if (!item.disponible) { <span class="tag red">No disponible</span> }
                    </div>
                    @if (item.tiempoPreparacion) {
                      <div class="menu-time">⏱ {{ item.tiempoPreparacion }} min</div>
                    }
                    @if (auth.isStaff()) {
                      <div class="menu-actions">
                        <button class="btn btn-secondary btn-sm" (click)="editarItem(item)">Editar</button>
                        <button class="btn btn-danger btn-sm" (click)="eliminarItem(item)">Eliminar</button>
                      </div>
                    }
                  </div>
                }
              </div>
            </div>
          }
        }
        @if (itemsFiltrados().length === 0) {
          <div class="empty-state"><div class="empty-icon">🍽️</div><p>No hay ítems en esta categoría</p></div>
        }
      }

      <!-- Modal crear/editar -->
      @if (modalAbierto()) {
        <div class="modal-overlay" (click)="cerrarModal()">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3 class="modal-title">{{ editando() ? 'Editar plato' : 'Nuevo plato' }}</h3>
              <button class="modal-close" (click)="cerrarModal()">×</button>
            </div>

            @if (modalError()) { <div class="alert alert-danger">{{ modalError() }}</div> }

            <form [formGroup]="form" (ngSubmit)="guardar()">
              <div class="form-group">
                <label class="form-label">Nombre *</label>
                <input type="text" formControlName="nombre" class="form-control">
              </div>
              <div class="form-group">
                <label class="form-label">Descripción</label>
                <textarea formControlName="descripcion" class="form-control" rows="2"></textarea>
              </div>
              <div class="grid-2">
                <div class="form-group">
                  <label class="form-label">Precio (COP) *</label>
                  <input type="number" formControlName="precio" class="form-control" min="0">
                </div>
                <div class="form-group">
                  <label class="form-label">Categoría *</label>
                  <select formControlName="categoria" class="form-control">
                    @for (c of categorias; track c.value) {
                      <option [value]="c.value">{{ c.label }}</option>
                    }
                  </select>
                </div>
              </div>
              <div class="grid-2">
                <div class="form-group">
                  <label class="form-label">Tiempo de preparación (min)</label>
                  <input type="number" formControlName="tiempoPreparacion" class="form-control" min="0">
                </div>
                <div class="form-group">
                  <label class="form-label">Disponible</label>
                  <select formControlName="disponible" class="form-control">
                    <option [value]="true">Sí</option>
                    <option [value]="false">No</option>
                  </select>
                </div>
              </div>
              <div class="checkboxes">
                <label class="checkbox-label">
                  <input type="checkbox" formControlName="vegetariano"> 🌱 Vegetariano
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" formControlName="vegano"> 🌿 Vegano
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" formControlName="sinGluten"> 🌾 Sin gluten
                </label>
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
    .cat-tabs { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 2rem; }
    .cat-tab { padding: 0.4rem 1rem; border-radius: 999px; border: 1.5px solid var(--gray-200); background: var(--white); font-size: 0.82rem; font-weight: 500; cursor: pointer; transition: var(--transition); color: var(--gray-600); }
    .cat-tab:hover { border-color: var(--primary); color: var(--primary); }
    .cat-tab.active { background: var(--primary); border-color: var(--primary); color: var(--white); }
    .cat-section { margin-bottom: 2rem; }
    .cat-title { font-family: var(--font-display); font-size: 1.2rem; margin-bottom: 1rem; color: var(--gray-800); }
    .menu-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1rem; }
    .menu-card { padding: 1rem; transition: var(--transition); }
    .menu-card:hover { box-shadow: var(--shadow-lg); transform: translateY(-2px); }
    .menu-card.unavailable { opacity: 0.6; }
    .menu-card-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem; gap: 0.5rem; }
    .menu-name { font-weight: 600; font-size: 0.95rem; color: var(--gray-900); }
    .menu-price { font-weight: 700; color: var(--primary); font-size: 0.95rem; white-space: nowrap; }
    .menu-desc { font-size: 0.8rem; color: var(--gray-500); margin-bottom: 0.75rem; line-height: 1.5; }
    .menu-tags { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-bottom: 0.5rem; }
    .tag { font-size: 0.7rem; padding: 0.15rem 0.5rem; border-radius: 999px; font-weight: 500; }
    .tag.green { background: var(--success-light); color: #065f46; }
    .tag.yellow { background: var(--warning-light); color: #92400e; }
    .tag.red { background: var(--danger-light); color: #991b1b; }
    .menu-time { font-size: 0.75rem; color: var(--gray-400); }
    .menu-actions { display: flex; gap: 0.4rem; margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid var(--gray-100); }
    .checkboxes { display: flex; gap: 1.5rem; margin-bottom: 1rem; flex-wrap: wrap; }
    .checkbox-label { display: flex; align-items: center; gap: 0.4rem; font-size: 0.875rem; cursor: pointer; }
  `]
})
export class MenuComponent implements OnInit {
  auth = inject(AuthService);
  private menuService = inject(MenuService);
  private fb = inject(FormBuilder);

  categorias = CATEGORIAS;
  items = signal<ItemMenu[]>([]);
  itemsFiltrados = signal<ItemMenu[]>([]);
  loading = signal(true);
  catActiva = '';
  modalAbierto = signal(false);
  editando = signal<ItemMenu | null>(null);
  guardando = signal(false);
  modalError = signal('');

  form = this.fb.group({
    nombre: ['', Validators.required],
    descripcion: [''],
    precio: [0, [Validators.required, Validators.min(0)]],
    categoria: ['plato_principal', Validators.required],
    tiempoPreparacion: [null],
    disponible: [true],
    vegetariano: [false],
    vegano: [false],
    sinGluten: [false]
  });

  ngOnInit() {
    this.menuService.getMenu().subscribe({
      next: res => {
        const lista = (res as any).items ?? [];
        this.items.set(lista);
        this.itemsFiltrados.set(lista);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  filtrar() {
    if (!this.catActiva) { this.itemsFiltrados.set(this.items()); return; }
    this.itemsFiltrados.set(this.items().filter(i => i.categoria === this.catActiva));
  }

  categoriasFiltradas() {
    return this.catActiva ? this.categorias.filter(c => c.value === this.catActiva) : this.categorias;
  }

  itemsPorCategoria(cat: CategoriaMenu) {
    return this.itemsFiltrados().filter(i => i.categoria === cat);
  }

  abrirModal(item?: ItemMenu) {
    this.editando.set(item ?? null);
    this.modalError.set('');
    if (item) {
      this.form.patchValue({ ...item } as any);
    } else {
      this.form.reset({ categoria: 'plato_principal', disponible: true, vegetariano: false, vegano: false, sinGluten: false, precio: 0 });
    }
    this.modalAbierto.set(true);
  }

  editarItem(item: ItemMenu) { this.abrirModal(item); }

  cerrarModal() { this.modalAbierto.set(false); this.editando.set(null); }

  guardar() {
    if (this.form.invalid) return;
    this.guardando.set(true);
    this.modalError.set('');
    const data: any = { ...this.form.value };
    if (!this.editando()) data.restaurante = environment.restauranteId;
    const op = this.editando()
      ? this.menuService.actualizar(this.editando()!._id, data as any)
      : this.menuService.crear(data as any);

    op.subscribe({
      next: () => { this.guardando.set(false); this.cerrarModal(); this.ngOnInit(); },
      error: err => { this.guardando.set(false); this.modalError.set(err.error?.mensaje ?? 'Error'); }
    });
  }

  eliminarItem(item: ItemMenu) {
    if (!confirm(`¿Eliminar "${item.nombre}"?`)) return;
    this.menuService.eliminar(item._id).subscribe({ next: () => this.ngOnInit() });
  }
}
