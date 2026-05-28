import { Routes } from '@angular/router';
import { authGuard, adminGuard, staffGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'registro',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/registro/registro.component').then(m => m.RegistroComponent)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'reservas',
    canActivate: [authGuard],
    loadComponent: () => import('./features/reservas/reservas.component').then(m => m.ReservasComponent)
  },
  {
    path: 'reservas/nueva',
    canActivate: [authGuard],
    loadComponent: () => import('./features/reservas/nueva-reserva/nueva-reserva.component').then(m => m.NuevaReservaComponent)
  },
  {
    path: 'menu',
    loadComponent: () => import('./features/menu/menu.component').then(m => m.MenuComponent)
  },
  {
    path: 'mesas',
    canActivate: [authGuard, staffGuard],
    loadComponent: () => import('./features/mesas/mesas.component').then(m => m.MesasComponent)
  },
  {
    path: 'usuarios',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./features/usuarios/usuarios.component').then(m => m.UsuariosComponent)
  },
  {
    path: 'restaurante',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./features/restaurante/restaurante.component').then(m => m.RestauranteComponent)
  },
  {
    path: 'perfil',
    canActivate: [authGuard],
    loadComponent: () => import('./features/auth/perfil/perfil.component').then(m => m.PerfilComponent)
  },
  { path: '**', redirectTo: 'dashboard' }
];