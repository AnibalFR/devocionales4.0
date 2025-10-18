# Reglas de Negocio: Catálogo de Familias

**Fecha de creación**: 14 de octubre de 2025
**Versión**: 4.0
**Vista**: FamiliasPage
**Estado**: ✅ Funcional - Completado 100%

---

## 📋 Índice

1. [Descripción General](#descripción-general)
2. [Reglas de Negocio](#reglas-de-negocio)
3. [Modelo de Datos](#modelo-de-datos)
4. [Operaciones CRUD](#operaciones-crud)
5. [Comparación v3.0 vs v4.0](#comparación-v30-vs-40)
6. [Funcionalidad Faltante](#funcionalidad-faltante)
7. [Referencias de Código](#referencias-de-código)

---

## Descripción General

### ¿Qué es una Familia?

Una **familia** es una agrupación de miembros que comparten domicilio y relación familiar. Las familias sirven para:
- Organizar miembros por unidad familiar
- Compartir datos comunes (dirección, barrio, núcleo)
- Rastrear reuniones devocionales familiares
- Facilitar visitas pastorales
- Generar reportes por familia

### Características Principales

- **Jerarquía**: Comunidad → Barrio → Núcleo → Familia → Miembros
- **Datos Compartidos**: Dirección, Barrio y Núcleo se sincronizan entre familia y miembros
- **Roles Familiares**: Padre, Madre, Hijo, Hija, Abuelo, Abuela
- **Editabilidad**: Edición inline tipo Excel
- **Modal de Ligado**: Asignar miembros a familia con roles
- **Persistencia**: PostgreSQL vía GraphQL

---

## Reglas de Negocio

### FAM-001: Validación de Barrios al Crear Familia (CRÍTICA)
**Estado**: ✅ Implementado
**Prioridad**: CRÍTICA
**Test ID**: `test-fam-001`

**Descripción**:
No se permite crear familias sin barrios existentes en la comunidad.

**Reglas**:
1. **Validación Frontend**: Antes de llamar mutation, verificar que existan barrios
2. **Mensaje claro**: "⚠️ Primero debes crear al menos un barrio."
3. **Prevención**: Deshabilitar botón "Nueva Familia" si no hay barrios
4. **Asignación automática**: Al crear, asignar el primer barrio disponible
5. **Razón**: Los barrios son obligatorios para organización territorial

**Implementación**:
```typescript
// Frontend: /packages/web/src/pages/FamiliasPage.tsx:187-209
const handleNuevaFamilia = async () => {
  const barrios = data?.barrios || [];

  // FAM-001: Validar que existan barrios
  if (barrios.length === 0) {
    alert('⚠️ Primero debes crear al menos un barrio.');
    return;
  }

  try {
    await createFamilia({
      variables: {
        input: {
          nombre: 'Nueva Familia',
          barrioId: barrios[0].id, // Auto-asignar primer barrio
        },
      },
    });
  } catch (error) {
    console.error('Error creating familia:', error);
    alert('Error al crear la familia');
  }
};
```

**Comparación con v3.0**:
- ✅ v3.0: Validación presente (línea 679-684)
- ✅ v4.0: Validación presente (línea 190-194)
- ✅ **MIGRADO CORRECTAMENTE**

**Casos de Uso**:
- Usuario CEA intenta crear familia sin barrios configurados
- Setup inicial de comunidad nueva
- Prevenir inconsistencias de datos

---

### FAM-002: Filtrado de Miembros Disponibles
**Estado**: ✅ Implementado
**Prioridad**: Alta
**Test ID**: `test-fam-002`

**Descripción**:
En el modal de ligado de miembros, solo mostrar miembros que NO están ligados a otra familia.

**Reglas**:
1. **Criterio de disponibilidad**: Un miembro está disponible si:
   - NO tiene `familiaId` asignado (libre), O
   - Está ligado a la familia actual (permite editar)
2. **Ocultar ligados**: No mostrar miembros de otras familias
3. **Permitir edición**: Si el miembro ya está ligado a esta familia, mostrarlo para permitir desligar o cambiar rol
4. **Indicador visual**: En v3.0 se marcaban con fondo azul los ya ligados

**Implementación**:
```typescript
// Frontend: /packages/web/src/pages/FamiliasPage.tsx:371-378
// FAM-002: Filter available members (not linked to other families)
const availableMiembros = modal.familiaId
  ? allMiembros.filter(
      (m: any) =>
        !m.familiaId || // Not linked to any family
        m.familiaId === modal.familiaId // Already linked to this familia
    )
  : [];
```

**Comparación con v3.0**:
```javascript
// v3.0: /catalogo-familias.html:871-874
let filteredMembers = allMembers.filter(m =>
  m.familia_id === currentFamiliaIdForLinking || !m.familia_id
);
```
- ✅ v3.0: Filtrado presente (línea 872-874)
- ✅ v4.0: Filtrado presente (línea 373-377)
- ✅ **MIGRADO CORRECTAMENTE**

**Casos de Uso**:
- Evitar que un miembro esté en dos familias simultáneamente
- Permitir reasignación de miembros (desligar de una familia para ligar a otra)
- Facilitar la selección sin opciones inválidas

---

### FAM-003: Selector Inteligente de Dirección
**Estado**: ✅ Implementado
**Prioridad**: Alta
**Test ID**: `test-fam-003`

**Descripción**:
Al ligar miembros a una familia, el sistema debe ofrecer un selector inteligente de direcciones basado en los miembros seleccionados.

**Reglas**:
1. **Recolectar direcciones**: De todos los miembros seleccionados con dirección definida
2. **Direcciones únicas**: Mostrar solo direcciones únicas en el selector
3. **Auto-selección**:
   - Si todos los miembros tienen la misma dirección → auto-seleccionar
   - Si solo hay un miembro seleccionado → auto-seleccionar su dirección
   - Si hay múltiples direcciones → usuario debe elegir manualmente
4. **Sincronización**: La dirección elegida se aplicará a:
   - La familia
   - Todos los miembros ligados

**Implementación v4.0** (solo lógica, sin UI):
```typescript
// Frontend: /packages/web/src/pages/FamiliasPage.tsx:273-287
// FAM-003: Intelligent address selector
// Get unique addresses from selected members
const addresses = selectedMiembrosData
  .map((m: any) => m.direccion)
  .filter((addr: string) => addr);
const uniqueAddresses = [...new Set(addresses)];

let selectedAddress = familia?.direccion || '';
if (uniqueAddresses.length === 1) {
  // Auto-select if all have same address
  selectedAddress = uniqueAddresses[0];
} else if (selectedMiembrosData.length === 1) {
  // Auto-select if only one member
  selectedAddress = selectedMiembrosData[0].direccion || '';
}
```

**Implementación v3.0** (con UI completa):
```javascript
// v3.0: /catalogo-familias.html:808-820
const selectedAddresses = [...new Set(selectedMembers.filter(m => m.address).map(m => m.address))];
addressSelect.innerHTML = '<option value="">Seleccionar dirección...</option>';
if (selectedAddresses.length > 0) {
  selectedAddresses.forEach(address => {
    addressSelect.innerHTML += `<option value="${address}">📍 ${address}</option>`;
  });
  if (selectedAddresses.length === 1) {
    addressSelect.value = selectedAddresses[0];
  }
}
```

**Comparación con v3.0**:
- ✅ v3.0: UI completa con dropdown (línea 106-111, 799-820)
- ✅ v4.0: UI completa con dropdown + opción manual (línea 1060-1090)
- ✅ **MIGRADO COMPLETAMENTE**

**Implementación v4.0 (COMPLETA)**:
```tsx
{/* Selector de Dirección con UI completa - FamiliasPage.tsx:1060-1090 */}
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Dirección: <span className="text-red-500">*</span>
  </label>
  <select
    value={modal.selectedAddress}
    onChange={(e) => setModal({ ...modal, selectedAddress: e.target.value })}
    className="select select-bordered w-full select-sm"
  >
    <option value="">Seleccionar dirección...</option>
    {uniqueAddresses.map((addr) => (
      <option key={addr} value={addr}>📍 {addr}</option>
    ))}
    <option value="manual">✏️ Escribir manualmente...</option>
  </select>
  {modal.selectedAddress === 'manual' && (
    <input
      type="text"
      placeholder="Escribe la dirección"
      onChange={(e) => setModal({ ...modal, selectedAddress: e.target.value })}
      className="input input-bordered w-full input-sm mt-2"
      autoFocus
    />
  )}
</div>
```

---

### FAM-004: Sincronización de Datos Compartidos
**Estado**: ✅ Implementado
**Prioridad**: CRÍTICA
**Test ID**: `test-fam-004`

**Descripción**:
Cuando se ligan miembros a una familia, los datos compartidos (dirección, barrio, núcleo) se sincronizan automáticamente entre la familia y todos sus miembros.

**Reglas**:
1. **Datos compartidos**:
   - `direccion` / `address`
   - `barrioId` / `barrio_id`
   - `nucleoId` / `nucleo_id`
2. **Sincronización bidireccional**:
   - Al ligar miembros → actualizar familia con datos de miembros
   - Al actualizar familia → propagar cambios a todos los miembros
3. **Selección inteligente**:
   - Dirección: de miembros seleccionados (FAM-003)
   - Barrio: del primer miembro o familia actual
   - Núcleo: del primer miembro o familia actual
4. **Propagación**: Todos los miembros ligados quedan con los mismos valores

**Implementación**:
```typescript
// Frontend: /packages/web/src/pages/FamiliasPage.tsx:289-336
// FAM-004: Determine shared barrio/nucleo
const sharedBarrioId = familia?.barrioId || selectedMiembrosData[0]?.barrioId || null;
const sharedNucleoId = familia?.nucleoId || selectedMiembrosData[0]?.nucleoId || null;

// Update familia with shared data
await updateFamilia({
  variables: {
    id: modal.familiaId,
    input: {
      direccion: selectedAddress,
      barrioId: sharedBarrioId,
      nucleoId: sharedNucleoId,
    },
  },
});

// Update all selected members with familia link, role, and shared data
for (const miembroId of modal.selectedMiembros) {
  await updateMiembro({
    variables: {
      id: miembroId,
      input: {
        familiaId: modal.familiaId,
        rolFamiliar: modal.roles[miembroId] || null,
        direccion: selectedAddress,
        barrioId: sharedBarrioId,
        nucleoId: sharedNucleoId,
      },
    },
  });
}

// Unlink members that were deselected
const previouslyLinked = familia?.miembros.map((m: any) => m.id) || [];
const toUnlink = previouslyLinked.filter(
  (id: string) => !modal.selectedMiembros.has(id)
);
for (const miembroId of toUnlink) {
  await updateMiembro({
    variables: {
      id: miembroId,
      input: {
        familiaId: null,
        rolFamiliar: null,
      },
    },
  });
}
```

**Comparación con v3.0**:
```javascript
// v3.0: /catalogo-familias.html:998-1020
// Update familia with shared data
Storage.updateFamilia(currentFamiliaIdForLinking, {
  address: selectedAddress,
  barrio_id: selectedBarrioId,
  nucleo_id: selectedNucleoId
});

// Update all members with shared data
allMembers.forEach(miembro => {
  if (selectedMemberIds.includes(miembro.id)) {
    miembro.familia_id = currentFamiliaIdForLinking;
    miembro.barrio_id = selectedBarrioId;
    miembro.nucleo_id = selectedNucleoId;
    miembro.address = selectedAddress;
    miembro.rol_familiar = rolesMap[miembro.id] || null;
  }
});
```
- ✅ v3.0: Sincronización completa (línea 998-1020)
- ✅ v4.0: Sincronización completa (línea 289-336)
- ✅ **MIGRADO CORRECTAMENTE**

**Ventajas**:
- Consistencia de datos garantizada
- Evita desincronización entre familia y miembros
- Facilita reportes y filtros por barrio/núcleo

---

### FAM-005: Asignación de Roles Familiares
**Estado**: ✅ Implementado
**Prioridad**: Media
**Test ID**: `test-fam-005`

**Descripción**:
Cada miembro ligado a una familia puede tener un rol familiar asignado.

**Reglas**:
1. **Roles disponibles**:
   - Padre
   - Madre
   - Hijo
   - Hija
   - Abuelo
   - Abuela
2. **Campo opcional**: Un miembro puede no tener rol asignado
3. **Asignación en modal**: Dropdown visible solo si el miembro está seleccionado
4. **Visualización**: Mostrar rol entre paréntesis junto al nombre en vistas expandidas
5. **Persistencia**: Se guarda en campo `rolFamiliar` del miembro

**Implementación**:
```typescript
// Frontend: /packages/web/src/pages/FamiliasPage.tsx:110
const ROLES_FAMILIARES = ['Padre', 'Madre', 'Hijo', 'Hija', 'Abuelo', 'Abuela'];

// Modal - Rol Familiar Selector: 658-672
{modal.selectedMiembros.has(miembro.id) && (
  <select
    value={modal.roles[miembro.id] || ''}
    onChange={(e) => setMiembroRol(miembro.id, e.target.value)}
    className="input input-sm w-32"
  >
    <option value="">Sin rol</option>
    {ROLES_FAMILIARES.map((rol) => (
      <option key={rol} value={rol}>
        {rol}
      </option>
    ))}
  </select>
)}

// Actualización de miembro con rol: 312
rolFamiliar: modal.roles[miembroId] || null,

// Visualización en subrows: 588-590
{miembro.rolFamiliar && (
  <span className="text-gray-500"> ({miembro.rolFamiliar})</span>
)}
```

**Comparación con v3.0**:
```javascript
// v3.0: /catalogo-familias.html:931-939
const rolFamiliarSelect = document.createElement('select');
rolFamiliarSelect.innerHTML = `
  <option value="">-</option>
  <option value="padre">Padre</option>
  <option value="madre">Madre</option>
  <option value="hijo">Hijo</option>
  <option value="hija">Hija</option>
  <option value="abuelo">Abuelo</option>
  <option value="abuela">Abuela</option>
`;
```
- ✅ v3.0: Roles implementados (línea 920-941)
- ✅ v4.0: Roles implementados (línea 658-672)
- ✅ **MIGRADO CORRECTAMENTE**
- ⚠️ Nota: v3.0 usaba lowercase ("padre"), v4.0 usa PascalCase ("Padre")

---

### FAM-006: Visualización Expandible de Miembros
**Estado**: ✅ Implementado
**Prioridad**: Alta
**Test ID**: `test-fam-006`

**Descripción**:
Cada familia en la tabla puede expandirse para mostrar sus miembros ligados como subfilas.

**Reglas**:
1. **Icono expandir/colapsar**:
   - ▶ (chevron-right): Fila colapsada
   - ▼ (chevron-down): Fila expandida
2. **Visibilidad del icono**: Solo mostrar si la familia tiene miembros ligados
3. **Subfilas**:
   - Fondo gris claro (#f8f9fa)
   - Indentación visual (↳)
   - Mostrar nombre completo + rol familiar
   - Mostrar indicador si tiene devocional (✓ Devocional)
4. **Datos de miembro**:
   - Nombre completo
   - Rol familiar (si existe)
   - Teléfono
   - Indicador de devocional

**Implementación**:
```typescript
// Frontend: /packages/web/src/pages/FamiliasPage.tsx:143-151
const toggleRow = (familiaId: string) => {
  const newExpanded = new Set(expandedRows);
  if (newExpanded.has(familiaId)) {
    newExpanded.delete(familiaId);
  } else {
    newExpanded.add(familiaId);
  }
  setExpandedRows(newExpanded);
};

// Botón expandir: 465-471
<button
  onClick={() => toggleRow(familia.id)}
  className="text-gray-600 hover:text-gray-900"
>
  {isExpanded ? '▼' : '▶'}
</button>

// Subfilas de miembros: 578-603
{isExpanded &&
  familia.miembros.map((miembro: any) => (
    <tr key={`member-${miembro.id}`} className="bg-gray-50">
      <td className="px-4 py-2"></td>
      <td colSpan={7} className="px-4 py-2">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-600">↳</span>
          <span className="font-medium text-gray-900">
            {miembro.nombre} {miembro.apellidos}
            {miembro.rolFamiliar && (
              <span className="text-gray-500"> ({miembro.rolFamiliar})</span>
            )}
          </span>
          {miembro.telefono && (
            <span className="text-gray-600">📞 {miembro.telefono}</span>
          )}
          {miembro.tieneDevocional && (
            <span className="text-green-600 text-xs font-semibold">
              ✓ Devocional
            </span>
          )}
        </div>
      </td>
    </tr>
  ))}
```

**Comparación con v3.0**:
- ✅ v3.0: Expandible con 11 columnas en subfilas (línea 1038-1160)
- ✅ v4.0: Expandible con diseño simplificado (línea 578-603)
- ✅ **MIGRADO CORRECTAMENTE**
- ℹ️ v4.0 usa diseño más compacto (horizontal) vs v3.0 (columnas completas)

---

### FAM-007: Indicador de Devocional
**Estado**: ✅ Implementado
**Prioridad**: Alta
**Test ID**: `test-fam-007`

**Descripción**:
La columna "Devocional" muestra "Sí" si al menos un miembro de la familia tiene reunión devocional.

**Reglas**:
1. **Criterio**: Buscar en todos los miembros de la familia
2. **Condición**: Si `miembro.tieneDevocional === true` para al menos uno
3. **Display**:
   - "Sí" en verde si tiene devocional
   - "No" en gris si no tiene
4. **Lógica**: Campo calculado en tiempo de renderizado (no persistido)
5. **Fuente de verdad**: Campo `tieneDevocional` del miembro

**Implementación**:
```typescript
// Frontend: /packages/web/src/pages/FamiliasPage.tsx:457-458
// FAM-007: Check if any member has devocional
const tieneDevocional = familia.miembros.some((m: any) => m.tieneDevocional);

// Display en tabla: 550-557
{/* Devocional (FAM-007) */}
<td className="px-4 py-2 text-sm">
  {tieneDevocional ? (
    <span className="text-green-600 font-semibold">Sí</span>
  ) : (
    <span className="text-gray-400">No</span>
  )}
</td>
```

**Comparación con v3.0**:
```javascript
// v3.0: /catalogo-familias.html:398-411
const miembrosConDevocional = Storage.getMiembros().filter(m =>
  m.familia_id === familia.id && m.tiene_devocional === true
);
const tieneDevocional = miembrosConDevocional.length > 0;

const devBadge = tieneDevocional
  ? '<span class="dev-badge si">Sí</span>'
  : '<span class="dev-badge no">No</span>';
```
- ✅ v3.0: Indicador implementado (línea 398-411)
- ✅ v4.0: Indicador implementado (línea 457-458, 550-557)
- ✅ **MIGRADO CORRECTAMENTE**

**Nota importante**:
Este campo es de solo lectura en el catálogo de familias. Para cambiar el estado devocional, se debe editar en el **Catálogo de Miembros**.

---

## Modelo de Datos

### Schema Prisma
```prisma
// /packages/backend/prisma/schema.prisma
model Familia {
  id        String   @id @default(cuid())
  nombre    String
  direccion String?
  telefono  String?
  email     String?
  barrioId  String
  nucleoId  String?
  estatus   String   @default("active") // 'active' | 'inactive'
  notas     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relaciones
  comunidadId String
  comunidad   Comunidad @relation(fields: [comunidadId], references: [id])
  barrio      Barrio    @relation("FamiliaToBarrio", fields: [barrioId], references: [id])
  nucleo      Nucleo?   @relation("FamiliaToNucleo", fields: [nucleoId], references: [id])
  miembros    Miembro[]
  visitas     Visita[]

  @@index([comunidadId])
  @@index([barrioId])
  @@index([nucleoId])
}

model Miembro {
  id            String   @id @default(cuid())
  nombre        String
  apellidos     String?
  telefono      String?
  direccion     String?
  barrioId      String?
  nucleoId      String?
  familiaId     String?
  rolFamiliar   String?  // 'Padre' | 'Madre' | 'Hijo' | 'Hija' | 'Abuelo' | 'Abuela'
  tieneDevocional Boolean @default(false)
  // ... otros campos ...

  // Relaciones
  familia Familia? @relation(fields: [familiaId], references: [id])
  barrio  Barrio?  @relation(fields: [barrioId], references: [id])
  nucleo  Nucleo?  @relation(fields: [nucleoId], references: [id])

  @@index([familiaId])
  @@index([barrioId])
  @@index([nucleoId])
}
```

### Schema GraphQL
```graphql
# /packages/backend/src/schema.ts
type Familia {
  id: ID!
  nombre: String!
  direccion: String
  telefono: String
  email: String
  barrio: String
  barrioId: ID!
  nucleoId: ID
  estatus: String!
  notas: String
  createdAt: String!
  updatedAt: String!
  comunidadId: ID!

  # Field resolvers
  barrioRel: Barrio
  nucleoRel: Nucleo
  miembros: [Miembro!]!
}

input CreateFamiliaInput {
  nombre: String!
  direccion: String
  telefono: String
  email: String
  barrioId: ID!
  nucleoId: ID
  estatus: String
  notas: String
}

input UpdateFamiliaInput {
  nombre: String
  direccion: String
  telefono: String
  email: String
  barrioId: ID
  nucleoId: ID
  estatus: String
  notas: String
}

type Query {
  familias: [Familia!]!
  familia(id: ID!): Familia
}

type Mutation {
  createFamilia(input: CreateFamiliaInput!): Familia!
  updateFamilia(id: ID!, input: UpdateFamiliaInput!): Familia!
  deleteFamilia(id: ID!): Boolean!
}
```

---

## Operaciones CRUD

### Create
- **Endpoint**: `mutation createFamilia($input: CreateFamiliaInput!)`
- **Permisos**: CEA, COLABORADOR
- **Validaciones**:
  - Usuario autenticado ✅
  - Barrios existentes (FAM-001) ✅
  - Nombre no vacío ✅
  - barrioId obligatorio ✅

### Read (List)
- **Endpoint**: `query familias`
- **Permisos**: CEA, COLABORADOR, VISITANTE
- **Filtros**: Comunidad del usuario
- **Includes**: barrios, nucleos, miembros (para modal)

### Read (Single)
- **Endpoint**: `query familia($id: ID!)`
- **Permisos**: CEA, COLABORADOR, VISITANTE
- **Validaciones**: Familia existe y pertenece a la comunidad

### Update
- **Endpoint**: `mutation updateFamilia($id: ID!, $input: UpdateFamiliaInput!)`
- **Permisos**: CEA, COLABORADOR
- **Validaciones**:
  - Usuario autenticado ✅
  - Familia existe ✅
  - Campos opcionales ✅

### Delete
- **Endpoint**: `mutation deleteFamilia($id: ID!)`
- **Permisos**: Solo CEA
- **Validaciones**:
  - Usuario autenticado ✅
  - Familia existe ✅
  - Soft delete ✅

---

## Comparación v3.0 vs v4.0

### ✅ Características Migradas Correctamente (100%)

| Feature | v3.0 | v4.0 | Estado |
|---------|------|------|--------|
| **FAM-001**: Validación de barrios | ✅ | ✅ | ✅ Migrado |
| **FAM-002**: Filtrado de miembros disponibles | ✅ | ✅ | ✅ Migrado |
| **FAM-003**: Dirección inteligente con UI | ✅ | ✅ | ✅ Migrado |
| **FAM-004**: Sincronización de datos compartidos | ✅ | ✅ | ✅ Migrado |
| **FAM-005**: Roles familiares | ✅ | ✅ | ✅ Migrado |
| **FAM-006**: Filas expandibles | ✅ | ✅ | ✅ Migrado |
| **FAM-007**: Indicador devocional | ✅ | ✅ | ✅ Migrado |
| **Paginación** (10/20/50) | ✅ | ✅ | ✅ Migrado |
| **Columna Núcleo** | ✅ | ✅ | ✅ Migrado |
| **Columna Estatus** (editable) | ✅ | ✅ | ✅ Migrado |
| **Columna Notas** (editable) | ✅ | ✅ | ✅ Migrado |
| **Columna Fecha Creación** | ✅ | ✅ | ✅ Migrado |
| **Filtros** (Devocional, Estatus) | ✅ | ✅ | ✅ Migrado |
| **Ordenamiento** (4 opciones) | ✅ | ✅ | ✅ Migrado |
| **Tab navigation** | ✅ | ✅ | ✅ Migrado |
| **UI Selectores en Modal** | ✅ | ✅ | ✅ Migrado |
| **Search en Modal** | ✅ | ✅ | ✅ Migrado |
| **Edición inline** | ✅ | ✅ | ✅ Migrado |
| **Soft delete** | ✅ | ✅ | ✅ Migrado |
| **Confirmación de eliminación** | ✅ | ✅ | ✅ Migrado |

### ✅ Funcionalidad Completada (Octubre 2025)

**TODAS las funcionalidades han sido implementadas exitosamente:**

| Feature | Líneas en v4.0 | Estado |
|---------|----------------|--------|
| **Paginación** (10/20/50) | 159-161, 540-555, 956-1029 | ✅ Implementado |
| **Columna Núcleo** | 671-673, 811-814 | ✅ Implementado |
| **Columna Estatus** (editable) | 680-682, 830-862 | ✅ Implementado |
| **Columna Notas** (editable) | 683-685, 864-887 | ✅ Implementado |
| **Columna Fecha Creación** | 686-688, 889-895 | ✅ Implementado |
| **Filtros** (Devocional, Estatus) | 163-165, 505-525, 605-637 | ✅ Implementado |
| **Ordenamiento** (4 opciones) | 168, 527-538, 590-603 | ✅ Implementado |
| **UI Selectores en Modal** | 1049-1144 | ✅ Implementado |
| **Tab navigation** | 225-251 | ✅ Implementado |
| **Search en Modal** | 179, 1146-1154, 485-492 | ✅ Implementado |

---

## 🎉 Funcionalidad Completada (Octubre 2025)

**TODAS las funcionalidades críticas y medias han sido implementadas exitosamente.**

### ✅ Implementaciones Completadas

#### 1. Paginación ✅
**Impacto**: CRÍTICO (renderizar +100 familias causa lentitud extrema)
**Estado**: ✅ IMPLEMENTADO

```tsx
// Agregar estado de paginación
const [pagination, setPagination] = useState({
  currentPage: 1,
  pageSize: 20,
  total: 0
});

// Agregar controles de paginación
<div className="pagination-controls">
  <select value={pagination.pageSize} onChange={handlePageSizeChange}>
    <option value="10">10</option>
    <option value="20">20</option>
    <option value="50">50</option>
  </select>
  <button onClick={previousPage}>← Anterior</button>
  <span>Página {pagination.currentPage} de {totalPages}</span>
  <button onClick={nextPage}>Siguiente →</button>
</div>
```

**Referencia v3.0**: líneas 70-89, 716-766

#### 2. Columnas Faltantes en Tabla

**Núcleo** (CRÍTICO):
```tsx
{/* FamiliasPage.tsx:671-673, 811-814 */}
<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">
  Núcleo
</th>

<td className="px-4 py-2 text-sm text-gray-700">
  {familia.nucleoRel?.nombre || '-'}
</td>
```

**Estatus** ✅ IMPLEMENTADO (línea 680-682, 830-862) - EDITABLE:
```tsx
{/* Agregar antes de columna Acciones */}
<th className="px-4 py-3">Estatus</th>

{/* En el tbody - editable */}
{editing.familiaId === familia.id && editing.field === 'estatus' ? (
  <td className="px-4 py-2">
    <select
      value={editing.value}
      onChange={(e) => setEditing({ ...editing, value: e.target.value })}
      onKeyDown={(e) => handleKeyDown(e, familia.id, 'estatus')}
      onBlur={() => saveEdit(familia.id, 'estatus')}
      autoFocus
      className="input input-sm w-full"
    >
      <option value="active">Activa</option>
      <option value="inactive">Inactiva</option>
    </select>
  </td>
) : (
  <td
    className="px-4 py-2 cursor-pointer hover:bg-gray-100"
    onClick={() => startEdit(familia.id, 'estatus', familia.estatus)}
  >
    <span className={`badge ${familia.estatus === 'active' ? 'badge-success' : 'badge-error'}`}>
      {familia.estatus === 'active' ? 'Activa' : 'Inactiva'}
    </span>
  </td>
)}
```

**Notas** (MEDIA):
```tsx
{/* FamiliasPage.tsx:683-685, 864-887 - EDITABLE */}
<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-48">
  Notas
</th>

{editing.familiaId === familia.id && editing.field === 'notas' ? (
  <td className="px-4 py-2">
    <input
      type="text"
      value={editing.value}
      onChange={(e) => setEditing({ ...editing, value: e.target.value })}
      onKeyDown={(e) => handleKeyDown(e, familia.id, 'notas')}
      onBlur={() => saveEdit(familia.id, 'notas')}
      autoFocus
      className="input input-sm w-full border-2 border-green-600"
    />
  </td>
) : (
  <td
    className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-sm text-gray-700 truncate max-w-[200px] editable-cell"
    onClick={() => startEdit(familia.id, 'notas', familia.notas)}
    title={familia.notas || ''}
  >
    {familia.notas || '-'}
  </td>
)}
```

**Fecha Creación** ✅ IMPLEMENTADO (línea 686-688, 889-895) - NO EDITABLE:
```tsx
{/* FamiliasPage.tsx:686-688, 889-895 - NO EDITABLE */}
<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">
  Fecha Creación
</th>

<td
  className="px-4 py-2 text-sm bg-gray-50 text-gray-600"
  title="Campo automático - No se puede editar"
>
  {formatDate(familia.createdAt)}
</td>
```

**Referencia v3.0**: líneas 48-60, 379-448

#### 3. UI Selectores en Modal de Ligado ✅

**Dirección, Barrio y Núcleo** ✅ IMPLEMENTADO (línea 1049-1144):
```tsx
{/* Agregar antes de la lista de miembros */}
<div className="mb-6 p-4 bg-gray-50 rounded-lg">
  <h4 className="font-semibold mb-3">Datos Compartidos de la Familia</h4>
  <p className="text-sm text-gray-600 mb-4">
    Estos datos se aplicarán a todos los miembros ligados.
  </p>

  {/* Selector de Dirección (FAM-003) */}
  <div className="mb-3">
    <label className="block font-medium mb-1">Dirección:</label>
    <select
      id="addressSelect"
      value={selectedAddress}
      onChange={(e) => setSelectedAddress(e.target.value)}
      className="select select-bordered w-full"
    >
      <option value="">Seleccionar dirección...</option>
      {uniqueAddresses.map(addr => (
        <option key={addr} value={addr}>📍 {addr}</option>
      ))}
    </select>
  </div>

  {/* Selector de Barrio */}
  <div className="mb-3">
    <label className="block font-medium mb-1">Barrio:</label>
    <select
      id="barrioSelect"
      value={selectedBarrioId}
      onChange={(e) => setSelectedBarrioId(e.target.value)}
      className="select select-bordered w-full"
    >
      <option value="">Seleccionar barrio...</option>
      {barrios.map(b => (
        <option key={b.id} value={b.id}>{b.nombre}</option>
      ))}
    </select>
  </div>

  {/* Selector de Núcleo */}
  <div>
    <label className="block font-medium mb-1">Núcleo:</label>
    <select
      id="nucleoSelect"
      value={selectedNucleoId || ''}
      onChange={(e) => setSelectedNucleoId(e.target.value || null)}
      className="select select-bordered w-full"
    >
      <option value="">Sin núcleo</option>
      {nucleos
        .filter(n => n.barrioId === selectedBarrioId)
        .map(n => (
          <option key={n.id} value={n.id}>{n.nombre}</option>
        ))}
    </select>
  </div>
</div>
```

**Referencia v3.0**: líneas 100-128, 799-861

### ⚠️ MEDIA Prioridad

#### 4. Filtros de Devocional y Estatus

```tsx
{/* FamiliasPage.tsx:605-637 - IMPLEMENTADO */}
{/* Filtro Devocional */}
<div className="flex items-center gap-2">
  <label className="text-sm font-medium text-gray-700">Devocional:</label>
  <select
    value={filterDevocional}
    onChange={(e) => {
      setFilterDevocional(e.target.value as any);
      setCurrentPage(1);
    }}
    className="select select-sm select-bordered"
  >
    <option value="all">Todas</option>
    <option value="con-devocional">Con Devocional</option>
    <option value="sin-devocional">Sin Devocional</option>
  </select>
</div>

{/* Filtro Estatus */}
<div className="flex items-center gap-2">
  <label className="text-sm font-medium text-gray-700">Estatus:</label>
  <select
    value={filterEstatus}
    onChange={(e) => {
      setFilterEstatus(e.target.value as any);
      setCurrentPage(1);
    }}
    className="select select-sm select-bordered"
  >
    <option value="all">Todas</option>
    <option value="active">Activas</option>
    <option value="inactive">Inactivas</option>
  </select>
</div>

{/* Lógica de filtrado - FamiliasPage.tsx:505-525 */}
if (filterDevocional === 'con-devocional') {
  filteredFamilias = filteredFamilias.filter(f => f.miembros.some(m => m.tieneDevocional));
} else if (filterDevocional === 'sin-devocional') {
  filteredFamilias = filteredFamilias.filter(f => !f.miembros.some(m => m.tieneDevocional));
}

if (filterEstatus === 'active') {
  filteredFamilias = filteredFamilias.filter(f => f.estatus === 'active');
} else if (filterEstatus === 'inactive') {
  filteredFamilias = filteredFamilias.filter(f => f.estatus === 'inactive');
}
```

**Referencia v3.0**: líneas 17-32, 224-243

#### 5. Ordenamiento ✅

✅ IMPLEMENTADO (línea 168, 527-538, 590-603):

```tsx
{/* FamiliasPage.tsx:590-603 - IMPLEMENTADO */}
<div className="flex items-center gap-2">
  <label className="text-sm font-medium text-gray-700">Ordenar:</label>
  <select
    value={sortBy}
    onChange={(e) => setSortBy(e.target.value as any)}
    className="select select-sm select-bordered"
  >
    <option value="fecha">Fecha de Registro</option>
    <option value="nombre">Nombre (A-Z)</option>
    <option value="miembros-desc">Más miembros primero</option>
    <option value="miembros-asc">Menos miembros primero</option>
  </select>
</div>

{/* Lógica de ordenamiento - FamiliasPage.tsx:527-538 */}
if (sortBy === 'nombre') {
  filteredFamilias.sort((a, b) => a.nombre.localeCompare(b.nombre));
} else if (sortBy === 'miembros-desc') {
  filteredFamilias.sort((a, b) => b.miembros.length - a.miembros.length);
} else if (sortBy === 'miembros-asc') {
  filteredFamilias.sort((a, b) => a.miembros.length - b.miembros.length);
} else if (sortBy === 'fecha') {
  filteredFamilias.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
```

**Referencia v3.0**: líneas 6-14, 245-260

#### 6. Tab Navigation en Edición Inline ✅

✅ IMPLEMENTADO (línea 225-251):

```tsx
{/* FamiliasPage.tsx:225-251 - IMPLEMENTADO */}
const handleKeyDown = (e: React.KeyboardEvent, familiaId: string, field: string) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    saveEdit(familiaId, field);
  } else if (e.key === 'Escape') {
    e.preventDefault();
    cancelEdit();
  } else if (e.key === 'Tab') {
    e.preventDefault();
    saveEdit(familiaId, field);

    // Navegar a siguiente celda editable
    const cell = (e.target as HTMLElement).closest('td');
    const row = cell?.closest('tr');
    const cells = Array.from(row?.cells || []);
    const currentIndex = cells.indexOf(cell as HTMLTableCellElement);

    // Buscar siguiente celda editable
    for (let i = currentIndex + 1; i < cells.length; i++) {
      const nextCell = cells[i] as HTMLTableCellElement;
      if (nextCell.classList.contains('editable-cell')) {
        setTimeout(() => nextCell.click(), 50);
        break;
      }
    }
  }
};
```

**Referencia v3.0**: líneas 634-666

#### 7. Search en Modal de Miembros ✅

✅ IMPLEMENTADO (línea 179, 1146-1154, 485-492):

```tsx
{/* FamiliasPage.tsx:1146-1154 - IMPLEMENTADO */}
<div className="mb-4">
  <input
    type="text"
    placeholder="🔍 Buscar por nombre..."
    value={modal.searchMember}
    onChange={(e) => setModal({ ...modal, searchMember: e.target.value })}
    className="input input-bordered w-full"
  />
</div>

{/* Filtrado integrado - FamiliasPage.tsx:485-492 */}
const availableMiembros = modal.familiaId
  ? allMiembros.filter(
      (m: any) =>
        (!m.familiaId || m.familiaId === modal.familiaId) &&
        (modal.searchMember === '' ||
          m.nombre.toLowerCase().includes(modal.searchMember.toLowerCase()) ||
          m.apellidos?.toLowerCase().includes(modal.searchMember.toLowerCase()))
    )
  : [];
```

**Referencia v3.0**: líneas 130-132, 877-882

---

## Referencias de Código

### v3.0 - `/catalogo-familias.html`
- **Estructura HTML**: 1-157
- **Paginación**: 70-89, 716-766
- **Modal de ligado**: 92-157, 776-1030
- **Edición inline**: 473-667
- **Expandible**: 1038-1160
- **Filtros**: 224-275
- **Selectores inteligentes**: 799-861
- **Roles familiares**: 920-941
- **Total**: 1,172 líneas

### v4.0 - `/packages/web/src/pages/FamiliasPage.tsx`
- **GraphQL Queries**: 5-108
- **Handlers**: 187-345
- **FAM-001**: 190-194
- **FAM-002**: 371-378
- **FAM-003**: 273-287
- **FAM-004**: 289-336
- **FAM-005**: 658-672
- **FAM-006**: 578-603
- **FAM-007**: 457-458, 550-557
- **Modal**: 622-704
- **Total**: 708 líneas

### Backend
- **Resolvers**: `/packages/backend/src/resolvers/familia.resolvers.ts`
- **Schema**: `/packages/backend/src/schema.ts`
- **Prisma**: `/packages/backend/prisma/schema.prisma`

---

## 🧪 Tests Pendientes

### Backend
- [ ] `test-fam-001`: Rechazar creación sin barrios
- [ ] `test-fam-002`: Filtrar miembros disponibles correctamente
- [ ] `test-fam-003`: Selector inteligente de dirección
- [ ] `test-fam-004`: Sincronización de datos compartidos
- [ ] `test-fam-005`: Asignación de roles familiares
- [ ] `test-fam-006`: Cálculo de devocional basado en miembros
- [ ] `test-fam-007`: Soft delete de familia
- [ ] `test-fam-008`: Desligar miembros al eliminar familia

### Frontend
- [ ] Render de tabla de familias
- [ ] Crear nueva familia
- [ ] Editar inline con Enter
- [ ] Modal de ligado de miembros
- [ ] Expandir/colapsar filas
- [ ] Indicador de devocional

---

## 📊 Resumen de Migración

### Métricas Generales

| Métrica | v3.0 | v4.0 Antes | v4.0 AHORA | Diferencia |
|---------|------|------------|------------|------------|
| **Líneas de código** | 1,172 | 708 | 1,270 | +8.4% vs v3.0 |
| **Columnas visibles** | 11 | 8 | 12 | **+1 columna** (Expand) |
| **Reglas de negocio** | 7 | 7 | 7 | ✅ 100% |
| **Features críticos** | 17 | 7 | **17** | **✅ 100%** |

### Estado de Reglas de Negocio (100% Completado)

| Regla | Estado | Implementación |
|-------|--------|----------------|
| FAM-001 | ✅ | Completo - Validación de barrios (línea 256-259) |
| FAM-002 | ✅ | Completo - Filtrado de miembros (línea 484-492) |
| FAM-003 | ✅ | **Completo - UI selectores (línea 1060-1090)** |
| FAM-004 | ✅ | Completo - Sincronización datos (línea 395-421) |
| FAM-005 | ✅ | Completo - Roles familiares (línea 1208-1222) |
| FAM-006 | ✅ | Completo - Filas expandibles (línea 917-946) |
| FAM-007 | ✅ | Completo - Indicador devocional (línea 708-711, 822-828) |

### Features Implementadas por Prioridad (Octubre 2025)

**✅ CRÍTICO** (7 features implementadas):
1. ✅ Paginación (10/20/50 por página) - Línea 159-161, 540-555, 956-1029
2. ✅ Columna Núcleo - Línea 671-673, 811-814
3. ✅ Columna Estatus (Activa/Inactiva) - Línea 680-682, 830-862
4. ✅ Filtros (Devocional, Estatus) - Línea 163-165, 505-525, 605-637
5. ✅ UI Selectores en Modal (Dirección, Barrio, Núcleo) - Línea 1049-1144
6. ✅ Ordenamiento (Nombre, Miembros, Fecha) - Línea 168, 527-538, 590-603
7. ✅ Columna Notas - Línea 683-685, 864-887

**✅ MEDIA** (2 features implementadas):
8. ✅ Tab navigation en edición inline - Línea 225-251
9. ✅ Search en modal de miembros - Línea 179, 1146-1154, 485-492

**✅ BAJA** (1 feature implementada):
10. ✅ Columna Fecha Creación - Línea 686-688, 889-895

---

## ✅ Estado de Recomendaciones

### ✅ Completado (Octubre 2025)
1. ✅ Implementar paginación (20 por defecto)
2. ✅ Agregar columnas Núcleo y Estatus
3. ✅ Agregar UI selectores en modal de ligado
4. ✅ Implementar filtros básicos
5. ✅ Agregar ordenamiento
6. ✅ Implementar Tab navigation
7. ✅ Agregar columna Notas y Fecha Creación
8. ✅ Agregar search en modal

### 🔮 Mejoras Futuras (Backlog)
9. ⚠️ Tests automatizados (0/7 tests)
10. ⚠️ Validación de dependencias al eliminar (advertir si tiene miembros)
11. ⚠️ Bulk operations (ligar múltiples miembros a múltiples familias)
12. ⚠️ Exportar familias a Excel/PDF
13. ⚠️ Historial de cambios (auditoría)

---

**Última actualización**: 14 de octubre de 2025
**Mantenido por**: Equipo de Desarrollo Devocionales 4.0
**Estado**: ✅ Funcional - Completado 100% con paridad completa respecto a v3.0
