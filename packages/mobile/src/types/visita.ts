export interface Visita {
  id: string;
  familiaId: string;
  visitDate: string;
  visitTime: string;
  visitType: 'primera_visita' | 'visita_seguimiento' | 'no_se_pudo_realizar';
  visitStatus: 'programada' | 'realizada' | 'cancelada';
  additionalNotes?: string;
  familia: {
    id: string;
    nombre: string;
    direccion?: string;
    telefono?: string;
    email?: string;
  };
  barrio?: {
    id: string;
    nombre: string;
  };
  nucleo?: {
    id: string;
    nombre: string;
  };
  creadoPor: {
    id: string;
    nombre: string;
    email?: string;
  };
  visitadores: Array<{
    id: string;
    nombre: string;
    email?: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface VisitaDetalle extends Visita {
  barrioId?: string;
  barrioOtro?: string;
  nucleoId?: string;
  visitorUserIds: string[];
  motivoNoVisita?: string;
  motivoNoVisitaOtra?: string;
  visitActivities?: {
    conversacion_preocupaciones?: boolean;
    oraciones?: boolean;
    estudio_instituto?: boolean;
    estudio_instituto_especificar?: string;
    otro_estudio?: boolean;
    otro_estudio_especificar?: string;
    invitacion_actividad?: boolean;
    invitacion_especificar?: string;
  };
  materialDejado?: {
    libro_oraciones?: boolean;
    otro?: boolean;
    otro_especificar?: string;
  };
  seguimientoVisita: boolean;
  tipoSeguimiento?: string;
  seguimientoFecha?: string;
  seguimientoHora?: string;
  seguimientoActividadBasica: boolean;
  seguimientoActividadBasicaEspecificar?: string;
  seguimientoNinguno: boolean;
}
