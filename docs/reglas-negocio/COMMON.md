# Reglas de Negocio Comunes

**Fecha de creación**: 14 de octubre de 2025
**Versión**: 4.0
**Estado**: Vigente

---

## 📋 Índice

1. [Convenciones Generales](#convenciones-generales)
2. [Formato de Campos](#formato-de-campos)
3. [Edición Inline](#edición-inline)
4. [Seguridad y Autenticación](#seguridad-y-autenticación)
5. [Eliminación de Registros](#eliminación-de-registros)
6. [Multi-tenancy](#multi-tenancy)

---

## Convenciones Generales

### COMMON-001: Nomenclatura de IDs
**Descripción**: Todos los registros de negocio tienen identificadores únicos.

**Regla**:
- IDs generados automáticamente por PostgreSQL (UUID o CUID)
- Formato: cadena alfanumérica única
- Inmutable una vez creado
- No se reutilizan IDs eliminados

**Implementación**:
- Backend: Prisma maneja generación automática
- Schema: `id String @id @default(cuid())`

---

### COMMON-002: Timestamps Automáticos
**Descripción**: Todos los registros tienen marcas de tiempo de creación y actualización.

**Regla**:
- `createdAt`: Fecha/hora de creación (inmutable)
- `updatedAt`: Fecha/hora de última modificación (auto-actualiza)
- Zona horaria: America/Mexico_City (Querétaro, México)
- Formato: ISO 8601

**Implementación**:
```typescript
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
```

**Frontend**:
- Formato de visualización: `dd/MM/yyyy`
- Helper: `formatDate()` con timeZone 'America/Mexico_City'

---

## Formato de Campos

### COMMON-003: Campos de Texto
**Descripción**: Estandarización de campos de texto en el sistema.

**Reglas**:
- **Nombre**: String, obligatorio, min 1 carácter, max 200
- **Descripción**: String, opcional, max 1000 caracteres
- **Trimming**: Se eliminan espacios al inicio y final
- **Valores vacíos**: Se guardan como `null`, no como string vacío

**Validación**:
```typescript
// Frontend
if (value.trim() === '') value = null;

// Backend
nombre: String! // Obligatorio
descripcion: String // Opcional
```

---

### COMMON-004: Estados Activo/Inactivo
**Descripción**: Todos los catálogos usan soft delete.

**Regla**:
- Campo `activo`: Boolean, default `true`
- No se eliminan físicamente registros
- Queries por defecto filtran `activo = true`
- Solo usuarios CEA pueden ver/restaurar inactivos

**Implementación**:
```typescript
// Schema
activo Boolean @default(true)

// Resolver
where: { activo: true }
```

---

## Edición Inline

### COMMON-005: Edición Tipo Excel
**Descripción**: Todos los catálogos permiten edición inline de celdas.

**Regla**:
- **Click en celda**: Inicia edición (excepto campos no editables)
- **Enter**: Guarda cambios y sale de edición
- **Escape**: Cancela cambios y sale de edición
- **Tab**: Guarda y navega a siguiente celda editable
- **onBlur**: Guarda automáticamente al perder foco

**Características**:
- Solo una celda editable a la vez por registro
- Input tiene borde verde (`border-2 border-green-600`)
- Celdas editables tienen hover azul (`hover:bg-blue-50`)
- Celdas no editables tienen fondo gris (`bg-gray-50`)

**Implementación**:
```typescript
const [editing, setEditing] = useState<{
  recordId: string | null;
  field: string | null;
  value: string;
}>({ recordId: null, field: null, value: '' });
```

---

### COMMON-006: Campos No Editables
**Descripción**: Ciertos campos son de solo lectura.

**Regla**:
- `createdAt`: Siempre no editable
- `updatedAt`: Siempre no editable (auto-actualiza)
- IDs: Siempre no editables
- Campos calculados: No editables

**Estilo visual**:
```typescript
className="bg-gray-50 text-gray-600"
```

---

## Seguridad y Autenticación

### COMMON-007: Autenticación Requerida
**Descripción**: Todas las operaciones requieren autenticación.

**Regla**:
- JWT en header: `Authorization: Bearer <token>`
- Token expira en 7 días
- Sin token: Error `UNAUTHENTICATED`

**Implementación**:
```typescript
if (!userId) {
  throw new GraphQLError('No autenticado', {
    extensions: { code: 'UNAUTHENTICATED' },
  });
}
```

---

### COMMON-008: Validación en Dos Capas
**Descripción**: Validaciones redundantes en frontend y backend.

**Regla**:
- **Frontend**: Validación para UX (rápida, amigable)
- **Backend**: Validación de seguridad (obligatoria, strict)
- Backend NUNCA confía en validación del frontend

**Ejemplo**:
```typescript
// Frontend: Alert amigable
if (!valid) {
  alert('⚠️ Mensaje amigable');
  return;
}

// Backend: Error GraphQL
if (!valid) {
  throw new GraphQLError('Validación fallida', {
    extensions: { code: 'BAD_REQUEST' },
  });
}
```

---

## Eliminación de Registros

### COMMON-009: Soft Delete
**Descripción**: Los registros no se eliminan físicamente.

**Regla**:
- Eliminación = `UPDATE activo = false`
- Queries excluyen `activo = false` por defecto
- Relaciones mantienen integridad referencial
- Solo CEA puede ver/restaurar eliminados

**Implementación**:
```typescript
// Mutation deleteX
await prisma.x.update({
  where: { id },
  data: { activo: false },
});
```

---

### COMMON-010: Confirmación de Eliminación
**Descripción**: Confirmación obligatoria antes de eliminar.

**Regla**:
- Dialog con mensaje: `¿Eliminar [tipo] "[nombre]"?`
- Botones: "Cancelar" (default) y "Eliminar" (rojo)
- No hay "deshacer" inmediato (se requiere CEA para restaurar)

**Implementación**:
```typescript
if (confirm(`¿Eliminar el barrio "${nombre}"?`)) {
  await deleteBarrio({ variables: { id } });
}
```

---

## Multi-tenancy

### COMMON-011: Aislamiento por Comunidad
**Descripción**: Cada comunidad tiene sus propios datos aislados.

**Regla**:
- Todo registro tiene `comunidadId`
- Usuarios solo ven datos de su comunidad
- Queries filtran automáticamente por `comunidadId`
- CEA puede administrar múltiples comunidades

**Implementación**:
```typescript
// Obtener comunidad del usuario
const user = await prisma.usuario.findUnique({
  where: { id: userId },
  select: { comunidadId: true },
});

// Crear con comunidadId
data: {
  ...input,
  comunidadId: user.comunidadId,
}
```

---

## 📊 Estados de Carga y Error

### COMMON-012: Estados de UI
**Descripción**: Todas las vistas manejan estados de loading y error.

**Regla**:
- **Loading**: Spinner con mensaje "Cargando [entidad]..."
- **Error**: Card roja con mensaje "Error al cargar [entidad]: {error.message}"
- **Vacío**: Mensaje "No hay [entidad] registrados. Crea uno nuevo para comenzar."

**Implementación**:
```typescript
if (loading) return <LoadingState />;
if (error) return <ErrorState error={error} />;
if (data.length === 0) return <EmptyState />;
```

---

## 📝 Convenciones de Código

### COMMON-013: Naming Conventions
**Descripción**: Estándares de nombres en código.

**Reglas**:
- **Variables**: camelCase (`barrioId`, `nombreCompleto`)
- **Tipos/Interfaces**: PascalCase (`CreateBarrioInput`, `Nucleo`)
- **Constantes**: UPPER_SNAKE_CASE (`MAX_LENGTH`, `DEFAULT_TIMEZONE`)
- **Archivos**: kebab-case para utils, PascalCase para componentes
- **GraphQL Types**: PascalCase (`Barrio`, `Nucleo`)
- **GraphQL Fields**: camelCase (`barrioId`, `createdAt`)

---

## 🔗 Referencias

**Archivos relacionados**:
- `/packages/backend/prisma/schema.prisma` - Schema de base de datos
- `/packages/backend/src/schema.ts` - Schema GraphQL
- `/packages/backend/src/context.ts` - Context con userId y comunidadId
- `/packages/web/src/lib/apollo-client.ts` - Cliente Apollo con auth

**Documentación adicional**:
- `BARRIOS.md` - Reglas específicas de Barrios
- `NUCLEOS.md` - Reglas específicas de Núcleos

---

**Última actualización**: 14 de octubre de 2025
**Mantenido por**: Equipo de Desarrollo Devocionales 4.0
