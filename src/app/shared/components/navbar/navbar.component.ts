import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { RestauranteService } from '../../../core/services/api.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  template: `
    <nav class="navbar">
      <div class="navbar-inner">
        <a routerLink="/dashboard" class="brand">
          <span class="brand-icon">M</span>
          <span class="brand-copy">
            <span class="brand-text">MiMesita</span>
            <span class="brand-restaurant">{{ restauranteNombre() }}</span>
          </span>
        </a>

        @if (auth.isLoggedIn()) {
          <button class="burger" (click)="menuOpen.set(!menuOpen())">
            <span></span><span></span><span></span>
          </button>

          <div class="nav-links" [class.open]="menuOpen()">
            <a routerLink="/dashboard" routerLinkActive="active" (click)="menuOpen.set(false)">Inicio</a>
            <a routerLink="/menu" routerLinkActive="active" (click)="menuOpen.set(false)">Menu</a>
            <a routerLink="/reservas" routerLinkActive="active" (click)="menuOpen.set(false)">Mis Reservas</a>
            @if (auth.isStaff()) {
              <a routerLink="/mesas" routerLinkActive="active" (click)="menuOpen.set(false)">Mesas</a>
            }
            @if (auth.isAdmin()) {
              <a routerLink="/usuarios" routerLinkActive="active" (click)="menuOpen.set(false)">Usuarios</a>
              <a routerLink="/restaurante" routerLinkActive="active" (click)="menuOpen.set(false)">Restaurante</a>
            }
          </div>

          <div class="nav-user">
            <a routerLink="/perfil" class="user-chip">
              <span class="user-avatar">{{ inicial() }}</span>
              <span class="user-name">{{ auth.usuario()?.nombre }}</span>
            </a>
            <button class="btn-logout" (click)="auth.logout()" title="Cerrar sesion">Salir</button>
          </div>
        }
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      position: fixed; top: 0; left: 0; right: 0; z-index: 900;
      background: var(--white);
      border-bottom: 1px solid var(--gray-100);
      box-shadow: var(--shadow-sm);
      height: 64px;
    }
    .navbar-inner {
      max-width: 1200px; margin: 0 auto;
      height: 100%; padding: 0 1.5rem;
      display: flex; align-items: center; gap: 2rem;
    }
    .brand {
      display: flex; align-items: center; gap: 0.65rem;
      text-decoration: none; flex-shrink: 0;
    }
    .brand-icon {
      width: 30px; height: 30px; border-radius: 8px;
      display: inline-flex; align-items: center; justify-content: center;
      background: var(--primary); color: var(--white);
      font-family: var(--font-display); font-weight: 700; font-size: 1rem;
    }
    .brand-copy { display: flex; flex-direction: column; line-height: 1.05; }
    .brand-text {
      font-family: var(--font-display); font-size: 1.3rem;
      font-weight: 700; color: var(--primary);
    }
    .brand-restaurant {
      margin-top: 0.15rem; font-size: 0.7rem; font-weight: 700;
      color: var(--gray-500); max-width: 180px; overflow: hidden;
      text-overflow: ellipsis; white-space: nowrap;
    }
    .nav-links {
      display: flex; align-items: center; gap: 0.25rem;
      flex: 1;
    }
    .nav-links a {
      padding: 0.4rem 0.85rem;
      border-radius: var(--radius);
      text-decoration: none; font-size: 0.875rem;
      font-weight: 500; color: var(--gray-600);
      transition: var(--transition);
    }
    .nav-links a:hover { background: var(--gray-100); color: var(--gray-900); }
    .nav-links a.active { background: var(--primary-light); color: var(--primary); }
    .nav-user { display: flex; align-items: center; gap: 0.5rem; margin-left: auto; }
    .user-chip {
      display: flex; align-items: center; gap: 0.5rem;
      padding: 0.3rem 0.75rem 0.3rem 0.3rem;
      border-radius: 999px; background: var(--gray-100);
      text-decoration: none; transition: var(--transition);
    }
    .user-chip:hover { background: var(--gray-200); }
    .user-avatar {
      width: 28px; height: 28px;
      background: var(--primary); color: var(--white);
      border-radius: 50%; display: flex; align-items: center;
      justify-content: center; font-size: 0.75rem; font-weight: 700;
    }
    .user-name { font-size: 0.85rem; font-weight: 500; color: var(--gray-700); }
    .btn-logout {
      background: none; border: none; cursor: pointer;
      font-size: 0.8rem; color: var(--gray-500);
      padding: 0.35rem 0.55rem; border-radius: var(--radius-sm);
      transition: var(--transition);
      font-weight: 600;
    }
    .btn-logout:hover { color: var(--danger); background: var(--danger-light); }
    .burger { display: none; flex-direction: column; gap: 4px; background: none; border: none; cursor: pointer; padding: 0.4rem; }
    .burger span { display: block; width: 22px; height: 2px; background: var(--gray-600); border-radius: 2px; }
    @media (max-width: 768px) {
      .burger { display: flex; }
      .nav-links {
        display: none; position: absolute; top: 64px; left: 0; right: 0;
        background: var(--white); flex-direction: column; align-items: stretch;
        padding: 0.75rem; border-bottom: 1px solid var(--gray-200);
        box-shadow: var(--shadow);
      }
      .nav-links.open { display: flex; }
      .nav-links a { padding: 0.65rem 1rem; }
      .user-name { display: none; }
      .brand-restaurant { max-width: 120px; }
    }
  `]
})
export class NavbarComponent implements OnInit {
  auth = inject(AuthService);
  private restauranteService = inject(RestauranteService);
  menuOpen = signal(false);
  restauranteNombre = signal('Restaurante sin configurar');
  inicial = () => this.auth.usuario()?.nombre?.charAt(0).toUpperCase() ?? '?';

  ngOnInit() {
    this.restauranteService.getPrincipal().subscribe({
      next: res => this.restauranteNombre.set(res.restaurante.nombre),
      error: () => this.restauranteNombre.set('Restaurante sin configurar')
    });
  }
}
