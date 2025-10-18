import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');
  console.log('');

  // ============================================
  // PASO 1: LIMPIAR TODA LA DATA
  // ============================================
  console.log('🗑️  Limpiando toda la data existente...');

  // Eliminar en el orden correcto para evitar problemas de foreign keys
  const visitasDeleted = await prisma.visita.deleteMany({});
  console.log(`   ✓ ${visitasDeleted.count} visitas eliminadas`);

  const miembrosDeleted = await prisma.miembro.deleteMany({});
  console.log(`   ✓ ${miembrosDeleted.count} miembros eliminados`);

  const familiasDeleted = await prisma.familia.deleteMany({});
  console.log(`   ✓ ${familiasDeleted.count} familias eliminadas`);

  const nucleosDeleted = await prisma.nucleo.deleteMany({});
  console.log(`   ✓ ${nucleosDeleted.count} núcleos eliminados`);

  const barriosDeleted = await prisma.barrio.deleteMany({});
  console.log(`   ✓ ${barriosDeleted.count} barrios eliminados`);

  const metasDeleted = await prisma.meta.deleteMany({});
  console.log(`   ✓ ${metasDeleted.count} metas eliminadas`);

  // Eliminar usuarios (excepto el que vamos a crear)
  const usuariosDeleted = await prisma.usuario.deleteMany({
    where: {
      email: {
        not: 'nataliaov23@gmail.com',
      },
    },
  });
  console.log(`   ✓ ${usuariosDeleted.count} usuarios eliminados`);

  console.log('');
  console.log('✅ Data limpiada exitosamente');
  console.log('');

  // ============================================
  // PASO 2: CREAR COMUNIDAD
  // ============================================
  const comunidad = await prisma.comunidad.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      nombre: 'Comunidad Bahá\'í Querétaro',
      descripcion: 'Comunidad de prueba para desarrollo',
      activa: true,
    },
  });
  console.log('✅ Comunidad creada:', comunidad.nombre);

  // ============================================
  // PASO 3: CREAR USUARIO CEA (ADMINISTRADOR)
  // ============================================
  const hashedPassword = await bcrypt.hash('QBQ9gUQTF6JhgB', 10);

  const usuarioCEA = await prisma.usuario.upsert({
    where: { email: 'nataliaov23@gmail.com' },
    update: {
      password: hashedPassword,
      nombre: 'Natalia',
      apellidos: 'Olguín Villalobos',
      rol: 'CEA',
      comunidadId: comunidad.id,
      activo: true,
    },
    create: {
      email: 'nataliaov23@gmail.com',
      password: hashedPassword,
      nombre: 'Natalia',
      apellidos: 'Olguín Villalobos',
      rol: 'CEA',
      comunidadId: comunidad.id,
      activo: true,
    },
  });
  console.log('✅ Usuario CEA creado:', usuarioCEA.email);

  // ============================================
  // PASO 4: CREAR MIEMBRO PARA USUARIO CEA
  // ============================================
  const miembroCEA = await prisma.miembro.upsert({
    where: { usuarioId: usuarioCEA.id },
    update: {
      nombre: 'Natalia',
      apellidos: 'Olguín Villalobos',
      email: usuarioCEA.email,
      rol: 'CEA',
      tieneDevocional: false,
      devocionalMiembros: [],
      activo: true,
    },
    create: {
      usuarioId: usuarioCEA.id,
      nombre: 'Natalia',
      apellidos: 'Olguín Villalobos',
      email: usuarioCEA.email,
      rol: 'CEA',
      tieneDevocional: false,
      devocionalMiembros: [],
      activo: true,
      fechaRegistro: new Date(),
    },
  });
  console.log('✅ Miembro CEA creado:', miembroCEA.nombre);

  // ============================================
  // RESUMEN FINAL
  // ============================================
  console.log('');
  console.log('🎉 Seed completed successfully!');
  console.log('');
  console.log('📝 Usuario disponible:');
  console.log('   Email:    nataliaov23@gmail.com');
  console.log('   Password: QBQ9gUQTF6JhgB');
  console.log('   Rol:      CEA (Administrador)');
  console.log('');
  console.log('📊 Estado de la base de datos:');
  console.log('   ✓ 1 Comunidad');
  console.log('   ✓ 1 Usuario CEA');
  console.log('   ✓ 1 Miembro (Natalia)');
  console.log('   ✓ 0 Barrios');
  console.log('   ✓ 0 Núcleos');
  console.log('   ✓ 0 Familias');
  console.log('   ✓ 0 Visitas');
  console.log('   ✓ 0 Metas');
  console.log('');
  console.log('💡 La base de datos está lista para importar datos desde Excel');
  console.log('   o para comenzar a agregar registros manualmente.');
  console.log('');
}

main()
  .catch(e => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
