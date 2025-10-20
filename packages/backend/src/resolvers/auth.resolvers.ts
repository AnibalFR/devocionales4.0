import bcrypt from 'bcrypt';
import { GraphQLError } from 'graphql';
import type { Context } from '../context';
import { createToken } from '../context';
import { EventLogger } from '../services/eventLogger';

interface LoginInput {
  email: string;
  password: string;
}

interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export const authResolvers = {
  Mutation: {
    login: async (
      _parent: unknown,
      { input }: { input: LoginInput },
      { prisma }: Context
    ) => {
      const { email, password } = input;

      // Buscar usuario por email
      const usuario = await prisma.usuario.findUnique({
        where: { email },
        include: { comunidad: true },
      });

      if (!usuario) {
        throw new GraphQLError('Credenciales inválidas', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      // Verificar que el usuario esté activo
      if (!usuario.activo) {
        throw new GraphQLError('Usuario inactivo', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      // Verificar password
      const passwordValid = await bcrypt.compare(password, usuario.password);
      if (!passwordValid) {
        throw new GraphQLError('Credenciales inválidas', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      // Generar token
      const token = createToken(usuario.id);

      // Registrar evento de login
      await EventLogger.logEvent(
        { prisma, userId: usuario.id },
        {
          actionType: 'login',
          entityType: 'System',
        }
      );

      return {
        token,
        user: usuario,
      };
    },

    changePassword: async (
      _parent: unknown,
      { input }: { input: ChangePasswordInput },
      { prisma, userId }: Context
    ) => {
      // Verificar autenticación
      if (!userId) {
        throw new GraphQLError('No autenticado', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const { currentPassword, newPassword } = input;

      // Validar longitud de nueva contraseña
      if (newPassword.length < 8) {
        throw new GraphQLError('La nueva contraseña debe tener al menos 8 caracteres', {
          extensions: { code: 'BAD_REQUEST' },
        });
      }

      // Buscar usuario
      const usuario = await prisma.usuario.findUnique({
        where: { id: userId },
      });

      if (!usuario) {
        throw new GraphQLError('Usuario no encontrado', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Verificar contraseña actual
      const passwordValid = await bcrypt.compare(currentPassword, usuario.password);
      if (!passwordValid) {
        throw new GraphQLError('Contraseña actual incorrecta', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      // Hashear nueva contraseña
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Actualizar contraseña y marcar que ya no necesita cambiarla
      const updatedUsuario = await prisma.usuario.update({
        where: { id: userId },
        data: {
          password: hashedPassword,
          mustChangePassword: false,
        },
        include: {
          comunidad: true,
        },
      });

      return updatedUsuario;
    },
  },
};
