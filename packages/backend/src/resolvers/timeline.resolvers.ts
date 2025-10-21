import { GraphQLError } from 'graphql';
import type { Context } from '../context';
import { EventLogger } from '../services/eventLogger';

interface TimelineFilters {
  actionTypes?: string[];
  entityTypes?: string[];
  actorId?: string;
  startDate?: string;
  endDate?: string;
}

interface TimelineEventsArgs {
  filters?: TimelineFilters;
  limit?: number;
  cursor?: string;
}

export const timelineResolvers = {
  Query: {
    timelineEvents: async (
      _parent: unknown,
      { filters, limit = 50, cursor }: TimelineEventsArgs,
      { prisma, userId }: Context
    ) => {
      // Verificar autenticación
      if (!userId) {
        throw new GraphQLError('No autenticado', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      // Obtener información del usuario para permisos
      const usuario = await prisma.usuario.findUnique({
        where: { id: userId },
        include: {
          miembro: true,
        },
      });

      if (!usuario) {
        throw new GraphQLError('Usuario no encontrado', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Construir where clause base
      const where: any = {
        comunidadId: usuario.comunidadId,
      };

      // Aplicar filtros de permisos por rol
      if (usuario.rol === 'COLABORADOR' && usuario.miembro?.nucleoId) {
        // COLABORADOR solo ve eventos de su núcleo
        where.nucleoId = usuario.miembro.nucleoId;
      } else if (usuario.rol === 'VISITANTE') {
        // VISITANTE solo ve sus propias acciones
        where.actorId = userId;
      }
      // CEA y MCA ven todos los eventos de la comunidad (sin filtro adicional)

      // Aplicar filtros del usuario
      if (filters) {
        if (filters.actionTypes && filters.actionTypes.length > 0) {
          where.actionType = { in: filters.actionTypes };
        }

        if (filters.entityTypes && filters.entityTypes.length > 0) {
          where.entityType = { in: filters.entityTypes };
        }

        if (filters.actorId) {
          where.actorId = filters.actorId;
        }

        if (filters.startDate || filters.endDate) {
          where.timestampUtc = {};

          if (filters.startDate) {
            where.timestampUtc.gte = new Date(filters.startDate);
          }

          if (filters.endDate) {
            // Incluir todo el día final
            const endDate = new Date(filters.endDate);
            endDate.setHours(23, 59, 59, 999);
            where.timestampUtc.lte = endDate;
          }
        }
      }

      // Aplicar cursor para paginación
      if (cursor) {
        where.id = { lt: cursor };
      }

      // Ejecutar query con límite + 1 para saber si hay más
      const events = await prisma.timelineEvent.findMany({
        where,
        orderBy: { timestampUtc: 'desc' },
        take: limit + 1,
      });

      // Determinar si hay más eventos
      const hasMore = events.length > limit;
      const resultEvents = hasMore ? events.slice(0, limit) : events;

      // Personalizar los summaries para el usuario actual y serializar timestamps
      const personalizedEvents = resultEvents.map((event) => ({
        ...event,
        timestampUtc: event.timestampUtc.toISOString(),
        summary: EventLogger.personalizeSummary(event.summary, event.actorId, userId),
      }));

      // Obtener el cursor para la siguiente página
      const nextCursor = hasMore && resultEvents.length > 0 ? resultEvents[resultEvents.length - 1].id : null;

      return {
        events: personalizedEvents,
        hasMore,
        cursor: nextCursor,
      };
    },
  },
};
