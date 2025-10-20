import { GraphQLError } from 'graphql';
import type { Context } from '../context';

interface VisitActivitiesInput {
  conversacion_preocupaciones?: boolean;
  oraciones?: boolean;
  estudio_instituto?: boolean;
  estudio_instituto_especificar?: string;
  otro_estudio?: boolean;
  otro_estudio_especificar?: string;
  invitacion_actividad?: boolean;
  invitacion_especificar?: string;
}

interface MaterialDejadoInput {
  libro_oraciones?: boolean;
  otro?: boolean;
  otro_especificar?: string;
}

interface CreateVisitaInput {
  familiaId: string;
  visitDate: string;  // YYYY-MM-DD
  visitTime: string;  // HH:mm
  barrioId?: string;
  barrioOtro?: string;
  nucleoId?: string;
  visitorUserIds: string[];
  visitType: string;  // 'primera_visita' | 'visita_seguimiento' | 'no_se_pudo_realizar'
  motivoNoVisita?: string;
  motivoNoVisitaOtra?: string;
  visitActivities?: VisitActivitiesInput;
  materialDejado?: MaterialDejadoInput;
  seguimientoVisita?: boolean;
  tipoSeguimiento?: string;
  seguimientoFecha?: string;
  seguimientoHora?: string;
  seguimientoActividadBasica?: boolean;
  seguimientoActividadBasicaEspecificar?: string;
  seguimientoNinguno?: boolean;
  additionalNotes?: string;
}

interface UpdateVisitaInput {
  familiaId?: string;
  visitDate?: string;
  visitTime?: string;
  barrioId?: string;
  barrioOtro?: string;
  nucleoId?: string;
  visitorUserIds?: string[];
  visitType?: string;
  motivoNoVisita?: string;
  motivoNoVisitaOtra?: string;
  visitActivities?: VisitActivitiesInput;
  materialDejado?: MaterialDejadoInput;
  seguimientoVisita?: boolean;
  tipoSeguimiento?: string;
  seguimientoFecha?: string;
  seguimientoHora?: string;
  seguimientoActividadBasica?: boolean;
  seguimientoActividadBasicaEspecificar?: string;
  seguimientoNinguno?: boolean;
  additionalNotes?: string;
  lastUpdatedAt?: string; // OCC: timestamp para detectar conflictos
}

// Función para derivar automáticamente el visitStatus según VIS-002
function derivarVisitStatus(input: CreateVisitaInput | UpdateVisitaInput, currentDate?: string): string {
  // Determinar el tipo de visita (usar el actual si no se proporciona uno nuevo)
  const visitType = input.visitType || '';

  // Regla 1: Si es "no se pudo realizar" → cancelada
  if (visitType === 'no_se_pudo_realizar') {
    return 'cancelada';
  }

  // Determinar la fecha a usar (usar la nueva si se proporciona, sino la actual)
  const visitDate = input.visitDate || currentDate;
  if (!visitDate) {
    return 'programada'; // Default si no hay fecha
  }

  // Regla 2: Si la fecha es futura → programada
  const visitDateObj = new Date(visitDate);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  visitDateObj.setHours(0, 0, 0, 0);

  if (visitDateObj > hoy) {
    return 'programada';
  }

  // Regla 3: Si la fecha es pasada/hoy Y tiene actividades → realizada
  const tieneActividades = input.visitActivities && (
    input.visitActivities.conversacion_preocupaciones ||
    input.visitActivities.oraciones ||
    input.visitActivities.estudio_instituto ||
    input.visitActivities.otro_estudio ||
    input.visitActivities.invitacion_actividad
  );

  if (tieneActividades) {
    return 'realizada';
  }

  // Regla 4: Si la fecha es pasada/hoy Y NO tiene actividades → programada (pendiente)
  return 'programada';
}

export const visitaResolvers = {
  Query: {
    visitas: async (_parent: unknown, _args: unknown, { prisma, userId }: Context) => {
      if (!userId) {
        throw new GraphQLError('No autenticado', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      return prisma.visita.findMany({
        include: {
          familia: true,
          creadoPor: true,
          barrio: true,
          nucleo: true,
        },
        orderBy: { visitDate: 'desc' },
      });
    },

    visita: async (_parent: unknown, { id }: { id: string }, { prisma, userId }: Context) => {
      if (!userId) {
        throw new GraphQLError('No autenticado', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const visita = await prisma.visita.findUnique({
        where: { id },
        include: {
          familia: true,
          creadoPor: true,
          barrio: true,
          nucleo: true,
        },
      });

      if (!visita) {
        throw new GraphQLError('Visita no encontrada', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      return visita;
    },

    visitasPorCiclo: async (
      _parent: unknown,
      { fechaInicio, fechaFin }: { fechaInicio: string; fechaFin: string },
      { prisma, userId }: Context
    ) => {
      if (!userId) {
        throw new GraphQLError('No autenticado', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      return prisma.visita.findMany({
        where: {
          visitDate: {
            gte: fechaInicio,
            lte: fechaFin,
          },
        },
        include: {
          familia: true,
          creadoPor: true,
          barrio: true,
          nucleo: true,
        },
        orderBy: { visitDate: 'desc' },
      });
    },
  },

  Mutation: {
    createVisita: async (
      _parent: unknown,
      { input }: { input: CreateVisitaInput },
      { prisma, userId }: Context
    ) => {
      if (!userId) {
        throw new GraphQLError('No autenticado', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      // Verificar que la familia existe
      const familia = await prisma.familia.findUnique({
        where: { id: input.familiaId },
      });

      if (!familia) {
        throw new GraphQLError('Familia no encontrada', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Derivar automáticamente el visitStatus según VIS-002
      const visitStatus = derivarVisitStatus(input);

      const visita = await prisma.visita.create({
        data: {
          // IDs
          familiaId: input.familiaId,
          creadoPorId: userId,

          // Básico
          visitDate: input.visitDate,
          visitTime: input.visitTime,

          // Ubicación
          barrioId: input.barrioId,
          barrioOtro: input.barrioOtro,
          nucleoId: input.nucleoId,

          // Visitadores
          visitorUserIds: input.visitorUserIds || [],

          // Tipo y Estatus
          visitType: input.visitType,
          visitStatus,  // DERIVADO AUTOMÁTICAMENTE

          // No se pudo realizar
          motivoNoVisita: input.motivoNoVisita,
          motivoNoVisitaOtra: input.motivoNoVisitaOtra,

          // Actividades (JSON)
          visitActivities: input.visitActivities || {},

          // Materiales (JSON)
          materialDejado: input.materialDejado || {},

          // Seguimiento
          seguimientoVisita: input.seguimientoVisita || false,
          tipoSeguimiento: input.tipoSeguimiento,
          seguimientoFecha: input.seguimientoFecha,
          seguimientoHora: input.seguimientoHora,
          seguimientoActividadBasica: input.seguimientoActividadBasica || false,
          seguimientoActividadBasicaEspecificar: input.seguimientoActividadBasicaEspecificar,
          seguimientoNinguno: input.seguimientoNinguno || false,

          // Notas
          additionalNotes: input.additionalNotes,

          // Legacy fields (para compatibilidad)
          completada: visitStatus === 'realizada',
        },
        include: {
          familia: true,
          creadoPor: true,
          barrio: true,
          nucleo: true,
        },
      });

      return visita;
    },

    updateVisita: async (
      _parent: unknown,
      { id, input }: { id: string; input: UpdateVisitaInput },
      { prisma, userId }: Context
    ) => {
      if (!userId) {
        throw new GraphQLError('No autenticado', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      // Verificar que la visita existe
      const visitaExistente = await prisma.visita.findUnique({
        where: { id },
        include: { familia: true },
      });

      if (!visitaExistente) {
        throw new GraphQLError('Visita no encontrada', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Verificar permisos: el usuario debe pertenecer a la misma comunidad
      const user = await prisma.usuario.findUnique({
        where: { id: userId },
        select: { comunidadId: true },
      });

      if (visitaExistente.familia.comunidadId !== user?.comunidadId) {
        throw new GraphQLError('No tiene permisos para editar esta visita', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      // OCC: Validar conflicto de edición concurrente
      if (input.lastUpdatedAt) {
        const serverUpdatedAt = visitaExistente.updatedAt.toISOString();
        if (serverUpdatedAt !== input.lastUpdatedAt) {
          throw new GraphQLError('Conflicto: Otro usuario modificó este registro', {
            extensions: {
              code: 'EDIT_CONFLICT',
              serverVersion: serverUpdatedAt,
              serverData: visitaExistente
            },
          });
        }
      }

      // Derivar el nuevo visitStatus si se actualiza el tipo o la fecha
      const visitStatus = derivarVisitStatus(input, visitaExistente.visitDate);

      // Preparar datos de actualización (solo campos proporcionados)
      const dataToUpdate: any = {
        updatedAt: new Date(),
      };

      if (input.familiaId !== undefined) dataToUpdate.familiaId = input.familiaId;
      if (input.visitDate !== undefined) dataToUpdate.visitDate = input.visitDate;
      if (input.visitTime !== undefined) dataToUpdate.visitTime = input.visitTime;
      if (input.barrioId !== undefined) dataToUpdate.barrioId = input.barrioId;
      if (input.barrioOtro !== undefined) dataToUpdate.barrioOtro = input.barrioOtro;
      if (input.nucleoId !== undefined) dataToUpdate.nucleoId = input.nucleoId;
      if (input.visitorUserIds !== undefined) dataToUpdate.visitorUserIds = input.visitorUserIds;
      if (input.visitType !== undefined) dataToUpdate.visitType = input.visitType;
      if (input.motivoNoVisita !== undefined) dataToUpdate.motivoNoVisita = input.motivoNoVisita;
      if (input.motivoNoVisitaOtra !== undefined) dataToUpdate.motivoNoVisitaOtra = input.motivoNoVisitaOtra;
      if (input.visitActivities !== undefined) dataToUpdate.visitActivities = input.visitActivities;
      if (input.materialDejado !== undefined) dataToUpdate.materialDejado = input.materialDejado;
      if (input.seguimientoVisita !== undefined) dataToUpdate.seguimientoVisita = input.seguimientoVisita;
      if (input.tipoSeguimiento !== undefined) dataToUpdate.tipoSeguimiento = input.tipoSeguimiento;
      if (input.seguimientoFecha !== undefined) dataToUpdate.seguimientoFecha = input.seguimientoFecha;
      if (input.seguimientoHora !== undefined) dataToUpdate.seguimientoHora = input.seguimientoHora;
      if (input.seguimientoActividadBasica !== undefined) dataToUpdate.seguimientoActividadBasica = input.seguimientoActividadBasica;
      if (input.seguimientoActividadBasicaEspecificar !== undefined) dataToUpdate.seguimientoActividadBasicaEspecificar = input.seguimientoActividadBasicaEspecificar;
      if (input.seguimientoNinguno !== undefined) dataToUpdate.seguimientoNinguno = input.seguimientoNinguno;
      if (input.additionalNotes !== undefined) dataToUpdate.additionalNotes = input.additionalNotes;

      // Siempre actualizar el visitStatus
      dataToUpdate.visitStatus = visitStatus;
      dataToUpdate.completada = visitStatus === 'realizada'; // Legacy field

      const visita = await prisma.visita.update({
        where: { id },
        data: dataToUpdate,
        include: {
          familia: true,
          creadoPor: true,
          barrio: true,
          nucleo: true,
        },
      });

      return visita;
    },

    deleteVisita: async (
      _parent: unknown,
      { id }: { id: string },
      { prisma, userId }: Context
    ) => {
      if (!userId) {
        throw new GraphQLError('No autenticado', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const visita = await prisma.visita.findUnique({ where: { id } });
      if (!visita) {
        throw new GraphQLError('Visita no encontrada', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Hard delete (las visitas no necesitan soft delete según las reglas)
      await prisma.visita.delete({
        where: { id },
      });

      return true;
    },
  },

  Visita: {
    familia: async (parent: any, _args: unknown, { prisma }: Context) => {
      if (parent.familia) return parent.familia;

      return prisma.familia.findUnique({
        where: { id: parent.familiaId },
      });
    },

    creadoPor: async (parent: any, _args: unknown, { prisma }: Context) => {
      if (parent.creadoPor) return parent.creadoPor;

      return prisma.usuario.findUnique({
        where: { id: parent.creadoPorId },
        include: { comunidad: true },
      });
    },

    barrio: async (parent: any, _args: unknown, { prisma }: Context) => {
      if (parent.barrio) return parent.barrio;
      if (!parent.barrioId) return null;

      return prisma.barrio.findUnique({
        where: { id: parent.barrioId },
      });
    },

    nucleo: async (parent: any, _args: unknown, { prisma }: Context) => {
      if (parent.nucleo) return parent.nucleo;
      if (!parent.nucleoId) return null;

      return prisma.nucleo.findUnique({
        where: { id: parent.nucleoId },
      });
    },

    visitadores: async (parent: any, _args: unknown, { prisma }: Context) => {
      // Resolver los IDs de visitadores a objetos Usuario completos
      if (!parent.visitorUserIds || parent.visitorUserIds.length === 0) {
        return [];
      }

      return prisma.usuario.findMany({
        where: {
          id: { in: parent.visitorUserIds },
        },
        include: { comunidad: true },
      });
    },

    // Field resolvers para los objetos JSON
    visitActivities: (parent: any) => {
      // Si es null o undefined, devolver objeto vacío
      return parent.visitActivities || null;
    },

    materialDejado: (parent: any) => {
      // Si es null o undefined, devolver null
      return parent.materialDejado || null;
    },
  },
};
