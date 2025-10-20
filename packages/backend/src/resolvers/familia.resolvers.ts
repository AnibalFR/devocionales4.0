import { GraphQLError } from 'graphql';
import type { Context } from '../context';

interface CreateFamiliaInput {
  nombre: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  barrio?: string;
  barrioId?: string;
  nucleoId?: string;
  latitud?: number;
  longitud?: number;
  estatus?: string;
  notas?: string;
}

interface UpdateFamiliaInput {
  nombre?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  barrio?: string;
  barrioId?: string;
  nucleoId?: string;
  latitud?: number;
  longitud?: number;
  estatus?: string;
  activa?: boolean;
  notas?: string;
  lastUpdatedAt?: string; // OCC: timestamp para detectar conflictos
}

export const familiaResolvers = {
  Query: {
    familias: async (_parent: unknown, _args: unknown, { prisma, userId }: Context) => {
      if (!userId) {
        throw new GraphQLError('No autenticado', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      return prisma.familia.findMany({
        where: { activa: true },
        include: {
          miembros: true,
          visitas: {
            include: {
              creadoPor: true,
            },
          },
        },
        orderBy: { nombre: 'asc' },
      });
    },

    familia: async (_parent: unknown, { id }: { id: string }, { prisma, userId }: Context) => {
      if (!userId) {
        throw new GraphQLError('No autenticado', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const familia = await prisma.familia.findUnique({
        where: { id },
        include: {
          miembros: true,
          visitas: {
            include: {
              creadoPor: true,
            },
            orderBy: { fecha: 'desc' },
          },
        },
      });

      if (!familia) {
        throw new GraphQLError('Familia no encontrada', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      return familia;
    },
  },

  Mutation: {
    createFamilia: async (
      _parent: unknown,
      { input }: { input: CreateFamiliaInput },
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

      const familia = await prisma.familia.create({
        data: {
          ...input,
          estatus: input.estatus || 'active',
          comunidadId: usuario.comunidadId,
          activa: true,
          miembroCount: 0,
        },
        include: {
          miembros: true,
          visitas: true,
          barrioRel: true,
          nucleoRel: true,
        },
      });

      return familia;
    },

    updateFamilia: async (
      _parent: unknown,
      { id, input }: { id: string; input: UpdateFamiliaInput },
      { prisma, userId }: Context
    ) => {
      if (!userId) {
        throw new GraphQLError('No autenticado', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const familiaExistente = await prisma.familia.findUnique({ where: { id } });
      if (!familiaExistente) {
        throw new GraphQLError('Familia no encontrada', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // OCC: Validar conflicto de edición concurrente
      if (input.lastUpdatedAt) {
        const serverUpdatedAt = familiaExistente.updatedAt.toISOString();
        if (serverUpdatedAt !== input.lastUpdatedAt) {
          throw new GraphQLError('Conflicto: Otro usuario modificó este registro', {
            extensions: {
              code: 'EDIT_CONFLICT',
              serverVersion: serverUpdatedAt,
              serverData: familiaExistente
            },
          });
        }
      }

      // Remover lastUpdatedAt del input antes de actualizar
      const { lastUpdatedAt, ...dataToUpdate } = input;

      const familia = await prisma.familia.update({
        where: { id },
        data: dataToUpdate,
        include: {
          miembros: true,
          visitas: true,
          barrioRel: true,
          nucleoRel: true,
        },
      });

      return familia;
    },

    deleteFamilia: async (
      _parent: unknown,
      { id }: { id: string },
      { prisma, userId }: Context
    ) => {
      if (!userId) {
        throw new GraphQLError('No autenticado', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const familia = await prisma.familia.findUnique({ where: { id } });
      if (!familia) {
        throw new GraphQLError('Familia no encontrada', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Soft delete
      await prisma.familia.update({
        where: { id },
        data: { activa: false },
      });

      return true;
    },
  },

  Familia: {
    miembros: async (parent: any, _args: unknown, { prisma }: Context) => {
      if (parent.miembros) return parent.miembros;

      return prisma.miembro.findMany({
        where: { familiaId: parent.id, activo: true },
        orderBy: { fechaRegistro: 'desc' },
      });
    },

    visitas: async (parent: any, _args: unknown, { prisma }: Context) => {
      if (parent.visitas) return parent.visitas;

      return prisma.visita.findMany({
        where: { familiaId: parent.id },
        include: { creadoPor: true },
        orderBy: { visitDate: 'desc' },
      });
    },

    // OCC Fix: Serializar campos Date a ISO string
    updatedAt: (parent: any) => {
      return parent.updatedAt instanceof Date ? parent.updatedAt.toISOString() : parent.updatedAt;
    },

    createdAt: (parent: any) => {
      return parent.createdAt instanceof Date ? parent.createdAt.toISOString() : parent.createdAt;
    },

    barrioRel: async (parent: any, _args: unknown, { prisma }: Context) => {
      if (parent.barrioRel) return parent.barrioRel;
      if (!parent.barrioId) return null;

      return prisma.barrio.findUnique({
        where: { id: parent.barrioId },
      });
    },

    nucleoRel: async (parent: any, _args: unknown, { prisma }: Context) => {
      if (parent.nucleoRel) return parent.nucleoRel;
      if (!parent.nucleoId) return null;

      return prisma.nucleo.findUnique({
        where: { id: parent.nucleoId },
      });
    },
  },
};
