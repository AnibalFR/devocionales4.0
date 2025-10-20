import { GraphQLError } from 'graphql';
import type { Context } from '../context';

interface CreateMiembroInput {
  familiaId?: string;
  usuarioId?: string;
  nombre: string;
  apellidos?: string;
  direccion?: string;
  barrioId?: string;
  nucleoId?: string;
  fechaNacimiento?: string;
  edadAproximada?: number;
  telefono?: string;
  email?: string;
  rol: string;
  rolFamiliar?: string;
  tieneDevocional?: boolean;
  devocionalDia?: string;
  devocionalHora?: string;
  devocionalParticipantes?: number;
  devocionalMiembros?: string[];
  notas?: string;
}

interface UpdateMiembroInput {
  familiaId?: string;
  nombre?: string;
  apellidos?: string;
  direccion?: string;
  barrioId?: string;
  nucleoId?: string;
  fechaNacimiento?: string;
  edadAproximada?: number;
  telefono?: string;
  email?: string;
  rol?: string;
  rolFamiliar?: string;
  tieneDevocional?: boolean;
  devocionalDia?: string;
  devocionalHora?: string;
  devocionalParticipantes?: number;
  devocionalMiembros?: string[];
  activo?: boolean;
  notas?: string;
}

// Función auxiliar para convertir fecha YYYY-MM-DD a DateTime ISO-8601
function convertirFechaADateTime(fecha: string | null | undefined): Date | null {
  if (!fecha) return null;

  // Si ya es un objeto Date o string ISO completo, devolverlo como Date
  try {
    const date = new Date(fecha);
    if (!isNaN(date.getTime())) {
      return date;
    }
  } catch {
    // Continuar con el parsing manual
  }

  // Si es formato YYYY-MM-DD, convertir a DateTime a medianoche UTC
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (dateRegex.test(fecha)) {
    return new Date(`${fecha}T00:00:00.000Z`);
  }

  return null;
}

// Función auxiliar para calcular edad según MEM-003
function calcularEdad(miembro: any): number | null {
  // Si tiene fechaNacimiento → edad exacta calculada
  if (miembro.fechaNacimiento) {
    const hoy = new Date();
    const nacimiento = new Date(miembro.fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mesActual = hoy.getMonth();
    const mesNacimiento = nacimiento.getMonth();

    if (mesActual < mesNacimiento || (mesActual === mesNacimiento && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }

    return edad;
  }

  // Si tiene edad aproximada → calcular con años transcurridos desde última actualización
  if (miembro.edadAproximada !== null && miembro.edadAproximada !== undefined) {
    if (!miembro.fechaActualizacionEdad) {
      return miembro.edadAproximada;
    }

    const hoy = new Date();
    const actualizacion = new Date(miembro.fechaActualizacionEdad);
    const añosTranscurridos = Math.floor(
      (hoy.getTime() - actualizacion.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
    );

    return miembro.edadAproximada + añosTranscurridos;
  }

  return null;
}

export const miembroResolvers = {
  Query: {
    miembros: async (_parent: unknown, _args: unknown, { prisma, userId }: Context) => {
      if (!userId) {
        throw new GraphQLError('No autenticado', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      return prisma.miembro.findMany({
        where: { activo: true },
        include: {
          familia: true,
          usuario: true,
          barrio: true,
          nucleo: true,
        },
        orderBy: { fechaRegistro: 'desc' },
      });
    },

    miembro: async (_parent: unknown, { id }: { id: string }, { prisma, userId }: Context) => {
      if (!userId) {
        throw new GraphQLError('No autenticado', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const miembro = await prisma.miembro.findUnique({
        where: { id },
        include: {
          familia: true,
          usuario: true,
          barrio: true,
          nucleo: true,
        },
      });

      if (!miembro) {
        throw new GraphQLError('Miembro no encontrado', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      return miembro;
    },

    miembrosConDevocional: async (_parent: unknown, _args: unknown, { prisma, userId }: Context) => {
      if (!userId) {
        throw new GraphQLError('No autenticado', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      return prisma.miembro.findMany({
        where: {
          activo: true,
          tieneDevocional: true,
        },
        include: {
          familia: true,
          barrio: true,
          nucleo: true,
        },
        orderBy: { nombre: 'asc' },
      });
    },
  },

  Mutation: {
    createMiembro: async (
      _parent: unknown,
      { input }: { input: CreateMiembroInput },
      { prisma, userId }: Context
    ) => {
      if (!userId) {
        throw new GraphQLError('No autenticado', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      // Fecha de actualización de edad si se proporciona edad aproximada
      const data: any = {
        ...input,
        activo: true,
        fechaRegistro: new Date(),
      };

      // Convertir fechaNacimiento a DateTime si está presente
      if (input.fechaNacimiento) {
        const fechaConvertida = convertirFechaADateTime(input.fechaNacimiento);
        data.fechaNacimiento = fechaConvertida;
      }

      if (input.edadAproximada !== undefined && input.edadAproximada !== null) {
        data.fechaActualizacionEdad = new Date();
      }

      const miembro = await prisma.miembro.create({
        data,
        include: {
          familia: true,
          usuario: true,
          barrio: true,
          nucleo: true,
        },
      });

      // Actualizar miembroCount de la familia si está ligado
      if (miembro.familiaId) {
        const count = await prisma.miembro.count({
          where: { familiaId: miembro.familiaId, activo: true },
        });

        await prisma.familia.update({
          where: { id: miembro.familiaId },
          data: { miembroCount: count },
        });
      }

      return miembro;
    },

    updateMiembro: async (
      _parent: unknown,
      { id, input }: { id: string; input: UpdateMiembroInput },
      { prisma, userId }: Context
    ) => {
      if (!userId) {
        throw new GraphQLError('No autenticado', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const miembroExistente = await prisma.miembro.findUnique({ where: { id } });
      if (!miembroExistente) {
        throw new GraphQLError('Miembro no encontrado', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Actualizar fecha de actualización de edad si se modifica la edad aproximada
      const data: any = { ...input };

      // Convertir fechaNacimiento a DateTime si está presente
      if (input.fechaNacimiento !== undefined) {
        const fechaConvertida = convertirFechaADateTime(input.fechaNacimiento);
        data.fechaNacimiento = fechaConvertida;
      }

      if (input.edadAproximada !== undefined && input.edadAproximada !== miembroExistente.edadAproximada) {
        data.fechaActualizacionEdad = new Date();
      }

      const miembro = await prisma.miembro.update({
        where: { id },
        data,
        include: {
          familia: true,
          usuario: true,
          barrio: true,
          nucleo: true,
        },
      });

      // Actualizar miembroCount si cambió la familia
      if (input.familiaId && input.familiaId !== miembroExistente.familiaId) {
        // Decrementar en familia anterior
        if (miembroExistente.familiaId) {
          const countAnterior = await prisma.miembro.count({
            where: { familiaId: miembroExistente.familiaId, activo: true },
          });
          await prisma.familia.update({
            where: { id: miembroExistente.familiaId },
            data: { miembroCount: countAnterior },
          });
        }

        // Incrementar en familia nueva
        const countNueva = await prisma.miembro.count({
          where: { familiaId: input.familiaId, activo: true },
        });
        await prisma.familia.update({
          where: { id: input.familiaId },
          data: { miembroCount: countNueva },
        });
      }

      return miembro;
    },

    deleteMiembro: async (
      _parent: unknown,
      { id }: { id: string },
      { prisma, userId }: Context
    ) => {
      if (!userId) {
        throw new GraphQLError('No autenticado', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const miembro = await prisma.miembro.findUnique({
        where: { id },
        include: { usuario: true },
      });
      if (!miembro) {
        throw new GraphQLError('Miembro no encontrado', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      // Proteger eliminación de miembros vinculados a usuarios del sistema
      // Los usuarios del sistema deben aparecer en el catálogo para poder editar su información
      if (miembro.usuarioId) {
        throw new GraphQLError('No se puede eliminar un miembro que tiene una cuenta de usuario vinculada. Para eliminar este registro, primero debe desvincular o eliminar la cuenta de usuario.', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      // Soft delete
      await prisma.miembro.update({
        where: { id },
        data: { activo: false },
      });

      // Actualizar miembroCount de la familia
      if (miembro.familiaId) {
        const count = await prisma.miembro.count({
          where: { familiaId: miembro.familiaId, activo: true },
        });

        await prisma.familia.update({
          where: { id: miembro.familiaId },
          data: { miembroCount: count },
        });
      }

      return true;
    },
  },

  Miembro: {
    // Campo calculado: edad según sistema dual
    edadCalculada: (parent: any) => {
      return calcularEdad(parent);
    },

    familia: async (parent: any, _args: unknown, { prisma }: Context) => {
      if (parent.familia) return parent.familia;
      if (!parent.familiaId) return null;

      return prisma.familia.findUnique({
        where: { id: parent.familiaId },
      });
    },

    usuario: async (parent: any, _args: unknown, { prisma }: Context) => {
      if (parent.usuario) return parent.usuario;
      if (!parent.usuarioId) return null;

      return prisma.usuario.findUnique({
        where: { id: parent.usuarioId },
      });
    },

    barrio: async (parent: any, _args: unknown, { prisma }: Context) => {
      if (parent.barrio) return parent.barrio;
      if (!parent.barrioId) return null;

      return prisma.barrio.findUnique({
        where: { id: parent.barrioId },
      });
    },

    nucleo: async (parent: any, _args: unknown, { prisma }: Context) => {
      if (parent.nucleo) return parent.nucleo;
      if (!parent.nucleoId) return null;

      return prisma.nucleo.findUnique({
        where: { id: parent.nucleoId },
      });
    },
  },
};
