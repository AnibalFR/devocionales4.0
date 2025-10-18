import { GraphQLError } from 'graphql';
import bcrypt from 'bcrypt';
import type { Context } from '../context';

// Función para generar contraseña segura
function generarPasswordSegura(): string {
  const length = 14;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
}

export const usuarioResolvers = {
  Query: {
    me: async (_parent: unknown, _args: unknown, { prisma, userId }: Context) => {
      if (!userId) {
        throw new GraphQLError('No autenticado', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const usuario = await prisma.usuario.findUnique({
        where: { id: userId },
        include: { comunidad: true },
      });

      if (!usuario) {
        throw new GraphQLError('Usuario no encontrado', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      return usuario;
    },

    usuarios: async (_parent: unknown, _args: unknown, { prisma, userId }: Context) => {
      if (!userId) {
        throw new GraphQLError('No autenticado', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      // Obtener usuario actual para verificar permisos
      const currentUser = await prisma.usuario.findUnique({
        where: { id: userId },
      });

      if (!currentUser) {
        throw new GraphQLError('Usuario no encontrado', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Solo CEA puede ver todos los usuarios
      if (currentUser.rol !== 'CEA') {
        throw new GraphQLError('No autorizado', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      return prisma.usuario.findMany({
        include: { comunidad: true },
        orderBy: { nombre: 'asc' },
      });
    },
  },

  Mutation: {
    createUsuarioFromMiembro: async (
      _parent: unknown,
      { input }: { input: { miembroId: string; rol: string } },
      { prisma, userId }: Context
    ) => {
      if (!userId) {
        throw new GraphQLError('No autenticado', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      // Verificar que el usuario actual sea CEA o COLABORADOR
      const currentUser = await prisma.usuario.findUnique({
        where: { id: userId },
      });

      if (!currentUser || (currentUser.rol !== 'CEA' && currentUser.rol !== 'COLABORADOR')) {
        throw new GraphQLError('Solo usuarios CEA y COLABORADOR pueden enviar invitaciones', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      // Buscar el miembro
      const miembro = await prisma.miembro.findUnique({
        where: { id: input.miembroId },
      });

      if (!miembro) {
        throw new GraphQLError('Miembro no encontrado', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Verificar que el miembro no tenga ya un usuario vinculado
      if (miembro.usuarioId) {
        throw new GraphQLError('Este miembro ya tiene una cuenta de usuario', {
          extensions: { code: 'BAD_REQUEST' },
        });
      }

      // Verificar que el miembro tenga email
      if (!miembro.email) {
        throw new GraphQLError('El miembro debe tener un email para crear una cuenta', {
          extensions: { code: 'BAD_REQUEST' },
        });
      }

      // Verificar que el email no esté en uso
      const existingUser = await prisma.usuario.findUnique({
        where: { email: miembro.email },
      });

      if (existingUser) {
        throw new GraphQLError('El email ya está en uso por otro usuario', {
          extensions: { code: 'BAD_REQUEST' },
        });
      }

      // Generar contraseña temporal segura
      const passwordTemporal = generarPasswordSegura();
      const hashedPassword = await bcrypt.hash(passwordTemporal, 10);

      // Crear usuario
      const usuario = await prisma.usuario.create({
        data: {
          email: miembro.email,
          password: hashedPassword,
          nombre: miembro.nombre,
          apellidos: miembro.apellidos || '',
          rol: input.rol as 'CEA' | 'COLABORADOR' | 'VISITANTE',
          comunidadId: currentUser.comunidadId,
          activo: true,
          mustChangePassword: true, // Forzar cambio de contraseña en primer login
        },
        include: {
          comunidad: true,
        },
      });

      // Vincular usuario al miembro
      await prisma.miembro.update({
        where: { id: input.miembroId },
        data: { usuarioId: usuario.id },
      });

      return {
        usuario,
        passwordTemporal,
      };
    },
  },

  Usuario: {
    comunidad: async (parent: any, _args: unknown, { prisma }: Context) => {
      if (parent.comunidad) return parent.comunidad;

      return prisma.comunidad.findUnique({
        where: { id: parent.comunidadId },
      });
    },
  },
};
