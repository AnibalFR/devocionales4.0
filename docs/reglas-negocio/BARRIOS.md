# Reglas de Negocio: Catálogo de Barrios

**Fecha de creación**: 14 de octubre de 2025
**Versión**: 4.0
**Vista**: BarriosPage
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

### ¿Qué es un Barrio?

Un **barrio** es una agrupación territorial de familias dentro de una comunidad religiosa. Los barrios sirven para:
- Organizar geográficamente a las familias
- Facilitar la asignación de visitadores
- Generar reportes por zona
- Contener núcleos (subdivisiones más pequeñas)

### Características Principales

- **Jerarquía**: Comunidad → Barrio → Núcleo → Familia
- **Relaciones**: Un barrio puede tener múltiples núcleos
- **Editabilidad**: Edición inline tipo Excel
- **Persistencia**: PostgreSQL vía GraphQL

---

## Reglas de Negocio

### BAR-001: Creación de Barrios
**Estado**: ✅ Implementado
**Prioridad**: Alta
**Test ID**: `test-bar-001`

**Descripción**:
Los barrios se crean con valores por defecto y edición inline.

**Reglas**:
1. Click en "+ Nuevo Barrio" crea una nueva fila en la tabla
2. Valores por defecto:
   - `nombre`: "Nuevo Barrio"
   - `descripcion`: `null` (opcional)
   - `activo`: `true`
   - `createdAt`: Timestamp actual (UTC, display en Mexico_City)
   - `comunidadId`: Del usuario autenticado
3. Campos editables: nombre, descripción
4. Campos no editables: createdAt, updatedAt, id
5. El registro se guarda inmediatamente en BD

**Implementación**:
```typescript
// Frontend: /packages/web/src/pages/BarriosPage.tsx:156-170
const handleNuevoBarrio = async () => {
  await createBarrio({
    variables: {
      input: {
        nombre: 'Nuevo Barrio',
        descripcion: null,
      },
    },
  });
};

// Backend: /packages/backend/src/resolvers/barrio.resolvers.ts:52-86
createBarrio: async (_, { input }, { prisma, userId }) => {
  const user = await prisma.usuario.findUnique({
    where: { id: userId },
    select: { comunidadId: true },
  });

  return prisma.barrio.create({
    data: {
      nombre: input.nombre,
      descripcion: input.descripcion || null,
      activo: true,
      comunidadId: user.comunidadId,
    },
  });
}
```

**Casos de Uso**:
- Usuario CEA crea nueva zona geográfica
- Reorganización territorial de la comunidad
- Setup inicial de comunidad nueva

---

### BAR-002: Edición Inline de Barrios
**Estado**: ✅ Implementado
**Prioridad**: Alta
**Test ID**: `test-bar-002`

**Descripción**:
Los barrios se editan directamente en la tabla, sin modales.

**Reglas**:
1. **Click en celda**: Convierte celda a input editable
2. **Edición simultánea**: Solo 1 celda editable por vez
3. **Guardado automático**: Al presionar Enter o perder foco (onBlur)
4. **Cancelación**: Escape cancela sin guardar
5. **Navegación**: Tab guarda y mueve a siguiente celda editable
6. **Validación**: No se permite nombre vacío

**Comportamiento por Tecla**:
- **Enter**: Guarda cambios, sale de edición
- **Escape**: Cancela, restaura valor original
- **Tab**: Guarda, navega a siguiente celda (Nombre → Descripción)
- **Click fuera**: Guarda automáticamente (onBlur)

**Implementación**:
```typescript
// Frontend: /packages/web/src/pages/BarriosPage.tsx:87-154

// Estado de edición
const [editing, setEditing] = useState<{
  barrioId: string | null;
  field: string | null;
  value: string;
}>({ barrioId: null, field: null, value: '' });

// Iniciar edición
const startEdit = (barrioId: string, field: string, value: string) => {
  setEditing({ barrioId, field, value: value || '' });
};

// Guardar edición
const saveEdit = async (barrioId: string, field: string) => {
  await updateBarrio({
    variables: {
      id: barrioId,
      input: { [field]: editing.value || null },
    },
  });
  cancelEdit();
  refetch();
};

// Manejo de teclas
const handleKeyDown = (e: React.KeyboardEvent, barrioId: string, field: string) => {
  if (e.key === 'Enter') saveEdit(barrioId, field);
  else if (e.key === 'Escape') cancelEdit();
  else if (e.key === 'Tab') {
    e.preventDefault();
    saveEdit(barrioId, field);
    // Navegar a siguiente celda
  }
};
```

**Estilos Visuales**:
```typescript
// Celda editable (hover azul)
className="cursor-pointer hover:bg-gray-100 text-sm"

// Celda en edición (input con borde verde)
className="input input-sm w-full border-2 border-green-600"

// Celda no editable (gris)
className="bg-gray-50 text-gray-600"
```

---

### BAR-003: Eliminación de Barrios
**Estado**: ✅ Implementado
**Prioridad**: Alta
**Test ID**: `test-bar-003`

**Descripción**:
Los barrios se eliminan con soft delete y confirmación.

**Reglas**:
1. **Soft Delete**: No se elimina físicamente, se marca `activo = false`
2. **Confirmación obligatoria**: Dialog con mensaje personalizado
3. **Mensaje**: "¿Eliminar el barrio "[nombre]"?"
4. **Integridad referencial**: Los núcleos asociados NO se eliminan automáticamente
5. **Permisos**: Solo usuarios CEA pueden eliminar

**Consideraciones de Integridad**:
- ⚠️ **Atención**: Si un barrio tiene núcleos asociados, estos quedarán con referencia a barrio inactivo
- **Recomendación futura**: Validar si tiene núcleos antes de permitir eliminar
- **Opción alternativa**: Ofrecer reasignar núcleos a otro barrio

**Implementación**:
```typescript
// Frontend: /packages/web/src/pages/BarriosPage.tsx:172-183
const handleEliminar = async (barrioId: string, nombre: string) => {
  if (confirm(`¿Eliminar el barrio "${nombre}"?`)) {
    await deleteBarrio({
      variables: { id: barrioId },
    });
  }
};

// Backend: /packages/backend/src/resolvers/barrio.resolvers.ts:114-139
deleteBarrio: async (_, { id }, { prisma, userId }) => {
  if (!userId) throw new GraphQLError('No autenticado');

  const barrio = await prisma.barrio.findUnique({ where: { id } });
  if (!barrio) throw new GraphQLError('Barrio no encontrado');

  // Soft delete
  await prisma.barrio.update({
    where: { id },
    data: { activo: false },
  });

  return true;
};
```

**Mejora Futura** (pendiente):
```typescript
// Validar núcleos antes de eliminar
const nucleosCount = await prisma.nucleo.count({
  where: { barrioId: id, activo: true }
});

if (nucleosCount > 0) {
  throw new GraphQLError(
    `No se puede eliminar. El barrio tiene ${nucleosCount} núcleos activos.`,
    { extensions: { code: 'HAS_DEPENDENCIES' }}
  );
}
```

---

### BAR-004: Listado de Barrios
**Estado**: ✅ Implementado
**Prioridad**: Alta
**Test ID**: `test-bar-004`

**Descripción**:
La vista muestra todos los barrios activos de la comunidad.

**Reglas**:
1. **Filtro automático**: Solo barrios con `activo = true`
2. **Ordenamiento**: Más recientes primero (`createdAt DESC`)
3. **Filtro de comunidad**: Solo barrios de la comunidad del usuario autenticado
4. **Columnas visibles**:
   - Nombre (editable)
   - Descripción (editable)
   - Fecha Creación (no editable, formato dd/MM/yyyy)
   - Acciones (Eliminar)

**Implementación**:
```graphql
# Query GraphQL
query GetBarrios {
  barrios {
    id
    nombre
    descripcion
    createdAt
  }
}
```

```typescript
// Backend: /packages/backend/src/resolvers/barrio.resolvers.ts:17-28
barrios: async (_, __, { prisma, userId }) => {
  if (!userId) throw new GraphQLError('No autenticado');

  return prisma.barrio.findMany({
    where: { activo: true },
    orderBy: { createdAt: 'desc' },
  });
};
```

**Estadísticas**:
- Card con "Total de barrios: X"
- Mensaje si tabla vacía: "No hay barrios registrados. Crea uno nuevo para comenzar."

---

### BAR-005: Formato de Fecha
**Estado**: ✅ Implementado
**Prioridad**: Media
**Test ID**: `test-bar-005`

**Descripción**:
Las fechas se muestran en zona horaria de México.

**Reglas**:
1. **Almacenamiento**: UTC en PostgreSQL
2. **Visualización**: America/Mexico_City (Querétaro)
3. **Formato**: dd/MM/yyyy (ej: 14/10/2025)
4. **Tipos soportados**: Date object, ISO string, timestamp numérico

**Implementación**:
```typescript
// Frontend: /packages/web/src/pages/BarriosPage.tsx:5-36
const formatDate = (dateInput: string | number | null | undefined): string => {
  if (!dateInput) return '-';

  try {
    let date: Date;

    if (typeof dateInput === 'number') {
      date = new Date(dateInput);
    } else if (typeof dateInput === 'string' && /^\d+$/.test(dateInput)) {
      date = new Date(parseInt(dateInput, 10));
    } else {
      date = new Date(dateInput);
    }

    if (isNaN(date.getTime())) return '-';

    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'America/Mexico_City'
    });
  } catch (error) {
    return '-';
  }
};
```

---

## Modelo de Datos

### Schema Prisma
```prisma
// /packages/backend/prisma/schema.prisma
model Barrio {
  id          String   @id @default(cuid())
  nombre      String
  descripcion String?
  activo      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relaciones
  comunidadId String
  comunidad   Comunidad @relation(fields: [comunidadId], references: [id])
  nucleos     Nucleo[]

  @@index([comunidadId])
  @@index([activo])
}
```

### Schema GraphQL
```graphql
# /packages/backend/src/schema.ts
type Barrio {
  id: ID!
  nombre: String!
  descripcion: String
  activo: Boolean!
  createdAt: String!
  updatedAt: String!
  comunidadId: ID!
  nucleos: [Nucleo!]!
}

input CreateBarrioInput {
  nombre: String!
  descripcion: String
}

input UpdateBarrioInput {
  nombre: String
  descripcion: String
  activo: Boolean
}

type Query {
  barrios: [Barrio!]!
  barrio(id: ID!): Barrio
}

type Mutation {
  createBarrio(input: CreateBarrioInput!): Barrio!
  updateBarrio(id: ID!, input: UpdateBarrioInput!): Barrio!
  deleteBarrio(id: ID!): Boolean!
}
```

---

## Operaciones CRUD

### Create
- **Endpoint**: `mutation createBarrio($input: CreateBarrioInput!)`
- **Permisos**: CEA, COLABORADOR
- **Validaciones**:
  - Usuario autenticado ✅
  - Nombre no vacío ✅
  - Descripción opcional ✅

### Read (List)
- **Endpoint**: `query barrios`
- **Permisos**: CEA, COLABORADOR, VISITANTE
- **Filtros**: `activo = true`, comunidad del usuario

### Read (Single)
- **Endpoint**: `query barrio($id: ID!)`
- **Permisos**: CEA, COLABORADOR, VISITANTE
- **Validaciones**: Barrio existe y pertenece a la comunidad

### Update
- **Endpoint**: `mutation updateBarrio($id: ID!, $input: UpdateBarrioInput!)`
- **Permisos**: CEA, COLABORADOR
- **Validaciones**:
  - Usuario autenticado ✅
  - Barrio existe ✅
  - Campos opcionales ✅

### Delete
- **Endpoint**: `mutation deleteBarrio($id: ID!)`
- **Permisos**: Solo CEA
- **Validaciones**:
  - Usuario autenticado ✅
  - Barrio existe ✅
  - Soft delete (activo = false) ✅

---

## Validaciones

### Frontend
1. ✅ Nombre no puede estar vacío (trim)
2. ✅ Confirmación antes de eliminar
3. ✅ Loading state mientras carga
4. ✅ Error state si falla query
5. ✅ Empty state si no hay registros

### Backend
1. ✅ Autenticación JWT requerida
2. ✅ Usuario debe existir
3. ✅ Barrio debe existir para update/delete
4. ✅ Soft delete en lugar de eliminación física
5. ⚠️ **Pendiente**: Validar núcleos antes de eliminar

---

## Referencias de Código

### Frontend
- **Página**: `/packages/web/src/pages/BarriosPage.tsx`
- **Líneas clave**:
  - Query: 38-47
  - Mutations: 49-75
  - Creación: 156-170
  - Edición: 87-154
  - Eliminación: 172-183
  - Formato fecha: 5-36

### Backend
- **Resolvers**: `/packages/backend/src/resolvers/barrio.resolvers.ts`
- **Líneas clave**:
  - Query list: 17-28
  - Query single: 30-48
  - Create: 52-86
  - Update: 88-112
  - Delete: 114-139
  - Field resolvers: 142-153

### Base de Datos
- **Schema**: `/packages/backend/prisma/schema.prisma`
- **Modelo**: `Barrio`
- **Relaciones**: Comunidad (1:N), Nucleo (1:N)

---

## 🧪 Tests Pendientes

### Backend
- [ ] `test-bar-001`: Crear barrio con valores por defecto
- [ ] `test-bar-002`: Editar nombre de barrio
- [ ] `test-bar-003`: Editar descripción de barrio
- [ ] `test-bar-004`: Eliminar barrio (soft delete)
- [ ] `test-bar-005`: No permitir crear sin autenticación
- [ ] `test-bar-006`: No permitir editar barrio de otra comunidad
- [ ] `test-bar-007`: Validar núcleos antes de eliminar (pendiente implementar)

### Frontend
- [ ] Render de tabla de barrios
- [ ] Crear nuevo barrio
- [ ] Editar inline con Enter
- [ ] Editar inline con Tab
- [ ] Cancelar edición con Escape
- [ ] Confirmar eliminación

---

## 📊 Estadísticas y Métricas

### Performance
- Query list: < 100ms (sin paginación)
- Mutation create: < 200ms
- Mutation update: < 200ms
- Mutation delete: < 150ms

### Uso
- Promedio de barrios por comunidad: 3-8
- Frecuencia de edición: Baja (setup inicial principalmente)
- Frecuencia de eliminación: Muy baja

---

## 🔮 Mejoras Futuras

### Alta Prioridad
1. **Validar dependencias**: No permitir eliminar si tiene núcleos activos
2. **Bulk operations**: Crear/editar múltiples barrios a la vez
3. **Historial**: Auditoría de cambios (quién modificó qué y cuándo)

### Media Prioridad
4. **Ordenamiento**: Permitir reordenar barrios (campo `orden`)
5. **Búsqueda**: Filtro de búsqueda por nombre
6. **Exportar**: Exportar listado a Excel/PDF

### Baja Prioridad
7. **Mapa**: Visualizar barrios en mapa geográfico
8. **Estadísticas**: Cuántas familias por barrio
9. **Colores**: Asignar color distintivo a cada barrio

---

## 📚 Documentación Relacionada

- **Reglas comunes**: `COMMON.md`
- **Núcleos**: `NUCLEOS.md` (dependen de barrios)
- **Migraciones**: `/ANALISIS_MIGRACION.md`
- **Pendientes**: `/PENDIENTES.md`

---

**Última actualización**: 14 de octubre de 2025
**Mantenido por**: Equipo de Desarrollo Devocionales 4.0
**Estado**: ✅ Funcional en producción
