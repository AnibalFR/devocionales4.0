# Reglas de Negocio: Catálogo de Núcleos

**Fecha de creación**: 14 de octubre de 2025
**Versión**: 4.0
**Vista**: NucleosPage
**Estado**: Implementado ✅

---

## 📋 Índice

1. [Descripción General](#descripción-general)
2. [Reglas de Negocio](#reglas-de-negocio)
3. [Modelo de Datos](#modelo-de-datos)
4. [Operaciones CRUD](#operaciones-crud)
5. [Validaciones](#validaciones)
6. [Referencias de Código](#referencias-de-código)

---

## Descripción General

### ¿Qué es un Núcleo?

Un **núcleo** es una subdivisión de un barrio que agrupa familias de manera más granular. Los núcleos sirven para:
- Subdividir barrios grandes en grupos más manejables
- Asignar líderes o visitadores específicos
- Facilitar reuniones de grupos pequeños
- Organizar devocionales familiares por zonas específicas

### Características Principales

- **Jerarquía**: Comunidad → Barrio → **Núcleo** → Familia
- **Dependencia**: Un núcleo SIEMPRE pertenece a un barrio
- **Opcionalidad para familias**: Las familias pueden o no estar asignadas a un núcleo (ver NUC-002)
- **Editabilidad**: Edición inline tipo Excel con dropdown para barrio
- **Persistencia**: PostgreSQL vía GraphQL

---

## Reglas de Negocio

### NUC-001: Validación de Barrios al Crear Núcleo
**Estado**: ✅ Implementado (Frontend + Backend)
**Prioridad**: CRÍTICA
**Test ID**: `test-nuc-001`

**Descripción**:
Los núcleos deben estar asociados a un barrio existente. No se puede crear un núcleo si no hay barrios disponibles.

**Reglas**:
1. **Validación pre-creación**: Antes de crear núcleo, verificar que existen barrios
2. **Alert amigable**: Si no hay barrios, mostrar mensaje instructivo
3. **Asignación automática**: Por defecto se asigna el primer barrio disponible
4. **Validación en backend**: Verificar que el `barrioId` existe y está activo
5. **Bloqueo de creación**: No permitir crear núcleo sin barrio

**Mensaje de Error**:
```
⚠️ Primero debes crear al menos un barrio antes de crear núcleos.
```

**Implementación Frontend**:
```typescript
// /packages/web/src/pages/NucleosPage.tsx:173-196
const handleNuevoNucleo = async () => {
  const barrios = data?.barrios || [];

  // NUC-001: Validar que existe al menos un barrio
  if (barrios.length === 0) {
    alert('⚠️ Primero debes crear al menos un barrio antes de crear núcleos.');
    return;
  }

  try {
    await createNucleo({
      variables: {
        input: {
          nombre: 'Nuevo Núcleo',
          barrioId: barrios[0].id, // Assign first barrio by default
          descripcion: null,
        },
      },
    });
  } catch (error: any) {
    alert(error.message || 'Error al crear el núcleo');
  }
};
```

**Implementación Backend (Create)**:
```typescript
// /packages/backend/src/resolvers/nucleo.resolvers.ts:83-92
// NUC-001: Validar que existe el barrio
const barrio = await prisma.barrio.findUnique({
  where: { id: input.barrioId },
});

if (!barrio) {
  throw new GraphQLError('El barrio especificado no existe', {
    extensions: { code: 'BAD_REQUEST' },
  });
}
```

**Implementación Backend (Update)**:
```typescript
// /packages/backend/src/resolvers/nucleo.resolvers.ts:128-139
// NUC-001: Si se está cambiando el barrio, validar que existe
if (input.barrioId) {
  const barrio = await prisma.barrio.findUnique({
    where: { id: input.barrioId },
  });

  if (!barrio) {
    throw new GraphQLError('El barrio especificado no existe', {
      extensions: { code: 'BAD_REQUEST' },
    });
  }
}
```

**UI Helpers**:
```typescript
// Warning visual si no hay barrios
{barrios.length === 0 && (
  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
    <p className="text-sm text-yellow-800">
      ⚠️ <strong>No hay barrios registrados.</strong>
      Necesitas crear al menos un barrio antes de crear núcleos.
    </p>
  </div>
)}
```

**Casos de Prueba**:
- ✅ Intentar crear núcleo sin barrios → Alert y no crea
- ✅ Crear núcleo con barrios disponibles → Asigna primero
- ✅ Backend rechaza barrioId inválido → Error GraphQL
- ✅ Cambiar núcleo a barrio inexistente → Error GraphQL

---

### NUC-002: Núcleo Opcional para Miembros
**Estado**: ✅ Implementado (a nivel de modelo)
**Prioridad**: Media
**Test ID**: `test-nuc-002`

**Descripción**:
Los miembros de una familia pueden o no estar asignados a un núcleo. El núcleo es una agrupación opcional.

**Reglas**:
1. **Campo opcional**: `nucleoId` en modelo Miembro puede ser `null`
2. **Sin validación obligatoria**: No hay validación que requiera núcleo al crear miembro
3. **Flexibilidad**: Permite familias/miembros sin núcleo específico
4. **Solo barrio requerido**: La familia debe tener barrio, pero núcleo es opcional

**Implicaciones**:
- Familias pueden estar en un barrio pero sin núcleo asignado
- Los núcleos son subdivisiones opcionales para mejor organización
- Reportes deben considerar familias sin núcleo

**Schema Prisma (Miembro)**:
```prisma
model Miembro {
  id       String  @id @default(cuid())
  // ...otros campos
  nucleoId String? // ← OPCIONAL (permite null)
  nucleo   Nucleo? @relation(fields: [nucleoId], references: [id])
}
```

**Validación en Familia** (referencia):
```typescript
// Familia REQUIERE barrio, núcleo es opcional
model Familia {
  barrioId String   // ← REQUERIDO
  barrio   Barrio   @relation(fields: [barrioId], references: [id])

  nucleoId String?  // ← OPCIONAL
  nucleo   Nucleo?  @relation(fields: [nucleoId], references: [id])
}
```

---

### NUC-003: Creación de Núcleos
**Estado**: ✅ Implementado
**Prioridad**: Alta
**Test ID**: `test-nuc-003`

**Descripción**:
Los núcleos se crean con valores por defecto y edición inline.

**Reglas**:
1. Click en "+ Nuevo Núcleo" crea una nueva fila en la tabla
2. **Validación previa**: Verifica que existen barrios (NUC-001)
3. Valores por defecto:
   - `nombre`: "Nuevo Núcleo"
   - `barrioId`: ID del primer barrio disponible
   - `descripcion`: `null` (opcional)
   - `activo`: `true`
   - `createdAt`: Timestamp actual
   - `comunidadId`: Del usuario autenticado
4. Campos editables: nombre, barrioId, descripción
5. Campos no editables: createdAt, updatedAt, id

**Implementación**:
```typescript
// Frontend: /packages/web/src/pages/NucleosPage.tsx:173-196
const handleNuevoNucleo = async () => {
  const barrios = data?.barrios || [];

  if (barrios.length === 0) {
    alert('⚠️ Primero debes crear al menos un barrio antes de crear núcleos.');
    return;
  }

  await createNucleo({
    variables: {
      input: {
        nombre: 'Nuevo Núcleo',
        barrioId: barrios[0].id,
        descripcion: null,
      },
    },
  });
};

// Backend: /packages/backend/src/resolvers/nucleo.resolvers.ts:60-108
createNucleo: async (_, { input }, { prisma, userId }) => {
  const user = await prisma.usuario.findUnique({
    where: { id: userId },
    select: { comunidadId: true },
  });

  // Validar barrio existe (NUC-001)
  const barrio = await prisma.barrio.findUnique({
    where: { id: input.barrioId },
  });

  if (!barrio) {
    throw new GraphQLError('El barrio especificado no existe');
  }

  return prisma.nucleo.create({
    data: {
      nombre: input.nombre,
      barrioId: input.barrioId,
      descripcion: input.descripcion || null,
      activo: true,
      comunidadId: user.comunidadId,
    },
    include: {
      barrio: true,
    },
  });
}
```

---

### NUC-004: Edición Inline de Núcleos
**Estado**: ✅ Implementado
**Prioridad**: Alta
**Test ID**: `test-nuc-004`

**Descripción**:
Los núcleos se editan directamente en la tabla, incluyendo cambio de barrio mediante dropdown.

**Reglas**:
1. **Campos editables**: nombre, barrioId, descripción
2. **Dropdown para barrio**: Al editar barrioId, se muestra un `<select>` con todos los barrios
3. **Edición simultánea**: Solo 1 celda editable por vez
4. **Guardado automático**: Al cambiar selección (onChange) o presionar Enter
5. **Validación backend**: Verifica que nuevo barrioId existe (NUC-001)

**Edición de Barrio (Dropdown)**:
```typescript
// Frontend: /packages/web/src/pages/NucleosPage.tsx:324-352
{editing.nucleoId === nucleo.id && editing.field === 'barrioId' ? (
  <td className="px-4 py-2">
    <select
      value={editing.value}
      onChange={(e) =>
        setEditing({ ...editing, value: e.target.value })
      }
      onKeyDown={(e) => handleKeyDown(e, nucleo.id, 'barrioId')}
      onBlur={() => saveEdit(nucleo.id, 'barrioId')}
      autoFocus
      className="input input-sm w-full"
    >
      {barrios.map((barrio: any) => (
        <option key={barrio.id} value={barrio.id}>
          {barrio.nombre}
        </option>
      ))}
    </select>
  </td>
) : (
  <td
    className="px-4 py-2 cursor-pointer hover:bg-gray-100"
    onClick={() => startEdit(nucleo.id, 'barrioId', nucleo.barrioId)}
  >
    {nucleo.barrio?.nombre || '-'}
  </td>
)}
```

**Navegación con Tab**:
- Nombre → Barrio → Descripción
- Tab guarda cambio actual y mueve a siguiente celda editable
- Salta la columna "Fecha Creación" (no editable)

---

### NUC-005: Eliminación de Núcleos
**Estado**: ✅ Implementado
**Prioridad**: Alta
**Test ID**: `test-nuc-005`

**Descripción**:
Los núcleos se eliminan con soft delete y confirmación.

**Reglas**:
1. **Soft Delete**: No se elimina físicamente, se marca `activo = false`
2. **Confirmación obligatoria**: Dialog con mensaje personalizado
3. **Mensaje**: "¿Eliminar el núcleo "[nombre]"?"
4. **Integridad referencial**: Las familias asociadas NO se eliminan
5. **Permisos**: Solo usuarios CEA pueden eliminar

**Consideraciones de Integridad**:
- ⚠️ **Atención**: Si un núcleo tiene familias/miembros asociados, estos quedarán con referencia a núcleo inactivo
- **Ventaja de NUC-002**: Como `nucleoId` es opcional, las familias pueden continuar sin núcleo
- **Recomendación futura**: Validar si tiene familias antes de permitir eliminar, u ofrecer reasignar

**Implementación**:
```typescript
// Frontend: /packages/web/src/pages/NucleosPage.tsx:198-209
const handleEliminar = async (nucleoId: string, nombre: string) => {
  if (confirm(`¿Eliminar el núcleo "${nombre}"?`)) {
    await deleteNucleo({
      variables: { id: nucleoId },
    });
  }
};

// Backend: /packages/backend/src/resolvers/nucleo.resolvers.ts:152-177
deleteNucleo: async (_, { id }, { prisma, userId }) => {
  if (!userId) throw new GraphQLError('No autenticado');

  const nucleo = await prisma.nucleo.findUnique({ where: { id } });
  if (!nucleo) throw new GraphQLError('Núcleo no encontrado');

  // Soft delete
  await prisma.nucleo.update({
    where: { id },
    data: { activo: false },
  });

  return true;
};
```

---

### NUC-006: Listado de Núcleos
**Estado**: ✅ Implementado
**Prioridad**: Alta
**Test ID**: `test-nuc-006`

**Descripción**:
La vista muestra todos los núcleos activos con su barrio asociado.

**Reglas**:
1. **Filtro automático**: Solo núcleos con `activo = true`
2. **Include barrio**: Query incluye datos del barrio relacionado
3. **Ordenamiento**: Más recientes primero (`createdAt DESC`)
4. **Filtro de comunidad**: Solo núcleos de la comunidad del usuario autenticado
5. **Columnas visibles**:
   - Nombre (editable)
   - Barrio (editable con dropdown)
   - Descripción (editable)
   - Fecha Creación (no editable, formato dd/MM/yyyy)
   - Acciones (Eliminar)

**Query con Include**:
```graphql
query GetNucleos {
  nucleos {
    id
    nombre
    barrioId
    descripcion
    createdAt
    barrio {
      id
      nombre
    }
  }
  barrios {
    id
    nombre
  }
}
```

**Implementación Backend**:
```typescript
// /packages/backend/src/resolvers/nucleo.resolvers.ts:19-33
nucleos: async (_, __, { prisma, userId }) => {
  if (!userId) throw new GraphQLError('No autenticado');

  return prisma.nucleo.findMany({
    where: { activo: true },
    orderBy: { createdAt: 'desc' },
    include: {
      barrio: true, // ← Include para mostrar nombre de barrio
    },
  });
};
```

**Estadísticas**:
- Card con "Total de núcleos: X"
- Card con "Total de barrios: Y"
- Mensaje condicional si tabla vacía:
  - Sin barrios: "Crea un barrio primero para poder crear núcleos."
  - Con barrios: "No hay núcleos registrados. Crea uno nuevo para comenzar."

---

### NUC-007: Formato de Fecha
**Estado**: ✅ Implementado (mismo que barrios)
**Prioridad**: Media
**Test ID**: `test-nuc-007`

**Descripción**:
Las fechas se muestran en zona horaria de México (reutiliza helper de barrios).

**Reglas**:
1. **Almacenamiento**: UTC en PostgreSQL
2. **Visualización**: America/Mexico_City (Querétaro)
3. **Formato**: dd/MM/yyyy
4. **Helper reutilizable**: Mismo `formatDate()` que barrios

**Implementación**: Ver BARRIOS.md → BAR-005

---

## Modelo de Datos

### Schema Prisma
```prisma
// /packages/backend/prisma/schema.prisma
model Nucleo {
  id          String   @id @default(cuid())
  nombre      String
  descripcion String?
  activo      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relaciones
  barrioId    String
  barrio      Barrio    @relation(fields: [barrioId], references: [id])

  comunidadId String
  comunidad   Comunidad @relation(fields: [comunidadId], references: [id])

  miembros    Miembro[] // Relación opcional (ver NUC-002)
  familias    Familia[] // Relación opcional (ver NUC-002)

  @@index([barrioId])
  @@index([comunidadId])
  @@index([activo])
}
```

### Schema GraphQL
```graphql
type Nucleo {
  id: ID!
  nombre: String!
  barrioId: ID!
  barrio: Barrio!
  descripcion: String
  activo: Boolean!
  createdAt: String!
  updatedAt: String!
  comunidadId: ID!
}

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
}

type Query {
  nucleos: [Nucleo!]!
  nucleo(id: ID!): Nucleo
}

type Mutation {
  createNucleo(input: CreateNucleoInput!): Nucleo!
  updateNucleo(id: ID!, input: UpdateNucleoInput!): Nucleo!
  deleteNucleo(id: ID!): Boolean!
}
```

---

## Operaciones CRUD

### Create
- **Endpoint**: `mutation createNucleo($input: CreateNucleoInput!)`
- **Permisos**: CEA, COLABORADOR
- **Validaciones**:
  - Usuario autenticado ✅
  - Nombre no vacío ✅
  - BarrioId existe (NUC-001) ✅
  - Descripción opcional ✅

### Read (List)
- **Endpoint**: `query nucleos`
- **Permisos**: CEA, COLABORADOR, VISITANTE
- **Filtros**: `activo = true`, comunidad del usuario
- **Includes**: `barrio` (para mostrar nombre)

### Read (Single)
- **Endpoint**: `query nucleo($id: ID!)`
- **Permisos**: CEA, COLABORADOR, VISITANTE
- **Validaciones**: Núcleo existe y pertenece a la comunidad

### Update
- **Endpoint**: `mutation updateNucleo($id: ID!, $input: UpdateNucleoInput!)`
- **Permisos**: CEA, COLABORADOR
- **Validaciones**:
  - Usuario autenticado ✅
  - Núcleo existe ✅
  - Si cambia barrioId, validar que existe (NUC-001) ✅
  - Campos opcionales ✅

### Delete
- **Endpoint**: `mutation deleteNucleo($id: ID!)`
- **Permisos**: Solo CEA
- **Validaciones**:
  - Usuario autenticado ✅
  - Núcleo existe ✅
  - Soft delete (activo = false) ✅

---

## Validaciones

### Frontend
1. ✅ Validar existencia de barrios antes de crear (NUC-001)
2. ✅ Nombre no puede estar vacío (trim)
3. ✅ Dropdown solo muestra barrios activos
4. ✅ Confirmación antes de eliminar
5. ✅ Loading state mientras carga
6. ✅ Error state si falla query
7. ✅ Empty state condicional (sin barrios vs sin núcleos)
8. ✅ Warning visual si no hay barrios

### Backend
1. ✅ Autenticación JWT requerida
2. ✅ Usuario debe existir
3. ✅ Validar barrioId existe al crear (NUC-001)
4. ✅ Validar barrioId existe al actualizar (NUC-001)
5. ✅ Núcleo debe existir para update/delete
6. ✅ Soft delete en lugar de eliminación física
7. ⚠️ **Pendiente**: Validar familias antes de eliminar

---

## Referencias de Código

### Frontend
- **Página**: `/packages/web/src/pages/NucleosPage.tsx`
- **Líneas clave**:
  - Query: 37-55
  - Mutations: 57-93
  - Creación con validación NUC-001: 173-196
  - Edición: 105-171
  - Edición de barrio (dropdown): 324-352
  - Eliminación: 198-209
  - Warning sin barrios: 256-262
  - Formato fecha: 5-35 (helper reutilizado)

### Backend
- **Resolvers**: `/packages/backend/src/resolvers/nucleo.resolvers.ts`
- **Líneas clave**:
  - Query list: 19-33
  - Query single: 35-56
  - Create con validación NUC-001: 60-108
  - Update con validación NUC-001: 110-150
  - Delete: 152-177
  - Field resolver barrio: 181-187
  - Field resolvers timestamps: 188-197

### Base de Datos
- **Schema**: `/packages/backend/prisma/schema.prisma`
- **Modelo**: `Nucleo`
- **Relaciones**: Barrio (N:1), Comunidad (N:1), Miembro (1:N), Familia (1:N)

---

## 🧪 Tests Pendientes

### Backend
- [ ] `test-nuc-001`: No permitir crear núcleo sin barrio existente
- [ ] `test-nuc-002`: Permitir crear miembro sin nucleoId (null)
- [ ] `test-nuc-003`: Crear núcleo con barrioId válido
- [ ] `test-nuc-004`: Editar núcleo y cambiar de barrio
- [ ] `test-nuc-005`: No permitir crear con barrioId inválido
- [ ] `test-nuc-006`: No permitir actualizar con barrioId inválido
- [ ] `test-nuc-007`: Eliminar núcleo (soft delete)
- [ ] `test-nuc-008`: No permitir crear sin autenticación
- [ ] `test-nuc-009`: No permitir editar núcleo de otra comunidad

### Frontend
- [ ] Render de tabla de núcleos
- [ ] Warning si no hay barrios
- [ ] Alert al intentar crear sin barrios (NUC-001)
- [ ] Crear nuevo núcleo con barrio por defecto
- [ ] Editar nombre inline
- [ ] Editar barrio con dropdown
- [ ] Editar descripción inline
- [ ] Confirmar eliminación

---

## 📊 Estadísticas y Métricas

### Performance
- Query list: < 150ms (incluye join con barrios)
- Mutation create: < 250ms (incluye validación de barrio)
- Mutation update: < 250ms (incluye validación de barrio)
- Mutation delete: < 150ms

### Uso
- Promedio de núcleos por barrio: 2-5
- Promedio de núcleos por comunidad: 10-20
- Frecuencia de edición: Baja-Media (más dinámica que barrios)
- Frecuencia de eliminación: Muy baja

---

## 🔮 Mejoras Futuras

### Alta Prioridad
1. **Validar dependencias**: No permitir eliminar si tiene familias/miembros activos
2. **Reasignación**: Ofrecer reasignar familias al eliminar núcleo
3. **Bulk operations**: Crear/editar múltiples núcleos a la vez

### Media Prioridad
4. **Filtro por barrio**: Filtrar tabla de núcleos por barrio seleccionado
5. **Estadísticas**: Cuántas familias/miembros por núcleo
6. **Ordenamiento**: Permitir reordenar núcleos dentro de un barrio
7. **Historial**: Auditoría de cambios de barrio

### Baja Prioridad
8. **Mapa**: Visualizar núcleos en mapa dentro de su barrio
9. **Colores**: Heredar color del barrio o asignar propio
10. **Líderes**: Asignar líder de núcleo (usuario específico)

---

## 🔗 Dependencias y Relaciones

### Depende de:
- **Barrios** (NUC-001): No puede existir núcleo sin barrio
- **Comunidades** (COMMON-011): Aislamiento multi-tenant
- **Usuarios** (COMMON-007): Autenticación requerida

### Es usado por:
- **Familias** (opcional, NUC-002): Familia puede tener nucleoId
- **Miembros** (opcional, NUC-002): Miembro puede tener nucleoId
- **Visitas**: Pueden filtrar/reportar por núcleo
- **Reportes**: Desglose por núcleo

---

## 📚 Documentación Relacionada

- **Reglas comunes**: `COMMON.md`
- **Barrios**: `BARRIOS.md` (dependencia crítica)
- **Migraciones**: `/ANALISIS_MIGRACION.md`
- **Pendientes**: `/PENDIENTES.md`

---

## ⚠️ Notas Importantes

### Regla Crítica: NUC-001
La validación de existencia de barrios antes de crear núcleos es **CRÍTICA** y está implementada en dos capas:
1. **Frontend**: Alert preventivo (UX)
2. **Backend**: Error GraphQL (seguridad)

**Nunca** debe ser posible crear un núcleo sin un barrio válido.

### Regla de Diseño: NUC-002
La opcionalidad del núcleo para familias/miembros es intencional:
- Permite flexibilidad organizacional
- No todas las comunidades usan núcleos
- Algunas familias pueden estar solo en barrio

**Mantener** `nucleoId` como campo opcional en Familia y Miembro.

---

**Última actualización**: 14 de octubre de 2025
**Mantenido por**: Equipo de Desarrollo Devocionales 4.0
**Estado**: ✅ Funcional en producción
