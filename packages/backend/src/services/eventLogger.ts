import type { Context } from '../context';

export interface LogEventOptions {
  actionType: 'login' | 'logout' | 'create' | 'update' | 'delete' | 'import' | 'export';
  entityType: 'User' | 'Familia' | 'Miembro' | 'Visita' | 'Meta' | 'Barrio' | 'Nucleo' | 'System';
  entityId?: string;
  metadata?: Record<string, any>;
  barrioId?: string;
  nucleoId?: string;
}

/**
 * Servicio de logging de eventos para la timeline colaborativa
 * Registra automáticamente las acciones de los usuarios en el sistema
 */
export class EventLogger {
  /**
   * Registra un evento en la timeline
   * @param context Contexto de GraphQL con prisma y userId
   * @param options Opciones del evento a registrar
   * @returns Promise<void> - No falla si hay error, solo logea warning
   */
  static async logEvent(context: Context, options: LogEventOptions): Promise<void> {
    try {
      const { prisma, userId } = context;

      // Si no hay usuario autenticado, no registrar (excepto para login fallido)
      if (!userId) {
        console.warn('[EventLogger] No se puede registrar evento: usuario no autenticado');
        return;
      }

      // Obtener información del usuario
      const usuario = await prisma.usuario.findUnique({
        where: { id: userId },
        select: {
          id: true,
          nombre: true,
          apellidos: true,
          rol: true,
          comunidadId: true,
        },
      });

      if (!usuario) {
        console.warn('[EventLogger] Usuario no encontrado:', userId);
        return;
      }

      const actorName = `${usuario.nombre}${usuario.apellidos ? ' ' + usuario.apellidos : ''}`;

      // Generar summary basado en la acción
      const summary = EventLogger.generateSummary({
        actorName,
        actionType: options.actionType,
        entityType: options.entityType,
        metadata: options.metadata,
      });

      // Crear el evento en la base de datos
      await prisma.timelineEvent.create({
        data: {
          actorId: usuario.id,
          actorName,
          actorRole: usuario.rol,
          actionType: options.actionType,
          entityType: options.entityType,
          entityId: options.entityId || null,
          summary,
          metadata: options.metadata ? JSON.parse(JSON.stringify(options.metadata)) : null,
          comunidadId: usuario.comunidadId,
          barrioId: options.barrioId || null,
          nucleoId: options.nucleoId || null,
        },
      });

      console.log(`[EventLogger] Evento registrado: ${summary}`);
    } catch (error) {
      // No fallar la operación principal si falla el logging
      console.error('[EventLogger] Error al registrar evento:', error);
    }
  }

  /**
   * Genera un texto natural en español para el summary
   * @param params Parámetros para generar el summary
   * @returns string con el texto natural
   */
  private static generateSummary(params: {
    actorName: string;
    actionType: string;
    entityType: string;
    metadata?: Record<string, any>;
  }): string {
    const { actorName, actionType, entityType, metadata } = params;

    // Artículos y nombres en español
    const entityNames: Record<string, { singular: string; plural: string; article: string }> = {
      User: { singular: 'usuario', plural: 'usuarios', article: 'el' },
      Familia: { singular: 'familia', plural: 'familias', article: 'la' },
      Miembro: { singular: 'miembro', plural: 'miembros', article: 'el' },
      Visita: { singular: 'visita', plural: 'visitas', article: 'la' },
      Meta: { singular: 'meta', plural: 'metas', article: 'la' },
      Barrio: { singular: 'barrio', plural: 'barrios', article: 'el' },
      Nucleo: { singular: 'núcleo', plural: 'núcleos', article: 'el' },
      System: { singular: 'sistema', plural: 'sistemas', article: 'el' },
    };

    const entity = entityNames[entityType] || { singular: entityType.toLowerCase(), plural: entityType.toLowerCase(), article: 'el' };

    // Construcción del texto según el tipo de acción
    switch (actionType) {
      case 'login':
        return `${actorName} ha iniciado sesión`;

      case 'logout':
        return `${actorName} ha cerrado sesión`;

      case 'create': {
        const nombre = metadata?.nombre || metadata?.email;
        if (nombre) {
          return `${actorName} ha creado ${entity.article} ${entity.singular} "${nombre}"`;
        }
        return `${actorName} ha creado ${entity.article} ${entity.singular}`;
      }

      case 'update': {
        const nombre = metadata?.nombre || metadata?.email;
        const changedFields = metadata?.changedFields;

        if (nombre && changedFields && changedFields.length > 0) {
          const fieldsText = changedFields.join(', ');
          return `${actorName} ha editado ${entity.article} ${entity.singular} "${nombre}" (${fieldsText})`;
        }

        if (nombre) {
          return `${actorName} ha editado ${entity.article} ${entity.singular} "${nombre}"`;
        }

        return `${actorName} ha editado ${entity.article} ${entity.singular}`;
      }

      case 'delete': {
        const nombre = metadata?.nombre || metadata?.email;
        const count = metadata?.count;

        if (count && count > 1) {
          return `${actorName} ha eliminado ${count} ${entity.plural}`;
        }

        if (nombre) {
          return `${actorName} ha eliminado ${entity.article} ${entity.singular} "${nombre}"`;
        }

        return `${actorName} ha eliminado ${entity.article} ${entity.singular}`;
      }

      case 'import': {
        const fileName = metadata?.fileName;
        const recordCount = metadata?.recordCount;

        if (fileName && recordCount) {
          return `${actorName} ha importado "${fileName}" (${recordCount} registros)`;
        }

        if (fileName) {
          return `${actorName} ha importado "${fileName}"`;
        }

        return `${actorName} ha importado datos`;
      }

      case 'export': {
        const fileName = metadata?.fileName;
        const recordCount = metadata?.recordCount;

        if (fileName && recordCount) {
          return `${actorName} ha exportado "${fileName}" (${recordCount} registros)`;
        }

        if (fileName) {
          return `${actorName} ha exportado "${fileName}"`;
        }

        return `${actorName} ha exportado datos`;
      }

      default:
        return `${actorName} ha realizado una acción en ${entity.article} ${entity.singular}`;
    }
  }

  /**
   * Personaliza el summary para el usuario actual (reemplaza nombre por "Tú")
   * @param summary Summary original
   * @param actorId ID del actor del evento
   * @param currentUserId ID del usuario actual
   * @returns string con summary personalizado
   */
  static personalizeSummary(summary: string, actorId: string, currentUserId: string): string {
    if (actorId === currentUserId) {
      // Reemplazar el nombre del usuario por "Tú"
      // Buscar el patrón "Nombre ha..." y reemplazarlo por "Tú has..."
      return summary.replace(/^(.+?)\s+ha\s+/, 'Tú has ');
    }
    return summary;
  }
}
