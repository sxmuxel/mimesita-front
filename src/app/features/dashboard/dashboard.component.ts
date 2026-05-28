import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { ReservaService } from '../../core/services/api.service';
import { RestauranteService } from '../../core/services/api.service';
import { Reserva, Restaurante } from '../../shared/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Hola, {{ auth.usuario()?.nombre }} 👋</h1>
          <p class="page-subtitle">{{ subtitulo() }}</p>
        </div>
        @if (!auth.isStaff()) {
          <a routerLink="/reservas/nueva" class="btn btn-primary btn-lg">
            + Nueva reserva
          </a>
        }
      </div>

      <!-- Info restaurante -->
      @if (restaurante()) {
        <div class="rest-banner card">
          <div class="rest-info">
            <div class="rest-icon">🏠</div>
            <div>
              <h3>{{ restaurante()!.nombre }}</h3>
              <p>{{ restaurante()!.tipoCocina }} · {{ restaurante()!.direccion.calle }}, {{ restaurante()!.direccion.ciudad }}</p>
              <p>📞 {{ restaurante()!.telefono }}</p>
            </div>
          </div>
          <div class="rest-cap">
            <span class="cap-number">{{ restaurante()!.capacidadTotal }}</span>
            <span class="cap-label">Aforo Max.</span>
          </div>
        </div>
      }

      <!-- Stats cards -->
      @if (auth.isStaff()) {
        <div class="grid-4 stats-row">
          <div class="stat-card card">
            <div class="stat-icon pending">📋</div>
            <div class="stat-num">{{ stats().pendientes }}</div>
            <div class="stat-label">Pendientes</div>
          </div>
          <div class="stat-card card">
            <div class="stat-icon confirmed">✅</div>
            <div class="stat-num">{{ stats().confirmadas }}</div>
            <div class="stat-label">Confirmadas hoy</div>
          </div>
          <div class="stat-card card">
            <div class="stat-icon completed">🎉</div>
            <div class="stat-num">{{ stats().completadas }}</div>
            <div class="stat-label">Completadas</div>
          </div>
          <div class="stat-card card">
            <div class="stat-icon total">📅</div>
            <div class="stat-num">{{ stats().total }}</div>
            <div class="stat-label">Total</div>
          </div>
        </div>
      }

      <!-- Accesos rápidos -->
      <div class="section-title">Accesos rápidos</div>
      <div class="quick-grid">
        @if (!auth.isStaff()) {
          <a routerLink="/reservas/nueva" class="quick-card">
            <span class="quick-icon">📅</span>
            <span class="quick-label">Hacer reserva</span>
          </a>
        }
        <a routerLink="/reservas" class="quick-card">
          <span class="quick-icon">📋</span>
          <span class="quick-label">{{ auth.isStaff() ? 'Todas las reservas' : 'Mis reservas' }}</span>
        </a>
        <a routerLink="/menu" class="quick-card">
          <span class="quick-icon">🍜</span>
          <span class="quick-label">Ver menú</span>
        </a>
        @if (auth.isStaff()) {
          <a routerLink="/mesas" class="quick-card">
            <span class="quick-icon">🪑</span>
            <span class="quick-label">Gestionar mesas</span>
          </a>
        }
        @if (auth.isAdmin()) {
          <a routerLink="/usuarios" class="quick-card">
            <span class="quick-icon">👤</span>
            <span class="quick-label">Usuarios</span>
          </a>
          <a routerLink="/restaurante" class="quick-card">
            <span class="quick-icon">🏠</span>
            <span class="quick-label">Configurar restaurante</span>
          </a>
        }
      </div>

      <!-- Reservas recientes (staff) -->
      @if (auth.isStaff() && reservasRecientes().length > 0) {
        <div class="section-title">Reservas recientes</div>
        <div class="card">
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Cliente</th>
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>Mesa</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                @for (r of reservasRecientes(); track r._id) {
                  <tr>
                    <td><code>{{ r.codigoReserva }}</code></td>
                    <td>{{ getCliente(r) }}</td>
                    <td>{{ r.fecha | date:'dd/MM/yyyy' }}</td>
                    <td>{{ r.horaInicio }} - {{ r.horaFin }}</td>
                    <td>Mesa {{ getMesa(r) }}</td>
                    <td><span class="badge badge-{{ r.estado }}">{{ r.estado }}</span></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <div style="margin-top:1rem;text-align:right">
            <a routerLink="/reservas" class="btn btn-secondary btn-sm">Ver todas →</a>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .rest-banner { display: flex; align-items: center; justify-content: space-between; margin-bottom: 2rem; gap: 1rem; }
    .rest-info { display: flex; align-items: center; gap: 1rem; }
    .rest-icon { font-size: 2.5rem; }
    .rest-info h3 { font-family: var(--font-body); margin-bottom: 0.2rem; }
    .rest-info p { color: var(--gray-500); font-size: 0.85rem; }
    .rest-cap { text-align: center; }
    .cap-number { display: block; font-size: 2rem; font-weight: 700; color: var(--primary); line-height: 1; }
    .cap-label { font-size: 0.75rem; color: var(--gray-500); text-transform: uppercase; letter-spacing: 0.05em; }
    .stats-row { margin-bottom: 2rem; }
    .stat-card { text-align: center; padding: 1.25rem; }
    .stat-icon { font-size: 1.6rem; margin-bottom: 0.5rem; }
    .stat-num { font-size: 2rem; font-weight: 700; color: var(--gray-900); line-height: 1; }
    .stat-label { font-size: 0.78rem; color: var(--gray-500); text-transform: uppercase; letter-spacing: 0.04em; margin-top: 0.25rem; }
    .section-title { font-family: var(--font-body); font-size: 1.1rem; font-weight: 600; color: var(--gray-700); margin: 2rem 0 1rem; }
    .quick-grid { display: flex; flex-wrap: wrap; gap: 1rem; margin-bottom: 2rem; }
    .quick-card {
      display: flex; flex-direction: column; align-items: center;
      gap: 0.5rem; padding: 1.25rem 1.5rem;
      background: var(--white); border: 1.5px solid var(--gray-200);
      border-radius: var(--radius-lg); text-decoration: none;
      transition: var(--transition); min-width: 130px;
    }
    .quick-card:hover { border-color: var(--primary); background: var(--primary-light); transform: translateY(-2px); box-shadow: var(--shadow-blue); }
    .quick-icon { font-size: 1.8rem; }
    .quick-label { font-size: 0.82rem; font-weight: 500; color: var(--gray-600); text-align: center; }
    code { background: var(--gray-100); padding: 0.15rem 0.4rem; border-radius: 4px; font-size: 0.8rem; }
  `]
})
export class DashboardComponent implements OnInit {
  auth = inject(AuthService);
  private reservaService = inject(ReservaService);
  private restService = inject(RestauranteService);

  restaurante = signal<Restaurante | null>(null);
  reservasRecientes = signal<Reserva[]>([]);
  stats = signal({ pendientes: 0, confirmadas: 0, completadas: 0, total: 0 });

  subtitulo = () => {
    const rol = this.auth.usuario()?.rol;
    if (rol === 'admin') return 'Panel de administración';
    if (rol === 'empleado') return 'Panel de empleado';
    return `Bienvenido a ${this.restaurante()?.nombre ?? 'nuestro restaurante'} · Operando con tecnología de MiMesita`;
  };

  ngOnInit() {
    this.restService.getRestaurante().subscribe({
      next: res => this.restaurante.set(res.restaurante)
    });

    if (this.auth.isStaff()) {
      this.reservaService.getReservas({ limit: 5 }).subscribe({
        next: res => {
          this.reservasRecientes.set(res.reservas ?? []);
          this.stats.set({
            pendientes: (res.reservas ?? []).filter((r: any) => r.estado === 'pendiente').length,
            confirmadas: (res.reservas ?? []).filter((r: any) => r.estado === 'confirmada').length,
            completadas: (res.reservas ?? []).filter((r: any) => r.estado === 'completada').length,
            total: res.total ?? 0
          });
        }
      });
    }
  }

  getCliente(r: Reserva): string {
    if (typeof r.cliente === 'object') return `${r.cliente.nombre} ${r.cliente.apellido}`;
    return String(r.cliente);
  }

  getMesa(r: Reserva): string | number {
    if (typeof r.mesa === 'object') return r.mesa.numero;
    return String(r.mesa);
  }
}