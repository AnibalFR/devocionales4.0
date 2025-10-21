import { GraphQLError} from 'graphql';
import type { Context } from '../context';
import { EventLogger } from '../services/eventLogger';

interface CreateBarrioInput {
  nombre: string;
  descripcion?: string;
}

interface UpdateBarrioInput {
  nombre?: string;
  descripcion?: string;
  activo?: boolean;
  lastUpdatedAt?: string;
}

export const barrioResolvers = {
  Query: {
    barrios: async (_parent: unknown, _args: unknown, { prisma, userId }: Context) => {
      if (!userId) {
        throw new GraphQLError('No autenticado', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      return prisma.barrio.findMany({
        where: { activo: true },
        orderBy: { createdAt: 'desc' }, // BAR-001: Más recientes primero
      });
    },

    barrio: async (_parent: unknown, { id }: { id: string }, { prisma, userId }: Context) => {
      if (!userId) {
        throw new GraphQLError('No autenticado', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const barrio = await prisma.barrio.findUnique({
        where: { id },
      });

      if (!barrio) {
        throw new GraphQLError('Barrio no encontrado', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      return barrio;
    },
  },

  Mutation: {
    createBarrio: async (
      _parent: unknown,
      { input }: { input: CreateBarrioInput },
      { prisma, userId }: Context
    ) => {
      if (!userId) {
        throw new GraphQLError('No autenticado', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      // Obtener comunidadId del usuario autenticado
      const user = await prisma.usuario.findUnique({
        where: { id: userId },
        select: { comunidadId: true },
      });

      if (!user) {
        throw new GraphQLError('Usuario no encontrado', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // BAR-001: Crear barrio con valores por defecto
      const barrio = await prisma.barrio.create({
        data: {
          nombre: input.nombre,
          descripcion: input.descripcion || null,
          activo: true,
          comunidadId: user.comunidadId,
        },
      });

      // Registrar evento
      await EventLogger.logEvent(
        { prisma, userId },
        {
          actionType: 'create',
          entityType: 'Barrio',
          entityId: barrio.id,
          metadata: { nombre: barrio.nombre },
          barrioId: barrio.id,
        }
      );

      return barrio;
    },

    updateBarrio: async (
      _parent: unknown,
      { id, input }: { id: string; input: UpdateBarrioInput },
      { prisma, userId }: Context
    ) => {
      if (!userId) {
        throw new GraphQLError('No autenticado', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const barrioExistente = await prisma.barrio.findUnique({ where: { id } });
      if (!barrioExistente) {
        throw new GraphQLError('Barrio no encontrado', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // OCC: Validar conflicto de edición concurrente
      if (input.lastUpdatedAt) {
        const serverUpdatedAt = barrioExistente.updatedAt.toISOString();
        if (serverUpdatedAt !== input.lastUpdatedAt) {
          throw new GraphQLError('Conflicto: Otro usuario modificó este registro', {
            extensions: {
              code: 'EDIT_CONFLICT',
              serverVersion: serverUpdatedAt,
              serverData: barrioExistente
            },
          });
        }
      }

      // Remover lastUpdatedAt del input antes de actualizar
      const { lastUpdatedAt, ...dataToUpdate } = input;

      const barrio = await prisma.barrio.update({
        where: { id },
        data: dataToUpdate,
      });

      // Registrar evento
      await EventLogger.logEvent(
        { prisma, userId },
        {
          actionType: 'update',
          entityType: 'Barrio',
          entityId: barrio.id,
          metadata: { nombre: barrio.nombre },
          barrioId: barrio.id,
        }
      );

      return barrio;
    },

    deleteBarrio: async (
      _parent: unknown,
      { id }: { id: string },
      { prisma, userId }: Context
    ) => {
      if (!userId) {
        throw new GraphQLError('No autenticado', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const barrio = await prisma.barrio.findUnique({ where: { id } });
      if (!barrio) {
        throw new GraphQLError('Barrio no encontrado', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Soft delete
      await prisma.barrio.update({
        where: { id },
        data: { activo: false },
      });

      // Registrar evento
      await EventLogger.logEvent(
        { prisma, userId },
        {
          actionType: 'delete',
          entityType: 'Barrio',
          entityId: barrio.id,
          metadata: { nombre: barrio.nombre },
          barrioId: barrio.id,
        }
      );

      return true;
    },
  },

  Barrio: {
    createdAt: (parent: any) => {
      return parent.createdAt instanceof Date
        ? parent.createdAt.toISOString()
        : parent.createdAt;
    },
    updatedAt: (parent: any) => {
      return parent.updatedAt instanceof Date
        ? parent.updatedAt.toISOString()
        : parent.updatedAt;
    },
  },
};
