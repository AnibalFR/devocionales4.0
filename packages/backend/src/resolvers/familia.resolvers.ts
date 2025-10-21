import { GraphQLError } from 'graphql';
import type { Context } from '../context';
import { EventLogger } from '../services/eventLogger';
import {
  getUserWithPermissions,
  buildReadFilters,
  requireCreatePermission,
  requireModifyPermission,
} from '../utils/permissions';

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

      // Obtener usuario con permisos
      const usuario = await getUserWithPermissions(prisma, userId);

      // Construir filtros según permisos
      const permissionFilters = buildReadFilters(usuario);

      return prisma.familia.findMany({
        where: {
          activa: true,
          ...permissionFilters,
        },
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

      // Obtener usuario con permisos
      const usuario = await getUserWithPermissions(prisma, userId);

      const familia = await prisma.familia.findUnique({
        where: { id },
        include: {
          miembros: true,
          visitas: {
            include: {
              creadoPor: true,
            },
            orderBy: { visitDate: 'desc' },
          },
        },
      });

      if (!familia) {
        throw new GraphQLError('Familia no encontrada', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Verificar permisos de lectura (COLABORADOR solo su núcleo)
      const permissionFilters = buildReadFilters(usuario);
      if (permissionFilters.nucleoId && familia.nucleoId !== permissionFilters.nucleoId) {
        throw new GraphQLError('No tienes permisos para ver esta familia', {
          extensions: { code: 'FORBIDDEN' },
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

      // Obtener usuario con permisos
      const usuario = await getUserWithPermissions(prisma, userId);

      // Verificar permiso de creación
      requireCreatePermission(usuario.rol, 'familia');

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

      // Registrar evento
      await EventLogger.logEvent(
        { prisma, userId },
        {
          actionType: 'create',
          entityType: 'Familia',
          entityId: familia.id,
          metadata: { nombre: familia.nombre },
          barrioId: familia.barrioId || undefined,
          nucleoId: familia.nucleoId || undefined,
        }
      );

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

      // Obtener usuario con permisos
      const usuario = await getUserWithPermissions(prisma, userId);

      const familiaExistente = await prisma.familia.findUnique({ where: { id } });
      if (!familiaExistente) {
        throw new GraphQLError('Familia no encontrada', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Verificar permiso de modificación
      requireModifyPermission(
        usuario,
        'familia',
        familiaExistente.nucleoId,
        familiaExistente.barrioId
      );

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

      // Registrar evento
      await EventLogger.logEvent(
        { prisma, userId },
        {
          actionType: 'update',
          entityType: 'Familia',
          entityId: familia.id,
          metadata: { nombre: familia.nombre },
          barrioId: familia.barrioId || undefined,
          nucleoId: familia.nucleoId || undefined,
        }
      );

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

      // Obtener usuario con permisos
      const usuario = await getUserWithPermissions(prisma, userId);

      const familia = await prisma.familia.findUnique({ where: { id } });
      if (!familia) {
        throw new GraphQLError('Familia no encontrada', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Verificar permiso de modificación (eliminar requiere mismo permiso)
      requireModifyPermission(
        usuario,
        'familia',
        familia.nucleoId,
        familia.barrioId
      );

      // Soft delete
      await prisma.familia.update({
        where: { id },
        data: { activa: false },
      });

      // Registrar evento
      await EventLogger.logEvent(
        { prisma, userId },
        {
          actionType: 'delete',
          entityType: 'Familia',
          entityId: familia.id,
          metadata: { nombre: familia.nombre },
          barrioId: familia.barrioId || undefined,
          nucleoId: familia.nucleoId || undefined,
        }
      );

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
