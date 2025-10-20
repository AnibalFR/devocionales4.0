import { GraphQLError } from 'graphql';
import type { Context } from '../context';
import { EventLogger } from '../services/eventLogger';

interface CreateMetaInput {
  trimestre: string;
  fechaInicio: string;
  fechaFin: string;
  metaNucleos: number;
  metaVisitas: number;
  metaPersonasVisitando: number;
  metaDevocionales: number;
}

interface UpdateMetaInput {
  trimestre?: string;
  fechaInicio?: string;
  fechaFin?: string;
  metaNucleos?: number;
  metaVisitas?: number;
  metaPersonasVisitando?: number;
  metaDevocionales?: number;
  lastUpdatedAt?: string; // OCC: timestamp para detectar conflictos
}

// Función para calcular el estado de una meta según META-003
function calcularEstadoMeta(meta: any): string {
  const hoy = new Date();
  const inicio = new Date(meta.fechaInicio);
  const fin = new Date(meta.fechaFin);

  hoy.setHours(0, 0, 0, 0);
  inicio.setHours(0, 0, 0, 0);
  fin.setHours(0, 0, 0, 0);

  if (hoy < inicio) {
    return 'futura';
  } else if (hoy > fin) {
    return 'completada';
  } else {
    return 'activa';
  }
}

// Función para calcular el progreso de una meta activa
async function calcularProgresoMeta(meta: any, prisma: any) {
  // Contar núcleos activos
  const nucleosActuales = await prisma.nucleo.count({
    where: {
      comunidadId: meta.comunidadId,
      activo: true,
    },
  });

  // Contar visitas del período
  const visitasActuales = await prisma.visita.count({
    where: {
      visitDate: {
        gte: meta.fechaInicio,
        lte: meta.fechaFin,
      },
      visitStatus: 'realizada',
    },
  });

  // Contar personas visitando (distinct visitorUserIds del período)
  const visitasConVisitadores = await prisma.visita.findMany({
    where: {
      visitDate: {
        gte: meta.fechaInicio,
        lte: meta.fechaFin,
      },
      visitStatus: 'realizada',
    },
    select: {
      visitorUserIds: true,
    },
  });

  const visitadoresUnicos = new Set<string>();
  visitasConVisitadores.forEach(v => {
    if (v.visitorUserIds && Array.isArray(v.visitorUserIds)) {
      v.visitorUserIds.forEach((id: string) => visitadoresUnicos.add(id));
    }
  });
  const personasVisitandoActuales = visitadoresUnicos.size;

  // Contar devocionales activos
  const devocionalesActuales = await prisma.miembro.count({
    where: {
      activo: true,
      tieneDevocional: true,
    },
  });

  // Calcular porcentajes
  const nucleosPorcentaje = meta.metaNucleos > 0
    ? (nucleosActuales / meta.metaNucleos) * 100
    : 0;

  const visitasPorcentaje = meta.metaVisitas > 0
    ? (visitasActuales / meta.metaVisitas) * 100
    : 0;

  const personasVisitandoPorcentaje = meta.metaPersonasVisitando > 0
    ? (personasVisitandoActuales / meta.metaPersonasVisitando) * 100
    : 0;

  const devocionalesPorcentaje = meta.metaDevocionales > 0
    ? (devocionalesActuales / meta.metaDevocionales) * 100
    : 0;

  return {
    nucleosActuales,
    visitasActuales,
    personasVisitandoActuales,
    devocionalesActuales,
    nucleosPorcentaje: Math.round(nucleosPorcentaje * 100) / 100,
    visitasPorcentaje: Math.round(visitasPorcentaje * 100) / 100,
    personasVisitandoPorcentaje: Math.round(personasVisitandoPorcentaje * 100) / 100,
    devocionalesPorcentaje: Math.round(devocionalesPorcentaje * 100) / 100,
  };
}

export const metaResolvers = {
  Query: {
    metas: async (_parent: unknown, _args: unknown, { prisma, userId }: Context) => {
      if (!userId) {
        throw new GraphQLError('No autenticado', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      // Obtener comunidad del usuario
      const usuario = await prisma.usuario.findUnique({
        where: { id: userId },
      });

      if (!usuario) {
        throw new GraphQLError('Usuario no encontrado', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      return prisma.meta.findMany({
        where: { comunidadId: usuario.comunidadId },
        orderBy: { fechaInicio: 'desc' },
      });
    },

    meta: async (_parent: unknown, { id }: { id: string }, { prisma, userId }: Context) => {
      if (!userId) {
        throw new GraphQLError('No autenticado', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const meta = await prisma.meta.findUnique({
        where: { id },
      });

      if (!meta) {
        throw new GraphQLError('Meta no encontrada', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      return meta;
    },

    metaActiva: async (_parent: unknown, _args: unknown, { prisma, userId }: Context) => {
      if (!userId) {
        throw new GraphQLError('No autenticado', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      // Obtener comunidad del usuario
      const usuario = await prisma.usuario.findUnique({
        where: { id: userId },
      });

      if (!usuario) {
        throw new GraphQLError('Usuario no encontrado', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Obtener todas las metas de la comunidad
      const metas = await prisma.meta.findMany({
        where: { comunidadId: usuario.comunidadId },
      });

      // Encontrar la meta activa (fecha actual entre inicio y fin)
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      const metaActiva = metas.find(meta => {
        const inicio = new Date(meta.fechaInicio);
        const fin = new Date(meta.fechaFin);
        inicio.setHours(0, 0, 0, 0);
        fin.setHours(0, 0, 0, 0);

        return hoy >= inicio && hoy <= fin;
      });

      return metaActiva || null;
    },
  },

  Mutation: {
    createMeta: async (
      _parent: unknown,
      { input }: { input: CreateMetaInput },
      { prisma, userId }: Context
    ) => {
      if (!userId) {
        throw new GraphQLError('No autenticado', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      // Obtener comunidad del usuario
      const usuario = await prisma.usuario.findUnique({
        where: { id: userId },
      });

      if (!usuario) {
        throw new GraphQLError('Usuario no encontrado', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      const meta = await prisma.meta.create({
        data: {
          ...input,
          comunidadId: usuario.comunidadId,
        },
      });

      // Registrar evento
      await EventLogger.logEvent(
        { prisma, userId },
        {
          actionType: 'create',
          entityType: 'Meta',
          entityId: meta.id,
          metadata: { trimestre: meta.trimestre },
        }
      );

      return meta;
    },

    updateMeta: async (
      _parent: unknown,
      { id, input }: { id: string; input: UpdateMetaInput },
      { prisma, userId }: Context
    ) => {
      if (!userId) {
        throw new GraphQLError('No autenticado', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const metaExistente = await prisma.meta.findUnique({ where: { id } });
      if (!metaExistente) {
        throw new GraphQLError('Meta no encontrada', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // OCC: Validar conflicto de edición concurrente
      if (input.lastUpdatedAt) {
        const serverUpdatedAt = metaExistente.updatedAt.toISOString();
        if (serverUpdatedAt !== input.lastUpdatedAt) {
          throw new GraphQLError('Conflicto: Otro usuario modificó este registro', {
            extensions: {
              code: 'EDIT_CONFLICT',
              serverVersion: serverUpdatedAt,
              serverData: metaExistente
            },
          });
        }
      }

      // Remover lastUpdatedAt del input antes de actualizar
      const { lastUpdatedAt, ...dataToUpdate } = input;

      const meta = await prisma.meta.update({
        where: { id },
        data: dataToUpdate,
      });

      // Registrar evento
      await EventLogger.logEvent(
        { prisma, userId },
        {
          actionType: 'update',
          entityType: 'Meta',
          entityId: meta.id,
          metadata: { trimestre: meta.trimestre },
        }
      );

      return meta;
    },

    deleteMeta: async (
      _parent: unknown,
      { id }: { id: string },
      { prisma, userId }: Context
    ) => {
      if (!userId) {
        throw new GraphQLError('No autenticado', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const meta = await prisma.meta.findUnique({ where: { id } });
      if (!meta) {
        throw new GraphQLError('Meta no encontrada', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Hard delete
      await prisma.meta.delete({
        where: { id },
      });

      // Registrar evento
      await EventLogger.logEvent(
        { prisma, userId },
        {
          actionType: 'delete',
          entityType: 'Meta',
          entityId: meta.id,
          metadata: { trimestre: meta.trimestre },
        }
      );

      return true;
    },
  },

  Meta: {
    // Campo calculado: estado de la meta
    estado: (parent: any) => {
      return calcularEstadoMeta(parent);
    },

    // Campo calculado: progreso (solo si está activa)
    progreso: async (parent: any, _args: unknown, { prisma }: Context) => {
      const estado = calcularEstadoMeta(parent);

      // Solo calcular progreso si la meta está activa
      if (estado !== 'activa') {
        return null;
      }

      return await calcularProgresoMeta(parent, prisma);
    },

    comunidad: async (parent: any, _args: unknown, { prisma }: Context) => {
      return prisma.comunidad.findUnique({
        where: { id: parent.comunidadId },
      });
    },

    // OCC Fix: Serializar campos Date a ISO string
    updatedAt: (parent: any) => {
      return parent.updatedAt instanceof Date ? parent.updatedAt.toISOString() : parent.updatedAt;
    },

    createdAt: (parent: any) => {
      return parent.createdAt instanceof Date ? parent.createdAt.toISOString() : parent.createdAt;
    },
  },
};
