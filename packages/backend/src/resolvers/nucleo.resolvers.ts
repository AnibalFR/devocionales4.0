import { GraphQLError } from 'graphql';
import type { Context } from '../context';
import { EventLogger } from '../services/eventLogger';

interface CreateNucleoInput {
  nombre: string;
  barrioId: string;
  descripcion?: string;
}

interface UpdateNucleoInput {
  nombre?: string;
  barrioId?: string;
  descripcion?: string;
  activo?: boolean;
  lastUpdatedAt?: string;
}

export const nucleoResolvers = {
  Query: {
    nucleos: async (_parent: unknown, _args: unknown, { prisma, userId }: Context) => {
      if (!userId) {
        throw new GraphQLError('No autenticado', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      return prisma.nucleo.findMany({
        where: { activo: true },
        orderBy: { createdAt: 'desc' }, // Más recientes primero
        include: {
          barrio: true,
        },
      });
    },

    nucleo: async (_parent: unknown, { id }: { id: string }, { prisma, userId }: Context) => {
      if (!userId) {
        throw new GraphQLError('No autenticado', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const nucleo = await prisma.nucleo.findUnique({
        where: { id },
        include: {
          barrio: true,
        },
      });

      if (!nucleo) {
        throw new GraphQLError('Núcleo no encontrado', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      return nucleo;
    },
  },

  Mutation: {
    createNucleo: async (
      _parent: unknown,
      { input }: { input: CreateNucleoInput },
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

      // NUC-001: Validar que existe el barrio
      const barrio = await prisma.barrio.findUnique({
        where: { id: input.barrioId },
      });

      if (!barrio) {
        throw new GraphQLError('El barrio especificado no existe', {
          extensions: { code: 'BAD_REQUEST' },
        });
      }

      const nucleo = await prisma.nucleo.create({
        data: {
          nombre: input.nombre,
          barrioId: input.barrioId,
          descripcion: input.descripcion || null,
          activo: true,
          comunidadId: user.comunidadId,
        },
        include: {
          barrio: true,
        },
      });

      // Registrar evento
      await EventLogger.logEvent(
        { prisma, userId },
        {
          actionType: 'create',
          entityType: 'Nucleo',
          entityId: nucleo.id,
          metadata: { nombre: nucleo.nombre },
          barrioId: nucleo.barrioId,
          nucleoId: nucleo.id,
        }
      );

      return nucleo;
    },

    updateNucleo: async (
      _parent: unknown,
      { id, input }: { id: string; input: UpdateNucleoInput },
      { prisma, userId }: Context
    ) => {
      if (!userId) {
        throw new GraphQLError('No autenticado', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const nucleoExistente = await prisma.nucleo.findUnique({ where: { id } });
      if (!nucleoExistente) {
        throw new GraphQLError('Núcleo no encontrado', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // NUC-001: Si se está cambiando el barrio, validar que existe
      if (input.barrioId) {
        const barrio = await prisma.barrio.findUnique({
          where: { id: input.barrioId },
        });

        if (!barrio) {
          throw new GraphQLError('El barrio especificado no existe', {
            extensions: { code: 'BAD_REQUEST' },
          });
        }
      }

      // OCC: Validar conflicto de edición concurrente
      if (input.lastUpdatedAt) {
        const serverUpdatedAt = nucleoExistente.updatedAt.toISOString();
        if (serverUpdatedAt !== input.lastUpdatedAt) {
          throw new GraphQLError('Conflicto: Otro usuario modificó este registro', {
            extensions: {
              code: 'EDIT_CONFLICT',
              serverVersion: serverUpdatedAt,
              serverData: nucleoExistente
            },
          });
        }
      }

      // Remover lastUpdatedAt del input antes de actualizar
      const { lastUpdatedAt, ...dataToUpdate } = input;

      const nucleo = await prisma.nucleo.update({
        where: { id },
        data: dataToUpdate,
        include: {
          barrio: true,
        },
      });

      // Registrar evento
      await EventLogger.logEvent(
        { prisma, userId },
        {
          actionType: 'update',
          entityType: 'Nucleo',
          entityId: nucleo.id,
          metadata: { nombre: nucleo.nombre },
          barrioId: nucleo.barrioId,
          nucleoId: nucleo.id,
        }
      );

      return nucleo;
    },

    deleteNucleo: async (
      _parent: unknown,
      { id }: { id: string },
      { prisma, userId }: Context
    ) => {
      if (!userId) {
        throw new GraphQLError('No autenticado', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const nucleo = await prisma.nucleo.findUnique({ where: { id } });
      if (!nucleo) {
        throw new GraphQLError('Núcleo no encontrado', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Soft delete
      await prisma.nucleo.update({
        where: { id },
        data: { activo: false },
      });

      // Registrar evento
      await EventLogger.logEvent(
        { prisma, userId },
        {
          actionType: 'delete',
          entityType: 'Nucleo',
          entityId: nucleo.id,
          metadata: { nombre: nucleo.nombre },
          barrioId: nucleo.barrioId,
          nucleoId: nucleo.id,
        }
      );

      return true;
    },
  },

  Nucleo: {
    barrio: async (parent: any, _args: unknown, { prisma }: Context) => {
      if (parent.barrio) return parent.barrio;

      return prisma.barrio.findUnique({
        where: { id: parent.barrioId },
      });
    },
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
