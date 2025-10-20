export const typeDefs = `#graphql
  # ============================================
  # TIPOS
  # ============================================

  type Comunidad {
    id: ID!
    nombre: String!
    descripcion: String
    activa: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  type Usuario {
    id: ID!
    email: String!
    nombre: String!
    apellidos: String
    rol: RolUsuario!
    activo: Boolean!
    mustChangePassword: Boolean!
    comunidad: Comunidad!
    createdAt: String!
    updatedAt: String!
  }

  enum RolUsuario {
    CEA
    MCA
    COLABORADOR
    VISITANTE
  }

  type Barrio {
    id: ID!
    nombre: String!
    descripcion: String
    activo: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  type Nucleo {
    id: ID!
    nombre: String!
    barrioId: ID!
    descripcion: String
    activo: Boolean!
    createdAt: String!
    updatedAt: String!
    # Relación
    barrio: Barrio!
  }

  type Familia {
    id: ID!
    nombre: String!
    direccion: String
    telefono: String
    email: String
    barrio: String
    barrioId: ID
    nucleoId: ID
    latitud: Float
    longitud: Float
    estatus: String!  # 'active' | 'inactive'
    activa: Boolean!
    miembroCount: Int!
    notas: String
    createdAt: String!
    updatedAt: String!
    # Relaciones
    barrioRel: Barrio
    nucleoRel: Nucleo
    miembros: [Miembro!]!
    visitas: [Visita!]!
  }

  type Miembro {
    id: ID!
    familiaId: ID
    usuarioId: ID
    nombre: String!
    apellidos: String

    # Ubicación (sincronizada con familia si está ligado)
    direccion: String
    barrioId: ID
    nucleoId: ID

    # Sistema Dual de Edad según MEM-003
    fechaNacimiento: String  # Si existe → edad exacta (no editable)
    edadAproximada: Int      # Si NO hay fechaNacimiento → edad aproximada (editable)
    edadCalculada: Int       # Campo calculado (edad exacta o aproximada + años transcurridos)
    fechaActualizacionEdad: String  # Fecha de última actualización manual

    telefono: String
    email: String

    # Roles
    rol: String!          # 'CEA' | 'COLABORADOR' | 'MIEMBRO' (rol en comunidad)
    rolFamiliar: String   # 'Padre' | 'Madre' | 'Hijo' | 'Hija' | 'Abuelo' | 'Abuela'
    parentesco: String    # Deprecated - usar rolFamiliar

    # Reuniones Devocionales (MEM-006, DEV-001, DEV-002)
    tieneDevocional: Boolean!
    devocionalDia: String           # 'Lunes' - 'Domingo'
    devocionalHora: String          # 'HH:mm'
    devocionalParticipantes: Int
    devocionalMiembros: [ID!]!      # Array de IDs de miembros acompañantes

    activo: Boolean!
    notas: String
    fechaRegistro: String!
    createdAt: String!
    updatedAt: String!

    # Relaciones
    familia: Familia
    usuario: Usuario
    barrio: Barrio
    nucleo: Nucleo
  }

  type Visita {
    id: ID!
    familiaId: ID!
    creadoPorId: ID!

    # BÁSICO - Fecha y Hora (Paso 3)
    visitDate: String!    # YYYY-MM-DD (sin timezone)
    visitTime: String!    # HH:mm

    # UBICACIÓN (Paso 1)
    barrioId: ID
    barrioOtro: String    # Si seleccionó "Otro"
    nucleoId: ID          # Solo si barrio = "Santa Mónica"

    # VISITADORES (Paso 4) - Array de IDs
    visitorUserIds: [ID!]!

    # TIPO Y ESTATUS (Paso 5)
    visitType: String!    # 'primera_visita' | 'visita_seguimiento' | 'no_se_pudo_realizar'
    visitStatus: String!  # 'programada' | 'realizada' | 'cancelada' (DERIVADO)

    # NO SE PUDO REALIZAR (Paso 5 - condicional)
    motivoNoVisita: String       # 'no_abrieron' | 'sin_tiempo' | 'otra'
    motivoNoVisitaOtra: String

    # ACTIVIDADES (Paso 5 - JSON)
    visitActivities: VisitActivities

    # MATERIALES (Paso 6 - JSON)
    materialDejado: MaterialDejado

    # SEGUIMIENTO (Paso 7)
    seguimientoVisita: Boolean!
    tipoSeguimiento: String              # 'por_agendar' | 'agendado'
    seguimientoFecha: String             # YYYY-MM-DD
    seguimientoHora: String              # HH:mm
    seguimientoActividadBasica: Boolean!
    seguimientoActividadBasicaEspecificar: String
    seguimientoNinguno: Boolean!

    # NOTAS (Paso 8)
    additionalNotes: String

    # LEGACY FIELDS (compatibilidad)
    fecha: String          # Deprecated - usar visitDate
    tipo: String           # Deprecated - usar visitType
    proposito: String
    tema: String
    asistentes: Int
    notas: String
    completada: Boolean!

    createdAt: String!
    updatedAt: String!

    # Relaciones
    familia: Familia!
    creadoPor: Usuario!
    barrio: Barrio
    nucleo: Nucleo
    visitadores: [Usuario!]!  # Resuelve visitorUserIds → objetos Usuario
  }

  # Tipos auxiliares para Visita
  type VisitActivities {
    conversacion_preocupaciones: Boolean
    oraciones: Boolean
    estudio_instituto: Boolean
    estudio_instituto_especificar: String
    otro_estudio: Boolean
    otro_estudio_especificar: String
    invitacion_actividad: Boolean
    invitacion_especificar: String
  }

  type MaterialDejado {
    libro_oraciones: Boolean
    otro: Boolean
    otro_especificar: String
  }

  # ============================================
  # METAS DEL COMITÉ - Según META-001 a META-011
  # ============================================

  type Meta {
    id: ID!
    comunidadId: ID!

    # Período
    trimestre: String!      # "Oct 2025 - Ene 2026"
    fechaInicio: String!    # YYYY-MM-DD
    fechaFin: String!       # YYYY-MM-DD

    # Metas numéricas (4 métricas principales)
    metaNucleos: Int!
    metaVisitas: Int!
    metaPersonasVisitando: Int!
    metaDevocionales: Int!

    # Estado calculado dinámicamente (no almacenado)
    estado: String!  # 'activa' | 'completada' | 'futura'

    # Progreso calculado (si está activa)
    progreso: MetaProgreso

    createdAt: String!
    updatedAt: String!

    # Relación
    comunidad: Comunidad!
  }

  # Progreso calculado de la meta activa
  type MetaProgreso {
    nucleosActuales: Int!
    visitasActuales: Int!
    personasVisitandoActuales: Int!
    devocionalesActuales: Int!

    nucleosPorcentaje: Float!
    visitasPorcentaje: Float!
    personasVisitandoPorcentaje: Float!
    devocionalesPorcentaje: Float!
  }

  type AuthPayload {
    token: String!
    user: Usuario!
  }

  type ClearDataResult {
    visitasEliminadas: Int!
    miembrosEliminados: Int!
    familiasEliminadas: Int!
    nucleosEliminados: Int!
    barriosEliminados: Int!
    metasEliminadas: Int!
    miembrosCreados: Int!
    message: String!
  }

  type CreateUsuarioFromMiembroResult {
    usuario: Usuario!
    passwordTemporal: String!
  }

  # ============================================
  # INPUTS
  # ============================================

  input LoginInput {
    email: String!
    password: String!
  }

  input ChangePasswordInput {
    currentPassword: String!
    newPassword: String!
  }

  # Familia Inputs
  input CreateFamiliaInput {
    nombre: String!
    direccion: String
    telefono: String
    email: String
    barrio: String
    barrioId: ID
    nucleoId: ID
    latitud: Float
    longitud: Float
    estatus: String  # 'active' | 'inactive'
    notas: String
  }

  input UpdateFamiliaInput {
    nombre: String
    direccion: String
    telefono: String
    email: String
    barrio: String
    barrioId: ID
    nucleoId: ID
    latitud: Float
    longitud: Float
    estatus: String
    activa: Boolean
    notas: String
    lastUpdatedAt: String  # OCC: timestamp para detectar conflictos
  }

  # Miembro Inputs
  input CreateMiembroInput {
    familiaId: ID
    usuarioId: ID
    nombre: String!
    apellidos: String
    direccion: String
    barrioId: ID
    nucleoId: ID
    fechaNacimiento: String
    edadAproximada: Int
    telefono: String
    email: String
    rol: String!  # 'CEA' | 'COLABORADOR' | 'MIEMBRO'
    rolFamiliar: String
    tieneDevocional: Boolean
    devocionalDia: String
    devocionalHora: String
    devocionalParticipantes: Int
    devocionalMiembros: [ID!]
    notas: String
  }

  input UpdateMiembroInput {
    familiaId: ID
    nombre: String
    apellidos: String
    direccion: String
    barrioId: ID
    nucleoId: ID
    fechaNacimiento: String
    edadAproximada: Int
    telefono: String
    email: String
    rol: String
    rolFamiliar: String
    tieneDevocional: Boolean
    devocionalDia: String
    devocionalHora: String
    devocionalParticipantes: Int
    devocionalMiembros: [ID!]
    activo: Boolean
    notas: String
    lastUpdatedAt: String  # OCC: timestamp para detectar conflictos
  }

  # Visita Inputs (Wizard de 8 pasos)
  input CreateVisitaInput {
    familiaId: ID!

    # Paso 3: Fecha y Hora
    visitDate: String!    # YYYY-MM-DD
    visitTime: String!    # HH:mm

    # Paso 1: Ubicación
    barrioId: ID
    barrioOtro: String
    nucleoId: ID

    # Paso 4: Visitadores
    visitorUserIds: [ID!]!

    # Paso 5: Tipo y Actividades
    visitType: String!    # 'primera_visita' | 'visita_seguimiento' | 'no_se_pudo_realizar'
    motivoNoVisita: String
    motivoNoVisitaOtra: String
    visitActivities: VisitActivitiesInput

    # Paso 6: Materiales
    materialDejado: MaterialDejadoInput

    # Paso 7: Seguimiento
    seguimientoVisita: Boolean
    tipoSeguimiento: String
    seguimientoFecha: String
    seguimientoHora: String
    seguimientoActividadBasica: Boolean
    seguimientoActividadBasicaEspecificar: String
    seguimientoNinguno: Boolean

    # Paso 8: Notas
    additionalNotes: String
  }

  input VisitActivitiesInput {
    conversacion_preocupaciones: Boolean
    oraciones: Boolean
    estudio_instituto: Boolean
    estudio_instituto_especificar: String
    otro_estudio: Boolean
    otro_estudio_especificar: String
    invitacion_actividad: Boolean
    invitacion_especificar: String
  }

  input MaterialDejadoInput {
    libro_oraciones: Boolean
    otro: Boolean
    otro_especificar: String
  }

  input UpdateVisitaInput {
    familiaId: ID
    visitDate: String
    visitTime: String
    barrioId: ID
    barrioOtro: String
    nucleoId: ID
    visitorUserIds: [ID!]
    visitType: String
    motivoNoVisita: String
    motivoNoVisitaOtra: String
    visitActivities: VisitActivitiesInput
    materialDejado: MaterialDejadoInput
    seguimientoVisita: Boolean
    tipoSeguimiento: String
    seguimientoFecha: String
    seguimientoHora: String
    seguimientoActividadBasica: Boolean
    seguimientoActividadBasicaEspecificar: String
    seguimientoNinguno: Boolean
    additionalNotes: String
    lastUpdatedAt: String  # OCC: timestamp para detectar conflictos
  }

  # Meta Inputs
  input CreateMetaInput {
    trimestre: String!      # "Oct 2025 - Ene 2026"
    fechaInicio: String!    # YYYY-MM-DD
    fechaFin: String!       # YYYY-MM-DD
    metaNucleos: Int!
    metaVisitas: Int!
    metaPersonasVisitando: Int!
    metaDevocionales: Int!
  }

  input UpdateMetaInput {
    trimestre: String
    fechaInicio: String
    fechaFin: String
    metaNucleos: Int
    metaVisitas: Int
    metaPersonasVisitando: Int
    metaDevocionales: Int
    lastUpdatedAt: String  # OCC: timestamp para detectar conflictos
  }

  # Barrio Inputs
  input CreateBarrioInput {
    nombre: String!
    descripcion: String
  }

  input UpdateBarrioInput {
    nombre: String
    descripcion: String
    activo: Boolean
    lastUpdatedAt: String  # OCC: timestamp para detectar conflictos
  }

  # Nucleo Inputs
  input CreateNucleoInput {
    nombre: String!
    barrioId: ID!
    descripcion: String
  }

  input UpdateNucleoInput {
    nombre: String
    barrioId: ID
    descripcion: String
    activo: Boolean
    lastUpdatedAt: String  # OCC: timestamp para detectar conflictos
  }

  input CreateUsuarioFromMiembroInput {
    miembroId: ID!
    rol: RolUsuario!
  }

  input RegenerarCredencialesInput {
    miembroId: ID!
  }

  # ============================================
  # TIMELINE EVENTS - Sistema de Auditoría
  # ============================================

  type TimelineEvent {
    id: ID!
    timestampUtc: String!
    actorId: ID!
    actorName: String!
    actorRole: RolUsuario!
    actionType: String!      # login, logout, create, update, delete, import, export
    entityType: String!      # User, Familia, Miembro, Visita, Meta, Barrio, Nucleo, System
    entityId: ID
    summary: String!         # Texto natural: "Tú has iniciado sesión"
    metadata: JSON
  }

  input TimelineFilters {
    actionTypes: [String!]   # Filtrar por tipos de acción
    entityTypes: [String!]   # Filtrar por tipos de entidad
    actorId: ID              # Filtrar por usuario específico
    startDate: String        # YYYY-MM-DD
    endDate: String          # YYYY-MM-DD
  }

  type TimelineEventsConnection {
    events: [TimelineEvent!]!
    hasMore: Boolean!
    cursor: String
  }

  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
  }

  # ============================================
  # QUERIES
  # ============================================

  type Query {
    # Usuarios
    me: Usuario
    usuarios: [Usuario!]!

    # Familias
    familias: [Familia!]!
    familia(id: ID!): Familia

    # Miembros
    miembros: [Miembro!]!
    miembro(id: ID!): Miembro
    miembrosConDevocional: [Miembro!]!  # Catálogo de Devocionales

    # Visitas
    visitas: [Visita!]!
    visita(id: ID!): Visita
    visitasPorCiclo(fechaInicio: String!, fechaFin: String!): [Visita!]!

    # Barrios y Núcleos
    barrios: [Barrio!]!
    barrio(id: ID!): Barrio
    nucleos: [Nucleo!]!
    nucleo(id: ID!): Nucleo

    # Metas
    metas: [Meta!]!
    meta(id: ID!): Meta
    metaActiva: Meta  # Meta del periodo actual

    # Timeline Events
    timelineEvents(
      filters: TimelineFilters
      limit: Int = 50
      cursor: String
    ): TimelineEventsConnection!
  }

  # ============================================
  # MUTATIONS
  # ============================================

  type Mutation {
    # Auth (básico sin MFA por ahora)
    login(input: LoginInput!): AuthPayload!
    changePassword(input: ChangePasswordInput!): Usuario!

    # Familias
    createFamilia(input: CreateFamiliaInput!): Familia!
    updateFamilia(id: ID!, input: UpdateFamiliaInput!): Familia!
    deleteFamilia(id: ID!): Boolean!

    # Miembros
    createMiembro(input: CreateMiembroInput!): Miembro!
    updateMiembro(id: ID!, input: UpdateMiembroInput!): Miembro!
    deleteMiembro(id: ID!): Boolean!

    # Visitas
    createVisita(input: CreateVisitaInput!): Visita!
    updateVisita(id: ID!, input: UpdateVisitaInput!): Visita!
    deleteVisita(id: ID!): Boolean!

    # Metas
    createMeta(input: CreateMetaInput!): Meta!
    updateMeta(id: ID!, input: UpdateMetaInput!): Meta!
    deleteMeta(id: ID!): Boolean!

    # Barrios
    createBarrio(input: CreateBarrioInput!): Barrio!
    updateBarrio(id: ID!, input: UpdateBarrioInput!): Barrio!
    deleteBarrio(id: ID!): Boolean!

    # Núcleos
    createNucleo(input: CreateNucleoInput!): Nucleo!
    updateNucleo(id: ID!, input: UpdateNucleoInput!): Nucleo!
    deleteNucleo(id: ID!): Boolean!

    # Utilidades
    clearAllData: ClearDataResult!

    # Gestión de Usuarios
    createUsuarioFromMiembro(input: CreateUsuarioFromMiembroInput!): CreateUsuarioFromMiembroResult!
    regenerarCredenciales(input: RegenerarCredencialesInput!): CreateUsuarioFromMiembroResult!
  }
`;
