import bcrypt from 'bcrypt';
import { GraphQLError } from 'graphql';
import type { Context } from '../context';
import { createToken } from '../context';

interface LoginInput {
  email: string;
  password: string;
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

      return {
        token,
        user: usuario,
      };
    },
  },
};
