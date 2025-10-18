# Reglas de Negocio: Catálogo de Miembros

**Fecha de creación**: 14 de octubre de 2025
**Versión**: 4.0
**Vista**: MiembrosPage
**Estado**: Implementado ⚠️ (Funcional pero incompleto)

---

## 📋 Índice

1. [Descripción General](#descripción-general)
2. [Reglas de Negocio](#reglas-de-negocio)
3. [Modelo de Datos](#modelo-de-datos)
4. [Operaciones CRUD](#operaciones-crud)
5. [Funcionalidad Faltante](#funcionalidad-faltante)
6. [Referencias de Código](#referencias-de-código)

---

## Descripción General

### ¿Qué es un Miembro?

Un **miembro** es una persona que forma parte de la comunidad religiosa. Los miembros pueden:
- Pertenecer o no a una familia registrada
- Tener roles específicos (CEA, Colaborador, Miembro)
- Organizar reuniones devocionales semanales
- Estar asignados a barrios y opcionalmente a núcleos
- Tener información de contacto y datos personales

### Características Principales

- **Jerarquía**: Comunidad → Barrio → Núcleo → Familia → **Miembro**
- **Relaciones**: Puede estar ligado a una familia (opcional)
- **Sistema dual de edad**: Fecha de nacimiento exacta o edad aproximada calculada
- **Editabilidad**: Edición inline de la mayoría de campos
- **Persistencia**: PostgreSQL vía GraphQL

---

## Reglas de Negocio

### MEM-001: Creación de Nuevo Miembro
**Estado**: ✅ Implementado
**Prioridad**: CRÍTICA
**Test ID**: `test-mem-001`

**Descripción**:
Al crear un nuevo miembro, debe asignarse un barrio obligatorio. Los miembros aparecen al principio de la lista (más recientes primero).

**Reglas**:
1. **Validación de barrios**: Antes de crear, verificar que existan barrios
2. **Alert si no hay barrios**: "⚠ Primero debes crear al menos un barrio..."
3. **Asignación automática**: Se asigna el primer barrio del catálogo (`barrios[0]`)
4. **Núcleo opcional**: Por defecto `null` (no es obligatorio)
5. **Ordenamiento**: Los nuevos miembros aparecen primero (ordenamiento por fecha descendente)

**Implementación Frontend**:
```typescript
// /packages/web/src/pages/MiembrosPage.tsx:118-139
const handleNuevoMiembro = async () => {
  // MEM-001: Validación de barrios al crear nuevo miembro
  if (barrios.length === 0) {
    alert('⚠ Primero debes crear al menos un barrio.\n\nVe al Catálogo de Barrios...');
    return;
  }

  await createMiembro({
    variables: {
      input: {
        nombre: 'Nuevo Miembro',
        rol: 'MIEMBRO',
        barrioId: barrios[0].id, // Asignar primer barrio automáticamente
        tieneDevocional: false,
      },
    },
  });
};
```

**Implementación Backend**:
```typescript
// /packages/backend/src/resolvers/miembro.resolvers.ts:153-198
createMiembro: async (_, { input }, { prisma, userId }) => {
  const data: any = {
    ...input,
    activo: true,
    fechaRegistro: new Date(),
  };

  const miembro = await prisma.miembro.create({
    data,
    include: { familia: true, barrio: true, nucleo: true },
  });

  // Actualizar miembroCount si está ligado a familia
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
}
```

**Query con ordenamiento**:
```typescript
// Backend línea 100
return prisma.miembro.findMany({
  where: { activo: true },
  orderBy: { fechaRegistro: 'desc' }, // Más recientes primero
});
```

**Casos de Uso**:
- Usuario CEA registra nuevos miembros de la comunidad
- Colaborador agrega miembros a su familia
- Setup inicial de comunidad nueva

---

### MEM-002: Ordenamiento por Defecto
**Estado**: ✅ Implementado
**Prioridad**: Media
**Test ID**: `test-mem-002`

**Descripción**:
Los miembros se muestran ordenados por fecha de registro (más recientes primero) por defecto.

**Reglas**:
1. **Ordenamiento por defecto**: `ordenamiento = 'fecha'`
2. **Orden descendente**: `fechaB - fechaA` (más nuevo primero)
3. **Dropdown selecciona "Fecha de Registro"** como opción inicial
4. **Opciones adicionales**: Nombre (A-Z), Edad (mayor a menor)

**Implementación**:
```typescript
// Frontend: MiembrosPage.tsx:103
const [ordenamiento, setOrdenamiento] = useState('fecha'); // Default

// Frontend: Lógica de ordenamiento (líneas 158-163)
if (ordenamiento === 'fecha') {
  resultado.sort((a: any, b: any) => {
    const fechaA = new Date(a.fechaRegistro).getTime();
    const fechaB = new Date(b.fechaRegistro).getTime();
    return fechaB - fechaA; // Descendente
  });
} else if (ordenamiento === 'nombre') {
  resultado.sort((a: any, b: any) => a.nombre.localeCompare(b.nombre));
} else if (ordenamiento === 'edad') {
  resultado.sort((a: any, b: any) => (b.edadCalculada || 0) - (a.edadCalculada || 0));
}
```

**Dropdown UI** (líneas 332-343):
```typescript
<select value={ordenamiento} onChange={(e) => setOrdenamiento(e.target.value)}>
  <option value="fecha">Fecha de Registro</option>
  <option value="nombre">Nombre (A-Z)</option>
  <option value="edad">Edad (mayor a menor)</option>
</select>
```

---

### MEM-003: Cálculo de Edad (Sistema Dual)
**Estado**: ✅ Implementado (Completo)
**Prioridad**: CRÍTICA
**Test ID**: `test-mem-003`

**Descripción**:
La edad se calcula automáticamente de forma dinámica basándose en los datos disponibles. Implementa un sistema dual sofisticado.

**Sistema Dual**:

#### **Modo 1: Con Fecha de Nacimiento (Edad Exacta)**
- Campo **NO editable** (fondo gris)
- Edad calculada automáticamente considerando año, mes y día
- Se actualiza automáticamente cada año
- Tooltip: "Edad calculada desde fecha de nacimiento (no editable)"

#### **Modo 2: Sin Fecha de Nacimiento (Edad Aproximada)**
- Campo **SIEMPRE editable**
- Edad calculada = `edad_aproximada` + años transcurridos desde `fecha_actualizacion_edad`
- Al editar la edad, se guarda automáticamente la `fechaActualizacionEdad`
- La edad "envejece" automáticamente cada año
- Tooltip informativo muestra: edad guardada, fecha de actualización, y edad actual calculada

**Implementación Backend**:
```typescript
// /packages/backend/src/resolvers/miembro.resolvers.ts:48-81
function calcularEdad(miembro: any): number | null {
  // Modo 1: Si tiene fechaNacimiento → edad exacta
  if (miembro.fechaNacimiento) {
    const hoy = new Date();
    const nacimiento = new Date(miembro.fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mesActual = hoy.getMonth();
    const mesNacimiento = nacimiento.getMonth();

    // Ajustar si no ha cumplido años este año
    if (mesActual < mesNacimiento ||
        (mesActual === mesNacimiento && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }

    return edad;
  }

  // Modo 2: Si tiene edad aproximada → calcular con años transcurridos
  if (miembro.edadAproximada !== null && miembro.edadAproximada !== undefined) {
    if (!miembro.fechaActualizacionEdad) {
      return miembro.edadAproximada; // Backward compatibility
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
```

**Campo Calculado en GraphQL** (líneas 302-305):
```typescript
Miembro: {
  edadCalculada: (parent: any) => {
    return calcularEdad(parent);
  },
}
```

**Implementación Frontend**:
```typescript
// MiembrosPage.tsx:218-264
const renderEdad = (miembro: any) => {
  // Si tiene fecha de nacimiento, edad NO es editable
  if (miembro.fechaNacimiento) {
    return (
      <td className="bg-gray-50 text-gray-900"
          title="Edad calculada desde fecha de nacimiento (no editable)">
        {miembro.edadCalculada || '-'}
      </td>
    );
  }

  // Si NO tiene fecha de nacimiento, es editable
  if (editing.miembroId === miembro.id && editing.field === 'edadAproximada') {
    return (
      <td>
        <input
          type="number"
          min="0"
          max="120"
          value={editing.value || ''}
          onChange={(e) => setEditing({ ...editing, value: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === 'Enter') saveEdit(miembro.id);
            if (e.key === 'Escape') cancelEdit();
          }}
          onBlur={() => saveEdit(miembro.id)}
          autoFocus
        />
      </td>
    );
  }

  const tooltipText = miembro.edadAproximada
    ? `Edad aproximada: ${miembro.edadAproximada} (actualizada ${miembro.fechaActualizacionEdad || 'nunca'})\nEdad calculada actual: ${miembro.edadCalculada || 0}`
    : 'Click para ingresar edad aproximada';

  return (
    <td
      className="cursor-pointer hover:bg-gray-100"
      onClick={() => startEdit(miembro.id, 'edadAproximada', miembro.edadAproximada || '')}
      title={tooltipText}
    >
      {miembro.edadCalculada || '-'}
    </td>
  );
};
```

**Actualización Automática de Fecha** (backend líneas 218-222):
```typescript
// Al actualizar edad aproximada, se guarda automáticamente la fecha
const data: any = { ...input };
if (input.edadAproximada !== undefined &&
    input.edadAproximada !== miembroExistente.edadAproximada) {
  data.fechaActualizacionEdad = new Date(); // ← Automático
}
```

**Ejemplos Prácticos**:

```
Escenario 1: Con fecha de nacimiento (NO EDITABLE)
Input:
- fechaNacimiento: 1990-03-15
- año actual: 2025
Output:
- edadCalculada: 35 años (automático)
- Campo: Fondo gris, no permite editar
- Se actualiza automáticamente el 15/03 de cada año

Escenario 2: Sin fecha de nacimiento (EDITABLE)
Input inicial (01/01/2020):
- edadAproximada: 25
- fechaActualizacionEdad: 2020-01-01

En 2020:
- edadCalculada: 25 años (0 años transcurridos)

En 2025:
- edadCalculada: 30 años (25 + 5)

Usuario actualiza edad a 31 el 15/06/2025:
- edadAproximada: 31
- fechaActualizacionEdad: 2025-06-15

En 2026:
- edadCalculada: 32 años (31 + 1)

Escenario 3: Sin datos
- edadCalculada: null
- Campo: Muestra "-" como editable
- Usuario ingresa 40
- Se guarda: edadAproximada=40, fechaActualizacionEdad=<hoy>
- La edad aumentará automáticamente cada año
```

**Campos involucrados**:
- `fechaNacimiento`: Fecha exacta de nacimiento (opcional, si existe prioriza sobre edad aproximada)
- `edadAproximada`: Última edad ingresada manualmente
- `fechaActualizacionEdad`: Fecha en que se actualizó por última vez la edad (automática)
- `edadCalculada`: Campo calculado (GraphQL field resolver)

---

### MEM-004: Persistencia en Catálogo
**Estado**: ✅ Implementado
**Prioridad**: Media
**Test ID**: `test-mem-004`

**Descripción**:
Los miembros ligados a familias NO desaparecen del catálogo de miembros. Todos los miembros son visibles.

**Reglas**:
1. Un miembro puede tener `familiaId` asignado Y seguir visible en el catálogo
2. El catálogo muestra TODOS los miembros independientemente de si están ligados o no
3. La columna "Familia" muestra el nombre de la familia ligada o "N/A"
4. La columna "Familia" es **readonly** (se edita desde el Catálogo de Familias)

**Implementación**:
```typescript
// Frontend: MiembrosPage.tsx:478-481
{/* Familia - MEM-004 readonly */}
<td className="bg-gray-50 text-gray-600" title="Editar en: Catálogo de Familias">
  {miembro.familia?.nombre || 'N/A'}
</td>
```

**Backend**: Query incluye todos los miembros activos (líneas 92-101):
```typescript
return prisma.miembro.findMany({
  where: { activo: true }, // No filtra por familiaId
  include: {
    familia: true, // Include para mostrar nombre
    barrio: true,
    nucleo: true,
  },
  orderBy: { fechaRegistro: 'desc' },
});
```

**Ventajas**:
- Vista unificada de todos los miembros
- Miembros sin familia también visibles
- Fácil identificación de miembros no ligados (muestra "N/A")

---

### MEM-005: Roles de Miembro
**Estado**: ✅ Implementado
**Prioridad**: Alta
**Test ID**: `test-mem-005`

**Descripción**:
Los miembros tienen roles específicos dentro de la comunidad.

**Reglas**:
1. **Roles disponibles**: CEA, COLABORADOR, MIEMBRO
2. **Rol por defecto**: 'MIEMBRO' al crear
3. **Editable**: Mediante dropdown inline
4. **Permisos**: Los roles afectan los permisos en el sistema (gestionado por backend)

**Implementación**:
```typescript
// Frontend: MiembrosPage.tsx:85
const ROLES = ['CEA', 'COLABORADOR', 'MIEMBRO'];

// Dropdown editable (líneas 450-476)
{editing.miembroId === miembro.id && editing.field === 'rol' ? (
  <select
    value={editing.value}
    onChange={(e) => setEditing({ ...editing, value: e.target.value })}
    onBlur={() => saveEdit(miembro.id)}
    onKeyDown={(e) => {
      if (e.key === 'Enter') saveEdit(miembro.id);
      if (e.key === 'Escape') cancelEdit();
    }}
    autoFocus
  >
    {ROLES.map(rol => (
      <option key={rol} value={rol}>{rol}</option>
    ))}
  </select>
) : (
  <span
    className="cursor-pointer hover:underline"
    onClick={() => startEdit(miembro.id, 'rol', miembro.rol)}
  >
    {miembro.rol}
  </span>
)}
```

**Diferencia con v3.0**:
- v3.0: usaba lowercase ('cea', 'colaborador', 'miembro')
- v4.0: usa UPPERCASE ('CEA', 'COLABORADOR', 'MIEMBRO')
- Ambos funcionan, es decisión de UI

**Roles Familiares** (adicional en v4.0):
```typescript
// Línea 86
const ROLES_FAMILIARES = ['Padre', 'Madre', 'Hijo', 'Hija', 'Abuelo', 'Abuela', 'Otro'];
```

Este es un campo adicional que no existía en v3.0, permite identificar el rol dentro de la familia.

---

### MEM-006: Reuniones Devocionales
**Estado**: ⚠️ Parcialmente Implementado
**Prioridad**: Media
**Test ID**: `test-mem-006`

**Descripción**:
Los miembros pueden marcar que organizan reuniones devocionales semanales. Los detalles se gestionan en el Catálogo de Devocionales.

**Reglas**:
1. Checkbox `tieneDevocional` para marcar si el miembro organiza devocional
2. Las reuniones devocionales son siempre **semanales**
3. El catálogo de miembros solo muestra el checkbox
4. Los detalles (día, hora, participantes, miembros acompañantes) se gestionan en **Catálogo de Devocionales**
5. Un miembro puede tener devocional aunque no esté ligado a una familia

**Implementación Frontend**:
```typescript
// MiembrosPage.tsx:517-538
{/* Devocional - MEM-006 Checkbox */}
<td>
  <input
    type="checkbox"
    checked={miembro.tieneDevocional}
    onChange={async (e) => {
      try {
        await updateMiembro({
          variables: {
            id: miembro.id,
            input: { tieneDevocional: e.target.checked },
          },
        });
        refetch();
      } catch (err: any) {
        alert(`Error: ${err.message}`);
      }
    }}
    className="w-4 h-4 text-primary-600"
    title={miembro.tieneDevocional ? 'Quitar devocional' : 'Marcar como anfitrión de devocional'}
  />
</td>
```

**Backend - Campos disponibles** (líneas 18-22 en interface):
```typescript
interface CreateMiembroInput {
  // ...
  tieneDevocional?: boolean;
  devocionalDia?: string;      // Lunes-Domingo
  devocionalHora?: string;     // HH:mm
  devocionalParticipantes?: number;
  devocionalMiembros?: string[]; // Array de IDs de miembros acompañantes
}
```

**Query especializada** (líneas 130-149):
```typescript
miembrosConDevocional: async (_, __, { prisma, userId }) => {
  return prisma.miembro.findMany({
    where: {
      activo: true,
      tieneDevocional: true,
    },
    include: { familia: true, barrio: true, nucleo: true },
    orderBy: { nombre: 'asc' },
  });
};
```

**Estado actual**:
- ✅ Checkbox funcional en catálogo de miembros
- ✅ Backend tiene todos los campos necesarios
- ⚠️ Frontend NO muestra columnas de día/hora/participantes (como era en v3.0)
- ✅ Separación de responsabilidades: detalles en Catálogo de Devocionales

**Según especificación original**: "Los detalles de la devocional se gestionan en el **Catálogo de Reuniones Devocionales**" - Esto mantiene la separación correcta de responsabilidades.

---

## Modelo de Datos

### Schema Prisma
```prisma
model Miembro {
  id                      String    @id @default(cuid())
  nombre                  String
  apellidos               String?
  direccion               String?
  fechaNacimiento         DateTime? // Opcional
  edadAproximada          Int?      // Opcional
  fechaActualizacionEdad  DateTime? // Automática al editar edad
  telefono                String?
  email                   String?
  rol                     Rol       @default(MIEMBRO) // Enum: CEA, COLABORADOR, MIEMBRO
  rolFamiliar             String?   // Padre, Madre, Hijo, etc.
  activo                  Boolean   @default(true)
  fechaRegistro           DateTime  @default(now())

  // Devocional
  tieneDevocional         Boolean   @default(false)
  devocionalDia           String?
  devocionalHora          String?
  devocionalParticipantes Int?
  devocionalMiembros      String[]  @default([]) // Array de IDs

  // Relaciones
  familiaId               String?
  familia                 Familia?  @relation(fields: [familiaId], references: [id])

  usuarioId               String?   @unique
  usuario                 Usuario?  @relation(fields: [usuarioId], references: [id])

  barrioId                String?
  barrio                  Barrio?   @relation(fields: [barrioId], references: [id])

  nucleoId                String?   // Opcional (NUC-002)
  nucleo                  Nucleo?   @relation(fields: [nucleoId], references: [id])

  notas                   String?

  @@index([familiaId])
  @@index([barrioId])
  @@index([nucleoId])
  @@index([activo])
}
```

### Schema GraphQL
```graphql
type Miembro {
  id: ID!
  nombre: String!
  apellidos: String
  direccion: String
  fechaNacimiento: String
  edadAproximada: Int
  edadCalculada: Int           # Campo calculado (field resolver)
  fechaActualizacionEdad: String
  telefono: String
  email: String
  rol: Rol!
  rolFamiliar: String
  activo: Boolean!
  fechaRegistro: String!

  # Devocional
  tieneDevocional: Boolean!
  devocionalDia: String
  devocionalHora: String
  devocionalParticipantes: Int
  devocionalMiembros: [String!]

  # Relaciones
  familiaId: String
  familia: Familia
  usuarioId: String
  usuario: Usuario
  barrioId: String
  barrio: Barrio
  nucleoId: String
  nucleo: Nucleo

  notas: String
}

enum Rol {
  CEA
  COLABORADOR
  MIEMBRO
}

input CreateMiembroInput {
  familiaId: String
  usuarioId: String
  nombre: String!
  apellidos: String
  direccion: String
  barrioId: String
  nucleoId: String
  fechaNacimiento: String
  edadAproximada: Int
  telefono: String
  email: String
  rol: Rol!
  rolFamiliar: String
  tieneDevocional: Boolean
  devocionalDia: String
  devocionalHora: String
  devocionalParticipantes: Int
  devocionalMiembros: [String!]
  notas: String
}

input UpdateMiembroInput {
  familiaId: String
  nombre: String
  apellidos: String
  direccion: String
  barrioId: String
  nucleoId: String
  fechaNacimiento: String
  edadAproximada: Int
  telefono: String
  email: String
  rol: Rol
  rolFamiliar: String
  tieneDevocional: Boolean
  devocionalDia: String
  devocionalHora: String
  devocionalParticipantes: Int
  devocionalMiembros: [String!]
  activo: Boolean
  notas: String
}

type Query {
  miembros: [Miembro!]!
  miembro(id: ID!): Miembro
  miembrosConDevocional: [Miembro!]!
}

type Mutation {
  createMiembro(input: CreateMiembroInput!): Miembro!
  updateMiembro(id: ID!, input: UpdateMiembroInput!): Miembro!
  deleteMiembro(id: ID!): Boolean!
}
```

---

## Operaciones CRUD

### Create
- **Endpoint**: `mutation createMiembro($input: CreateMiembroInput!)`
- **Permisos**: CEA, COLABORADOR
- **Validaciones**:
  - Usuario autenticado ✅
  - Barrios existentes (MEM-001) ✅
  - Nombre obligatorio ✅
  - Si se proporciona `edadAproximada`, se guarda automáticamente `fechaActualizacionEdad` ✅
- **Side effects**: Actualiza `miembroCount` en familia si está ligado ✅

### Read (List)
- **Endpoint**: `query miembros`
- **Permisos**: CEA, COLABORADOR, VISITANTE
- **Filtros**: `activo = true`
- **Includes**: familia, usuario, barrio, nucleo
- **Ordenamiento**: `fechaRegistro DESC` (MEM-002)

### Read (Single)
- **Endpoint**: `query miembro($id: ID!)`
- **Permisos**: CEA, COLABORADOR, VISITANTE
- **Includes**: familia, usuario, barrio, nucleo

### Read (Con Devocional)
- **Endpoint**: `query miembrosConDevocional`
- **Permisos**: CEA, COLABORADOR
- **Filtros**: `activo = true`, `tieneDevocional = true`
- **Ordenamiento**: `nombre ASC`

### Update
- **Endpoint**: `mutation updateMiembro($id: ID!, $input: UpdateMiembroInput!)`
- **Permisos**: CEA, COLABORADOR (propios datos)
- **Validaciones**:
  - Miembro existe ✅
  - Si cambia `edadAproximada`, actualiza `fechaActualizacionEdad` automáticamente ✅
- **Side effects**: Actualiza `miembroCount` si cambia de familia ✅

### Delete
- **Endpoint**: `mutation deleteMiembro($id: ID!)`
- **Permisos**: Solo CEA
- **Validaciones**:
  - Miembro existe ✅
  - Soft delete (activo = false) ✅
- **Side effects**: Actualiza `miembroCount` en familia ✅

---

## Funcionalidad Faltante

### 🔴 CRÍTICO

#### 1. **Paginación**
**Estado**: ❌ No implementada
**Impacto**: Alto - Con +100 miembros, la UI será lenta e inusable
**v3.0**: Tenía paginación completa (10/20/50 por página, navegación)
**Recomendación**: Implementar paginación cursor-based en GraphQL

```typescript
// Requerido en Frontend
const [currentPage, setCurrentPage] = useState(1);
const [pageSize, setPageSize] = useState(20);

// Requerido en Backend
type MiembroConnection {
  edges: [MiembroEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}
```

---

### 🟡 ALTA PRIORIDAD

#### 2. **Columna: Fecha de Nacimiento**
**Estado**: ❌ No visible en UI (pero existe en backend)
**Impacto**: No se puede editar fecha de nacimiento
**v3.0**: Input type="date" editable (líneas 290-310)
**Solución**: Agregar columna editable

```typescript
// Agregar en tabla después de Apellidos
{editing.miembroId === miembro.id && editing.field === 'fechaNacimiento' ? (
  <input
    type="date"
    value={editing.value || ''}
    onChange={(e) => setEditing({ ...editing, value: e.target.value })}
    onKeyDown={(e) => {
      if (e.key === 'Enter') saveEdit(miembro.id);
      if (e.key === 'Escape') cancelEdit();
    }}
    onBlur={() => saveEdit(miembro.id)}
    autoFocus
  />
) : (
  <span onClick={() => startEdit(miembro.id, 'fechaNacimiento', miembro.fechaNacimiento)}>
    {miembro.fechaNacimiento ? formatDate(miembro.fechaNacimiento) : '-'}
  </span>
)}
```

#### 3. **Columna: Email**
**Estado**: ❌ No visible en UI (pero existe en backend)
**Impacto**: Información de contacto crítica no accesible
**v3.0**: Editable (líneas 349-356)
**Solución**: Agregar columna editable tipo email

#### 4. **Columna: Dirección**
**Estado**: ❌ No visible en UI (pero existe en backend)
**Impacto**: Información útil para visitas no visible
**v3.0**: Editable (líneas 365-372)
**Solución**: Agregar columna editable tipo text

---

### 🟢 MEDIA PRIORIDAD

#### 5. **Columna: Núcleo**
**Estado**: ❌ No visible en UI (pero existe en backend)
**Impacto**: No se puede asignar núcleo al miembro
**v3.0**: Dropdown editable (líneas 398-408)
**Solución**: Agregar columna con dropdown de núcleos

```typescript
{editing.miembroId === miembro.id && editing.field === 'nucleoId' ? (
  <select
    value={editing.value || ''}
    onChange={(e) => setEditing({ ...editing, value: e.target.value })}
    onBlur={() => saveEdit(miembro.id)}
    autoFocus
  >
    <option value="">-</option>
    {nucleos.map(n => (
      <option key={n.id} value={n.id}>{n.nombre}</option>
    ))}
  </select>
) : (
  <span onClick={() => startEdit(miembro.id, 'nucleoId', miembro.nucleoId)}>
    {miembro.nucleo?.nombre || '-'}
  </span>
)}
```

#### 6. **Filtro por Estatus**
**Estado**: ❌ No implementado
**Impacto**: No se pueden ver miembros inactivos vs activos
**v3.0**: Dropdown con opciones: Todos, Activos, Inactivos (líneas 26-32)
**Solución**: Agregar filtro en UI

```typescript
const [filtroEstatus, setFiltroEstatus] = useState('activo');

// En el filtrado:
if (filtroEstatus === 'activo') {
  resultado = resultado.filter((m: any) => m.activo === true);
} else if (filtroEstatus === 'inactivo') {
  resultado = resultado.filter((m: any) => m.activo === false);
}
```

#### 7. **Navegación con Tab**
**Estado**: ⚠️ No visible en código
**Impacto**: Menor productividad en edición masiva
**v3.0**: Navegación fluida entre celdas con Tab (líneas 706-754)
**Solución**: Implementar en cada campo editable

---

### 🔵 BAJA PRIORIDAD

#### 8. **Columna: Fecha Registro**
**Estado**: ❌ No visible en UI
**Impacto**: Información de auditoría no visible
**v3.0**: Readonly, fondo gris (líneas 442-449)
**Solución**: Agregar columna readonly

#### 9. **Badges Visuales**
**Estado**: ❌ No implementados
**Impacto**: Menor visibilidad de datos faltantes
**v3.0**: Iconos visuales (líneas 264-274):
  - ⚠️ Amarillo: Sin familia asignada
  - 🔘 Gris: Miembro inactivo
**Solución**: Agregar iconos condicionales en columna Nombre

#### 10. **Exportar a JSON**
**Estado**: ❌ No implementado
**Impacto**: No se puede hacer respaldo manual
**v3.0**: Función `exportMiembros()` (líneas 894-904)
**Solución**: Agregar botón de exportar con descarga de JSON

---

## Validaciones

### Frontend
1. ✅ Validación de barrios antes de crear (MEM-001)
2. ✅ Confirmación antes de eliminar
3. ✅ Loading state mientras carga
4. ✅ Error state si falla query
5. ✅ Empty state si no hay registros
6. ❌ **Falta**: Validación de formato de email
7. ❌ **Falta**: Validación de edad (rango 0-120)

### Backend
1. ✅ Autenticación JWT requerida
2. ✅ Usuario debe existir
3. ✅ Miembro debe existir para update/delete
4. ✅ Soft delete en lugar de eliminación física
5. ✅ Actualización automática de `fechaActualizacionEdad`
6. ✅ Actualización automática de `miembroCount` en familias
7. ✅ Campo calculado `edadCalculada` (field resolver)

---

## Referencias de Código

### Frontend
- **Página**: `/packages/web/src/pages/MiembrosPage.tsx` (559 líneas)
- **Líneas clave**:
  - Query: 4-42
  - Mutations: 62-83
  - Validación MEM-001: 118-139
  - Ordenamiento MEM-002: 103, 158-171
  - Sistema dual edad MEM-003: 218-264
  - Familia readonly MEM-004: 478-481
  - Roles MEM-005: 85-86, 450-476
  - Devocional MEM-006: 517-538

### Backend
- **Resolvers**: `/packages/backend/src/resolvers/miembro.resolvers.ts` (344 líneas)
- **Líneas clave**:
  - Función calcularEdad (MEM-003): 48-81
  - Query list: 85-102
  - Query single: 104-128
  - Query con devocional: 130-149
  - Create: 153-198
  - Update: 200-259
  - Delete: 261-298
  - Field resolver edadCalculada: 302-305
  - Field resolvers relaciones: 307-341

### Base de Datos
- **Schema**: `/packages/backend/prisma/schema.prisma`
- **Modelo**: `Miembro`
- **Relaciones**: Familia (N:1, opcional), Usuario (1:1, opcional), Barrio (N:1, opcional), Nucleo (N:1, opcional)

---

## 🧪 Tests Pendientes

### Backend
- [ ] `test-mem-001`: Crear miembro con barrio obligatorio
- [ ] `test-mem-001b`: No permitir crear sin barrios existentes
- [ ] `test-mem-002`: Ordenamiento por fecha descendente
- [ ] `test-mem-003a`: Calcular edad desde fecha de nacimiento
- [ ] `test-mem-003b`: Calcular edad aproximada con años transcurridos
- [ ] `test-mem-003c`: Actualizar fecha al editar edad aproximada
- [ ] `test-mem-004`: Miembros ligados visibles en catálogo
- [ ] `test-mem-005`: Editar rol de miembro
- [ ] `test-mem-006`: Marcar/desmarcar tiene devocional
- [ ] `test-mem-007`: Actualizar miembroCount al ligar/desligar
- [ ] `test-mem-008`: Soft delete de miembro

### Frontend
- [ ] Render tabla de miembros
- [ ] Alert si no hay barrios (MEM-001)
- [ ] Crear nuevo miembro con barrio por defecto
- [ ] Ordenamiento por fecha por defecto (MEM-002)
- [ ] Edad no editable si tiene fecha de nacimiento (MEM-003)
- [ ] Edad editable si no tiene fecha de nacimiento (MEM-003)
- [ ] Familia readonly (MEM-004)
- [ ] Editar rol con dropdown (MEM-005)
- [ ] Checkbox devocional funcional (MEM-006)

---

## 📊 Estadísticas y Métricas

### Performance Esperado
- Query list: < 200ms (sin paginación, problemas con +100 registros)
- Query list (con paginación): < 150ms esperado
- Mutation create: < 250ms (incluye actualización de count)
- Mutation update: < 250ms (incluye validaciones)
- Mutation delete: < 200ms (soft delete + count)

### Uso Típico
- Promedio de miembros por comunidad: 50-200
- Promedio de miembros por familia: 3-6
- Frecuencia de edición: Media-Alta
- Frecuencia de creación: Media
- Frecuencia de eliminación: Baja

---

## 🔮 Mejoras Futuras

### Alta Prioridad
1. **Implementar paginación** (CRÍTICO para performance)
2. **Agregar columnas faltantes**: fechaNacimiento, email, direccion, nucleo, fechaRegistro
3. **Filtro por estatus**: Activos/Inactivos/Todos
4. **Navegación Tab**: Entre celdas editables
5. **Validación de email**: Formato correcto

### Media Prioridad
6. **Badges visuales**: Sin familia, Inactivo
7. **Búsqueda global**: Por nombre, apellidos, email, teléfono
8. **Exportar**: JSON, CSV, Excel
9. **Importar**: CSV, Excel (bulk)
10. **Foto de perfil**: Avatar/imagen del miembro

### Baja Prioridad
11. **Historial de cambios**: Auditoría completa
12. **Merge de miembros**: Unir duplicados
13. **Vista compacta/expandida**: Toggle de columnas
14. **Filtros avanzados**: Por edad, barrio, núcleo
15. **Ordenamiento por múltiples campos**: Combinaciones

---

## 📚 Documentación Relacionada

- **Reglas comunes**: `COMMON.md`
- **Barrios**: `BARRIOS.md` (validación MEM-001)
- **Núcleos**: `NUCLEOS.md` (NUC-002: núcleo opcional)
- **Familias**: `FAMILIAS.md` (ligado de miembros)
- **Migraciones**: `/ANALISIS_MIGRACION.md`
- **Pendientes**: `/PENDIENTES.md`

---

## ⚠️ Notas Importantes

### Regla Crítica: MEM-003 (Sistema Dual de Edad)
El sistema dual de edad es **sofisticado y funcional**. Es importante mantener:
1. Prioridad de `fechaNacimiento` sobre `edadAproximada`
2. Actualización automática de `fechaActualizacionEdad`
3. Cálculo correcto de años transcurridos
4. UI diferenciada (editable vs no editable)

### Actualización de miembroCount
El backend actualiza automáticamente el contador de miembros en las familias:
- Al crear miembro ligado
- Al cambiar de familia
- Al eliminar miembro (soft delete)

Esto mantiene la integridad de datos sin intervención manual.

### Columnas Faltantes vs Backend Completo
**Importante**: El backend y GraphQL tienen TODOS los campos necesarios. Solo falta agregarlos en la UI del frontend. Esto facilita mucho la implementación de las columnas faltantes.

---

**Última actualización**: 14 de octubre de 2025
**Mantenido por**: Equipo de Desarrollo Devocionales 4.0
**Estado**: ✅ Funcional pero ⚠️ Incompleto (falta 30% de features de v3.0)
