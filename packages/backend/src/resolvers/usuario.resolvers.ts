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

      // Solo ADMIN, CEA y MCA pueden ver todos los usuarios
      if (currentUser.rol !== 'ADMIN' && currentUser.rol !== 'CEA' && currentUser.rol !== 'MCA') {
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

      // Verificar que el usuario actual sea ADMIN, CEA, MCA o COLABORADOR
      const currentUser = await prisma.usuario.findUnique({
        where: { id: userId },
      });

      if (!currentUser || (currentUser.rol !== 'ADMIN' && currentUser.rol !== 'CEA' && currentUser.rol !== 'MCA' && currentUser.rol !== 'COLABORADOR')) {
        throw new GraphQLError('Solo usuarios ADMIN, CEA, MCA y COLABORADOR pueden enviar invitaciones', {
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
          rol: input.rol as 'ADMIN' | 'CEA' | 'MCA' | 'COLABORADOR' | 'VISITANTE',
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

    regenerarCredenciales: async (
      _parent: unknown,
      { input }: { input: { miembroId: string } },
      { prisma, userId }: Context
    ) => {
      if (!userId) {
        throw new GraphQLError('No autenticado', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      // Verificar que el usuario actual sea ADMIN, CEA, MCA o COLABORADOR
      const currentUser = await prisma.usuario.findUnique({
        where: { id: userId },
      });

      if (!currentUser || (currentUser.rol !== 'ADMIN' && currentUser.rol !== 'CEA' && currentUser.rol !== 'MCA' && currentUser.rol !== 'COLABORADOR')) {
        throw new GraphQLError('Solo usuarios ADMIN, CEA, MCA y COLABORADOR pueden regenerar credenciales', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      // Buscar el miembro
      const miembro = await prisma.miembro.findUnique({
        where: { id: input.miembroId },
        include: { usuario: true },
      });

      if (!miembro) {
        throw new GraphQLError('Miembro no encontrado', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Verificar que el miembro tenga un usuario vinculado
      if (!miembro.usuarioId || !miembro.usuario) {
        throw new GraphQLError('Este miembro no tiene una cuenta de usuario', {
          extensions: { code: 'BAD_REQUEST' },
        });
      }

      // Generar nueva contraseña temporal segura
      const passwordTemporal = generarPasswordSegura();
      const hashedPassword = await bcrypt.hash(passwordTemporal, 10);

      // Actualizar contraseña del usuario y forzar cambio en próximo login
      const usuario = await prisma.usuario.update({
        where: { id: miembro.usuarioId },
        data: {
          password: hashedPassword,
          mustChangePassword: true,
        },
        include: {
          comunidad: true,
        },
      });

      return {
        usuario,
        passwordTemporal,
      };
    },

    updateUsuarioRol: async (
      _parent: unknown,
      { input }: { input: { usuarioId: string; rol: string } },
      { prisma, userId }: Context
    ) => {
      if (!userId) {
        throw new GraphQLError('No autenticado', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      // Verificar que el usuario actual sea ADMIN, CEA o MCA (solo admins pueden cambiar roles)
      const currentUser = await prisma.usuario.findUnique({
        where: { id: userId },
      });

      if (!currentUser || (currentUser.rol !== 'ADMIN' && currentUser.rol !== 'CEA' && currentUser.rol !== 'MCA')) {
        throw new GraphQLError('Solo usuarios ADMIN, CEA y MCA pueden cambiar roles', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      // Validar que el rol sea válido
      const rolesValidos = ['ADMIN', 'CEA', 'MCA', 'COLABORADOR', 'VISITANTE'];
      if (!rolesValidos.includes(input.rol)) {
        throw new GraphQLError('Rol inválido', {
          extensions: { code: 'BAD_REQUEST' },
        });
      }

      // Buscar el usuario a actualizar
      const usuario = await prisma.usuario.findUnique({
        where: { id: input.usuarioId },
        include: { comunidad: true },
      });

      if (!usuario) {
        throw new GraphQLError('Usuario no encontrado', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Actualizar el rol del usuario
      const usuarioActualizado = await prisma.usuario.update({
        where: { id: input.usuarioId },
        data: {
          rol: input.rol as any,
        },
        include: {
          comunidad: true,
        },
      });

      return usuarioActualizado;
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
