"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Seeding database...');
    // Hash password for all users
    const hashedPassword = await bcrypt_1.default.hash('password123', 10);
    // 1. Crear Comunidad
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
    // 2. Crear Usuarios
    const usuarioCEA = await prisma.usuario.upsert({
        where: { email: 'cea@devocionales.local' },
        update: {},
        create: {
            email: 'cea@devocionales.local',
            password: hashedPassword,
            nombre: 'Juan',
            apellidos: 'Pérez García',
            rol: 'CEA',
            comunidadId: comunidad.id,
            activo: true,
        },
    });
    console.log('✅ Usuario CEA creado:', usuarioCEA.email);
    const usuarioColaborador = await prisma.usuario.upsert({
        where: { email: 'colaborador@devocionales.local' },
        update: {},
        create: {
            email: 'colaborador@devocionales.local',
            password: hashedPassword,
            nombre: 'María',
            apellidos: 'López Sánchez',
            rol: 'COLABORADOR',
            comunidadId: comunidad.id,
            activo: true,
        },
    });
    console.log('✅ Usuario COLABORADOR creado:', usuarioColaborador.email);
    const usuarioVisitante = await prisma.usuario.upsert({
        where: { email: 'visitante@devocionales.local' },
        update: {},
        create: {
            email: 'visitante@devocionales.local',
            password: hashedPassword,
            nombre: 'Pedro',
            apellidos: 'Martínez Rodríguez',
            rol: 'VISITANTE',
            comunidadId: comunidad.id,
            activo: true,
        },
    });
    console.log('✅ Usuario VISITANTE creado:', usuarioVisitante.email);
    // 3. Crear Barrios
    const barrioCentro = await prisma.barrio.upsert({
        where: { id: '00000000-0000-0000-0000-000000000010' },
        update: {},
        create: {
            id: '00000000-0000-0000-0000-000000000010',
            nombre: 'Centro',
            descripcion: 'Barrio Centro de la ciudad',
            comunidadId: comunidad.id,
            activo: true,
        },
    });
    const barrioNorte = await prisma.barrio.upsert({
        where: { id: '00000000-0000-0000-0000-000000000011' },
        update: {},
        create: {
            id: '00000000-0000-0000-0000-000000000011',
            nombre: 'Norte',
            descripcion: 'Barrio Norte de la ciudad',
            comunidadId: comunidad.id,
            activo: true,
        },
    });
    const barrioSantaMonica = await prisma.barrio.upsert({
        where: { id: '00000000-0000-0000-0000-000000000012' },
        update: {},
        create: {
            id: '00000000-0000-0000-0000-000000000012',
            nombre: 'Santa Mónica',
            descripcion: 'Barrio Santa Mónica con núcleos',
            comunidadId: comunidad.id,
            activo: true,
        },
    });
    console.log('✅ Barrios creados');
    // 4. Crear Núcleos
    const nucleoA = await prisma.nucleo.upsert({
        where: { id: '00000000-0000-0000-0000-000000000020' },
        update: {},
        create: {
            id: '00000000-0000-0000-0000-000000000020',
            nombre: 'Núcleo A',
            descripcion: 'Primer núcleo de la comunidad',
            comunidadId: comunidad.id,
            activo: true,
        },
    });
    const nucleoB = await prisma.nucleo.upsert({
        where: { id: '00000000-0000-0000-0000-000000000021' },
        update: {},
        create: {
            id: '00000000-0000-0000-0000-000000000021',
            nombre: 'Núcleo B',
            descripcion: 'Segundo núcleo de la comunidad',
            comunidadId: comunidad.id,
            activo: true,
        },
    });
    console.log('✅ Núcleos creados');
    // 5. Crear Familias (con nuevos campos)
    const familia1 = await prisma.familia.upsert({
        where: { id: '00000000-0000-0000-0000-000000000030' },
        update: {},
        create: {
            id: '00000000-0000-0000-0000-000000000030',
            nombre: 'Familia González',
            direccion: 'Calle Principal #123',
            telefono: '442-123-4567',
            email: 'gonzalez@example.com',
            barrio: 'Centro',
            barrioId: barrioCentro.id,
            nucleoId: nucleoA.id,
            latitud: 20.5888,
            longitud: -100.3899,
            comunidadId: comunidad.id,
            estatus: 'active',
            activa: true,
            miembroCount: 3,
            notas: 'Familia muy receptiva',
        },
    });
    const familia2 = await prisma.familia.upsert({
        where: { id: '00000000-0000-0000-0000-000000000031' },
        update: {},
        create: {
            id: '00000000-0000-0000-0000-000000000031',
            nombre: 'Familia Ramírez',
            direccion: 'Avenida Norte #456',
            telefono: '442-234-5678',
            barrio: 'Norte',
            barrioId: barrioNorte.id,
            nucleoId: nucleoB.id,
            latitud: 20.5900,
            longitud: -100.3850,
            comunidadId: comunidad.id,
            estatus: 'active',
            activa: true,
            miembroCount: 0,
        },
    });
    const familia3 = await prisma.familia.upsert({
        where: { id: '00000000-0000-0000-0000-000000000032' },
        update: {},
        create: {
            id: '00000000-0000-0000-0000-000000000032',
            nombre: 'Familia Hernández',
            direccion: 'Calle Secundaria #789',
            telefono: '442-345-6789',
            barrio: 'Centro',
            barrioId: barrioCentro.id,
            nucleoId: nucleoA.id,
            comunidadId: comunidad.id,
            estatus: 'active',
            activa: true,
            miembroCount: 0,
        },
    });
    console.log('✅ Familias creadas');
    // 6. Crear Miembros (con nuevos campos incluyendo devocionales)
    await prisma.miembro.upsert({
        where: { id: '00000000-0000-0000-0000-000000000040' },
        update: {},
        create: {
            id: '00000000-0000-0000-0000-000000000040',
            nombre: 'Roberto',
            apellidos: 'González Pérez',
            fechaNacimiento: new Date('1975-05-15'),
            telefono: '442-123-4567',
            direccion: 'Calle Principal #123',
            barrioId: barrioCentro.id,
            nucleoId: nucleoA.id,
            rol: 'COLABORADOR',
            rolFamiliar: 'Padre',
            familiaId: familia1.id,
            activo: true,
            // Tiene reunión devocional
            tieneDevocional: true,
            devocionalDia: 'Jueves',
            devocionalHora: '19:00',
            devocionalParticipantes: 5,
            devocionalMiembros: ['00000000-0000-0000-0000-000000000041'], // Ana lo acompaña
        },
    });
    await prisma.miembro.upsert({
        where: { id: '00000000-0000-0000-0000-000000000041' },
        update: {},
        create: {
            id: '00000000-0000-0000-0000-000000000041',
            nombre: 'Ana',
            apellidos: 'González López',
            fechaNacimiento: new Date('1978-08-22'),
            telefono: '442-123-4567',
            direccion: 'Calle Principal #123',
            barrioId: barrioCentro.id,
            nucleoId: nucleoA.id,
            rol: 'MIEMBRO',
            rolFamiliar: 'Madre',
            familiaId: familia1.id,
            activo: true,
        },
    });
    await prisma.miembro.upsert({
        where: { id: '00000000-0000-0000-0000-000000000042' },
        update: {},
        create: {
            id: '00000000-0000-0000-0000-000000000042',
            nombre: 'Carlos',
            apellidos: 'González González',
            fechaNacimiento: new Date('2005-03-10'),
            direccion: 'Calle Principal #123',
            barrioId: barrioCentro.id,
            nucleoId: nucleoA.id,
            rol: 'MIEMBRO',
            rolFamiliar: 'Hijo',
            familiaId: familia1.id,
            activo: true,
        },
    });
    // Miembro sin fecha de nacimiento (usa edad aproximada)
    await prisma.miembro.upsert({
        where: { id: '00000000-0000-0000-0000-000000000043' },
        update: {},
        create: {
            id: '00000000-0000-0000-0000-000000000043',
            nombre: 'Laura',
            apellidos: 'Ramírez Torres',
            edadAproximada: 45,
            fechaActualizacionEdad: new Date(),
            telefono: '442-234-5678',
            direccion: 'Avenida Norte #456',
            barrioId: barrioNorte.id,
            nucleoId: nucleoB.id,
            rol: 'MIEMBRO',
            familiaId: familia2.id,
            activo: true,
        },
    });
    console.log('✅ Miembros creados');
    // 7. Crear Visitas (con estructura completa según wizard)
    await prisma.visita.upsert({
        where: { id: '00000000-0000-0000-0000-000000000050' },
        update: {},
        create: {
            id: '00000000-0000-0000-0000-000000000050',
            familiaId: familia1.id,
            creadoPorId: usuarioColaborador.id,
            // Nuevos campos requeridos
            visitDate: '2024-10-01',
            visitTime: '18:00',
            visitType: 'primera_visita',
            visitStatus: 'realizada',
            barrioId: barrioCentro.id,
            nucleoId: nucleoA.id,
            visitorUserIds: ['00000000-0000-0000-0000-000000000040'], // Roberto
            // Actividades (JSON)
            visitActivities: {
                conversacion_preocupaciones: true,
                oraciones: true,
                estudio_instituto: false,
                estudio_instituto_especificar: null,
                otro_estudio: false,
                otro_estudio_especificar: null,
                invitacion_actividad: true,
                invitacion_especificar: 'Reunión devocional del jueves',
            },
            // Material dejado (JSON)
            materialDejado: {
                libro_oraciones: true,
                otro: false,
                otro_especificar: null,
            },
            // Seguimiento
            seguimientoVisita: true,
            tipoSeguimiento: 'agendado',
            seguimientoFecha: '2024-10-08',
            seguimientoHora: '18:00',
            additionalNotes: 'Muy buena recepción. Familia interesada en participar.',
            // Legacy fields (compatibilidad)
            proposito: 'Primera visita a la familia',
            tema: 'El amor de Dios',
            asistentes: 3,
            completada: true,
        },
    });
    await prisma.visita.upsert({
        where: { id: '00000000-0000-0000-0000-000000000051' },
        update: {},
        create: {
            id: '00000000-0000-0000-0000-000000000051',
            familiaId: familia1.id,
            creadoPorId: usuarioColaborador.id,
            visitDate: '2024-10-08',
            visitTime: '18:00',
            visitType: 'visita_seguimiento',
            visitStatus: 'realizada',
            barrioId: barrioCentro.id,
            nucleoId: nucleoA.id,
            visitorUserIds: ['00000000-0000-0000-0000-000000000040', '00000000-0000-0000-0000-000000000041'], // Roberto y Ana
            visitActivities: {
                conversacion_preocupaciones: true,
                oraciones: true,
                estudio_instituto: true,
                estudio_instituto_especificar: 'Ruhi Libro 1',
                otro_estudio: false,
                otro_estudio_especificar: null,
                invitacion_actividad: false,
                invitacion_especificar: null,
            },
            materialDejado: {
                libro_oraciones: false,
                otro: true,
                otro_especificar: 'Ruhi Libro 1',
            },
            seguimientoActividadBasica: true,
            seguimientoActividadBasicaEspecificar: 'Iniciar estudio del Ruhi Libro 1',
            additionalNotes: 'Familia muy receptiva al estudio.',
            proposito: 'Seguimiento de visita anterior',
            tema: 'La oración',
            asistentes: 2,
            completada: true,
        },
    });
    await prisma.visita.upsert({
        where: { id: '00000000-0000-0000-0000-000000000052' },
        update: {},
        create: {
            id: '00000000-0000-0000-0000-000000000052',
            familiaId: familia2.id,
            creadoPorId: usuarioVisitante.id,
            visitDate: '2025-10-20',
            visitTime: '17:00',
            visitType: 'primera_visita',
            visitStatus: 'programada',
            barrioId: barrioNorte.id,
            nucleoId: nucleoB.id,
            visitorUserIds: [],
            additionalNotes: 'Primera visita programada',
            proposito: 'Presentar el evangelio',
            completada: false,
        },
    });
    // Visita que no se pudo realizar
    await prisma.visita.upsert({
        where: { id: '00000000-0000-0000-0000-000000000053' },
        update: {},
        create: {
            id: '00000000-0000-0000-0000-000000000053',
            familiaId: familia3.id,
            creadoPorId: usuarioVisitante.id,
            visitDate: '2024-10-05',
            visitTime: '16:00',
            visitType: 'no_se_pudo_realizar',
            visitStatus: 'cancelada',
            barrioId: barrioCentro.id,
            nucleoId: nucleoA.id,
            visitorUserIds: ['00000000-0000-0000-0000-000000000040'],
            motivoNoVisita: 'no_abrieron',
            seguimientoVisita: true,
            tipoSeguimiento: 'por_agendar',
            additionalNotes: 'Intentar en otro horario',
        },
    });
    console.log('✅ Visitas creadas');
    // 8. Crear Meta del Comité (trimestre actual)
    await prisma.meta.upsert({
        where: { id: '00000000-0000-0000-0000-000000000060' },
        update: {},
        create: {
            id: '00000000-0000-0000-0000-000000000060',
            comunidadId: comunidad.id,
            trimestre: 'Oct 2024 - Ene 2025',
            fechaInicio: '2024-10-21',
            fechaFin: '2025-01-20',
            metaNucleos: 12,
            metaVisitas: 200,
            metaPersonasVisitando: 27,
            metaDevocionales: 60,
        },
    });
    console.log('✅ Meta del comité creada');
    console.log('');
    console.log('🎉 Seed completed successfully!');
    console.log('');
    console.log('📝 Usuarios de prueba:');
    console.log('   CEA:         cea@devocionales.local / password123');
    console.log('   COLABORADOR: colaborador@devocionales.local / password123');
    console.log('   VISITANTE:   visitante@devocionales.local / password123');
    console.log('');
    console.log('📊 Datos creados:');
    console.log('   - 1 Comunidad');
    console.log('   - 3 Usuarios (CEA, COLABORADOR, VISITANTE)');
    console.log('   - 3 Barrios (Centro, Norte, Santa Mónica)');
    console.log('   - 2 Núcleos');
    console.log('   - 3 Familias');
    console.log('   - 4 Miembros (1 con devocional, 1 con edad aproximada)');
    console.log('   - 4 Visitas (realizada, seguimiento, programada, cancelada)');
    console.log('   - 1 Meta del comité (trimestre actual)');
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
//# sourceMappingURL=seed.js.map