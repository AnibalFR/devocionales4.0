# 📚 Reglas de Negocio - Devocionales 4.0

**Versión**: 4.0
**Fecha de creación**: 14 de octubre de 2025
**Estado**: En desarrollo activo

---

## 🎯 Propósito

Este directorio contiene la documentación completa de todas las reglas de negocio del sistema Devocionales 4.0, organizadas por módulo y funcionalidad.

---

## 📖 Estructura de Documentación

### 1. [COMMON.md](./COMMON.md) - Reglas Comunes
Reglas transversales que aplican a todo el sistema:
- Convenciones generales (IDs, timestamps, formato de campos)
- Edición inline tipo Excel
- Seguridad y autenticación
- Eliminación de registros (soft delete)
- Multi-tenancy
- Estados de UI (loading, error, empty)
- Naming conventions

**Cuándo consultar**: Antes de implementar cualquier nueva vista o funcionalidad.

---

### 2. [BARRIOS.md](./BARRIOS.md) - Catálogo de Barrios
Reglas específicas del módulo de Barrios:
- **BAR-001**: Creación de Barrios
- **BAR-002**: Edición Inline de Barrios
- **BAR-003**: Eliminación de Barrios
- **BAR-004**: Listado de Barrios
- **BAR-005**: Formato de Fecha

**Vista asociada**: `/packages/web/src/pages/BarriosPage.tsx`
**Resolver backend**: `/packages/backend/src/resolvers/barrio.resolvers.ts`

---

### 3. [NUCLEOS.md](./NUCLEOS.md) - Catálogo de Núcleos
Reglas específicas del módulo de Núcleos:
- **NUC-001**: ⚠️ Validación de Barrios al Crear Núcleo (CRÍTICA)
- **NUC-002**: Núcleo Opcional para Miembros
- **NUC-003**: Creación de Núcleos
- **NUC-004**: Edición Inline de Núcleos
- **NUC-005**: Eliminación de Núcleos
- **NUC-006**: Listado de Núcleos
- **NUC-007**: Formato de Fecha

**Vista asociada**: `/packages/web/src/pages/NucleosPage.tsx`
**Resolver backend**: `/packages/backend/src/resolvers/nucleo.resolvers.ts`

---

### 4. [MIEMBROS.md](./MIEMBROS.md) - Catálogo de Miembros
Reglas específicas del módulo de Miembros:
- **MEM-001**: ⚠️ Creación de Nuevo Miembro (CRÍTICA - Validación de Barrios)
- **MEM-002**: Ordenamiento por Defecto
- **MEM-003**: ⚠️ Cálculo de Edad - Sistema Dual (CRÍTICA)
- **MEM-004**: Persistencia en Catálogo
- **MEM-005**: Roles de Miembro
- **MEM-006**: Reuniones Devocionales

**Vista asociada**: `/packages/web/src/pages/MiembrosPage.tsx`
**Resolver backend**: `/packages/backend/src/resolvers/miembro.resolvers.ts`
**Estado**: ✅ Funcional - Completado con paginación y columnas faltantes

---

### 5. [DEVOCIONALES.md](./DEVOCIONALES.md) - Catálogo de Devocionales
Reglas específicas del módulo de Devocionales:
- **DEV-001**: Gestión de Reuniones Devocionales
- **DEV-002**: 🚨 Gestión de Miembros Acompañantes (BUG CRÍTICO)
- **DEV-003**: Edición Inline de Campos
- **DEV-004**: Botón Nueva Devocional

**Vista asociada**: `/packages/web/src/pages/DevocionalesPage.tsx`
**Resolver backend**: `/packages/backend/src/resolvers/miembro.resolvers.ts` (query miembrosConDevocional)
**Estado**: 🚨 Funcional CON ERRORES CRÍTICOS - Campo `devocionalAcompanantesIds` debe cambiarse a `devocionalMiembros`

---

### 6. [FAMILIAS.md](./FAMILIAS.md) - Catálogo de Familias
Reglas específicas del módulo de Familias:
- **FAM-001**: ⚠️ Validación de Barrios al Crear Familia (CRÍTICA)
- **FAM-002**: Filtrado de Miembros Disponibles
- **FAM-003**: Selector Inteligente de Dirección
- **FAM-004**: Sincronización de Datos Compartidos (CRÍTICA)
- **FAM-005**: Asignación de Roles Familiares
- **FAM-006**: Visualización Expandible de Miembros
- **FAM-007**: Indicador de Devocional

**Vista asociada**: `/packages/web/src/pages/FamiliasPage.tsx`
**Resolver backend**: `/packages/backend/src/resolvers/familia.resolvers.ts`
**Estado**: ✅ Funcional - Completado 100% con paridad completa respecto a v3.0

---

### 7. [METAS.md](./METAS.md) - Metas del Comité
Reglas específicas del módulo de Metas Trimestrales:
- **META-001**: Creación de Nueva Meta
- **META-002**: Estructura de Datos de Meta
- **META-003**: Cálculo Automático del Estado
- **META-004**: Meta Activa en Reporte de Ciclo
- **META-005**: Cálculo de Métricas Actuales
- **META-006**: Visualización de Progreso con Barras de Color
- **META-007**: Eliminación de Meta con Confirmación
- **META-008**: Edición de Meta
- **META-009**: Banner Informativo en Catálogo
- **META-010**: Actualización Automática de Fechas
- **META-011**: ⚠️ Sistema de Trimestres del Comité (CRÍTICA)

**Vista asociada**: `/packages/web/src/pages/MetasPage.tsx`
**Resolver backend**: `/packages/backend/src/resolvers/meta.resolvers.ts`
**Estado**: ✅ Funcional - Completado con sistema de trimestres del comité (21 al 20)

---

## 🔗 Relaciones entre Módulos

```
Comunidad
    │
    ├─── Usuarios
    │       └─── Autenticación (COMMON-007)
    │
    ├─── Barrios (BARRIOS.md)
    │       │
    │       ├─── MEM-001: Validación crítica (obligatorio para Miembros)
    │       ├─── NUC-001: Validación crítica (obligatorio para Núcleos)
    │       │
    │       ├─── Núcleos (NUCLEOS.md)
    │       │       │
    │       │       └─── NUC-002: Opcional para Miembros
    │       │
    │       ├─── Familias (FAMILIAS.md)
    │       │       │
    │       │       ├─── FAM-001: Validación de barrios (CRÍTICA)
    │       │       ├─── FAM-002: Filtrado de miembros disponibles
    │       │       ├─── FAM-003: Selector inteligente de dirección
    │       │       ├─── FAM-004: Sincronización de datos compartidos (CRÍTICA)
    │       │       ├─── FAM-005: Roles familiares
    │       │       ├─── FAM-006: Visualización expandible
    │       │       ├─── FAM-007: Indicador de devocional
    │       │       │
    │       │       └─── Miembros (MIEMBROS.md)
    │       │               │
    │       │               ├─── MEM-003: Sistema dual de edad
    │       │               ├─── MEM-004: Persistencia independiente de familia
    │       │               ├─── MEM-006: Reuniones devocionales
    │       │               │
    │       │               └─── Devocionales (DEVOCIONALES.md)
    │       │                       │
    │       │                       ├─── DEV-001: Filtro miembros con tieneDevocional
    │       │                       ├─── DEV-002: 🚨 BUG campo devocionalAcompanantesIds
    │       │                       └─── DEV-003: Edición inline día/hora/participantes
    │       │
    │       └─── Miembros (sin familia)
```

---

## 📋 Índice de Reglas por Código

| Código | Descripción | Archivo | Estado |
|--------|-------------|---------|--------|
| **COMMON-001** | Nomenclatura de IDs | COMMON.md | ✅ |
| **COMMON-002** | Timestamps Automáticos | COMMON.md | ✅ |
| **COMMON-003** | Campos de Texto | COMMON.md | ✅ |
| **COMMON-004** | Estados Activo/Inactivo | COMMON.md | ✅ |
| **COMMON-005** | Edición Tipo Excel | COMMON.md | ✅ |
| **COMMON-006** | Campos No Editables | COMMON.md | ✅ |
| **COMMON-007** | Autenticación Requerida | COMMON.md | ✅ |
| **COMMON-008** | Validación en Dos Capas | COMMON.md | ✅ |
| **COMMON-009** | Soft Delete | COMMON.md | ✅ |
| **COMMON-010** | Confirmación de Eliminación | COMMON.md | ✅ |
| **COMMON-011** | Aislamiento por Comunidad | COMMON.md | ✅ |
| **COMMON-012** | Estados de UI | COMMON.md | ✅ |
| **COMMON-013** | Naming Conventions | COMMON.md | ✅ |
| **BAR-001** | Creación de Barrios | BARRIOS.md | ✅ |
| **BAR-002** | Edición Inline de Barrios | BARRIOS.md | ✅ |
| **BAR-003** | Eliminación de Barrios | BARRIOS.md | ✅ |
| **BAR-004** | Listado de Barrios | BARRIOS.md | ✅ |
| **BAR-005** | Formato de Fecha | BARRIOS.md | ✅ |
| **NUC-001** | ⚠️ Validación de Barrios (CRÍTICA) | NUCLEOS.md | ✅ |
| **NUC-002** | Núcleo Opcional para Miembros | NUCLEOS.md | ✅ |
| **NUC-003** | Creación de Núcleos | NUCLEOS.md | ✅ |
| **NUC-004** | Edición Inline de Núcleos | NUCLEOS.md | ✅ |
| **NUC-005** | Eliminación de Núcleos | NUCLEOS.md | ✅ |
| **NUC-006** | Listado de Núcleos | NUCLEOS.md | ✅ |
| **NUC-007** | Formato de Fecha | NUCLEOS.md | ✅ |
| **MEM-001** | ⚠️ Creación de Nuevo Miembro (CRÍTICA) | MIEMBROS.md | ✅ |
| **MEM-002** | Ordenamiento por Defecto | MIEMBROS.md | ✅ |
| **MEM-003** | ⚠️ Cálculo de Edad - Sistema Dual (CRÍTICA) | MIEMBROS.md | ✅ |
| **MEM-004** | Persistencia en Catálogo | MIEMBROS.md | ✅ |
| **MEM-005** | Roles de Miembro | MIEMBROS.md | ✅ |
| **MEM-006** | Reuniones Devocionales | MIEMBROS.md | ✅ |
| **DEV-001** | Gestión de Reuniones Devocionales | DEVOCIONALES.md | ⚠️ |
| **DEV-002** | 🚨 Gestión de Acompañantes (BUG CRÍTICO) | DEVOCIONALES.md | 🚨 |
| **DEV-003** | Edición Inline de Campos | DEVOCIONALES.md | ⚠️ |
| **DEV-004** | Botón Nueva Devocional | DEVOCIONALES.md | ❌ |
| **FAM-001** | ⚠️ Validación de Barrios (CRÍTICA) | FAMILIAS.md | ✅ |
| **FAM-002** | Filtrado de Miembros Disponibles | FAMILIAS.md | ✅ |
| **FAM-003** | Selector Inteligente de Dirección | FAMILIAS.md | ✅ |
| **FAM-004** | Sincronización de Datos Compartidos (CRÍTICA) | FAMILIAS.md | ✅ |
| **FAM-005** | Asignación de Roles Familiares | FAMILIAS.md | ✅ |
| **FAM-006** | Visualización Expandible de Miembros | FAMILIAS.md | ✅ |
| **FAM-007** | Indicador de Devocional | FAMILIAS.md | ✅ |
| **META-001** | Creación de Nueva Meta | METAS.md | ✅ |
| **META-002** | Estructura de Datos de Meta | METAS.md | ✅ |
| **META-003** | Cálculo Automático del Estado | METAS.md | ✅ |
| **META-004** | Meta Activa en Reporte de Ciclo | METAS.md | ✅ |
| **META-005** | Cálculo de Métricas Actuales | METAS.md | ✅ |
| **META-006** | Visualización de Progreso con Barras de Color | METAS.md | ✅ |
| **META-007** | Eliminación de Meta con Confirmación | METAS.md | ✅ |
| **META-008** | Edición de Meta | METAS.md | ✅ |
| **META-009** | Banner Informativo en Catálogo | METAS.md | ✅ |
| **META-010** | Actualización Automática de Fechas | METAS.md | ✅ |
| **META-011** | ⚠️ Sistema de Trimestres del Comité (CRÍTICA) | METAS.md | ✅ |

---

## 🚨 Reglas Críticas

Las siguientes reglas son **CRÍTICAS** y su violación puede causar inconsistencias de datos:

### COMMON-007: Autenticación Requerida
- **Impacto**: Crítico (seguridad)
- **Consecuencia de violación**: Acceso no autorizado
- **Implementación**: Middleware en todas las operaciones
- **Test ID**: `test-common-007`

### COMMON-011: Aislamiento por Comunidad
- **Impacto**: Crítico (privacidad)
- **Consecuencia de violación**: Filtración de datos entre comunidades
- **Implementación**: Filtros automáticos en todas las queries
- **Test ID**: `test-common-011`

### MEM-001: Validación de Barrios al Crear Miembro
- **Impacto**: Crítico (integridad de datos)
- **Consecuencia de violación**: Miembros sin barrio asignado, errores en organización territorial
- **Implementación**: Frontend + Backend (dos capas)
- **Test ID**: `test-mem-001`

### MEM-003: Sistema Dual de Cálculo de Edad
- **Impacto**: Alto (funcionalidad core)
- **Consecuencia de violación**: Datos demográficos incorrectos, problemas en reportes
- **Implementación**: Backend (función calcularEdad + field resolver)
- **Test ID**: `test-mem-003`

### NUC-001: Validación de Barrios al Crear Núcleo
- **Impacto**: Alto (integridad de datos)
- **Consecuencia de violación**: Núcleos huérfanos, errores en queries
- **Implementación**: Frontend + Backend (dos capas)
- **Test ID**: `test-nuc-001`

### DEV-002: Campo devocionalAcompanantesIds NO EXISTE (BUG)
- **Impacto**: CRÍTICO (funcionalidad rota)
- **Consecuencia de violación**: Acompañantes no se guardan, query falla
- **Implementación**: Frontend usa campo incorrecto - debe usar `devocionalMiembros`
- **Test ID**: `test-dev-002`
- **FIX URGENTE**: Cambiar todas las ocurrencias de `devocionalAcompanantesIds` → `devocionalMiembros` en DevocionalesPage.tsx

### FAM-001: Validación de Barrios al Crear Familia
- **Impacto**: Crítico (integridad de datos)
- **Consecuencia de violación**: Familias sin barrio asignado, errores en organización territorial
- **Implementación**: Frontend + Backend (dos capas)
- **Test ID**: `test-fam-001`

### FAM-004: Sincronización de Datos Compartidos
- **Impacto**: Crítico (consistencia de datos)
- **Consecuencia de violación**: Desincronización entre familia y miembros (dirección, barrio, núcleo)
- **Implementación**: Frontend (sincronización bidireccional al ligar/desligar miembros)
- **Test ID**: `test-fam-004`

### META-011: Sistema de Trimestres del Comité
- **Impacto**: Alto (funcionalidad core)
- **Consecuencia de violación**: Metas con períodos incorrectos, reportes inconsistentes
- **Implementación**: Frontend (generación de trimestres del 21 al 20)
- **Test ID**: `test-meta-011`
- **Detalle**: Trimestres Bahá'í: Ene-Abr (21/01-20/04), Abr-Jul (21/04-20/07), Jul-Oct (21/07-20/10), Oct-Ene (21/10-20/01)

---

## 🧪 Testing

### Convención de Test IDs
Cada regla de negocio tiene un `test-id` único para rastrear su cobertura de testing:

```typescript
// Ejemplo de test
describe('NUC-001: Validación de Barrios al Crear Núcleo', () => {
  it('test-nuc-001: debe rechazar creación sin barrio existente', async () => {
    // Test implementation
  });
});
```

### Estado de Cobertura
- **COMMON**: 0/13 tests (0%)
- **BARRIOS**: 0/5 tests (0%)
- **NUCLEOS**: 0/7 tests (0%)
- **MIEMBROS**: 0/6 tests (0%)
- **DEVOCIONALES**: 0/4 tests (0%)
- **FAMILIAS**: 0/7 tests (0%)
- **METAS**: 0/11 tests (0%)
- **TOTAL**: 0/53 tests implementados

Ver `/PENDIENTES.md` sección "Testing" para plan completo.

---

## 📝 Convenciones de Documentación

### Formato de Regla
Cada regla sigue esta estructura:

```markdown
### CÓDIGO: Nombre de la Regla
**Estado**: ✅ Implementado | ⚠️ Parcial | ❌ Pendiente
**Prioridad**: Alta | Media | Baja | CRÍTICA
**Test ID**: `test-codigo-numero`

**Descripción**:
Explicación clara de qué hace la regla.

**Reglas**:
1. Punto específico 1
2. Punto específico 2

**Implementación**:
```typescript
// Código relevante
```

**Casos de Uso**:
- Caso 1
- Caso 2
```

### Estados
- ✅ **Implementado**: Funcional y probado
- ⚠️ **Parcial**: Implementado pero con mejoras pendientes
- ❌ **Pendiente**: No implementado
- 🔄 **En progreso**: En desarrollo activo

---

## 🔮 Roadmap de Documentación

### Módulos Documentados ✅
1. ✅ **COMMON.md** - Reglas comunes (13 reglas)
2. ✅ **BARRIOS.md** - Catálogo de Barrios (5 reglas)
3. ✅ **NUCLEOS.md** - Catálogo de Núcleos (7 reglas)
4. ✅ **MIEMBROS.md** - Catálogo de Miembros (6 reglas) ✅ Completado
5. ✅ **DEVOCIONALES.md** - Catálogo de Devocionales (4 reglas) 🚨 Con BUG CRÍTICO
6. ✅ **FAMILIAS.md** - Catálogo de Familias (7 reglas) ✅ Completado 100%
7. ✅ **METAS.md** - Metas del Comité (11 reglas) ✅ Completado con sistema de trimestres

### Próximos Módulos a Documentar
1. **VISITAS.md** (alta prioridad)
   - VIS-001 a VIS-011 (ya existe documentación parcial)
2. **REPORTES.md** (media prioridad)
   - Reporte de Ciclo
   - Estadísticas y métricas

---

## 📚 Referencias Adicionales

### Documentación del Proyecto
- `/README.md` - Información general del proyecto
- `/ANALISIS_MIGRACION.md` - Plan de migración desde v3.0
- `/PENDIENTES.md` - Tareas y mejoras pendientes

### Código Fuente
- `/packages/backend/prisma/schema.prisma` - Schema de base de datos
- `/packages/backend/src/schema.ts` - Schema GraphQL
- `/packages/backend/src/resolvers/` - Resolvers GraphQL
- `/packages/web/src/pages/` - Vistas del frontend

### Entorno Anterior (v3.0)
- `/Users/anibalfigueroaramirez/XYZ/devocionales3.0/REGLAS_NEGOCIO.md` - Reglas originales

---

## 🤝 Contribución

### Al Agregar Nueva Funcionalidad
1. Leer `COMMON.md` para seguir estándares
2. Documentar reglas en archivo específico del módulo
3. Asignar código único (ej: `MOD-001`)
4. Asignar test ID (ej: `test-mod-001`)
5. Actualizar este README con nuevo módulo/regla
6. Implementar tests correspondientes

### Al Modificar Regla Existente
1. Actualizar documentación en archivo del módulo
2. Actualizar estado si cambia (✅ → ⚠️)
3. Documentar breaking changes si aplican
4. Actualizar tests afectados

---

## 📞 Contacto

**Equipo de Desarrollo**: Devocionales 4.0
**Última actualización**: 15 de octubre de 2025
**Versión de documentación**: 1.1.0

---

## ✅ Checklist de Implementación

Usa este checklist al implementar una nueva vista:

- [ ] Leer `COMMON.md` completo
- [ ] Seguir convenciones de edición inline (COMMON-005)
- [ ] Implementar soft delete (COMMON-009)
- [ ] Agregar confirmación de eliminación (COMMON-010)
- [ ] Validar autenticación (COMMON-007)
- [ ] Filtrar por comunidad (COMMON-011)
- [ ] Validación en dos capas (COMMON-008)
- [ ] Estados de UI (loading, error, empty) (COMMON-012)
- [ ] Formato de fechas con timezone (America/Mexico_City)
- [ ] Documentar reglas en archivo del módulo
- [ ] Crear tests con test IDs
- [ ] Actualizar README con nuevas reglas

---

**¡Gracias por mantener la documentación actualizada!**
