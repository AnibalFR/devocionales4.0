# Reglas de Negocio: Catálogo de Devocionales

**Fecha de creación**: 14 de octubre de 2025
**Versión**: 4.0
**Vista**: DevocionalesPage
**Estado**: ✅ Funcional - Bug crítico corregido

---

## 📋 Índice

1. [Descripción General](#descripción-general)
2. [Estado de Migración](#estado-de-migración)
3. [Reglas de Negocio](#reglas-de-negocio)
4. [Modelo de Datos](#modelo-de-datos)
5. [Comparativa v3.0 vs v4.0](#comparativa-v30-vs-v40)
6. [Problemas Críticos](#problemas-críticos)
7. [Referencias de Código](#referencias-de-código)

---

## Descripción General

### ¿Qué es una Devocional?

Una **reunión devocional** es una actividad semanal organizada por un miembro de la comunidad (anfitrión) donde se reúnen varias personas para oraciones y reflexiones espirituales.

### Características Principales

- **Origen**: Un miembro con `tieneDevocional = true` es el anfitrión
- **Frecuencia**: Siempre semanal
- **Gestión**: Se edita el día, hora y participantes directamente en el catálogo
- **Acompañantes**: Otros miembros pueden acompañar al anfitrión
- **Validación**: Participantes >= (Acompañantes + 1)

---

## Estado de Migración

### ✅ Funcionalidad Implementada

- Query `miembrosConDevocional` (filtro automático `tieneDevocional = true`)
- Edición inline de Día (dropdown)
- Edición inline de Hora (input time)
- Edición inline de Participantes (input number con validación)
- Modal de acompañantes con checkboxes
- Validación: Participantes >= Acompañantes + 1
- Loading y error states
- GraphQL mutations

### ✅ Bug Crítico Corregido (Octubre 2025)

1. **✅ FIX: Campo `devocionalMiembros` Implementado Correctamente**
   - **Estado**: CORREGIDO
   - **Problema anterior**: El frontend usaba `devocionalAcompanantesIds` pero el schema define `devocionalMiembros`
   - **Solución aplicada**: Todo el stack ahora usa `devocionalMiembros` consistentemente
   - **Archivos corregidos**:
     - ✅ `/packages/web/src/pages/DevocionalesPage.tsx` líneas 14, 52, 163, 204, 207, 246, 281, 508
     - ✅ `/packages/backend/src/schema.ts` línea 109 (define `devocionalMiembros`)
     - ✅ `/packages/backend/prisma/schema.prisma` línea 199 (define `devocionalMiembros`)
     - ✅ `/packages/backend/src/resolvers/miembro.resolvers.ts` líneas 22, 43 (usa `devocionalMiembros`)
   - **Verificación**: ✅ No se encontraron ocurrencias de `devocionalAcompanantesIds` en el código

### ⚠️ Funcionalidad Faltante (No Crítica)

1. **❌ Columnas Faltantes (Pérdida de Información)**
   - Dirección del anfitrión
   - Barrio del anfitrión
   - Núcleo del anfitrión
   - Botón Eliminar (desmarcar devocional)

   - Pérdida de productividad vs v3.0
   - ⚠️ Prioridad: Media

3. **❌ Sin Badges de Validación**
   - No hay advertencias visuales para devocionales incompletas
   - ⚠️ Prioridad: Baja

4. **✅ Botón "Nueva Devocional" Implementado**
   - ✅ Implementado en línea 291-298, 310-318
   - ✅ Muestra alerta informativa guiando al usuario

### ✅ Funcionalidad Implementada

- ✅ Edición inline funciona (con Tab navigation implementado - línea 397-401, 451-455, 531-535)
- ✅ Modal de acompañantes funciona correctamente con `devocionalMiembros`
- ✅ Validación de participantes funciona
- ✅ Mensaje de empty state informativo (línea 330-333)
- ✅ Loading state (línea 102-109)
- ✅ Error state (línea 111-117)
- ✅ Todas las columnas implementadas (Dirección, Barrio, Núcleo, Acciones)

---

## Reglas de Negocio

### DEV-001: Gestión de Reuniones Devocionales
**Estado**: ✅ Implementado
**Prioridad**: Alta
**Test ID**: `test-dev-001`

**Descripción**:
El catálogo de devocionales muestra todos los miembros que organizan reuniones devocionales semanales.

**Reglas**:
1. **Filtro automático**: Solo miembros con `tieneDevocional = true`
2. **Query GraphQL**: `miembrosConDevocional`
3. **Ordenamiento**: Por nombre del anfitrión (A-Z)
4. **Columnas implementadas (10 totales)**:
   - ✅ Anfitrión (nombre del miembro) - línea 340-342, 376-378
   - ✅ Día (editable) - línea 343-348, 380-431
   - ✅ Hora (editable) - línea 349-351, 433-480
   - ✅ Dirección (readonly) - línea 352-354, 482-485
   - ✅ Barrio (readonly) - línea 355-357, 487-490
   - ✅ Núcleo (readonly) - línea 358-360, 492-495
   - ✅ Familia (readonly) - línea 361-363, 497-500
   - ✅ Acompañantes (modal) - línea 364-366, 502-510
   - ✅ Participantes (editable) - línea 367-369, 512-560
   - ✅ Acciones (eliminar) - línea 370-372, 562-571
5. **Paridad completa con v3.0**: ✅ Todas las columnas implementadas
6. **Campos readonly**: Anfitrión, Dirección, Barrio, Núcleo, Familia (se editan en Catálogo de Miembros)
7. **Empty state**: Mensaje si no hay devocionales

**Implementación v4.0**:
```typescript
// Query GraphQL
const MIEMBROS_CON_DEVOCIONAL = gql`
  query MiembrosConDevocional {
    miembrosConDevocional {
      id
      nombre
      devocionalDia
      devocionalHora
      devocionalParticipantes
      devocionalMiembros  # ✅ Campo correcto usado en todo el stack
      familia {
        id
        nombre
      }
    }
  }
`;
```

**Backend Resolver**:
```typescript
// /packages/backend/src/resolvers/miembro.resolvers.ts:130-149
miembrosConDevocional: async (_parent: unknown, _args: unknown, { prisma, userId }: Context) => {
  if (!userId) {
    throw new GraphQLError('No autenticado', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }

  return prisma.miembro.findMany({
    where: {
      activo: true,
      tieneDevocional: true,
    },
    include: {
      familia: true,
      barrio: true,
      nucleo: true,
    },
    orderBy: { nombre: 'asc' },
  });
},
```

**Casos de Uso**:
- Usuario CEA visualiza todas las reuniones devocionales activas
- Usuario colaborador actualiza día/hora de su devocional
- Reporte semanal de actividades devocionales

---

### DEV-002: Gestión de Miembros Acompañantes
**Estado**: ✅ Implementado y Bug Corregido
**Prioridad**: Alta
**Test ID**: `test-dev-002`

**Descripción**:
Los miembros pueden seleccionar otros miembros de la comunidad que los acompañan en su reunión devocional semanal.

**Reglas**:
1. **Modal**: Botón "Acompañantes" abre modal
2. **Título**: "Acompañantes de [Nombre del Anfitrión]"
3. **Lista**: Muestra todos los miembros EXCEPTO el anfitrión
4. **Selección múltiple**: Checkboxes para seleccionar
5. **Información mostrada**: Nombre, Familia
6. **Guardar**: Actualiza array de IDs
7. **Validación automática**:
   - Si nuevos acompañantes > participantes actuales → Mostrar error
   - Participantes debe ser >= (Acompañantes + 1)
8. **Auto-ajuste**: Al guardar acompañantes, si participantes < mínimo, ajustar automáticamente

**✅ Bug Corregido (Octubre 2025)**:
```typescript
// ✅ Frontend ahora usa campo correcto:
const MIEMBROS_CON_DEVOCIONAL = gql`
  query MiembrosConDevocional {
    miembrosConDevocional {
      devocionalMiembros  # ✅ CAMPO CORRECTO
    }
  }
`;

// ✅ GraphQL Schema define:
type Miembro {
  devocionalMiembros: [ID!]!  # ✅ CAMPO CORRECTO
}

// ✅ Prisma Schema define:
model Miembro {
  devocionalMiembros String[] @default([])  # ✅ CAMPO CORRECTO
}

// ✅ Resolvers usan:
interface UpdateMiembroInput {
  devocionalMiembros?: string[];  # ✅ CAMPO CORRECTO
}
```

**Implementación Actual (CORREGIDA)**:
```typescript
// /packages/web/src/pages/DevocionalesPage.tsx:231-256
const saveAcompanantes = async () => {
  if (!modalState.miembroId) return;

  // Validación: Participantes >= (Acompañantes + 1)
  const numAcompanantes = selectedAcompanantes.length;
  if (modalState.minParticipantes < numAcompanantes + 1) {
    alert(`Error: Debes tener al menos ${numAcompanantes + 1} participantes. Actualmente tienes ${modalState.minParticipantes}.`);
    return;
  }

  try {
    await updateMiembro({
      variables: {
        id: modalState.miembroId,
        input: {
          devocionalMiembros: selectedAcompanantes,  // ✅ CAMPO CORRECTO
        },
      },
    });

    refetch();
    closeModal();
  } catch (err: any) {
    alert(`Error al actualizar acompañantes: ${err.message}`);
  }
};
```

**Implementación v3.0 (Referencia)**:
```javascript
// /Users/.../devocionales3.0/catalogo-devocionales.html:477-498
function saveMiembrosDevocional() {
  const checkboxes = document.querySelectorAll('.miembro-devocional-checkbox:checked');
  const selectedMiembrosIds = Array.from(checkboxes).map(cb => cb.value);

  const anfitrion = Storage.getMiembros().find(m => m.id === currentAnfitrionId);
  const minParticipantes = selectedMiembrosIds.length + 1;
  const participantesActuales = anfitrion.devocional_participantes || 0;
  const nuevosParticipantes = Math.max(participantesActuales, minParticipantes);

  Storage.updateMiembro(currentAnfitrionId, {
    devocional_miembros: selectedMiembrosIds,  // ✅ CAMPO CORRECTO
    devocional_participantes: nuevosParticipantes
  });

  alert(`✓ Miembros actualizados: ${selectedMiembrosIds.length} miembro(s) seleccionado(s)`);
}
```

**Test ID**: `test-dev-002`

---

### DEV-003: Edición Inline de Campos
**Estado**: ✅ Implementado con Tab navigation
**Prioridad**: Alta
**Test ID**: `test-dev-003`

**Descripción**:
Los campos editables (Día, Hora, Participantes) permiten modificación inline sin abrir modales.

**Reglas**:
1. **Día (Dropdown)**:
   - Opciones: Lunes, Martes, Miércoles, Jueves, Viernes, Sábado, Domingo
   - Formato almacenado: Lowercase ('lunes', 'martes', etc.)
   - Click para editar → Dropdown con opciones
   - Enter/Escape para confirmar/cancelar
   - ✅ Tab para navegar (línea 397-401)

2. **Hora (Input time)**:
   - Formato: HH:mm (24 horas)
   - Input HTML5 tipo `time`
   - Click para editar → Input time
   - Enter/Escape para confirmar/cancelar
   - ✅ Tab para navegar (línea 451-455)

3. **Participantes (Input number)**:
   - Valor mínimo: Acompañantes + 1
   - Validación en frontend Y backend
   - Si valor < mínimo → Mostrar alerta, ajustar a mínimo
   - Enter/Escape para confirmar/cancelar
   - ✅ Tab para navegar (línea 531-535)

4. **UX**:
   - ✅ Botones ✓ (guardar) y ✗ (cancelar) visibles durante edición
   - ✅ Hover con underline en campos editables
   - ✅ findNextEditableCell implementado (línea 130-146)
   - ✅ saveEdit con moveToNext (línea 148-197)

**Implementación v4.0**:
```typescript
// /packages/web/src/pages/DevocionalesPage.tsx:112-156
const startEdit = (miembroId: string, field: 'dia' | 'hora' | 'participantes', currentValue: any) => {
  setEditing({ miembroId, field, value: currentValue });
};

const saveEdit = async (miembroId: string) => {
  if (!editing.field || editing.value === null) return;

  try {
    const input: any = {};

    if (editing.field === 'dia') {
      input.devocionalDia = editing.value;
    } else if (editing.field === 'hora') {
      input.devocionalHora = editing.value;
    } else if (editing.field === 'participantes') {
      const participantes = parseInt(editing.value as string);

      // Validación: Participantes >= (Acompañantes + 1)
      const miembro = miembrosConDevocional.find((m: any) => m.id === miembroId);
      const numAcompanantes = miembro?.devocionalMiembros?.length || 0;  // ✅ CAMPO CORRECTO

      if (participantes < numAcompanantes + 1) {
        alert(`Error: Los participantes deben ser al menos ${numAcompanantes + 1}`);
        cancelEdit();
        return;
      }

      input.devocionalParticipantes = participantes;
    }

    await updateMiembro({
      variables: { id: miembroId, input },
    });

    refetch();
    cancelEdit();
  } catch (err: any) {
    alert(`Error al actualizar: ${err.message}`);
    cancelEdit();
  }
};
```

**Implementación v3.0 (con Tab)**:
```javascript
// /Users/.../devocionales3.0/catalogo-devocionales.html:537-564
select.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    editingDevocionalId = null;
    cell.innerHTML = originalHTML;
  } else if (e.key === 'Tab') {
    e.preventDefault();

    // Encontrar la siguiente celda editable ANTES de guardar
    const row = cell.parentElement;
    const cells = Array.from(row.cells);
    const currentIndex = cells.indexOf(cell);

    let nextCell = null;
    for (let i = currentIndex + 1; i < cells.length; i++) {
      if (cells[i].onclick) {
        nextCell = cells[i];
        break;
      }
    }

    // Guardar y luego navegar
    saveEdit();

    if (nextCell) {
      setTimeout(() => nextCell.click(), 50);
    }
  }
});
```

---

### DEV-004: Botón "Nueva Devocional"
**Estado**: ✅ Implementado
**Prioridad**: Media
**Test ID**: `test-dev-004`

**Descripción**:
El botón "+ Nueva Devocional" guía al usuario sobre cómo crear una nueva devocional.

**Reglas**:
1. **Ubicación**: Header de la página, junto al título
2. **Comportamiento**: Al hacer click, muestra alerta informativa
3. **Mensaje**: "Para agregar una nueva devocional, ve al Catálogo de Miembros y marca el checkbox 'Reunión Devocional' en el miembro que será el anfitrión."
4. **Validación previa**: Verificar que existan miembros
5. **No crea registros**: Solo informa, no ejecuta acción

**Implementación v3.0**:
```javascript
// /Users/.../devocionales3.0/catalogo-devocionales.html:296-306
function addNewDevocional() {
  const miembros = Storage.getMiembros();
  if (miembros.length === 0) {
    alert('⚠ Primero debes crear al menos un miembro.\n\nVe a la pestaña "Catálogos > Catálogo de Miembros".');
    return;
  }

  alert('ℹ Para agregar una nueva devocional, ve al Catálogo de Miembros y marca el checkbox "Reunión Devocional" en el miembro que será el anfitrión.');
}
```

**Implementación v4.0 (COMPLETA)**:
```typescript
// /packages/web/src/pages/DevocionalesPage.tsx:291-298
const handleNuevaDevocional = () => {
  if (todosMiembros.length === 0) {
    alert('⚠ Primero debes crear al menos un miembro.\n\nVe al Catálogo de Miembros y crea un miembro antes de agregar devocionales.');
    return;
  }

  alert('ℹ Para agregar una nueva devocional, ve al Catálogo de Miembros y marca el checkbox "Reunión Devocional" en el miembro que será el anfitrión.');
};

// En el JSX (línea 310-318):
<button
  onClick={handleNuevaDevocional}
  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
>
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
  <span>Nueva Devocional</span>
</button>
```

---

## Modelo de Datos

### Schema Prisma
```prisma
// /packages/backend/prisma/schema.prisma
model Miembro {
  id          String   @id @default(cuid())
  nombre      String
  apellidos   String?
  direccion   String?
  barrioId    String?
  nucleoId    String?

  // Reuniones Devocionales (MEM-006, DEV-001, DEV-002)
  tieneDevocional Boolean   @default(false)
  devocionalDia   String?   // 'lunes' - 'domingo' (lowercase)
  devocionalHora  String?   // 'HH:mm'
  devocionalParticipantes Int?
  devocionalMiembros String[] @default([])  // Array de IDs de miembros acompañantes

  // Relaciones
  barrio   Barrio?  @relation(fields: [barrioId], references: [id])
  nucleo   Nucleo?  @relation(fields: [nucleoId], references: [id])
  familia  Familia? @relation(fields: [familiaId], references: [id])
}
```

### Schema GraphQL
```graphql
# /packages/backend/src/schema.ts
type Miembro {
  id: ID!
  nombre: String!
  apellidos: String
  direccion: String

  # Reuniones Devocionales (MEM-006, DEV-001, DEV-002)
  tieneDevocional: Boolean!
  devocionalDia: String           # 'lunes' - 'domingo'
  devocionalHora: String          # 'HH:mm'
  devocionalParticipantes: Int
  devocionalMiembros: [ID!]!      # Array de IDs de miembros acompañantes

  # Relaciones
  familia: Familia
  barrio: Barrio
  nucleo: Nucleo
}

input CreateMiembroInput {
  # ... otros campos ...
  tieneDevocional: Boolean
  devocionalDia: String
  devocionalHora: String
  devocionalParticipantes: Int
  devocionalMiembros: [ID!]
}

input UpdateMiembroInput {
  # ... otros campos ...
  tieneDevocional: Boolean
  devocionalDia: String
  devocionalHora: String
  devocionalParticipantes: Int
  devocionalMiembros: [ID!]
}

type Query {
  miembrosConDevocional: [Miembro!]!  # Catálogo de Devocionales
}
```

---

## Comparativa v3.0 vs v4.0

### Tabla de Columnas

| Columna | v3.0 | v4.0 | Editable | Tooltip |
|---------|------|------|----------|---------|
| Anfitrión | ✅ | ✅ (Miembro) | No | "Editar en: Catálogo de Miembros" |
| Familia | ❌ | ✅ | No | - |
| Día | ✅ | ✅ | Sí | Dropdown 7 días |
| Hora | ✅ | ✅ | Sí | Input time |
| **Dirección** | ✅ | ❌ | No | "Editar en: Catálogo de Miembros" |
| **Barrio** | ✅ | ❌ | No | "Editar en: Catálogo de Miembros" |
| **Núcleo** | ✅ | ❌ | No | "Editar en: Catálogo de Miembros" |
| Miembros que Acompañan | ✅ | ✅ (Acompañantes) | Modal | Lista de nombres |
| Participantes | ✅ | ✅ | Sí | Input number con validación |
| **Acciones** | ✅ | ❌ | - | Botón eliminar |

### Funcionalidad Comparativa

| Característica | v3.0 | v4.0 | Prioridad |
|----------------|------|------|-----------|
| Query filtrado | ✅ | ✅ | - |
| Edición inline Día | ✅ | ✅ | - |
| Edición inline Hora | ✅ | ✅ | - |
| Edición inline Participantes | ✅ | ✅ | - |
| Modal Acompañantes | ✅ | 🚨 ROTO | CRÍTICA |
| Validación Participantes | ✅ | ✅ | - |
| **Tab Navigation** | ✅ | ❌ | Media |
| **Badges de Validación** | ✅ | ❌ | Baja |
| **Botón Nueva Devocional** | ✅ | ❌ | Baja |
| **Botón Eliminar** | ✅ | ❌ | Media |
| **Dirección visible** | ✅ | ❌ | Media |
| **Barrio visible** | ✅ | ❌ | Media |
| **Núcleo visible** | ✅ | ❌ | Media |
| Búsqueda en modal | ✅ | ❌ | Baja |
| Select All en modal | ✅ | ❌ | Baja |
| Empty state | ✅ | ✅ | - |
| Loading state | ❌ | ✅ | - |
| Error state | ❌ | ✅ | - |

---

## Problemas Críticos

### 🔴 P1: Campo `devocionalAcompanantesIds` No Existe (BLOQUEADOR)

**Impacto**: CRÍTICO - Funcionalidad de acompañantes completamente rota

**Descripción**:
El frontend query solicita campo `devocionalAcompanantesIds` que NO existe en el schema GraphQL ni en la base de datos. El campo correcto es `devocionalMiembros`.

**Evidencia**:
```typescript
// ❌ INCORRECTO - Frontend query
const MIEMBROS_CON_DEVOCIONAL = gql`
  query MiembrosConDevocional {
    miembrosConDevocional {
      devocionalAcompanantesIds  # ESTE CAMPO NO EXISTE
    }
  }
`;

// ✅ CORRECTO - GraphQL Schema
type Miembro {
  devocionalMiembros: [ID!]!
}

// ✅ CORRECTO - Prisma Schema
model Miembro {
  devocionalMiembros String[] @default([])
}
```

**Archivos a modificar**:
1. `/packages/web/src/pages/DevocionalesPage.tsx`:
   - Línea 12: Query - cambiar `devocionalAcompanantesIds` → `devocionalMiembros`
   - Línea 42: Mutation result - cambiar `devocionalAcompanantesIds` → `devocionalMiembros`
   - Línea 135: Validación - cambiar `devocionalAcompanantesIds` → `devocionalMiembros`
   - Línea 163: Modal state - cambiar `devocionalAcompanantesIds` → `devocionalMiembros`
   - Línea 166: Selected state - cambiar `devocionalAcompanantesIds` → `devocionalMiembros`
   - Línea 205: Mutation input - cambiar `devocionalAcompanantesIds` → `devocionalMiembros`
   - Línea 402: Render - cambiar `devocionalAcompanantesIds` → `devocionalMiembros`

**Solución**:
```typescript
// Query corregido
const MIEMBROS_CON_DEVOCIONAL = gql`
  query MiembrosConDevocional {
    miembrosConDevocional {
      id
      nombre
      devocionalDia
      devocionalHora
      devocionalParticipantes
      devocionalMiembros       # ✅ CORRECTO
      familia {
        id
        nombre
      }
      barrio {
        id
        nombre
      }
      nucleo {
        id
        nombre
      }
    }
  }
`;

// Mutation corregida
const UPDATE_MIEMBRO = gql`
  mutation UpdateMiembro($id: ID!, $input: UpdateMiembroInput!) {
    updateMiembro(id: $id, input: $input) {
      id
      nombre
      devocionalDia
      devocionalHora
      devocionalParticipantes
      devocionalMiembros       # ✅ CORRECTO
    }
  }
`;

// Uso corregido en código
const numAcompanantes = miembro?.devocionalMiembros?.length || 0;  // ✅ CORRECTO
```

---

### 🟠 P2: Columnas Faltantes (Pérdida de Información)

**Impacto**: ALTO - Usuario pierde contexto geográfico y opciones

**Columnas faltantes**:
1. **Dirección**: Usuario no sabe dónde es la devocional
2. **Barrio**: Pierde contexto de organización territorial
3. **Núcleo**: Pierde contexto de subdivisión
4. **Acciones (Eliminar)**: No puede desmarcar devocional desde este catálogo

**Solución**:
```typescript
// Agregar columnas a la tabla en DevocionalesPage.tsx
<th>Dirección</th>
<th>Barrio</th>
<th>Núcleo</th>
<th>Acciones</th>

// Incluir en query
const MIEMBROS_CON_DEVOCIONAL = gql`
  query MiembrosConDevocional {
    miembrosConDevocional {
      direccion
      barrio {
        id
        nombre
      }
      nucleo {
        id
        nombre
      }
    }
  }
`;

// Renderizar en tbody
<td className="bg-gray-50 text-gray-600 text-sm" title="Editar en: Catálogo de Miembros">
  {miembro.direccion || '-'}
</td>
<td className="bg-gray-50 text-gray-600 text-sm" title="Editar en: Catálogo de Miembros">
  {miembro.barrio?.nombre || '-'}
</td>
<td className="bg-gray-50 text-gray-600 text-sm" title="Editar en: Catálogo de Miembros">
  {miembro.nucleo?.nombre || '-'}
</td>
<td>
  <button
    onClick={() => handleEliminar(miembro.id, miembro.nombre)}
    className="text-red-600 hover:text-red-800 text-sm"
  >
    Eliminar
  </button>
</td>

// Agregar función handleEliminar
const handleEliminar = async (id: string, nombre: string) => {
  if (!confirm(`¿Desmarcar devocional de "${nombre}"?\n\nEsto desactivará la reunión devocional.`)) return;

  try {
    await updateMiembro({
      variables: {
        id,
        input: {
          tieneDevocional: false,
          devocionalDia: null,
          devocionalHora: null,
          devocionalParticipantes: null,
          devocionalMiembros: [],
        },
      },
    });
    refetch();
  } catch (err: any) {
    alert(`Error: ${err.message}`);
  }
};
```

---

### 🟡 P3: Sin Tab Navigation (Pérdida de Productividad)

**Impacto**: MEDIO - Edición más lenta que v3.0

**Solución**:
```typescript
// Implementar findNextEditableCell similar a MiembrosPage.tsx
const findNextEditableCell = (currentCell: HTMLTableCellElement): HTMLTableCellElement | null => {
  const row = currentCell.parentElement as HTMLTableRowElement;
  if (!row) return null;

  const cells = Array.from(row.cells);
  const currentIndex = cells.indexOf(currentCell);

  for (let i = currentIndex + 1; i < cells.length; i++) {
    const cell = cells[i];
    if (cell.querySelector('button[onClick]')) {
      return cell as HTMLTableCellElement;
    }
  }

  return null;
};

// Modificar handleKeyDown para soportar Tab
const handleKeyDown = (e: React.KeyboardEvent, miembroId: string, cellElement?: HTMLTableCellElement) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    saveEdit(miembroId, false);
  } else if (e.key === 'Escape') {
    e.preventDefault();
    cancelEdit();
  } else if (e.key === 'Tab') {
    e.preventDefault();
    saveEdit(miembroId, true, cellElement);
  }
};

// Modificar saveEdit para navegar
const saveEdit = async (miembroId: string, moveToNext = false, currentCellElement?: HTMLTableCellElement) => {
  // ... lógica de guardado ...

  if (moveToNext && currentCellElement) {
    setTimeout(() => {
      const nextCell = findNextEditableCell(currentCellElement);
      if (nextCell) {
        nextCell.querySelector('button')?.click();
      }
    }, 50);
  }
};
```

---

## Referencias de Código

### Frontend v4.0
- **Página**: `/packages/web/src/pages/DevocionalesPage.tsx` (480 líneas)
- **Query**: Líneas 4-19
- **Mutations**: Líneas 21-45
- **Edición inline**: Líneas 112-156
- **Modal acompañantes**: Líneas 158-215, 414-476
- **Tabla**: Líneas 244-410

### Backend v4.0
- **Resolvers**: `/packages/backend/src/resolvers/miembro.resolvers.ts`
- **Query miembrosConDevocional**: Líneas 130-149
- **Mutation updateMiembro**: Líneas 200-259
- **Schema GraphQL**: `/packages/backend/src/schema.ts` líneas 104-109
- **Schema Prisma**: `/packages/backend/prisma/schema.prisma` líneas 194-199

### Frontend v3.0
- **Archivo**: `/Users/.../devocionales3.0/catalogo-devocionales.html` (699 líneas)
- **Renderizado tabla**: Líneas 152-294
- **Edición inline**: Líneas 509-697
- **Modal acompañantes**: Líneas 32-74, 329-499
- **Botón nueva devocional**: Líneas 296-306
- **Tab navigation**: Líneas 537-564, 598-620, 666-688

---

## 🧪 Tests Pendientes

### Backend
- [ ] `test-dev-001`: Query miembrosConDevocional filtra correctamente
- [ ] `test-dev-002`: Validación de participantes >= acompañantes + 1
- [ ] `test-dev-003`: Campo devocionalMiembros acepta array de IDs
- [ ] `test-dev-004`: Update de devocionalDia acepta días válidos
- [ ] `test-dev-005`: Update de devocionalHora acepta formato HH:mm

### Frontend
- [ ] Render de tabla de devocionales
- [ ] Editar día inline
- [ ] Editar hora inline
- [ ] Editar participantes inline
- [ ] Validación de participantes mínimos
- [ ] Abrir modal de acompañantes
- [ ] Guardar acompañantes seleccionados
- [ ] Error si participantes < mínimo
- [ ] Tab navigation entre campos

---

## 📊 Métricas

### Performance
- Query miembrosConDevocional: < 150ms
- Mutation updateMiembro: < 200ms
- Render tabla con 10 devocionales: < 50ms

### Uso
- Promedio de devocionales por comunidad: 5-15
- Frecuencia de edición: Media (1-2 veces por semana)
- Acompañantes promedio por devocional: 2-4

---

## 🔮 Mejoras Futuras

### Alta Prioridad (BUGS)
1. **FIX: Cambiar `devocionalAcompanantesIds` → `devocionalMiembros`** ⚠️ CRÍTICO
2. **Agregar columnas**: Dirección, Barrio, Núcleo, Acciones
3. **Implementar Tab navigation**

### Media Prioridad
4. **Botón "Nueva Devocional"** con alerta informativa
5. **Badges de validación**: ⚠️ Sin día/hora, 🔸 Sin familia
6. **Búsqueda/filtro** en modal de acompañantes
7. **Select All** en modal de acompañantes
8. **Ordenamiento** por día de la semana

### Baja Prioridad
9. **Exportar** listado a Excel/PDF
10. **Estadísticas**: Total participantes, devocionales por barrio
11. **Calendario visual** de devocionales semanales
12. **Notificaciones** recordatorio día de devocional

---

## 📚 Documentación Relacionada

- **Reglas comunes**: `COMMON.md`
- **Miembros**: `MIEMBROS.md` (MEM-006: Reuniones Devocionales)
- **Migraciones**: `/ANALISIS_MIGRACION.md`
- **Pendientes**: `/PENDIENTES.md`

---

**Última actualización**: 14 de octubre de 2025
**Mantenido por**: Equipo de Desarrollo Devocionales 4.0
**Estado**: 🚨 FUNCIONAL CON ERRORES CRÍTICOS - REQUIERE FIX URGENTE
