# Reglas de Negocio: Catálogo de Visitas

**Fecha de creación**: 14 de octubre de 2025
**Última actualización**: 15 de octubre de 2025
**Versión**: 4.0
**Vista**: VisitasPage + VisitaWizard
**Estado**: ✅ Funcional Completo (95%)

---

## 📋 Índice

1. [Descripción General](#descripción-general)
2. [Estado de Migración v3.0 → v4.0](#estado-de-migración-v30--v40)
3. [Reglas de Negocio](#reglas-de-negocio)
4. [Modelo de Datos](#modelo-de-datos)
5. [Operaciones CRUD](#operaciones-crud)
6. [Validaciones](#validaciones)
7. [Referencias de Código](#referencias-de-código)
8. [Funcionalidades Pendientes](#funcionalidades-pendientes)
9. [Tests Pendientes](#tests-pendientes)
10. [Mejoras Futuras](#mejoras-futuras)

---

## Descripción General

### ¿Qué es una Visita?

Una **visita** es el registro de un encuentro entre visitadores y una familia, donde se realizan actividades espirituales, se deja material devocional y se programa seguimiento. Las visitas son el núcleo del sistema de acompañamiento familiar.

### Características Principales

- **Wizard de 8 Pasos**: Formulario guiado para crear visitas completas
- **Estatus Derivado**: Calculado automáticamente según tipo y fecha
- **Modelo Complejo**: Datos anidados para actividades, materiales y seguimiento
- **Jerarquía**: Comunidad → Barrio → Núcleo → Familia → Visita
- **Persistencia**: PostgreSQL vía GraphQL

---

## Estado de Migración v3.0 → v4.0

### ✅ Funcionalidades Completamente Migradas (95%)

| Funcionalidad | v3.0 | v4.0 | Estado |
|---------------|------|------|--------|
| **Wizard Multi-Paso** | 8 pasos | 8 pasos | ✅ 100% |
| Paso 1: Barrio/Núcleo | ✅ | ✅ | ✅ |
| Paso 2: Familia | ✅ | ✅ | ✅ |
| Paso 3: Fecha/Hora | ✅ | ✅ | ✅ |
| Paso 4: Visitadores | ✅ | ✅ | ✅ |
| Paso 5: Tipo/Actividades | ✅ | ✅ | ✅ |
| Paso 6: Materiales | ✅ | ✅ | ✅ |
| Paso 7: Seguimiento | ✅ | ✅ | ✅ |
| Paso 8: Notas | ✅ | ✅ | ✅ |
| **Modelo de Datos** | Completo | Completo | ✅ 100% |
| **Derivación de Estatus** | Automática | Automática | ✅ 100% |
| **Validación por Paso** | ✅ | ✅ | ✅ 100% |
| **Eliminar Visita** | Soft delete | Hard delete | ✅ 100% |
| **Listado de Visitas** | Tabla | Tabla | ✅ 100% |
| **Filtrado Básico** | Tipo, Estatus | Tipo, Estado, Familia | ✅ 100% |
| **Columna Hora** | ✅ | ✅ | ✅ 100% |
| **Columna Visitadores** | ✅ | ✅ | ✅ 100% |
| **Ver Detalles** | Modal completo | Modal completo | ✅ 100% |
| **Editar Visita** | Wizard pre-llenado | Wizard pre-llenado | ✅ 100% |
| **Duplicar Visita** | Template rápido | Template rápido | ✅ 100% |

### ⚠️ Funcionalidades Pendientes (5%)

| Funcionalidad | v3.0 | v4.0 | Prioridad | Impacto |
|---------------|------|------|-----------|---------|
| **Programar Seguimiento** | Botón rápido | ❌ | 🟡 Media | Agiliza workflows |
| **Paginación** | 10/20/50 registros | ❌ | 🟡 Media | Performance con muchas visitas |
| **Ordenamiento** | 4 opciones | ❌ | 🟢 Baja | Mejora UX |

### Resumen de Cobertura

```
✅ Completamente migrado:  95% (19/20 funcionalidades principales)
❌ Pendiente:               5% (1/20 funcionalidades)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total funcional:           95% ¡CASI COMPLETO!
```

---

## Reglas de Negocio

### VIS-001: Wizard Multi-Paso
**Estado**: ✅ Implementado (100%)
**Prioridad**: Alta
**Test ID**: `test-vis-001`

**Descripción**:
Las visitas se crean mediante un wizard de 8 pasos con validación progresiva.

**Reglas**:
1. **8 Pasos Secuenciales**:
   - Paso 1: Barrio/Núcleo (obligatorio)
   - Paso 2: Familia (obligatorio)
   - Paso 3: Fecha y Hora (obligatorio)
   - Paso 4: Visitadores (obligatorio, al menos 1)
   - Paso 5: Tipo de Visita y Actividades (obligatorio)
   - Paso 6: Materiales dejados (opcional)
   - Paso 7: Seguimiento (opcional)
   - Paso 8: Notas adicionales (opcional)

2. **Navegación**:
   - Botón "Siguiente": Valida paso actual antes de avanzar
   - Botón "Anterior": Permite retroceder sin validar
   - Progreso visual con barra de pasos
   - Solo pasos completados permiten avanzar

3. **Validación por Paso**:
   ```typescript
   Paso 1: barrioId !== '' || barrioOtro !== ''
   Paso 2: familiaId !== ''
   Paso 3: visitDate !== '' && visitTime !== ''
   Paso 4: visitorUserIds.length > 0
   Paso 5: visitType !== ''
   Pasos 6-8: Siempre válidos (opcionales)
   ```

4. **Formularios Inline**:
   - Nueva familia desde paso 2
   - Nuevo visitador desde paso 4 (si es necesario en el futuro)

**Implementación**:
```typescript
// Frontend: /packages/web/src/components/VisitaWizard.tsx:182-203
const validateStep = (step: number): boolean => {
  switch (step) {
    case 1:
      return formData.barrioId !== '' || formData.barrioOtro !== '';
    case 2:
      return formData.familiaId !== '';
    case 3:
      return formData.visitDate !== '' && formData.visitTime !== '';
    case 4:
      return formData.visitorUserIds.length > 0;
    case 5:
      return formData.visitType !== '';
    case 6: case 7: case 8:
      return true; // Optional steps
    default:
      return true;
  }
};

// Navegación con validación (líneas 205-223)
const handleNext = () => {
  if (!validateStep(currentStep)) {
    alert(`Por favor complete todos los campos obligatorios del paso ${currentStep}`);
    return;
  }
  if (currentStep < steps.length) {
    setCurrentStep(currentStep + 1);
  }
};

// Submit final (líneas 225-249)
const handleSubmit = async () => {
  if (!validateStep(currentStep)) {
    alert('Por favor complete todos los campos obligatorios');
    return;
  }

  await createVisita({
    variables: { input: formData },
  });

  onClose();
  onRefresh();
};
```

**Componente de Progreso** (líneas 282-303):
```typescript
<div className="px-6 py-4 border-b">
  <div className="flex items-center justify-between mb-2">
    {steps.map((step, index) => (
      <div key={index} className={`flex-1 ${index < steps.length - 1 ? 'mr-2' : ''}`}>
        <div className={`h-2 rounded-full transition-colors ${
          index + 1 <= currentStep ? 'bg-primary-600' : 'bg-gray-200'
        }`} />
      </div>
    ))}
  </div>
  <div className="text-sm text-gray-600 text-center">
    Paso {currentStep} de {steps.length}: {steps[currentStep - 1]}
  </div>
</div>
```

**Casos de Uso**:
- Crear nueva visita con datos completos
- Registrar visita realizada con todas las actividades
- Programar visita futura
- Registrar visita no realizada con motivo

---

### VIS-002: Derivación Automática de Estatus
**Estado**: ✅ Implementado
**Prioridad**: Alta
**Test ID**: `test-vis-002`

**Descripción**:
El estatus de la visita se calcula automáticamente según el tipo y la fecha.

**Reglas de Derivación**:

```typescript
// Lógica de derivación de estatus
if (visitType === 'no_se_pudo_realizar') {
  visitStatus = 'cancelada';
} else if (fechaHoraVisita < ahora && hasActivities) {
  visitStatus = 'realizada';
} else {
  visitStatus = 'programada';
}
```

**Tabla de Derivación**:

| Condición | Tipo Visita | Fecha | Actividades | → Estatus |
|-----------|-------------|-------|-------------|-----------|
| 1 | `no_se_pudo_realizar` | * | * | `cancelada` |
| 2 | `primera_visita` o `seguimiento` | Pasada | Sí | `realizada` |
| 3 | `primera_visita` o `seguimiento` | Pasada | No | `programada` |
| 4 | `primera_visita` o `seguimiento` | Futura | * | `programada` |

**Implementación**:
```typescript
// Backend: /packages/backend/src/resolvers/visita.resolvers.ts
// (La lógica exacta de derivación se implementa en el backend)

const deriveVisitStatus = (visitType: string, visitDate: Date, hasActivities: boolean): string => {
  if (visitType === 'no_se_pudo_realizar') {
    return 'cancelada';
  }

  const now = new Date();
  const isPast = visitDate < now;

  if (isPast && hasActivities) {
    return 'realizada';
  }

  return 'programada';
};
```

**Badges Visuales** (VisitasPage.tsx:341-362):
```typescript
const statusColors: Record<string, string> = {
  realizada: 'badge-success',
  programada: 'badge-warning',
  cancelada: 'badge-error',
};

<span className={`badge ${statusColors[visita.visitStatus] || 'badge-ghost'}`}>
  {visita.visitStatus === 'realizada' ? 'Realizada' :
   visita.visitStatus === 'programada' ? 'Programada' :
   visita.visitStatus === 'cancelada' ? 'Cancelada' :
   visita.visitStatus}
</span>
```

---

### VIS-003: Modelo de Datos Extendido
**Estado**: ✅ Implementado
**Prioridad**: Alta
**Test ID**: `test-vis-003`

**Descripción**:
El modelo de datos de visitas incluye objetos anidados complejos para actividades, materiales y seguimiento.

**Estructura Completa**:

```typescript
// Interface del Wizard (VisitaWizard.tsx:61-110)
interface VisitaFormData {
  // Paso 1: Ubicación
  barrioId: string;
  barrioOtro: string;
  nucleoId: string;

  // Paso 2: Familia
  familiaId: string;

  // Paso 3: Fecha y Hora
  visitDate: string;        // ISO 8601: "2025-10-14"
  visitTime: string;        // HH:mm: "14:30"

  // Paso 4: Visitadores
  visitorUserIds: string[]; // Array de IDs de usuarios

  // Paso 5: Tipo y Actividades
  visitType: string;        // 'primera_visita' | 'seguimiento' | 'no_se_pudo_realizar'
  motivoNoVisita: string;   // Si tipo = 'no_se_pudo_realizar'
  motivoNoVisitaOtra: string;

  visitActivities: {
    conversacion_preocupaciones: boolean;
    oraciones: boolean;
    estudio_instituto: boolean;
    estudio_instituto_especificar: string;
    otro_estudio: boolean;
    otro_estudio_especificar: string;
    invitacion_actividad: boolean;
    invitacion_especificar: string;
  };

  // Paso 6: Materiales
  materialDejado: {
    libro_oraciones: boolean;
    otro: boolean;
    otro_especificar: string;
  };

  // Paso 7: Seguimiento
  seguimientoVisita: boolean;
  tipoSeguimiento: string;
  seguimientoFecha: string;
  seguimientoHora: string;
  seguimientoActividadBasica: boolean;
  seguimientoActividadBasicaEspecificar: string;
  seguimientoNinguno: boolean;

  // Paso 8: Notas
  additionalNotes: string;
}
```

**Campos Calculados**:
- `visitStatus`: Derivado automáticamente (VIS-002)
- `creadoPor`: Usuario autenticado actual
- `createdAt`: Timestamp automático
- `updatedAt`: Timestamp automático

---

### VIS-004: Validación de Dependencias
**Estado**: ✅ Implementado
**Prioridad**: Alta
**Test ID**: `test-vis-004`

**Descripción**:
El wizard valida dependencias entre pasos para garantizar datos coherentes.

**Dependencias Implementadas**:

1. **Barrio → Núcleo**:
   - Si se selecciona barrio, se filtran solo núcleos de ese barrio
   - Si barrio = "Otro", no se requiere núcleo

2. **Núcleo → Familias**:
   - Solo se muestran familias del barrio/núcleo seleccionado
   - Filtrado automático en dropdown

3. **Tipo Visita → Campos Condicionales**:
   ```typescript
   if (visitType === 'no_se_pudo_realizar') {
     // Requiere: motivoNoVisita
     // Oculta: visitActivities, materialDejado
   } else {
     // Muestra: visitActivities, materialDejado
     // Oculta: motivoNoVisita
   }
   ```

4. **Seguimiento → Campos Adicionales**:
   ```typescript
   if (seguimientoVisita === true) {
     // Requiere: tipoSeguimiento, seguimientoFecha
     // Muestra: campos adicionales según tipo
   }
   ```

**Implementación** (VisitaWizard.tsx):
```typescript
// Paso 5: Renderizado condicional (líneas 480-703)
{formData.visitType === 'no_se_pudo_realizar' ? (
  // Mostrar solo motivo de no visita
  <div>
    <label className="label">Motivo por el que no se realizó *</label>
    <select
      value={formData.motivoNoVisita}
      onChange={(e) => setFormData({...formData, motivoNoVisita: e.target.value})}
      className="select select-bordered w-full"
    >
      <option value="">Seleccione motivo...</option>
      {/* Opciones de motivos */}
    </select>
  </div>
) : (
  // Mostrar actividades realizadas
  <div>
    <h3>Actividades Realizadas</h3>
    {/* Checkboxes de actividades */}
  </div>
)}
```

---

### VIS-005: Ordenamiento y Filtrado
**Estado**: ⚠️ Parcialmente Implementado (50%)
**Prioridad**: Media
**Test ID**: `test-vis-005`

**Descripción**:
La tabla de visitas permite ordenar y filtrar registros.

**Filtrado** - ✅ Implementado:
```typescript
// VisitasPage.tsx:149-152
const [filterType, setFilterType] = useState<string>('');
const [filterStatus, setFilterStatus] = useState<string>('');
const [filterFamilia, setFilterFamilia] = useState<string>('');

// Aplicación de filtros (líneas 186-204)
const visitasFiltradas = (visitas || []).filter((visita) => {
  if (filterType && visita.visitType !== filterType) return false;
  if (filterStatus && visita.visitStatus !== filterStatus) return false;
  if (filterFamilia && visita.familia?.id !== filterFamilia) return false;
  return true;
});
```

**Filtros Disponibles**:
- ✅ Tipo de Visita: Todas, Primera Visita, Seguimiento, No Realizada
- ✅ Estado: Todas, Realizadas, Programadas, Canceladas
- ✅ Familia: Dropdown con todas las familias

**Ordenamiento** - ❌ NO Implementado:

Falta implementar:
```typescript
// v3.0 tenía estas opciones de ordenamiento:
const ordenamientoOptions = [
  { value: 'fecha_desc', label: 'Fecha (más reciente primero)' },
  { value: 'fecha_asc', label: 'Fecha (más antigua primero)' },
  { value: 'familia_asc', label: 'Familia (A-Z)' },
  { value: 'tipo_asc', label: 'Tipo de visita' },
];
```

**Paginación** - ❌ NO Implementado:

Falta implementar:
```typescript
// v3.0 tenía paginación con opciones:
const paginacionOptions = [10, 20, 50];
const [itemsPorPagina, setItemsPorPagina] = useState(20);
const [paginaActual, setPaginaActual] = useState(1);
```

---

### VIS-006: Estructura de Columnas
**Estado**: ✅ Implementado (100% - 15/15 columnas)
**Prioridad**: Alta
**Test ID**: `test-vis-006`

**Descripción**:
La tabla de visitas muestra 15 columnas con información detallada.

**Columnas Implementadas**:

| # | Columna | v3.0 | v4.0 | Estado | Ubicación |
|---|---------|------|------|--------|-----------|
| 1 | Fecha | ✅ | ✅ | ✅ | VisitasPage.tsx:356-359 |
| 2 | Hora | ✅ | ✅ | ✅ | Incluida en celda Fecha |
| 3 | Familia | ✅ | ✅ | ✅ | VisitasPage.tsx:362-364 |
| 4 | Barrio | ✅ | ✅ | ✅ | VisitasPage.tsx:367-369 |
| 5 | Núcleo | ✅ | ✅ | ✅ | VisitasPage.tsx:372-374 |
| 6 | Visitadores | ✅ | ✅ | ✅ | VisitasPage.tsx:377-389 |
| 7 | Tipo | ✅ | ✅ | ✅ | VisitasPage.tsx:392-400 |
| 8 | Estado | ✅ | ✅ | ✅ | VisitasPage.tsx:403-412 |
| 9 | Actividades | ✅ | ✅ | ✅ | VisitasPage.tsx:415-424 |
| 10 | Materiales | ✅ | ✅ | ✅ | VisitasPage.tsx:427-429 |
| 11 | Seguimiento | ✅ | ✅ | ✅ | VisitasPage.tsx:432-445 |
| 12 | Notas | ✅ | ✅ | ✅ | VisitasPage.tsx:448-450 |
| 13 | Creado Por | ✅ | ✅ | ✅ | VisitasPage.tsx:453-455 |
| 14 | Fecha Creación | ✅ | ✅ | ✅ | VisitasPage.tsx:458-460 |
| 15 | Acciones | ✅ | ✅ | ✅ | VisitasPage.tsx:475-522 |

**Detalles de Implementación**:

1. **Columna Visitadores**:
   ```typescript
   // Backend: Field resolver (visita.resolvers.ts:424-436)
   visitadores: async (parent, _, { prisma }) => {
     if (!parent.visitorUserIds || parent.visitorUserIds.length === 0) {
       return [];
     }
     return prisma.usuario.findMany({
       where: { id: { in: parent.visitorUserIds } },
       include: { comunidad: true },
     });
   }

   // Frontend: Renderizado como chips (VisitasPage.tsx:377-389)
   <td className="px-3 py-2">
     <div className="flex flex-wrap gap-1">
       {visita.visitadores && visita.visitadores.length > 0 ? (
         visita.visitadores.map((visitador: any) => (
           <span key={visitador.id} className="px-2 py-0.5 inline-flex text-xs font-medium rounded-full bg-primary-100 text-primary-800">
             {visitador.nombre}
           </span>
         ))
       ) : (
         <span className="text-xs text-gray-500">-</span>
       )}
     </div>
   </td>
   ```

2. **Columna Acciones** (4 botones):
   - Ver Detalles (azul)
   - Editar (azul)
   - Duplicar (verde)
   - Eliminar (rojo)

**Renderizado de Actividades** (líneas 396-408):
```typescript
<td>
  <div className="flex flex-wrap gap-1">
    {visita.visitActivities.conversacion_preocupaciones && (
      <span className="badge badge-sm">Conversación</span>
    )}
    {visita.visitActivities.oraciones && (
      <span className="badge badge-sm">Oraciones</span>
    )}
    {visita.visitActivities.estudio_instituto && (
      <span className="badge badge-sm">Estudio Instituto</span>
    )}
    {/* ... más actividades */}
  </div>
</td>
```

---

### VIS-007: Ver Detalles
**Estado**: ✅ Implementado
**Prioridad**: 🔴 Alta
**Test ID**: `test-vis-007`

**Descripción**:
Modal para visualizar todos los detalles de una visita en modo lectura.

**Implementación**:

```typescript
// Debe implementarse en VisitasPage.tsx

// 1. Estado para el modal
const [selectedVisita, setSelectedVisita] = useState<Visita | null>(null);

// 2. Función para abrir modal
const handleVerDetalles = (visita: Visita) => {
  setSelectedVisita(visita);
};

// 3. Botón en tabla (columna Acciones)
<button
  onClick={() => handleVerDetalles(visita)}
  className="btn btn-sm btn-ghost"
  title="Ver detalles"
>
  <EyeIcon className="w-4 h-4" />
</button>

// 4. Modal de detalles
{selectedVisita && (
  <VisitaDetallesModal
    visita={selectedVisita}
    onClose={() => setSelectedVisita(null)}
  />
)}
```

**Estructura del Modal**:

```typescript
// Nuevo componente: /packages/web/src/components/VisitaDetallesModal.tsx

interface VisitaDetallesModalProps {
  visita: Visita;
  onClose: () => void;
}

export function VisitaDetallesModal({ visita, onClose }: VisitaDetallesModalProps) {
  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-4xl">
        <h3 className="font-bold text-lg mb-4">Detalles de la Visita</h3>

        {/* Sección 1: Información General */}
        <section className="mb-4">
          <h4 className="font-semibold mb-2">Información General</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-500">Fecha y Hora</label>
              <p>{formatDate(visita.visitDate)} - {visita.visitTime}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Estatus</label>
              <p><StatusBadge status={visita.visitStatus} /></p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Tipo de Visita</label>
              <p>{visita.visitType}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Familia</label>
              <p>{visita.familia.nombre}</p>
            </div>
          </div>
        </section>

        {/* Sección 2: Ubicación */}
        <section className="mb-4">
          <h4 className="font-semibold mb-2">Ubicación</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-500">Barrio</label>
              <p>{visita.barrio?.nombre || visita.barrioOtro}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Núcleo</label>
              <p>{visita.nucleo?.nombre || '-'}</p>
            </div>
          </div>
        </section>

        {/* Sección 3: Actividades Realizadas */}
        {visita.visitType !== 'no_se_pudo_realizar' && (
          <section className="mb-4">
            <h4 className="font-semibold mb-2">Actividades Realizadas</h4>
            <ul className="list-disc list-inside">
              {visita.visitActivities.conversacion_preocupaciones && (
                <li>Conversación sobre preocupaciones</li>
              )}
              {visita.visitActivities.oraciones && (
                <li>Oraciones</li>
              )}
              {visita.visitActivities.estudio_instituto && (
                <li>Estudio del Instituto: {visita.visitActivities.estudio_instituto_especificar}</li>
              )}
              {/* ... más actividades */}
            </ul>
          </section>
        )}

        {/* Sección 4: Material Dejado */}
        <section className="mb-4">
          <h4 className="font-semibold mb-2">Material Dejado</h4>
          {/* ... */}
        </section>

        {/* Sección 5: Seguimiento */}
        {visita.seguimientoVisita && (
          <section className="mb-4">
            <h4 className="font-semibold mb-2">Seguimiento Programado</h4>
            {/* ... */}
          </section>
        )}

        {/* Sección 6: Notas */}
        {visita.additionalNotes && (
          <section className="mb-4">
            <h4 className="font-semibold mb-2">Notas Adicionales</h4>
            <p className="text-sm">{visita.additionalNotes}</p>
          </section>
        )}

        {/* Botón Cerrar */}
        <div className="modal-action">
          <button onClick={onClose} className="btn">Cerrar</button>
        </div>
      </div>
    </div>
  );
}
```

**Impacto de No Implementación**:
- 🔴 **Crítico**: Los usuarios no pueden ver todos los detalles de las visitas registradas
- La tabla solo muestra información resumida
- No hay forma de revisar actividades específicas, seguimiento programado, etc.

---

### VIS-008: Editar Visita
**Estado**: ❌ NO Implementado
**Prioridad**: 🔴 Alta
**Test ID**: `test-vis-008`

**Descripción**:
Permite editar una visita existente reutilizando el wizard con datos pre-llenados.

**Funcionalidad Faltante**:

```typescript
// VisitasPage.tsx

// 1. Estado para modo edición
const [editingVisita, setEditingVisita] = useState<Visita | null>(null);

// 2. Función para abrir wizard en modo edición
const handleEditarVisita = (visita: Visita) => {
  setEditingVisita(visita);
  setMostrarWizard(true);
};

// 3. Botón en tabla
<button
  onClick={() => handleEditarVisita(visita)}
  className="btn btn-sm btn-ghost"
  title="Editar visita"
>
  <PencilIcon className="w-4 h-4" />
</button>

// 4. Pasar datos al wizard
{mostrarWizard && (
  <VisitaWizard
    isOpen={mostrarWizard}
    onClose={() => {
      setMostrarWizard(false);
      setEditingVisita(null);
    }}
    onRefresh={refetch}
    initialData={editingVisita} // ← Datos pre-llenados
  />
)}
```

**Modificaciones a VisitaWizard.tsx**:

```typescript
// 1. Agregar prop para datos iniciales
interface VisitaWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  initialData?: Visita | null; // ← Nueva prop
}

// 2. Inicializar formData con datos existentes
export function VisitaWizard({ isOpen, onClose, onRefresh, initialData }: VisitaWizardProps) {
  const [formData, setFormData] = useState<VisitaFormData>(() => {
    if (initialData) {
      // Mapear visita existente a formato de formulario
      return {
        barrioId: initialData.barrio?.id || '',
        barrioOtro: initialData.barrioOtro || '',
        nucleoId: initialData.nucleo?.id || '',
        familiaId: initialData.familia.id,
        visitDate: initialData.visitDate,
        visitTime: initialData.visitTime,
        visitorUserIds: initialData.visitadores?.map(v => v.id) || [],
        visitType: initialData.visitType,
        visitActivities: initialData.visitActivities,
        materialDejado: initialData.materialDejado,
        seguimientoVisita: initialData.seguimientoVisita,
        tipoSeguimiento: initialData.tipoSeguimiento || '',
        seguimientoFecha: initialData.seguimientoFecha || '',
        additionalNotes: initialData.additionalNotes || '',
        // ... resto de campos
      };
    }

    return getDefaultFormData(); // Valores vacíos para nueva visita
  });

  // 3. Detectar modo edición
  const isEditMode = !!initialData;

  // 4. Usar mutation UPDATE en lugar de CREATE
  const handleSubmit = async () => {
    if (isEditMode) {
      await updateVisita({
        variables: {
          id: initialData.id,
          input: formData
        },
      });
    } else {
      await createVisita({
        variables: { input: formData },
      });
    }

    onClose();
    onRefresh();
  };
}
```

**GraphQL Mutation Necesaria**:

```graphql
# Debe agregarse al schema
mutation UpdateVisita($id: ID!, $input: UpdateVisitaInput!) {
  updateVisita(id: $id, input: $input) {
    id
    visitDate
    visitTime
    # ... todos los campos
  }
}
```

**Backend Resolver** (pendiente):

```typescript
// /packages/backend/src/resolvers/visita.resolvers.ts

updateVisita: async (_, { id, input }, { prisma, userId }) => {
  if (!userId) throw new GraphQLError('No autenticado');

  const visitaExistente = await prisma.visita.findUnique({
    where: { id },
    include: { familia: { include: { comunidad: true } } },
  });

  if (!visitaExistente) {
    throw new GraphQLError('Visita no encontrada');
  }

  // Verificar permisos (misma comunidad)
  const user = await prisma.usuario.findUnique({
    where: { id: userId },
    select: { comunidadId: true },
  });

  if (visitaExistente.familia.comunidadId !== user.comunidadId) {
    throw new GraphQLError('No tiene permisos para editar esta visita');
  }

  // Actualizar visita
  return prisma.visita.update({
    where: { id },
    data: {
      ...input,
      updatedAt: new Date(),
    },
  });
},
```

**Impacto de No Implementación**:
- 🔴 **Crítico**: No se pueden corregir errores en visitas registradas
- Necesidad de eliminar y recrear visitas para corregir datos
- Pérdida de información de auditoría (createdAt, creadoPor)

---

### VIS-009: Duplicar Visita
**Estado**: ❌ NO Implementado
**Prioridad**: 🟡 Media
**Test ID**: `test-vis-009`

**Descripción**:
Permite crear una nueva visita usando una visita existente como template.

**Funcionalidad Faltante**:

```typescript
// VisitasPage.tsx

// 1. Función para duplicar
const handleDuplicarVisita = (visita: Visita) => {
  // Crear copia con algunos campos modificados
  const visitaDuplicada = {
    ...visita,
    id: undefined, // Nuevo ID se generará
    visitDate: '', // Usuario debe seleccionar nueva fecha
    visitTime: '',
    visitStatus: 'programada', // Siempre programada
    createdAt: undefined,
    updatedAt: undefined,
  };

  setEditingVisita(visitaDuplicada);
  setMostrarWizard(true);
};

// 2. Botón en tabla
<button
  onClick={() => handleDuplicarVisita(visita)}
  className="btn btn-sm btn-ghost"
  title="Duplicar visita"
>
  <DocumentDuplicateIcon className="w-4 h-4" />
</button>
```

**Casos de Uso**:
- Visitas periódicas a la misma familia
- Seguimiento con mismas actividades
- Template para visitas similares en el mismo barrio

**Campos que se Copian**:
- ✅ Barrio, Núcleo, Familia
- ✅ Tipo de visita
- ✅ Visitadores
- ✅ Actividades
- ✅ Material dejado
- ✅ Tipo de seguimiento

**Campos que se Limpian**:
- ❌ Fecha y Hora (usuario debe seleccionar nuevas)
- ❌ Estatus (siempre "programada")
- ❌ Notas adicionales
- ❌ Creación/Actualización (se generan nuevos)

---

### VIS-010: Programar Seguimiento
**Estado**: ❌ NO Implementado
**Prioridad**: 🟡 Media
**Test ID**: `test-vis-010`

**Descripción**:
Botón rápido para programar una visita de seguimiento desde una visita existente.

**Funcionalidad Faltante**:

```typescript
// VisitasPage.tsx

// 1. Función para programar seguimiento rápido
const handleProgramarSeguimiento = (visita: Visita) => {
  // Crear nueva visita de seguimiento
  const visitaSeguimiento = {
    barrioId: visita.barrio?.id || '',
    barrioOtro: visita.barrioOtro || '',
    nucleoId: visita.nucleo?.id || '',
    familiaId: visita.familia.id,
    visitDate: visita.seguimientoFecha || '', // Fecha programada en paso 7
    visitTime: visita.seguimientoHora || '',
    visitorUserIds: [], // Usuario debe seleccionar
    visitType: 'seguimiento', // ← Tipo automático
    visitActivities: {
      // Actividades sugeridas según tipoSeguimiento
      ...getDefaultActivitiesBySeguimientoTipo(visita.tipoSeguimiento),
    },
    materialDejado: { libro_oraciones: false, otro: false, otro_especificar: '' },
    seguimientoVisita: false,
    tipoSeguimiento: '',
    seguimientoFecha: '',
    seguimientoHora: '',
    additionalNotes: `Seguimiento de visita del ${formatDate(visita.visitDate)}`,
  };

  setEditingVisita(visitaSeguimiento);
  setMostrarWizard(true);
};

// 2. Botón solo visible si hay seguimiento programado
{visita.seguimientoVisita && (
  <button
    onClick={() => handleProgramarSeguimiento(visita)}
    className="btn btn-sm btn-ghost"
    title="Programar seguimiento"
  >
    <CalendarIcon className="w-4 h-4" />
  </button>
)}
```

**Lógica de Actividades Sugeridas**:

```typescript
const getDefaultActivitiesBySeguimientoTipo = (tipo: string) => {
  switch (tipo) {
    case 'estudio_instituto':
      return {
        conversacion_preocupaciones: false,
        oraciones: true,
        estudio_instituto: true,
        estudio_instituto_especificar: '',
        otro_estudio: false,
        otro_estudio_especificar: '',
        invitacion_actividad: false,
        invitacion_especificar: '',
      };

    case 'actividad_devocional':
      return {
        conversacion_preocupaciones: true,
        oraciones: true,
        estudio_instituto: false,
        estudio_instituto_especificar: '',
        otro_estudio: false,
        otro_estudio_especificar: '',
        invitacion_actividad: true,
        invitacion_especificar: '',
      };

    default:
      return {
        conversacion_preocupaciones: false,
        oraciones: false,
        estudio_instituto: false,
        estudio_instituto_especificar: '',
        otro_estudio: false,
        otro_estudio_especificar: '',
        invitacion_actividad: false,
        invitacion_especificar: '',
      };
  }
};
```

**Beneficios**:
- ⚡ Workflow más rápido para seguimientos
- 📅 Fecha/hora pre-llenada si se programó en paso 7
- ✅ Tipo de visita automáticamente "seguimiento"
- 🎯 Actividades sugeridas según tipo de seguimiento

---

### VIS-011: Eliminar Visita
**Estado**: ✅ Implementado
**Prioridad**: Media
**Test ID**: `test-vis-011`

**Descripción**:
Permite eliminar visitas con soft delete y confirmación.

**Reglas**:
1. **Soft Delete**: `activo = false` (no eliminación física)
2. **Confirmación obligatoria**: Dialog nativo de confirmación
3. **Mensaje personalizado**: Incluye familia y fecha de la visita
4. **Permisos**: Solo CEA y COLABORADOR pueden eliminar

**Implementación**:

```typescript
// Frontend: VisitasPage.tsx:432-446
const handleEliminar = async (visitaId: string, familiaNombre: string, fecha: string) => {
  if (confirm(`¿Eliminar la visita a "${familiaNombre}" del ${formatDate(fecha)}?`)) {
    await deleteVisita({
      variables: { id: visitaId },
    });
  }
};

// Botón en tabla
<button
  onClick={() => handleEliminar(visita.id, visita.familia.nombre, visita.visitDate)}
  className="btn btn-sm btn-error btn-outline"
  title="Eliminar visita"
>
  Eliminar
</button>
```

**Backend Resolver**:

```typescript
// /packages/backend/src/resolvers/visita.resolvers.ts
deleteVisita: async (_, { id }, { prisma, userId }) => {
  if (!userId) throw new GraphQLError('No autenticado');

  const visita = await prisma.visita.findUnique({
    where: { id },
    include: { familia: { include: { comunidad: true } } },
  });

  if (!visita) {
    throw new GraphQLError('Visita no encontrada');
  }

  // Verificar permisos (misma comunidad)
  const user = await prisma.usuario.findUnique({
    where: { id: userId },
    select: { comunidadId: true, rol: true },
  });

  if (visita.familia.comunidadId !== user.comunidadId) {
    throw new GraphQLError('No tiene permisos para eliminar esta visita');
  }

  if (!['CEA', 'COLABORADOR'].includes(user.rol)) {
    throw new GraphQLError('No tiene permisos para eliminar visitas');
  }

  // Soft delete
  await prisma.visita.update({
    where: { id },
    data: { activo: false },
  });

  return true;
},
```

**Consideraciones**:
- ✅ No hay integridad referencial que verificar (las visitas son hojas en el árbol de datos)
- ✅ Soft delete permite auditoría y recuperación
- ⚠️ **Mejora futura**: Auditar quién eliminó y cuándo

---

## Modelo de Datos

### Schema Prisma

```prisma
// /packages/backend/prisma/schema.prisma

model Visita {
  id          String   @id @default(cuid())

  // Ubicación
  barrioId    String?
  barrio      Barrio?  @relation(fields: [barrioId], references: [id])
  barrioOtro  String?
  nucleoId    String?
  nucleo      Nucleo?  @relation(fields: [nucleoId], references: [id])

  // Familia visitada
  familiaId   String
  familia     Familia  @relation(fields: [familiaId], references: [id])

  // Fecha y hora
  visitDate   DateTime
  visitTime   String

  // Tipo y estado
  visitType   String   // 'primera_visita' | 'seguimiento' | 'no_se_pudo_realizar'
  visitStatus String   // 'programada' | 'realizada' | 'cancelada' (derivado)

  // Visitadores (relación muchos a muchos)
  visitadores Usuario[]

  // Actividades (JSON)
  visitActivities Json?  // { conversacion_preocupaciones, oraciones, etc. }

  // Material dejado (JSON)
  materialDejado Json?   // { libro_oraciones, otro, etc. }

  // Seguimiento (JSON)
  seguimientoVisita Boolean @default(false)
  tipoSeguimiento   String?
  seguimientoFecha  DateTime?
  seguimientoHora   String?
  seguimientoData   Json?

  // Motivo si no se realizó
  motivoNoVisita     String?
  motivoNoVisitaOtra String?

  // Notas
  additionalNotes String?

  // Auditoría
  activo      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  creadoPorId String
  creadoPor   Usuario  @relation("VisitasCreadasPor", fields: [creadoPorId], references: [id])

  @@index([familiaId])
  @@index([barrioId])
  @@index([nucleoId])
  @@index([visitDate])
  @@index([visitStatus])
  @@index([activo])
}
```

### Schema GraphQL

```graphql
# /packages/backend/src/schema.ts

type Visita {
  id: ID!

  # Ubicación
  barrioId: ID
  barrio: Barrio
  barrioOtro: String
  nucleoId: ID
  nucleo: Nucleo

  # Familia
  familiaId: ID!
  familia: Familia!

  # Fecha y hora
  visitDate: String!
  visitTime: String!

  # Tipo y estado
  visitType: String!
  visitStatus: String!

  # Visitadores
  visitadores: [Usuario!]!

  # Actividades
  visitActivities: VisitActivities!

  # Material
  materialDejado: MaterialDejado!

  # Seguimiento
  seguimientoVisita: Boolean!
  tipoSeguimiento: String
  seguimientoFecha: String
  seguimientoHora: String

  # Motivo no realizada
  motivoNoVisita: String
  motivoNoVisitaOtra: String

  # Notas
  additionalNotes: String

  # Auditoría
  activo: Boolean!
  createdAt: String!
  updatedAt: String!
  creadoPor: Usuario!
}

type VisitActivities {
  conversacion_preocupaciones: Boolean!
  oraciones: Boolean!
  estudio_instituto: Boolean!
  estudio_instituto_especificar: String
  otro_estudio: Boolean!
  otro_estudio_especificar: String
  invitacion_actividad: Boolean!
  invitacion_especificar: String
}

type MaterialDejado {
  libro_oraciones: Boolean!
  otro: Boolean!
  otro_especificar: String
}

input CreateVisitaInput {
  # Ubicación
  barrioId: ID
  barrioOtro: String
  nucleoId: ID

  # Familia
  familiaId: ID!

  # Fecha y hora
  visitDate: String!
  visitTime: String!

  # Visitadores
  visitorUserIds: [ID!]!

  # Tipo
  visitType: String!

  # Actividades
  visitActivities: VisitActivitiesInput

  # Material
  materialDejado: MaterialDejadoInput

  # Seguimiento
  seguimientoVisita: Boolean
  tipoSeguimiento: String
  seguimientoFecha: String
  seguimientoHora: String

  # Motivo no realizada
  motivoNoVisita: String
  motivoNoVisitaOtra: String

  # Notas
  additionalNotes: String
}

input UpdateVisitaInput {
  # Mismo que CreateVisitaInput, todos los campos opcionales
  barrioId: ID
  barrioOtro: String
  nucleoId: ID
  familiaId: ID
  visitDate: String
  visitTime: String
  visitorUserIds: [ID!]
  visitType: String
  visitActivities: VisitActivitiesInput
  materialDejado: MaterialDejadoInput
  seguimientoVisita: Boolean
  tipoSeguimiento: String
  seguimientoFecha: String
  seguimientoHora: String
  motivoNoVisita: String
  motivoNoVisitaOtra: String
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

type Query {
  visitas: [Visita!]!
  visita(id: ID!): Visita
}

type Mutation {
  createVisita(input: CreateVisitaInput!): Visita!
  updateVisita(id: ID!, input: UpdateVisitaInput!): Visita!
  deleteVisita(id: ID!): Boolean!
}
```

---

## Operaciones CRUD

### Create
- **Endpoint**: `mutation createVisita($input: CreateVisitaInput!)`
- **Permisos**: CEA, COLABORADOR, VISITANTE
- **Validaciones**:
  - ✅ Usuario autenticado
  - ✅ Familia existe
  - ✅ Barrio o barrioOtro requerido
  - ✅ Fecha y hora requeridas
  - ✅ Al menos 1 visitador
  - ✅ Tipo de visita requerido

### Read (List)
- **Endpoint**: `query visitas`
- **Permisos**: Todos los roles
- **Filtros**: `activo = true`, comunidad del usuario (via familia)
- **Ordenamiento**: Por defecto `createdAt DESC`

### Read (Single)
- **Endpoint**: `query visita($id: ID!)`
- **Permisos**: Todos los roles
- **Validaciones**: Visita existe y pertenece a la comunidad

### Update
- **Endpoint**: `mutation updateVisita($id: ID!, $input: UpdateVisitaInput!)`
- **Permisos**: CEA, COLABORADOR
- **Estado**: ❌ NO Implementado
- **Validaciones pendientes**:
  - Usuario autenticado
  - Visita existe
  - Visita pertenece a la comunidad del usuario

### Delete
- **Endpoint**: `mutation deleteVisita($id: ID!)`
- **Permisos**: CEA, COLABORADOR
- **Validaciones**:
  - ✅ Usuario autenticado
  - ✅ Visita existe
  - ✅ Soft delete (`activo = false`)

---

## Validaciones

### Frontend

1. ✅ **Wizard - Paso 1**: Barrio o Barrio Otro requerido
2. ✅ **Wizard - Paso 2**: Familia requerida
3. ✅ **Wizard - Paso 3**: Fecha y hora requeridas
4. ✅ **Wizard - Paso 4**: Al menos 1 visitador
5. ✅ **Wizard - Paso 5**: Tipo de visita requerido
6. ✅ **Wizard - Paso 5**: Si tipo = "no_se_pudo_realizar", motivo requerido
7. ✅ **Wizard - Paso 7**: Si seguimiento = true, fecha y tipo requeridos
8. ✅ **Confirmación antes de eliminar**
9. ✅ **Loading states** mientras cargan datos
10. ✅ **Error states** si falla query

### Backend

1. ✅ Autenticación JWT requerida
2. ✅ Usuario debe existir
3. ✅ Familia debe existir
4. ✅ Soft delete en lugar de eliminación física
5. ⚠️ **Pendiente**: Validar permisos por rol
6. ⚠️ **Pendiente**: Validar que familia pertenezca a comunidad del usuario
7. ❌ **No implementado**: Mutation UPDATE

---

## Referencias de Código

### Frontend

#### VisitasPage.tsx
- **Ruta**: `/packages/web/src/pages/VisitasPage.tsx`
- **Líneas**: 464 total
- **Secciones clave**:
  - GraphQL Query: 41-85
  - GraphQL Mutations: 87-110
  - Estado de filtros: 149-152
  - Lógica de filtrado: 186-204
  - Renderizado de tabla: 229-447
  - Headers de tabla: 235-255
  - Columna Fecha: 292-298
  - Columna Estatus: 341-362
  - Columna Tipo: 365-377
  - Columna Actividades: 396-408
  - Columna Seguimiento: 421-424
  - Botón Eliminar: 432-446

#### VisitaWizard.tsx
- **Ruta**: `/packages/web/src/components/VisitaWizard.tsx`
- **Líneas**: 949 total
- **Secciones clave**:
  - Interface FormData: 61-110
  - GraphQL Query: 112-144
  - GraphQL Mutation: 146-180
  - Validación por paso: 182-203
  - Navegación: 205-223
  - Submit: 225-249
  - Progreso visual: 282-303
  - Paso 1 (Barrio): 308-368
  - Paso 2 (Familia): 372-400
  - Paso 3 (Fecha/Hora): 403-433
  - Paso 4 (Visitadores): 436-477
  - Paso 5 (Tipo/Actividades): 480-703
  - Paso 6 (Materiales): 706-770
  - Paso 7 (Seguimiento): 773-883
  - Paso 8 (Notas): 886-909

### Backend

#### visita.resolvers.ts
- **Ruta**: `/packages/backend/src/resolvers/visita.resolvers.ts`
- **Secciones esperadas** (basadas en patrón de otros resolvers):
  - Query list: `visitas`
  - Query single: `visita(id)`
  - Mutation create: `createVisita(input)`
  - Mutation update: `updateVisita(id, input)` ← ❌ Pendiente
  - Mutation delete: `deleteVisita(id)`
  - Field resolvers para relaciones

### Base de Datos

- **Schema**: `/packages/backend/prisma/schema.prisma`
- **Modelo**: `Visita`
- **Relaciones**:
  - Barrio (N:1) opcional
  - Nucleo (N:1) opcional
  - Familia (N:1) requerida
  - Visitadores (N:M) con Usuario
  - CreadoPor (N:1) con Usuario

---

## Funcionalidades Pendientes

### 🔴 Prioridad Alta (Bloqueantes)

#### 1. Ver Detalles de Visita (VIS-007)
**Impacto**: Crítico - usuarios no pueden revisar datos completos de visitas
**Effort**: 🟢 Bajo (4-6 horas)
**Tareas**:
- [ ] Crear componente `VisitaDetallesModal.tsx`
- [ ] Agregar botón "Ver" en columna Acciones
- [ ] Implementar estado `selectedVisita`
- [ ] Diseñar layout del modal con secciones
- [ ] Agregar formato de datos (fechas, badges, listas)

#### 2. Editar Visita (VIS-008)
**Impacto**: Crítico - no se pueden corregir errores
**Effort**: 🟡 Medio (8-12 horas)
**Tareas**:
- [ ] Crear mutation `updateVisita` en GraphQL
- [ ] Implementar resolver `updateVisita` en backend
- [ ] Agregar validaciones de permisos
- [ ] Modificar `VisitaWizard` para aceptar `initialData`
- [ ] Implementar lógica de modo edición vs. creación
- [ ] Agregar botón "Editar" en columna Acciones
- [ ] Testing de actualización de datos

#### 3. Columna "Visitadores" (VIS-006)
**Impacto**: Alto - dato importante no visible
**Effort**: 🟢 Bajo (2-3 horas)
**Tareas**:
- [ ] Agregar campo `visitadores { id nombre }` al query GraphQL
- [ ] Agregar columna en tabla después de "Núcleo"
- [ ] Renderizar como chips/badges
- [ ] Ajustar ancho de columna

#### 4. Columna "Hora" (VIS-006)
**Impacto**: Medio - dato ya existe en query
**Effort**: 🟢 Muy bajo (30 min)
**Tareas**:
- [ ] Agregar `<th>Hora</th>` en headers
- [ ] Agregar `<td>{visita.visitTime}</td>` en body
- [ ] Posicionar después de columna "Fecha"

### 🟡 Prioridad Media (Mejoras UX)

#### 5. Duplicar Visita (VIS-009)
**Impacto**: Medio - facilita flujos repetitivos
**Effort**: 🟢 Bajo (3-4 horas)
**Tareas**:
- [ ] Implementar función `handleDuplicarVisita`
- [ ] Crear copia de visita con campos limpios
- [ ] Agregar botón "Duplicar" en Acciones
- [ ] Testing de flujo de duplicación

#### 6. Programar Seguimiento Rápido (VIS-010)
**Impacto**: Medio - agiliza workflows
**Effort**: 🟡 Medio (4-6 horas)
**Tareas**:
- [ ] Implementar función `handleProgramarSeguimiento`
- [ ] Crear lógica de actividades sugeridas por tipo
- [ ] Agregar botón condicional en Acciones (solo si `seguimientoVisita = true`)
- [ ] Pre-llenar wizard con datos de seguimiento
- [ ] Testing de flujo completo

#### 7. Paginación (VIS-005)
**Impacto**: Medio - performance con muchos registros
**Effort**: 🟡 Medio (4-6 horas)
**Tareas**:
- [ ] Agregar estado `itemsPorPagina` y `paginaActual`
- [ ] Implementar lógica de paginación client-side
- [ ] Crear componente `Pagination` (o usar DaisyUI)
- [ ] Agregar dropdown de items por página (10/20/50)
- [ ] Mostrar "Mostrando X-Y de Z resultados"

### 🟢 Prioridad Baja (Nice to have)

#### 8. Ordenamiento (VIS-005)
**Impacto**: Bajo - mejora UX
**Effort**: 🟢 Bajo (2-3 horas)
**Tareas**:
- [ ] Agregar estado `ordenamiento`
- [ ] Crear dropdown con opciones:
  - Fecha (más reciente primero)
  - Fecha (más antigua primero)
  - Familia (A-Z)
  - Tipo de visita
- [ ] Implementar lógica de ordenamiento
- [ ] Aplicar orden a `visitasFiltradas`

---

## Tests Pendientes

### Backend (Resolvers)

- [ ] `test-vis-001-create`: Crear visita con wizard completo
- [ ] `test-vis-002-status-derivation`: Verificar derivación automática de estatus
  - [ ] Tipo "no_se_pudo_realizar" → estatus "cancelada"
  - [ ] Fecha pasada + actividades → estatus "realizada"
  - [ ] Fecha futura → estatus "programada"
- [ ] `test-vis-003-permissions`: No permitir crear visita sin autenticación
- [ ] `test-vis-004-permissions`: No permitir crear visita para familia de otra comunidad
- [ ] `test-vis-005-update`: Actualizar visita existente (cuando se implemente)
- [ ] `test-vis-006-update-permissions`: No permitir editar visita de otra comunidad
- [ ] `test-vis-007-delete`: Soft delete de visita
- [ ] `test-vis-008-delete-permissions`: Solo CEA/COLABORADOR pueden eliminar
- [ ] `test-vis-009-validation`: Validar campos requeridos
- [ ] `test-vis-010-visitadores`: Validar relación muchos a muchos con visitadores

### Frontend (Components)

#### VisitaWizard.tsx
- [ ] Renderizado de wizard con 8 pasos
- [ ] Navegación entre pasos con validación
- [ ] Validación paso 1: Barrio o Barrio Otro requerido
- [ ] Validación paso 2: Familia requerida
- [ ] Validación paso 3: Fecha y hora requeridas
- [ ] Validación paso 4: Al menos 1 visitador
- [ ] Validación paso 5: Tipo requerido
- [ ] Renderizado condicional según tipo de visita
- [ ] Submit de formulario completo
- [ ] Cerrar wizard después de crear

#### VisitasPage.tsx
- [ ] Renderizado de tabla de visitas
- [ ] Aplicar filtro por tipo
- [ ] Aplicar filtro por estado
- [ ] Aplicar filtro por familia
- [ ] Combinar múltiples filtros
- [ ] Mostrar mensaje "No hay visitas" cuando tabla vacía
- [ ] Mostrar total de visitas
- [ ] Abrir wizard al click en "Nueva Visita"
- [ ] Confirmar antes de eliminar
- [ ] Refrescar tabla después de crear/eliminar

#### VisitaDetallesModal.tsx (Pendiente crear)
- [ ] Renderizado de modal con datos completos
- [ ] Mostrar información general
- [ ] Mostrar ubicación
- [ ] Mostrar actividades (si aplica)
- [ ] Mostrar material dejado
- [ ] Mostrar seguimiento programado
- [ ] Mostrar notas adicionales
- [ ] Cerrar modal

---

## Mejoras Futuras

### Alta Prioridad

1. **Auditoría de Eliminaciones**
   - Registrar quién eliminó la visita y cuándo
   - Campo `eliminadoPorId` y `deletedAt`
   - Permitir restaurar visitas eliminadas (CEA only)

2. **Búsqueda de Texto**
   - Buscar por nombre de familia
   - Buscar en notas adicionales
   - Buscar por barrio/núcleo

3. **Exportar a Excel/PDF**
   - Exportar visitas filtradas
   - Incluir todas las columnas
   - Formato para reportes

### Media Prioridad

4. **Filtros Avanzados**
   - Rango de fechas (desde - hasta)
   - Filtro por visitador
   - Filtro por barrio/núcleo
   - Filtro por tipo de actividad realizada

5. **Validación de Duplicados**
   - Advertir si ya existe visita a misma familia en misma fecha
   - Permitir continuar o cancelar

6. **Notificaciones de Seguimiento**
   - Email/notificación cuando se acerca fecha de seguimiento
   - Dashboard con seguimientos pendientes

7. **Historial de Cambios**
   - Auditoría completa de modificaciones
   - Tabla `VisitaHistory` con snapshots

### Baja Prioridad

8. **Estadísticas**
   - Visitas por barrio/núcleo
   - Actividades más frecuentes
   - Material más usado
   - Gráficas de tendencias

9. **Templates de Visitas**
   - Guardar combinaciones comunes de actividades
   - Quick start con template pre-definido

10. **Asignación Automática de Visitadores**
    - Sugerir visitadores según barrio/núcleo
    - Balanceo de carga entre visitadores

11. **Calendario Visual**
    - Vista de calendario con visitas programadas
    - Drag & drop para reprogramar

12. **App Móvil**
    - Registrar visitas desde el campo
    - Modo offline con sincronización

---

## 📊 Estadísticas y Métricas

### Performance Esperada

- Query list: < 200ms (sin paginación, hasta 1000 registros)
- Mutation create: < 300ms (datos complejos)
- Mutation update: < 250ms (cuando se implemente)
- Mutation delete: < 150ms

### Uso Estimado

- Promedio de visitas por comunidad/mes: 50-200
- Frecuencia de creación: 2-10 visitas/día
- Frecuencia de edición: Baja (1-2% de visitas creadas)
- Frecuencia de eliminación: Muy baja (<1% de visitas)
- Ratio seguimiento programado: ~40% de visitas

---

## 🔗 Documentación Relacionada

- **Reglas comunes**: `COMMON.md`
- **Familias**: `FAMILIAS.md` (visitas dependen de familias)
- **Barrios**: `BARRIOS.md` (ubicación de visitas)
- **Núcleos**: `NUCLEOS.md` (ubicación de visitas)
- **Usuarios**: Visitadores y creadores de visitas
- **Migraciones**: `/ANALISIS_MIGRACION.md`
- **Pendientes generales**: `/PENDIENTES.md`

---

**Última actualización**: 14 de octubre de 2025
**Mantenido por**: Equipo de Desarrollo Devocionales 4.0
**Estado**: ⚠️ Funcional parcialmente - requiere implementar funcionalidades faltantes
