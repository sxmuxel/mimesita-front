import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, map, tap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest, Usuario } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = environment.apiUrl;

  private _usuario = signal<Usuario | null>(this.cargarUsuarioLocal());
  private _token = signal<string | null>(localStorage.getItem('mm_token'));

  usuario = this._usuario.asReadonly();
  token = this._token.asReadonly();
  isLoggedIn = computed(() => !!this._token());
  isAdmin = computed(() => this._usuario()?.rol === 'admin');
  isEmpleado = computed(() => this._usuario()?.rol === 'empleado');
  isCliente = computed(() => this._usuario()?.rol === 'cliente');
  isStaff = computed(() => ['admin', 'empleado'].includes(this._usuario()?.rol ?? ''));

  constructor(private http: HttpClient, private router: Router) {}

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, credentials).pipe(
      tap(res => {
        localStorage.setItem('mm_token', res.token);
        localStorage.setItem('mm_usuario', JSON.stringify(res.usuario));
        this._token.set(res.token);
        this._usuario.set(res.usuario);
      })
    );
  }

  registro(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/registro`, data).pipe(
      tap(res => {
        localStorage.setItem('mm_token', res.token);
        localStorage.setItem('mm_usuario', JSON.stringify(res.usuario));
        this._token.set(res.token);
        this._usuario.set(res.usuario);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('mm_token');
    localStorage.removeItem('mm_usuario');
    this._token.set(null);
    this._usuario.set(null);
    this.router.navigate(['/login']);
  }

  sincronizarPerfil(): Observable<Usuario | null> {
    if (!this._token()) return of(null);

    return this.http.get<{ usuario: Usuario }>(`${this.apiUrl}/auth/perfil`).pipe(
      tap(res => {
        localStorage.setItem('mm_usuario', JSON.stringify(res.usuario));
        this._usuario.set(res.usuario);
      }),
      map(res => res.usuario),
      catchError(() => {
        localStorage.removeItem('mm_token');
        localStorage.removeItem('mm_usuario');
        this._token.set(null);
        this._usuario.set(null);
        return of(null);
      })
    );
  }

  actualizarPerfil(data: Partial<Usuario>): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/auth/perfil`, data).pipe(
      tap(res => {
        const updated = { ...this._usuario()!, ...res.usuario };
        localStorage.setItem('mm_usuario', JSON.stringify(updated));
        this._usuario.set(updated);
      })
    );
  }

  cambiarPassword(passwordActual: string, passwordNueva: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/auth/cambiar-password`, { passwordActual, passwordNueva });
  }

  private cargarUsuarioLocal(): Usuario | null {
    const stored = localStorage.getItem('mm_usuario');
    return stored ? JSON.parse(stored) : null;
  }
}
