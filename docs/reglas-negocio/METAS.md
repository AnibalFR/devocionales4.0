# Reglas de Negocio: Metas del Comité

## Tabla de Contenidos
- [META-001: Creación de Nueva Meta](#meta-001-creación-de-nueva-meta)
- [META-002: Estructura de Datos de Meta](#meta-002-estructura-de-datos-de-meta)
- [META-003: Cálculo Automático del Estado](#meta-003-cálculo-automático-del-estado)
- [META-004: Meta Activa en Reporte de Ciclo](#meta-004-meta-activa-en-reporte-de-ciclo)
- [META-005: Cálculo de Métricas Actuales](#meta-005-cálculo-de-métricas-actuales)
- [META-006: Visualización de Progreso con Barras de Color](#meta-006-visualización-de-progreso-con-barras-de-color)
- [META-007: Eliminación de Meta con Confirmación](#meta-007-eliminación-de-meta-con-confirmación)
- [META-008: Edición de Meta](#meta-008-edición-de-meta)
- [META-009: Banner Informativo en Catálogo](#meta-009-banner-informativo-en-catálogo)
- [META-010: Actualización Automática de Fechas](#meta-010-actualización-automática-de-fechas)
- [META-011: Sistema de Trimestres del Comité](#meta-011-sistema-de-trimestres-del-comité)

---

## META-001: Creación de Nueva Meta

**Descripción:** Al crear una nueva meta del comité, se genera con valores predeterminados basados en el sistema de trimestres.

**Regla:**
- Al hacer clic en "Nueva Meta", se abre un modal de creación
- El usuario debe seleccionar un trimestre del dropdown
- Trimestres disponibles: 3 años (año anterior, actual, siguiente)
- Las fechas se actualizan automáticamente al seleccionar el trimestre
- Todas las metas numéricas inician en 0 (editables)
- Campos obligatorios: Trimestre, Fecha Inicio, Fecha Fin

**Implementación:**
- **Frontend:** `packages/web/src/pages/MetasPage.tsx` - función `openCreateModal()` y `handleSubmit()`
- **Backend:** `packages/backend/src/resolvers/meta.resolvers.ts` - mutation `createMeta`
- **GraphQL Schema:** `packages/backend/src/schema.ts` - `CreateMetaInput`

**Archivos:**
- Frontend: `MetasPage.tsx:114-126, 151-181`
- Backend: `meta.resolvers.ts:210-240`

---

## META-002: Estructura de Datos de Meta

**Descripción:** Cada meta del comité tiene la siguiente estructura de datos en la base de datos.

**Modelo:**
```typescript
{
  id: string;                        // UUID generado automáticamente
  comunidadId: string;               // Relación con la comunidad
  trimestre: string;                 // "Ene - Abr 2025"
  fechaInicio: string;               // YYYY-MM-DD (date)
  fechaFin: string;                  // YYYY-MM-DD (date)
  metaNucleos: number;               // Número entero ≥ 0
  metaVisitas: number;               // Número entero ≥ 0
  metaPersonasVisitando: number;     // Número entero ≥ 0
  metaDevocionales: number;          // Número entero ≥ 0
  createdAt: DateTime;               // Timestamp automático
  updatedAt: DateTime;               // Timestamp automático
}
```

**Campos Calculados (no almacenados):**
- `estado`: 'futura' | 'activa' | 'completada' (calculado en tiempo real)
- `progreso`: objeto con métricas actuales y porcentajes (solo si está activa)

**Implementación:**
- **Prisma Schema:** `packages/backend/prisma/schema.prisma` - model `Meta`
- **GraphQL Type:** `packages/backend/src/schema.ts` - type `Meta`

**Archivos:**
- Schema: `schema.prisma` - model Meta
- GraphQL: `schema.ts:209-235`

---

## META-003: Cálculo Automático del Estado

**Descripción:** El estado de cada meta se calcula automáticamente según las fechas de inicio y fin comparadas con la fecha actual.

**Regla:**
- **Futura:** La fecha actual es anterior a fecha_inicio
  - Badge azul con texto "Futura"
- **Activa:** La fecha actual está entre fecha_inicio y fecha_fin (inclusivo)
  - Badge verde con texto "Activa"
- **Completada:** La fecha actual es posterior a fecha_fin
  - Badge gris con texto "Completada"

**Implementación:**
- El cálculo se realiza en cada consulta mediante un resolver
- La comparación usa fechas sin horario (setHours(0,0,0,0))
- Solo puede haber una meta activa a la vez (por diseño, no validado por sistema)

**Función:**
```typescript
function calcularEstadoMeta(meta: any): string {
  const hoy = new Date();
  const inicio = new Date(meta.fechaInicio);
  const fin = new Date(meta.fechaFin);

  hoy.setHours(0, 0, 0, 0);
  inicio.setHours(0, 0, 0, 0);
  fin.setHours(0, 0, 0, 0);

  if (hoy < inicio) {
    return 'futura';
  } else if (hoy > fin) {
    return 'completada';
  } else {
    return 'activa';
  }
}
```

**Archivos:**
- Backend: `meta.resolvers.ts:24-41, 297-299`
- Frontend: `MetasPage.tsx:64-74` (constantes de colores)

---

## META-004: Meta Activa en Reporte de Ciclo

**Descripción:** El sistema identifica automáticamente la meta activa del período actual para mostrarla en reportes.

**Regla:**
- Se usa el query `metaActiva` para obtener la meta activa
- Si no hay meta activa → retorna `null`
- Si existe meta activa → retorna la meta con su progreso calculado
- La meta activa se determina comparando la fecha actual con los rangos de fechas

**Implementación:**
- **GraphQL Query:** `metaActiva` retorna la única meta cuyo período incluye la fecha actual
- **Uso:** En ReporteCicloPage para mostrar panel de seguimiento de metas
- **Resolver:** Busca entre todas las metas de la comunidad y retorna la que cumple la condición

**Archivos:**
- Backend: `meta.resolvers.ts:169-206`
- Frontend: `MetasPage.tsx:112` (obtención de metaActiva)

---

## META-005: Cálculo de Métricas Actuales

**Descripción:** Las métricas actuales se calculan automáticamente desde los datos del sistema para la meta activa.

**Regla:**
- **Núcleos Activos:** Cuenta total de núcleos activos (`activo: true`) en la comunidad
- **Visitas Realizadas:** Cuenta de visitas con estatus "realizada" dentro del período de la meta
  - Filtro: `visitDate >= fechaInicio AND visitDate <= fechaFin AND visitStatus = 'realizada'`
- **Personas Visitando:** Cuenta de usuarios únicos que realizaron visitas dentro del período
  - Se extraen los `visitorUserIds` de todas las visitas realizadas en el período
  - Se eliminan duplicados usando `Set`
- **Devocionales Activos:** Cuenta de miembros con `tieneDevocional: true AND activo: true`

**Implementación:**
- Todos los cálculos se ejecutan en tiempo real al consultar la meta activa
- Solo se calculan para metas con estado "activa"
- Se retornan tanto valores absolutos como porcentajes

**Función:**
```typescript
async function calcularProgresoMeta(meta: any, prisma: any) {
  // Contar núcleos activos
  const nucleosActuales = await prisma.nucleo.count({
    where: { comunidadId: meta.comunidadId, activo: true }
  });

  // Contar visitas del período
  const visitasActuales = await prisma.visita.count({
    where: {
      visitDate: { gte: meta.fechaInicio, lte: meta.fechaFin },
      visitStatus: 'realizada',
    },
  });

  // ... más cálculos
}
```

**Archivos:**
- Backend: `meta.resolvers.ts:43-121, 302-310`

---

## META-006: Visualización de Progreso con Barras de Color

**Descripción:** Cada tarjeta de métrica muestra una barra de progreso con colores y mensajes motivacionales según el porcentaje de cumplimiento.

**Regla:**
- **Verde (≥80% de cumplimiento):**
  - Color de barra: `bg-green-500`
  - Mensaje motivacional: "¡Excelente progreso!"
  - Color mensaje: `text-green-700`

- **Amarillo (50-79% de cumplimiento):**
  - Color de barra: `bg-yellow-500`
  - Mensaje motivacional: "¡Buen avance!"
  - Color mensaje: `text-yellow-700`

- **Rojo (<50% de cumplimiento):**
  - Color de barra: `bg-red-500`
  - Mensaje motivacional: "¡Sigamos adelante!"
  - Color mensaje: `text-red-700`

- **Casos especiales:**
  - Si la meta es 0 → barra verde al 100% sin mensaje
  - Si el progreso supera el 100% → se muestra el porcentaje real pero la barra se limita al 100%
  - La barra tiene ancho máximo de 100% del contenedor

**Implementación:**
```typescript
const renderProgressBar = (label: string, actual: number, meta: number, porcentaje: number) => {
  // Determinar color y mensaje según porcentaje
  let color, mensaje, colorMensaje;

  if (meta === 0) {
    color = 'bg-green-500';
  } else if (porcentaje >= 80) {
    color = 'bg-green-500';
    mensaje = '¡Excelente progreso!';
    colorMensaje = 'text-green-700';
  } else if (porcentaje >= 50) {
    color = 'bg-yellow-500';
    mensaje = '¡Buen avance!';
    colorMensaje = 'text-yellow-700';
  } else {
    color = 'bg-red-500';
    mensaje = '¡Sigamos adelante!';
    colorMensaje = 'text-red-700';
  }
  // ... renderizar
}
```

**Archivos:**
- Frontend: `MetasPage.tsx:194-239`

---

## META-007: Eliminación de Meta con Confirmación

**Descripción:** Al eliminar una meta, se solicita confirmación al usuario mostrando información relevante.

**Regla:**
- Mensaje de confirmación: `¿Estás seguro de eliminar esta meta?`
- Si el usuario acepta → ejecuta mutation `deleteMeta` y refresca la lista
- Si el usuario cancela → no se realiza ninguna acción
- La eliminación es permanente (hard delete, no hay soft delete)
- Solo se pueden eliminar metas de la propia comunidad (validado en backend)

**Implementación:**
- **Frontend:** Muestra confirm dialog nativo del navegador
- **Backend:** Valida existencia de la meta y ejecuta delete

**Archivos:**
- Frontend: `MetasPage.tsx:183-192`
- Backend: `meta.resolvers.ts:268-292`

---

## META-008: Edición de Meta

**Descripción:** Las metas pueden ser editadas mediante un modal que carga los datos existentes.

**Regla:**
- Al hacer clic en "Editar", se abre el modal precargado con los datos actuales
- Se pueden modificar todos los campos (trimestre, fechas, metas numéricas)
- Al cambiar el trimestre, las fechas se actualizan automáticamente
- Validaciones:
  - Campos obligatorios: trimestre, fechaInicio, fechaFin
  - Metas numéricas no pueden ser negativas
- Al guardar, se ejecuta mutation `updateMeta` con solo los campos modificados
- El estado se recalcula automáticamente en la siguiente consulta

**Implementación:**
- **Frontend:** Mismo modal que creación, pero con `editMode: true`
- **Backend:** Update parcial, solo campos proporcionados en el input

**Archivos:**
- Frontend: `MetasPage.tsx:128-140, 166-181`
- Backend: `meta.resolvers.ts:242-266`

---

## META-009: Banner Informativo en Catálogo

**Descripción:** El catálogo de metas muestra un banner informativo sobre el funcionamiento del sistema.

**Regla:**
- Se muestra un banner azul con icono de información al inicio del catálogo
- Texto del mensaje: "Define aquí las metas del comité por trimestre. La meta con fecha actual será marcada como **Activa** y se mostrará en el Reporte de Ciclo."
- Colores del banner:
  - Fondo: gradiente azul claro (`from-blue-50 to-blue-100`)
  - Borde izquierdo: azul (`border-blue-500`)
  - Texto: azul oscuro (`text-blue-900`)
  - Icono: azul (`text-blue-600`)
- El banner está presente siempre, incluso cuando no hay metas

**Implementación:**
```tsx
<div className="mb-6 bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-500 rounded-r-lg p-4 flex items-start space-x-3">
  <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" ...>
    {/* Info icon */}
  </svg>
  <p className="text-sm text-blue-900">
    Define aquí las metas del comité por trimestre...
  </p>
</div>
```

**Archivos:**
- Frontend: `MetasPage.tsx:295-303`

---

## META-010: Actualización Automática de Fechas

**Descripción:** Al seleccionar un trimestre del dropdown, las fechas de inicio y fin se actualizan automáticamente.

**Regla:**
- Cada opción del dropdown de trimestre tiene asociadas sus fechas correspondientes
- Al seleccionar un trimestre:
  1. Se actualiza el campo `trimestre` con el nombre del período
  2. Se actualiza automáticamente `fechaInicio` con la fecha del trimestre
  3. Se actualiza automáticamente `fechaFin` con la fecha del trimestre
- Las fechas son editables manualmente después de la selección
- Esto aplica tanto en creación como en edición de metas

**Implementación:**
```typescript
const handleTrimestreChange = (value: string) => {
  const option = trimestreOptions.find(opt => opt.value === value);
  if (option) {
    setFormData(prev => ({
      ...prev,
      trimestre: value,
      fechaInicio: option.fechaInicio,
      fechaFin: option.fechaFin,
    }));
  }
};
```

**Archivos:**
- Frontend: `MetasPage.tsx:263-273`

---

## META-011: Sistema de Trimestres del Comité

**Descripción:** El sistema genera automáticamente una lista de trimestres válidos basándose en el sistema de períodos del comité Bahá'í.

**Regla:**
- **Trimestres definidos (del día 21 al 20):**
  - **Ene - Abr:** 21 de enero al 20 de abril
  - **Abr - Jul:** 21 de abril al 20 de julio
  - **Jul - Oct:** 21 de julio al 20 de octubre
  - **Oct - Ene:** 21 de octubre al 20 de enero del año siguiente (cruza años)

- **Generación de opciones:**
  - Se generan trimestres para 3 años: año anterior, actual, y siguiente
  - Total de opciones disponibles: 12 trimestres (4 por año × 3 años)
  - Se ordenan cronológicamente por fecha de inicio

- **Estructura de cada trimestre:**
  ```typescript
  {
    value: "ene-abr-2025",
    label: "Ene - Abr 2025",
    fechaInicio: "2025-01-21",
    fechaFin: "2025-04-20"
  }
  ```

- **Formato de fechas:**
  - Almacenadas como strings en formato ISO: `YYYY-MM-DD`
  - Sin conversión de zona horaria (fechas puras)

**Implementación:**
```typescript
const generateTrimestreOptions = () => {
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];
  const options = [];

  years.forEach(year => {
    // Ene - Abr
    options.push({
      value: `ene-abr-${year}`,
      label: `Ene - Abr ${year}`,
      fechaInicio: `${year}-01-21`,
      fechaFin: `${year}-04-20`,
    });
    // ... otros trimestres
  });

  return options.sort((a, b) => a.fechaInicio.localeCompare(b.fechaInicio));
};
```

**Archivos:**
- Frontend: `MetasPage.tsx:241-259`

---

## Resumen de Implementación

### Frontend
- **Página principal:** `packages/web/src/pages/MetasPage.tsx`
- **Componentes:** Modal de creación/edición, tabla de metas, panel de progreso
- **Queries/Mutations:** METAS_QUERY, CREATE_META, UPDATE_META, DELETE_META

### Backend
- **Resolvers:** `packages/backend/src/resolvers/meta.resolvers.ts`
- **Schema GraphQL:** `packages/backend/src/schema.ts` (types Meta, MetaProgreso, inputs)
- **Modelo Prisma:** `packages/backend/prisma/schema.prisma` (model Meta)

### Reglas Críticas
1. **META-011**: Sistema de trimestres del comité (21 al 20)
2. **META-003**: Cálculo automático del estado
3. **META-005**: Cálculo de métricas en tiempo real
4. **META-006**: Visualización con colores y mensajes motivacionales
