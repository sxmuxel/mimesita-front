import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  Restaurante, Mesa, Reserva, ItemMenu, Usuario,
  CrearReservaRequest, EstadoReserva
} from '../../shared/models';

const RESTAURANTE_PLACEHOLDER = 'REEMPLAZA_CON_TU_ID_DE_RESTAURANTE';

function hasRestauranteId(id?: string | null): id is string {
  return !!id && id !== RESTAURANTE_PLACEHOLDER;
}

// ─── Restaurante Service ────────────────────────────────
@Injectable({ providedIn: 'root' })
export class RestauranteService {
  private url = `${environment.apiUrl}/restaurantes`;
  constructor(private http: HttpClient) {}

  getPrincipal(): Observable<{ restaurante: Restaurante }> {
    return this.http.get<any>(`${this.url}/principal`);
  }

  guardarPrincipal(data: Partial<Restaurante>): Observable<any> {
    return this.http.put<any>(`${this.url}/principal`, data);
  }

  getRestaurante(id: string = environment.restauranteId): Observable<{ restaurante: Restaurante }> {
    if (!hasRestauranteId(id)) {
      return this.getPrincipal();
    }
    return this.http.get<any>(`${this.url}/${id}`);
  }

  getRestaurantes(): Observable<any> {
    return this.http.get<any>(this.url);
  }

  crear(data: Partial<Restaurante>): Observable<any> {
    return this.http.post<any>(this.url, data);
  }

  actualizar(id: string, data: Partial<Restaurante>): Observable<any> {
    return this.http.put<any>(`${this.url}/${id}`, data);
  }

  eliminar(id: string): Observable<any> {
    return this.http.delete<any>(`${this.url}/${id}`);
  }
}

// ─── Mesa Service ───────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class MesaService {
  private url = `${environment.apiUrl}/mesas`;
  private restaurantesUrl = `${environment.apiUrl}/restaurantes`;
  constructor(private http: HttpClient) {}

  getMesasDeRestaurante(restauranteId: string = environment.restauranteId): Observable<{ mesas: Mesa[]; total: number }> {
    if (!hasRestauranteId(restauranteId)) {
      return this.http.get<any>(`${this.restaurantesUrl}/principal`).pipe(
        switchMap(res => {
          const restaurante = res.restaurante;
          if (!restaurante?._id) throw new Error('No hay restaurantes registrados.');
          return this.http.get<any>(`${this.url}/restaurante/${restaurante._id}`);
        })
      );
    }
    return this.http.get<any>(`${this.url}/restaurante/${restauranteId}`);
  }

  getMesas(params?: any): Observable<any> {
    let httpParams = new HttpParams();
    if (params) Object.keys(params).forEach(k => httpParams = httpParams.set(k, params[k]));
    return this.http.get<any>(this.url, { params: httpParams });
  }

  getMesa(id: string): Observable<{ mesa: Mesa }> {
    return this.http.get<any>(`${this.url}/${id}`);
  }

  crear(data: Partial<Mesa>): Observable<any> {
    if (!hasRestauranteId(data.restaurante as string)) {
      return this.http.get<any>(`${this.restaurantesUrl}/principal`).pipe(
        switchMap(res => {
          const restaurante = res.restaurante;
          return this.http.post<any>(this.url, { ...data, restaurante: restaurante?._id });
        })
      );
    }
    return this.http.post<any>(this.url, data);
  }

  actualizar(id: string, data: Partial<Mesa>): Observable<any> {
    return this.http.put<any>(`${this.url}/${id}`, data);
  }

  eliminar(id: string): Observable<any> {
    return this.http.delete<any>(`${this.url}/${id}`);
  }
}

// ─── Reserva Service ────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class ReservaService {
  private url = `${environment.apiUrl}/reservas`;
  constructor(private http: HttpClient) {}

  getReservas(params?: any): Observable<any> {
    let httpParams = new HttpParams();
    if (params) Object.keys(params).forEach(k => { if (params[k]) httpParams = httpParams.set(k, params[k]); });
    return this.http.get<any>(this.url, { params: httpParams });
  }

  getReserva(id: string): Observable<{ reserva: Reserva }> {
    return this.http.get<any>(`${this.url}/${id}`);
  }

  buscarPorCodigo(codigo: string): Observable<{ reserva: Reserva }> {
    return this.http.get<any>(`${this.url}/codigo/${codigo}`);
  }

  crear(data: CrearReservaRequest): Observable<any> {
    return this.http.post<any>(this.url, data);
  }

  actualizar(id: string, data: Partial<Reserva>): Observable<any> {
    return this.http.put<any>(`${this.url}/${id}`, data);
  }

  cambiarEstado(id: string, estado: EstadoReserva): Observable<any> {
    return this.http.patch<any>(`${this.url}/${id}/estado`, { estado });
  }

  eliminar(id: string): Observable<any> {
    return this.http.delete<any>(`${this.url}/${id}`);
  }
}

// ─── Menu Service ───────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class MenuService {
  private url = `${environment.apiUrl}/menu`;
  private restaurantesUrl = `${environment.apiUrl}/restaurantes`;
  constructor(private http: HttpClient) {}

  getMenu(restauranteId: string = environment.restauranteId): Observable<{ items: ItemMenu[] }> {
    if (!hasRestauranteId(restauranteId)) {
      return this.http.get<any>(`${this.restaurantesUrl}/principal`).pipe(
        switchMap(res => {
          const restaurante = res.restaurante;
          const url = restaurante?._id ? `${this.url}?restaurante=${restaurante._id}` : this.url;
          return this.http.get<any>(url);
        })
      );
    }
    return this.http.get<any>(`${this.url}?restaurante=${restauranteId}`);
  }

  getItem(id: string): Observable<{ item: ItemMenu }> {
    return this.http.get<any>(`${this.url}/${id}`);
  }

  crear(data: Partial<ItemMenu>): Observable<any> {
    if (!hasRestauranteId(data.restaurante as string)) {
      return this.http.get<any>(`${this.restaurantesUrl}/principal`).pipe(
        switchMap(res => {
          const restaurante = res.restaurante;
          return this.http.post<any>(this.url, { ...data, restaurante: restaurante?._id });
        })
      );
    }
    return this.http.post<any>(this.url, data);
  }

  actualizar(id: string, data: Partial<ItemMenu>): Observable<any> {
    return this.http.put<any>(`${this.url}/${id}`, data);
  }

  eliminar(id: string): Observable<any> {
    return this.http.delete<any>(`${this.url}/${id}`);
  }
}

// ─── Usuario Service ────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private url = `${environment.apiUrl}/usuarios`;
  constructor(private http: HttpClient) {}

  getUsuarios(params?: any): Observable<any> {
    let httpParams = new HttpParams();
    if (params) Object.keys(params).forEach(k => { if (params[k]) httpParams = httpParams.set(k, params[k]); });
    return this.http.get<any>(this.url, { params: httpParams });
  }

  getUsuario(id: string): Observable<{ usuario: Usuario }> {
    return this.http.get<any>(`${this.url}/${id}`);
  }

  crear(data: Partial<Usuario> & { password: string }): Observable<any> {
    return this.http.post<any>(this.url, data);
  }

  actualizar(id: string, data: Partial<Usuario>): Observable<any> {
    return this.http.put<any>(`${this.url}/${id}`, data);
  }

  eliminar(id: string): Observable<any> {
    return this.http.delete<any>(`${this.url}/${id}`);
  }
}
