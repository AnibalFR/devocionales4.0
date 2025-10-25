import { gql } from '@apollo/client';

export const DASHBOARD_QUERY = gql`
  query Dashboard {
    metaActiva {
      id
      trimestre
      fechaInicio
      fechaFin
      metaNucleos
      metaVisitas
      metaPersonasVisitando
      metaDevocionales
      progreso {
        nucleosActuales
        visitasActuales
        personasVisitandoActuales
        devocionalesActuales
        nucleosPorcentaje
        visitasPorcentaje
        personasVisitandoPorcentaje
        devocionalesPorcentaje
      }
    }
  }
`;

export const MY_NUCLEO_STATS_QUERY = gql`
  query MyNucleoStats($fechaInicio: String!, $fechaFin: String!) {
    visitasPorCiclo(fechaInicio: $fechaInicio, fechaFin: $fechaFin) {
      id
      visitDate
      nucleoId
      visitType
      visitStatus
    }
  }
`;
