import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ReservaService } from '../../core/services/api.service';
import { Reserva, EstadoReserva } from '../../shared/models';

@Component({
  selector: 'app-reservas',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">{{ auth.isStaff() ? 'Gestión de Reservas' : 'Mis Reservas' }}</h1>
          <p class="page-subtitle">{{ total() }} reservas encontradas</p>
        </div>
        @if (!auth.isStaff()) {
          <a routerLink="/reservas/nueva" class="btn btn-primary">+ Nueva reserva</a>
        }
      </div>

      <!-- Filtros -->
      <div class="card filtros">
        <div class="filtros-inner">
          <div class="form-group" style="margin:0;flex:1;min-width:150px">
            <label class="form-label">Estado</label>
            <select class="form-control" [(ngModel)]="filtroEstado" (change)="cargar()">
              <option value="">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="confirmada">Confirmada</option>
              <option value="cancelada">Cancelada</option>
              <option value="completada">Completada</option>
              <option value="no_presentado">No presentado</option>
            </select>
          </div>
          @if (auth.isStaff()) {
            <div class="form-group" style="margin:0;flex:1;min-width:150px">
              <label class="form-label">Fecha</label>
              <input type="date" class="form-control" [(ngModel)]="filtroFecha" (change)="cargar()">
            </div>
          }
          <div style="align-self:flex-end">
            <button class="btn btn-secondary" (click)="limpiarFiltros()">Limpiar</button>
          </div>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-container"><div class="spinner"></div></div>
      } @else if (reservas().length === 0) {
        <div class="empty-state">
          <div class="empty-icon">📅</div>
          <p>No hay reservas que mostrar</p>
          @if (!auth.isStaff()) {
            <a routerLink="/reservas/nueva" class="btn btn-primary" style="margin-top:1rem">Hacer mi primera reserva</a>
          }
        </div>
      } @else {
        <div class="reservas-list">
          @for (r of reservas(); track r._id) {
            <div class="reserva-card card">
              <div class="reserva-top">
                <div class="reserva-codigo">
                  <code>{{ r.codigoReserva }}</code>
                  <span class="badge badge-{{ r.estado }}">{{ r.estado }}</span>
                </div>
                @if (r.ocasionEspecial && r.ocasionEspecial !== 'ninguna') {
                  <span class="ocasion-tag">{{ getOcasionLabel(r.ocasionEspecial) }}</span>
                }
              </div>

              <div class="reserva-body">
                <div class="reserva-info">
                  <div class="info-item">
                    <span class="info-icon">📅</span>
                    <span>{{ r.fecha | date:'EEEE dd MMM yyyy':'':'es' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-icon">🕐</span>
                    <span>{{ r.horaInicio }} – {{ r.horaFin }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-icon">👥</span>
                    <span>{{ r.numeroPersonas }} personas</span>
                  </div>
                  <div class="info-item">
                    <span class="info-icon">🪑</span>
                    <span>Mesa {{ getMesaNum(r) }} · {{ getMesaUbicacion(r) }}</span>
                  </div>
                  @if (auth.isStaff()) {
                    <div class="info-item">
                      <span class="info-icon">👤</span>
                      <span>{{ getClienteNombre(r) }}</span>
                    </div>
                  }
                </div>
                @if (r.peticionesEspeciales) {
                  <div class="peticiones">
                    <span class="info-icon">💬</span>
                    {{ r.peticionesEspeciales }}
                  </div>
                }
              </div>

              <div class="reserva-actions">
                <!-- Staff: cambiar estado -->
                @if (auth.isStaff() && r.estado !== 'cancelada' && r.estado !== 'completada') {
                  <select class="form-control form-control-sm" (change)="cambiarEstado(r, $any($event.target).value)">
                    <option value="">Cambiar estado...</option>
                    <option value="confirmada">Confirmar</option>
                    <option value="completada">Completada</option>
                    <option value="no_presentado">No se presentó</option>
                    <option value="cancelada">Cancelar</option>
                  </select>
                }
                <!-- Cliente: cancelar -->
                @if (!auth.isStaff() && (r.estado === 'pendiente' || r.estado === 'confirmada')) {
                  <button class="btn btn-danger btn-sm" (click)="cancelar(r)">Cancelar reserva</button>
                }
                <!-- Admin: eliminar -->
                @if (auth.isAdmin()) {
                  <button class="btn btn-secondary btn-sm" (click)="eliminar(r)">🗑️</button>
                }
              </div>
            </div>
          }
        </div>

        <!-- Paginación -->
        @if (totalPaginas() > 1) {
          <div class="paginacion">
            <button class="btn btn-secondary btn-sm" (click)="cambiarPagina(pagina()-1)" [disabled]="pagina()===1">← Anterior</button>
            <span>Página {{ pagina() }} de {{ totalPaginas() }}</span>
            <button class="btn btn-secondary btn-sm" (click)="cambiarPagina(pagina()+1)" [disabled]="pagina()===totalPaginas()">Siguiente →</button>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .filtros { margin-bottom: 1.5rem; }
    .filtros-inner { display: flex; gap: 1rem; flex-wrap: wrap; align-items: flex-end; }
    .reservas-list { display: flex; flex-direction: column; gap: 1rem; }
    .reserva-card { padding: 1.25rem; }
    .reserva-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem; }
    .reserva-codigo { display: flex; align-items: center; gap: 0.75rem; }
    code { background: var(--gray-100); padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.82rem; }
    .ocasion-tag { font-size: 0.78rem; color: var(--gray-600); background: var(--warning-light); padding: 0.2rem 0.6rem; border-radius: 999px; }
    .reserva-body { margin-bottom: 1rem; }
    .reserva-info { display: flex; flex-wrap: wrap; gap: 0.75rem 1.5rem; }
    .info-item { display: flex; align-items: center; gap: 0.35rem; font-size: 0.875rem; color: var(--gray-700); }
    .info-icon { font-size: 0.9rem; }
    .peticiones { margin-top: 0.75rem; font-size: 0.85rem; color: var(--gray-600); display: flex; gap: 0.4rem; }
    .reserva-actions { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; padding-top: 0.75rem; border-top: 1px solid var(--gray-100); }
    .form-control-sm { width: auto; padding: 0.35rem 0.7rem; font-size: 0.82rem; }
    .paginacion { display: flex; align-items: center; justify-content: center; gap: 1rem; margin-top: 1.5rem; font-size: 0.875rem; color: var(--gray-600); }
  `]
})
export class ReservasComponent implements OnInit {
  auth = inject(AuthService);
  private reservaService = inject(ReservaService);

  reservas = signal<Reserva[]>([]);
  loading = signal(true);
  total = signal(0);
  pagina = signal(1);
  totalPaginas = signal(1);
  filtroEstado = '';
  filtroFecha = '';

  ngOnInit() { this.cargar(); }

  cargar() {
    this.loading.set(true);
    const params: any = { page: this.pagina(), limit: 8 };
    if (this.filtroEstado) params.estado = this.filtroEstado;
    if (this.filtroFecha) params.fecha = this.filtroFecha;

    this.reservaService.getReservas(params).subscribe({
      next: res => {
        this.reservas.set(res.reservas ?? []);
        this.total.set(res.total ?? 0);
        this.totalPaginas.set(res.totalPaginas ?? 1);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  cambiarEstado(r: Reserva, estado: string) {
    if (!estado) return;
    this.reservaService.cambiarEstado(r._id, estado as EstadoReserva).subscribe({
      next: () => this.cargar()
    });
  }

  cancelar(r: Reserva) {
    if (!confirm('¿Cancelar esta reserva?')) return;
    this.reservaService.cambiarEstado(r._id, 'cancelada').subscribe({ next: () => this.cargar() });
  }

  eliminar(r: Reserva) {
    if (!confirm('¿Eliminar permanentemente esta reserva?')) return;
    this.reservaService.eliminar(r._id).subscribe({ next: () => this.cargar() });
  }

  limpiarFiltros() { this.filtroEstado = ''; this.filtroFecha = ''; this.pagina.set(1); this.cargar(); }
  cambiarPagina(p: number) { this.pagina.set(p); this.cargar(); }

  getMesaNum(r: Reserva) { return typeof r.mesa === 'object' ? r.mesa.numero : r.mesa; }
  getMesaUbicacion(r: Reserva) { return typeof r.mesa === 'object' ? r.mesa.ubicacion : ''; }
  getClienteNombre(r: Reserva) {
    if (typeof r.cliente === 'object') return `${r.cliente.nombre} ${r.cliente.apellido}`;
    return '';
  }

  private ocasiones: Record<string, string> = {
    cumpleanos: '🎂 Cumpleaños',
    aniversario: '💑 Aniversario',
    reunion_negocios: '💼 Reunión de negocios',
    otra: '🎉 Otra ocasión',
    ninguna: ''
  };

  getOcasionLabel(ocasion?: string): string {
    return ocasion ? (this.ocasiones[ocasion] ?? ocasion) : '';
  }
  
}