export interface MetaProgreso {
  nucleosActuales: number;
  visitasActuales: number;
  personasVisitandoActuales: number;
  devocionalesActuales: number;
  nucleosPorcentaje: number;
  visitasPorcentaje: number;
  personasVisitandoPorcentaje: number;
  devocionalesPorcentaje: number;
}

export interface MetaActiva {
  id: string;
  trimestre: string;
  fechaInicio: string;
  fechaFin: string;
  metaNucleos: number;
  metaVisitas: number;
  metaPersonasVisitando: number;
  metaDevocionales: number;
  progreso?: MetaProgreso;
}

export interface UserDetailed {
  id: string;
  email: string;
  nombre: string;
  apellidos?: string;
  rol: string;
  comunidad: {
    id: string;
    nombre: string;
  };
}

export interface MiembroDetailed {
  id: string;
  usuarioId?: string;
  nucleoId?: string;
  barrioId?: string;
  nucleo?: {
    id: string;
    nombre: string;
    barrio: {
      id: string;
      nombre: string;
    };
  };
}

export interface NucleoStats {
  visitasRealizadas: number;
  personasParticipando: number;
  ultimaVisita?: string;
}
