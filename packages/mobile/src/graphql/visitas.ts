import { gql } from '@apollo/client';

export const VISITAS_QUERY = gql`
  query Visitas {
    visitas {
      id
      familiaId
      visitDate
      visitTime
      visitType
      visitStatus
      additionalNotes
      familia {
        id
        nombre
        direccion
      }
      barrio {
        id
        nombre
      }
      nucleo {
        id
        nombre
      }
      creadoPor {
        id
        nombre
      }
      visitadores {
        id
        nombre
      }
    }
  }
`;

export const VISITA_QUERY = gql`
  query Visita($id: ID!) {
    visita(id: $id) {
      id
      familiaId
      visitDate
      visitTime
      barrioId
      barrioOtro
      nucleoId
      visitorUserIds
      visitType
      visitStatus
      motivoNoVisita
      motivoNoVisitaOtra
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
      familia {
        id
        nombre
        direccion
        telefono
        email
      }
      barrio {
        id
        nombre
      }
      nucleo {
        id
        nombre
      }
      creadoPor {
        id
        nombre
        email
      }
      visitadores {
        id
        nombre
        email
      }
      createdAt
      updatedAt
    }
  }
`;
