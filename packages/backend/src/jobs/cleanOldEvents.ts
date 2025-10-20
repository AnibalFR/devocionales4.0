import { prisma } from '../context';

/**
 * Job para limpiar eventos de timeline mayores a 90 días
 * Ejecutar con: pnpm run clean:events
 */
async function cleanOldEvents() {
  try {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const result = await prisma.timelineEvent.deleteMany({
      where: {
        timestampUtc: {
          lt: ninetyDaysAgo,
        },
      },
    });

    console.log(`[CleanOldEvents] Eliminados ${result.count} eventos antiguos (> 90 días)`);
    return result.count;
  } catch (error) {
    console.error('[CleanOldEvents] Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  cleanOldEvents()
    .then((count) => {
      console.log(`Proceso completado. ${count} eventos eliminados.`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error en limpieza:', error);
      process.exit(1);
    });
}

export { cleanOldEvents };
