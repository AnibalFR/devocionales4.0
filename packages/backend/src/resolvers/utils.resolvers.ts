import { GraphQLError } from 'graphql';
import type { Context } from '../context';

export const utilsResolvers = {
  Mutation: {
    clearAllData: async (_parent: unknown, _args: unknown, { prisma, userId }: Context) => {
      if (!userId) {
        throw new GraphQLError('No autenticado', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      // Verificar que el usuario sea CEA (administrador)
      const user = await prisma.usuario.findUnique({
        where: { id: userId },
        select: { rol: true, comunidadId: true },
      });

      if (!user || user.rol !== 'CEA') {
        throw new GraphQLError('Solo usuarios CEA pueden limpiar la base de datos', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      const comunidadId = user.comunidadId;

      // Borrar datos en el orden correcto para evitar problemas de foreign keys

      // 1. Eliminar visitas
      const visitasResult = await prisma.visita.deleteMany({
        where: { creadoPor: { comunidadId } },
      });

      // 2. Eliminar miembros (incluyendo sus devocionales)
      // Obtener IDs de todas las familias de esta comunidad
      const familias = await prisma.familia.findMany({
        where: { comunidadId },
        select: { id: true },
      });
      const familiaIds = familias.map(f => f.id);

      // Eliminar TODOS los miembros:
      // - Los que pertenecen a familias de esta comunidad
      // - Los que tienen un usuario de esta comunidad
      // - Los que están huérfanos (sin familia ni usuario) - estos quedaron de limpiezas anteriores
      const miembrosResult = await prisma.miembro.deleteMany({
        where: {
          OR: [
            // Miembros con familia de esta comunidad
            ...(familiaIds.length > 0 ? [{ familiaId: { in: familiaIds } }] : []),
            // Miembros con usuario de esta comunidad
            { usuario: { comunidadId } },
            // Miembros huérfanos (sin familia ni usuario) - limpiar residuos
            { AND: [{ familiaId: null }, { usuarioId: null }] }
          ]
        },
      });

      // 3. Eliminar familias
      const familiasResult = await prisma.familia.deleteMany({
        where: { comunidadId },
      });

      // 4. Eliminar núcleos
      const nucleosResult = await prisma.nucleo.deleteMany({
        where: { barrio: { comunidadId } },
      });

      // 5. Eliminar barrios
      const barriosResult = await prisma.barrio.deleteMany({
        where: { comunidadId },
      });

      // 6. Eliminar metas
      const metasResult = await prisma.meta.deleteMany({
        where: { comunidadId },
      });

      return {
        visitasEliminadas: visitasResult.count,
        miembrosEliminados: miembrosResult.count,
        familiasEliminadas: familiasResult.count,
        nucleosEliminados: nucleosResult.count,
        barriosEliminados: barriosResult.count,
        metasEliminadas: metasResult.count,
        message: `Se eliminaron ${visitasResult.count} visitas, ${miembrosResult.count} miembros, ${familiasResult.count} familias, ${nucleosResult.count} núcleos, ${barriosResult.count} barrios y ${metasResult.count} metas exitosamente.`,
      };
    },
  },
};
