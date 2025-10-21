import { GraphQLError } from 'graphql';
import type { PrismaClient, RolUsuario } from '@prisma/client';

/**
 * Sistema de Permisos Granular
 *
 * ADMIN/CEA/MCA: Acceso completo sin restricciones
 * COLABORADOR:
 *   - Lectura: Solo su núcleo/barrio
 *   - Crear: Cualquier registro
 *   - Editar/Eliminar: Solo su núcleo
 * VISITANTE: Ver y crear visitas únicamente
 */

export interface UserWithPermissions {
  id: string;
  rol: RolUsuario;
  comunidadId: string;
  miembro?: {
    nucleoId: string | null;
    barrioId: string | null;
  } | null;
}

/**
 * Verifica si el usuario es administrador (ADMIN, CEA o MCA)
 */
export function isAdmin(rol: RolUsuario): boolean {
  return rol === 'ADMIN' || rol === 'CEA' || rol === 'MCA';
}

/**
 * Verifica si el usuario puede ver todos los registros
 */
export function canViewAll(rol: RolUsuario): boolean {
  return isAdmin(rol);
}

/**
 * Verifica si el usuario puede crear registros
 */
export function canCreate(rol: RolUsuario, entityType: string): boolean {
  // VISITANTE solo puede crear visitas
  if (rol === 'VISITANTE') {
    return entityType === 'visita';
  }

  // COLABORADOR puede crear cualquier cosa excepto barrios/núcleos
  if (rol === 'COLABORADOR') {
    return entityType !== 'barrio' && entityType !== 'nucleo';
  }

  // ADMIN/CEA/MCA pueden crear todo
  return isAdmin(rol);
}

/**
 * Verifica si el usuario puede editar/eliminar un registro específico
 */
export function canModify(
  usuario: UserWithPermissions,
  entityType: string,
  entityNucleoId?: string | null,
  _entityBarrioId?: string | null
): boolean {
  // ADMIN/CEA/MCA pueden modificar todo
  if (isAdmin(usuario.rol)) {
    return true;
  }

  // VISITANTE no puede modificar nada
  if (usuario.rol === 'VISITANTE') {
    return false;
  }

  // COLABORADOR puede modificar solo registros de su núcleo
  if (usuario.rol === 'COLABORADOR') {
    // Barrios y Núcleos solo ADMIN
    if (entityType === 'barrio' || entityType === 'nucleo') {
      return false;
    }

    // Si el COLABORADOR no tiene núcleo asignado, no puede modificar nada
    if (!usuario.miembro?.nucleoId) {
      return false;
    }

    // Verificar que el registro pertenezca al núcleo del COLABORADOR
    return entityNucleoId === usuario.miembro.nucleoId;
  }

  return false;
}

/**
 * Obtiene el usuario con información de permisos
 */
export async function getUserWithPermissions(
  prisma: PrismaClient,
  userId: string
): Promise<UserWithPermissions> {
  const usuario = await prisma.usuario.findUnique({
    where: { id: userId },
    include: {
      miembro: {
        select: {
          nucleoId: true,
          barrioId: true,
        },
      },
    },
  });

  if (!usuario) {
    throw new GraphQLError('Usuario no encontrado', {
      extensions: { code: 'NOT_FOUND' },
    });
  }

  return usuario;
}

/**
 * Construye filtros de lectura según permisos del usuario
 */
export function buildReadFilters(usuario: UserWithPermissions): any {
  // ADMIN/CEA/MCA ven todo
  if (isAdmin(usuario.rol)) {
    return {};
  }

  // COLABORADOR solo ve su núcleo
  if (usuario.rol === 'COLABORADOR' && usuario.miembro?.nucleoId) {
    return {
      nucleoId: usuario.miembro.nucleoId,
    };
  }

  // VISITANTE no puede ver registros CRUD (solo visitas)
  if (usuario.rol === 'VISITANTE') {
    return {
      id: 'no-access', // Filtro que no coincide con nada
    };
  }

  return {};
}

/**
 * Verifica permiso de creación y lanza error si no está autorizado
 */
export function requireCreatePermission(rol: RolUsuario, entityType: string): void {
  if (!canCreate(rol, entityType)) {
    throw new GraphQLError(
      `No tienes permisos para crear ${entityType}s`,
      { extensions: { code: 'FORBIDDEN' } }
    );
  }
}

/**
 * Verifica permiso de modificación y lanza error si no está autorizado
 */
export function requireModifyPermission(
  usuario: UserWithPermissions,
  entityType: string,
  entityNucleoId?: string | null,
  entityBarrioId?: string | null
): void {
  if (!canModify(usuario, entityType, entityNucleoId, entityBarrioId)) {
    throw new GraphQLError(
      `No tienes permisos para modificar este ${entityType}`,
      { extensions: { code: 'FORBIDDEN' } }
    );
  }
}

/**
 * Requiere que el usuario sea administrador
 */
export function requireAdmin(rol: RolUsuario): void {
  if (!isAdmin(rol)) {
    throw new GraphQLError(
      'Solo administradores (ADMIN, CEA, MCA) pueden realizar esta acción',
      { extensions: { code: 'FORBIDDEN' } }
    );
  }
}
