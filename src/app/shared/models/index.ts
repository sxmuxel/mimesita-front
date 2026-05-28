// ─── Usuario ───────────────────────────────────────────
export interface Usuario {
  _id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  rol: 'admin' | 'empleado' | 'cliente';
  activo: boolean;
  createdAt?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  telefono?: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  usuario: Usuario;
  mensaje?: string;
}

// ─── Restaurante ───────────────────────────────────────
export interface Horario {
  dia: string;
  apertura: string;
  cierre: string;
  cerrado?: boolean;
}

export interface Restaurante {
  _id: string;
  nombre: string;
  descripcion?: string;
  direccion: {
    calle: string;
    ciudad: string;
    departamento?: string;
  };
  telefono: string;
  email?: string;
  tipoCocina?: string;
  capacidadTotal: number;
  horarios?: Horario[];
  activo: boolean;
}

// ─── Mesa ──────────────────────────────────────────────
export interface Mesa {
  _id: string;
  restaurante: string | Restaurante;
  numero: number;
  capacidad: number;
  ubicacion: 'interior' | 'exterior' | 'terraza' | 'privado' | 'barra';
  descripcion?: string;
  disponible: boolean;
  activa: boolean;
}

// ─── Reserva ───────────────────────────────────────────
export type EstadoReserva = 'pendiente' | 'confirmada' | 'cancelada' | 'completada' | 'no_presentado';
export type OcasionEspecial = 'ninguna' | 'cumpleanos' | 'aniversario' | 'reunion_negocios' | 'otra';

export interface Reserva {
  _id: string;
  cliente: Usuario | string;
  restaurante: Restaurante | string;
  mesa: Mesa | string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  numeroPersonas: number;
  estado: EstadoReserva;
  ocasionEspecial?: OcasionEspecial;
  peticionesEspeciales?: string;
  codigoReserva: string;
  historialEstados?: { estado: string; fecha: string }[];
  createdAt?: string;
}

export interface CrearReservaRequest {
  restaurante: string;
  mesa: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  numeroPersonas: number;
  ocasionEspecial?: OcasionEspecial;
  peticionesEspeciales?: string;
}

// ─── Menú ──────────────────────────────────────────────
export type CategoriaMenu = 'entrada' | 'sopa' | 'ensalada' | 'plato_principal' | 'postre' | 'bebida' | 'especial';

export interface ItemMenu {
  _id: string;
  restaurante: string | Restaurante;
  nombre: string;
  descripcion?: string;
  precio: number;
  categoria: CategoriaMenu;
  disponible: boolean;
  vegetariano: boolean;
  vegano: boolean;
  sinGluten: boolean;
  alergenos?: string[];
  tiempoPreparacion?: number;
}

// ─── Respuestas API genéricas ──────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  mensaje?: string;
  data?: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  total: number;
  pagina: number;
  totalPaginas: number;
  [key: string]: any;
}