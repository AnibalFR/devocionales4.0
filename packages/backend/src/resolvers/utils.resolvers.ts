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

      // Verificar que el usuario sea ADMIN, CEA o MCA (administradores)
      const user = await prisma.usuario.findUnique({
        where: { id: userId },
        select: { rol: true, comunidadId: true },
      });

      if (!user || (user.rol !== 'ADMIN' && user.rol !== 'CEA' && user.rol !== 'MCA')) {
        throw new GraphQLError('Solo usuarios ADMIN, CEA y MCA pueden limpiar la base de datos', {
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
      // IMPORTANTE: NO eliminar miembros que tienen un usuario vinculado,
      // ya que estos representan a los usuarios del sistema y deben preservarse

      // Obtener IDs de todas las familias de esta comunidad
      const familias = await prisma.familia.findMany({
        where: { comunidadId },
        select: { id: true },
      });
      const familiaIds = familias.map(f => f.id);

      // Eliminar solo los miembros que NO tienen usuario vinculado:
      // - Los que pertenecen a familias de esta comunidad y no tienen usuario
      // - Los que están huérfanos (sin familia ni usuario)
      const miembrosResult = await prisma.miembro.deleteMany({
        where: {
          usuarioId: null, // Solo eliminar miembros sin usuario
          OR: [
            // Miembros con familia de esta comunidad
            ...(familiaIds.length > 0 ? [{ familiaId: { in: familiaIds } }] : []),
            // Miembros huérfanos (sin familia ni usuario) - limpiar residuos
            { familiaId: null }
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

      // 7. IMPORTANTE: Asegurar que todos los usuarios tengan su miembro correspondiente
      // Esto es necesario porque los usuarios deben aparecer en el catálogo de miembros
      // para poder editar su información (nombre, correo, etc.)
      const usuariosSinMiembro = await prisma.usuario.findMany({
        where: {
          comunidadId,
          miembro: null,
        },
      });

      let miembrosCreados = 0;
      for (const usuario of usuariosSinMiembro) {
        await prisma.miembro.create({
          data: {
            usuarioId: usuario.id,
            nombre: usuario.nombre,
            apellidos: usuario.apellidos,
            email: usuario.email,
            rol: usuario.rol,
            tieneDevocional: false,
            devocionalMiembros: [],
            activo: usuario.activo,
            fechaRegistro: new Date(),
          },
        });
        miembrosCreados++;
      }

      return {
        visitasEliminadas: visitasResult.count,
        miembrosEliminados: miembrosResult.count,
        familiasEliminadas: familiasResult.count,
        nucleosEliminados: nucleosResult.count,
        barriosEliminados: barriosResult.count,
        metasEliminadas: metasResult.count,
        miembrosCreados,
        message: `Se eliminaron ${visitasResult.count} visitas, ${miembrosResult.count} miembros, ${familiasResult.count} familias, ${nucleosResult.count} núcleos, ${barriosResult.count} barrios y ${metasResult.count} metas exitosamente. Se crearon ${miembrosCreados} miembros para usuarios existentes.`,
      };
    },
  },
};
