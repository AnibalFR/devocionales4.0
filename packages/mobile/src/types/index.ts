// Tipos principales de la aplicación

export interface User {
  id: string;
  email: string;
  nombre: string;
  apellidos?: string;
  rol: 'ADMIN' | 'CEA' | 'MCA' | 'COLABORADOR' | 'VISITANTE';
  mustChangePassword: boolean;
  comunidad?: Comunidad;
}

export interface Comunidad {
  id: string;
  nombre: string;
  descripcion?: string;
  activa: boolean;
}

export interface Familia {
  id: string;
  nombre: string;
}

export interface Barrio {
  id: string;
  nombre: string;
}

export interface Nucleo {
  id: string;
  nombre: string;
}

export interface Visitador {
  id: string;
  nombre: string;
}

export interface VisitActivities {
  conversacion_preocupaciones: boolean;
  oraciones: boolean;
  estudio_instituto: boolean;
  estudio_instituto_especificar?: string;
  otro_estudio: boolean;
  otro_estudio_especificar?: string;
  invitacion_actividad: boolean;
  invitacion_especificar?: string;
}

export interface MaterialDejado {
  libro_oraciones: boolean;
  otro: boolean;
  otro_especificar?: string;
}

export interface Visita {
  id: string;
  visitDate: string;
  visitTime: string;
  visitType: 'primera_visita' | 'visita_seguimiento' | 'no_se_pudo_realizar';
  visitStatus: 'programada' | 'realizada' | 'cancelada';
  familia: Familia;
  barrio?: Barrio;
  barrioOtro?: string;
  nucleo?: Nucleo;
  visitorUserIds: string[];
  visitadores: Visitador[];
  visitActivities?: VisitActivities;
  materialDejado?: MaterialDejado;
  seguimientoVisita: boolean;
  tipoSeguimiento?: string;
  seguimientoFecha?: string;
  seguimientoHora?: string;
  seguimientoActividadBasica?: string;
  seguimientoActividadBasicaEspecificar?: string;
  seguimientoNinguno?: boolean;
  additionalNotes?: string;
  motivoNoVisita?: string;
  motivoNoVisitaOtra?: string;
  creadoPor: {
    nombre: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  isLoading: boolean;
}
