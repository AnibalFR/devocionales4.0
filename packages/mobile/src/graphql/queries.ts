import { gql } from '@apollo/client';

export const VISITAS_QUERY = gql`
  query Visitas {
    visitas {
      id
      visitDate
      visitTime
      visitType
      visitStatus
      familia {
        id
        nombre
      }
      barrio {
        id
        nombre
      }
      barrioOtro
      nucleo {
        id
        nombre
      }
      visitorUserIds
      visitadores {
        id
        nombre
      }
      visitActivities {
        conversacion_preocupaciones
        oraciones
        estudio_instituto
        estudio_instituto_especificar
        otro_estudio
        otro_estudio_especificar
        invitacion_actividad
        invitacion_especificar
      }
      materialDejado {
        libro_oraciones
        otro
        otro_especificar
      }
      seguimientoVisita
      tipoSeguimiento
      seguimientoFecha
      seguimientoHora
      seguimientoActividadBasica
      seguimientoActividadBasicaEspecificar
      seguimientoNinguno
      additionalNotes
      motivoNoVisita
      motivoNoVisitaOtra
      creadoPor {
        nombre
      }
      createdAt
      updatedAt
    }
  }
`;
