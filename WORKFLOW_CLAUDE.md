# 🤖 Workflow de Claude para Cambios y Deployment

Este documento establece el procedimiento estándar que Claude debe seguir al realizar cambios en el proyecto Devocionales 4.0.

---

## 📋 Pasos Estándar para Cualquier Cambio

### PASO 1: Análisis y Planificación

**Cuando el usuario solicita un cambio:**

1. **Entender el requerimiento completo**
   - Hacer preguntas clarificadoras si es necesario
   - Identificar el alcance del cambio
   - Determinar impacto en backend, frontend, o ambos

2. **Crear un plan con TodoWrite**
   ```
   Usar TodoWrite para listar las tareas específicas:
   - Analizar código existente
   - Identificar archivos a modificar
   - Implementar cambios
   - Probar cambios
   - Hacer deployment
   ```

3. **Identificar tipo de cambio**
   - [ ] Solo código (frontend/backend)
   - [ ] Cambios en schema Prisma (requiere migración)
   - [ ] Nuevas dependencias npm/pnpm
   - [ ] Cambios de configuración
   - [ ] Correcciones de bugs
   - [ ] Nuevas funcionalidades

---

### PASO 1.5: Identificar Alcance del Cambio

**Determinar qué partes del proyecto se ven afectadas:**

- [ ] **Backend** (`packages/backend/`) - GraphQL, resolvers, schema, base de datos
- [ ] **Frontend Web** (`packages/web/`) - React, páginas, componentes
- [ ] **App Móvil** (`packages/mobile/`) - React Native, Expo

#### 🔀 Flujos según Alcance:

**A. Si el cambio afecta BACKEND o WEB (o ambos):**
```
→ Continuar con PASO 2
→ Usar deploy.sh al final (PASO 6)
→ El cambio se desplegará al servidor
```

**B. Si el cambio afecta SOLO MOBILE:**
```
→ Saltar a "WORKFLOW PARA APP MÓVIL" (sección al final de este documento)
→ NO usar deploy.sh (mobile no se despliega en servidor)
→ Solo commit y push
```

**C. Si el cambio afecta BACKEND + MOBILE:**
```
1. Primero: Implementar cambios en backend
2. Ejecutar deploy.sh (backend actualizado)
3. Después: Implementar cambios en mobile
4. Commit mobile por separado (sin deploy.sh)
5. Mobile usará nuevo backend automáticamente vía HTTPS
```

**Nota Importante:** La app móvil NO requiere deployment al servidor. Los cambios en mobile solo necesitan commit y push. Los usuarios actualizarán cuando descarguen nueva versión desde App Store / Play Store.

---

### PASO 2: Búsqueda y Análisis de Código

1. **Usar herramientas apropiadas:**
   - `Glob` para encontrar archivos por patrón
   - `Grep` para buscar código específico
   - `Read` para leer archivos completos
   - `Task` con Explore agent para exploración compleja

2. **Leer código relevante ANTES de modificar**
   - NUNCA modificar sin leer primero
   - Entender el contexto completo
   - Identificar patrones existentes
   - Verificar dependencias

3. **Actualizar TodoWrite** marcando "análisis" como completado

---

### PASO 3: Implementación de Cambios

#### A. Para Cambios en Backend

1. **Modificar archivos necesarios:**
   - Resolvers (`packages/backend/src/resolvers/`)
   - Schema GraphQL (`packages/backend/src/schema.ts`)
   - Tipos y contexto si es necesario

2. **Si hay cambios en Prisma:**
   - Modificar `schema.prisma`
   - **NO** crear migraciones localmente (se harán en deploy)
   - Documentar que se necesitará migración

3. **Verificar tipos TypeScript:**
   - Agregar tipos explícitos donde sea necesario
   - Usar `import type` para tipos
   - Evitar errores de compilación

#### B. Para Cambios en Frontend

1. **Modificar componentes/páginas:**
   - Usar `Edit` para cambios específicos
   - Mantener consistencia con código existente
   - Seguir patrones de React/TypeScript

2. **Actualizar GraphQL queries/mutations:**
   - Asegurar que coincidan con schema backend
   - Incluir todos los campos necesarios
   - Manejar errores apropiadamente

3. **Verificar tipos TypeScript:**
   - Usar `import type { ReactNode }` para tipos React
   - Agregar casts explícitos cuando sea necesario
   - Evitar `any` donde sea posible

#### C. Actualizar TodoWrite

Marcar cada tarea como completada cuando termine.

---

### PASO 4: Verificación y Testing

1. **Compilar código localmente:**

   **Backend:**
   ```bash
   cd packages/backend && npm run build
   ```

   **Frontend:**
   ```bash
   cd packages/web && npm run build
   ```

2. **Si hay errores de compilación:**
   - Corregirlos ANTES de continuar
   - No proceder al deployment con errores
   - Usar TypeScript strict mode correctamente

3. **Verificar cambios específicos:**
   - Leer archivos modificados para confirmar cambios
   - Verificar que no se rompió código existente
   - Asegurar que imports son correctos

---

### PASO 5: Preparar Deployment

#### A. Actualizar Notas de Release

**Antes de cada deployment, actualizar `packages/backend/release.json`:**

1. **Editar el array de notas:**
   ```json
   {
     "buildId": "auto-generated",
     "notes": [
       "Nueva funcionalidad de reportes mejorados",
       "Corrección de errores en formularios",
       "Mejoras de rendimiento"
     ],
     "requiresReload": false,
     "requiresReauth": false
   }
   ```

2. **Configurar flags según el tipo de actualización:**

   - **Actualización menor** (fixes pequeños, mejoras visuales):
     ```json
     "requiresReload": false,
     "requiresReauth": false
     ```
     → Muestra toast discreto, usuario actualiza cuando quiera

   - **Actualización importante** (nuevas features, cambios significativos):
     ```json
     "requiresReload": true,
     "requiresReauth": false
     ```
     → Muestra modal automático, usuario debe actualizar

   - **Actualización crítica** (cambios en autenticación, schema, seguridad):
     ```json
     "requiresReload": true,
     "requiresReauth": true
     ```
     → Modal que requiere logout + reload

3. **Mejores prácticas para notas:**
   - Máximo 5 items para mejor legibilidad
   - Sé claro y conciso
   - Usa lenguaje orientado al usuario
   - Enfócate en beneficios, no en detalles técnicos

#### B. Determinar Opciones del Script

1. **Determinar opciones del script de deployment:**

   ```bash
   # Cambios solo de código (más común)
   ./deploy.sh -c "mensaje"

   # Con migraciones de Prisma
   ./deploy.sh -c "mensaje" -m

   # Con nuevas dependencias
   ./deploy.sh -c "mensaje" -i

   # Completo (migraciones + dependencias)
   ./deploy.sh -c "mensaje" -m -i
   ```

2. **Crear mensaje de commit descriptivo:**
   - Título claro y conciso
   - Descripción de cambios principales
   - Listar backend/frontend changes
   - Mencionar breaking changes si los hay
   - Incluir automáticamente firma de Claude Code

3. **IMPORTANTE: Usar SIEMPRE el path absoluto del script:**
   ```bash
   # ⚠️ NUNCA uses ./deploy.sh (fallará si no estás en el directorio raíz)
   # ✅ SIEMPRE usa el path absoluto:
   /Users/anibalfigueroaramirez/XYZ/devocionales4.0/deploy.sh
   ```

---

### PASO 6: Ejecutar Deployment

**⚠️ IMPORTANTE: Usar siempre el PATH ABSOLUTO del script**

El script `deploy.sh` debe ejecutarse usando su **path completo**, no con `./deploy.sh`, para evitar errores cuando estás en subdirectorios como `packages/backend` o `packages/web`.

1. **Comando estándar (sin migraciones ni dependencias):**
   ```bash
   /Users/anibalfigueroaramirez/XYZ/devocionales4.0/deploy.sh -c "Descripción clara del cambio"
   ```

2. **Con migraciones:**
   ```bash
   /Users/anibalfigueroaramirez/XYZ/devocionales4.0/deploy.sh -c "Descripción del cambio" -m
   ```

3. **Con nuevas dependencias:**
   ```bash
   /Users/anibalfigueroaramirez/XYZ/devocionales4.0/deploy.sh -c "Descripción del cambio" -i
   ```

4. **Deployment completo:**
   ```bash
   /Users/anibalfigueroaramirez/XYZ/devocionales4.0/deploy.sh -c "Descripción del cambio" -m -i
   ```

**El script automáticamente:**
- ✅ Hace commit de cambios
- ✅ Push al repositorio
- ✅ Git pull en servidor
- ✅ Ejecuta migraciones (si `-m`)
- ✅ Instala dependencias (si `-i`)
- ✅ **Compila backend (TypeScript → JavaScript)**
- ✅ Build del frontend
- ✅ Reinicia backend
- ✅ Verifica que todo funcione

---

### PASO 7: Verificación Post-Deployment

1. **El script ya verifica automáticamente:**
   - Estado de PM2
   - Endpoint GraphQL interno
   - Acceso público
   - **Endpoint de release**: `/api/release` con nuevo buildId

2. **Revisar output del script:**
   - Confirmar que todos los pasos fueron exitosos (✓)
   - No debe haber errores (✗)
   - Warnings (⚠) son aceptables según el caso

3. **Sistema de notificación automática:**
   - El deployment genera un nuevo `buildId` único (timestamp + git hash)
   - Los usuarios activos verán notificación en ~5 minutos (polling automático)
   - Tipo de notificación depende de los flags configurados en `release.json`:
     - `requiresReload: false, requiresReauth: false` → Toast discreto
     - `requiresReload: true, requiresReauth: false` → Modal automático
     - `requiresReload: true, requiresReauth: true` → Modal con logout

4. **Verificar endpoint de release:**
   ```bash
   # Verificar internamente
   ssh root@64.227.96.34 'curl -s http://localhost:4000/api/release | python3 -m json.tool'

   # Verificar públicamente
   curl -s https://www.registrodevocionales.com/api/release
   ```

5. **Si algo falla:**
   ```bash
   # Ver logs del servidor
   ssh root@64.227.96.34 'pm2 logs devocionales-api --lines 50'

   # Si es necesario, hacer rollback
   ./deploy.sh -r
   ```

---

### PASO 8: Comunicar al Usuario

**Mensaje final al usuario debe incluir:**

1. **Resumen de cambios realizados:**
   ```markdown
   ## Cambios Implementados

   ### Backend
   - Nueva mutación: regenerarCredenciales
   - Schema actualizado con nuevos tipos

   ### Frontend
   - Botón dinámico en MiembrosPage
   - Modal contextual mejorado

   ### Correcciones
   - Errores TypeScript resueltos
   ```

2. **Confirmación de deployment:**
   ```markdown
   ## ✅ Deployment Exitoso

   - Código actualizado en servidor
   - Frontend reconstruido
   - Backend reiniciado
   - Verificación completa: ✓
   ```

3. **URLs para verificar:**
   ```markdown
   ## 🌐 URLs Disponibles

   - Frontend: https://www.registrodevocionales.com
   - GraphQL: https://www.registrodevocionales.com/graphql
   ```

4. **Instrucciones de prueba (si aplica):**
   ```markdown
   ## 🧪 Cómo Probar

   1. Ir a Catálogo de Miembros
   2. Click en "Invitar" para miembro nuevo
   3. Click en "Reenviar" para miembro existente
   ```

---

## 🚨 Casos Especiales

### Cuando hay Errores de TypeScript

1. **Nunca hacer deployment con errores de compilación**
2. **Corregir TODOS los errores primero**
3. **Tipos comunes a corregir:**
   - `import type { ReactNode }` para tipos React
   - Casts explícitos: `as HTMLTableRowElement`
   - Tipos de Set: `new Set<string>()`
   - Variables no usadas: prefijo con `_` o comentar

### Cuando se Modificó schema.prisma

1. **SIEMPRE usar `-m` en el deployment**
2. **Verificar que la migración es segura**
3. **No hacer cambios destructivos sin confirmar con usuario**
4. **Ejemplo:**
   ```bash
   /Users/anibalfigueroaramirez/XYZ/devocionales4.0/deploy.sh -c "Agrega tabla de notificaciones" -m
   ```

### Cuando se Agregaron Dependencias

1. **SIEMPRE usar `-i` en el deployment**
2. **Ejemplo:**
   ```bash
   /Users/anibalfigueroaramirez/XYZ/devocionales4.0/deploy.sh -c "Agrega librería de charts" -i
   ```

### Rollback de Emergencia

Si el deployment causó problemas:

```bash
/Users/anibalfigueroaramirez/XYZ/devocionales4.0/deploy.sh -r
```

Luego investigar el problema antes de reintentar.

---

## ✅ Checklist Pre-Deployment

Antes de ejecutar `./deploy.sh`, verificar:

- [ ] Leí el código existente antes de modificar
- [ ] Los cambios están completos y probados
- [ ] El código compila sin errores (backend y frontend)
- [ ] Actualicé TodoWrite marcando tareas completadas
- [ ] **Actualicé `packages/backend/release.json` con:**
  - [ ] Notas del release (qué cambió)
  - [ ] Flags apropiados (`requiresReload`, `requiresReauth`)
- [ ] Identifiqué si necesito `-m` (migraciones)
- [ ] Identifiqué si necesito `-i` (dependencias)
- [ ] Preparé mensaje de commit descriptivo
- [ ] Estoy en el directorio raíz del proyecto

---

## 📝 Template de Mensaje de Commit

```
[Título conciso del cambio]

## [Backend/Frontend/Ambos]
- Cambio específico 1
- Cambio específico 2
- Cambio específico 3

## [Sección adicional si aplica]
- Detalle adicional

[Si hay breaking changes, mencionarlos aquí]

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## 🎯 Ejemplo Completo de Workflow

### Escenario: Usuario pide "Agregar campo de teléfono a miembros"

1. **Análisis:**
   - Cambio en schema Prisma ✓
   - Cambio en resolvers ✓
   - Cambio en frontend ✓
   - Requiere migración: SÍ

2. **TodoWrite:**
   ```
   1. [in_progress] Analizar schema actual de Miembro
   2. [pending] Modificar schema.prisma
   3. [pending] Actualizar resolvers
   4. [pending] Actualizar GraphQL schema
   5. [pending] Modificar UI en MiembrosPage
   6. [pending] Compilar y verificar
   7. [pending] Hacer deployment
   ```

3. **Implementación:**
   - Modificar `schema.prisma`: agregar campo `telefono`
   - Actualizar `schema.ts`: agregar campo en tipo Miembro
   - Modificar `MiembrosPage.tsx`: agregar columna
   - Actualizar cada TODO como completado

4. **Verificación:**
   ```bash
   cd packages/backend && npm run build
   cd ../web && npm run build
   ```

5. **Deployment:**
   ```bash
   /Users/anibalfigueroaramirez/XYZ/devocionales4.0/deploy.sh -c "Agrega campo de teléfono a miembros

   ## Backend
   - Campo telefono en schema Prisma
   - Actualizado GraphQL schema
   - Resolver actualizado para incluir teléfono

   ## Frontend
   - Nueva columna en catálogo de miembros
   - Campo editable inline
   - Validación de formato
   " -m
   ```

6. **Verificación post-deployment:**
   - Script muestra ✓ en todos los pasos
   - Comunicar al usuario el éxito

---

## 🔄 Flujo Simplificado

```
Usuario solicita cambio
    ↓
Crear plan con TodoWrite
    ↓
Analizar código existente
    ↓
Implementar cambios
    ↓
Verificar compilación
    ↓
./deploy.sh -c "mensaje" [-m] [-i]
    ↓
Verificar deployment exitoso
    ↓
Comunicar al usuario
```

---

## 💡 Mejores Prácticas

1. **SIEMPRE leer antes de modificar**
2. **NUNCA deployar con errores de compilación**
3. **Usar TodoWrite para tracking**
4. **Commits descriptivos y claros**
5. **Verificar cada paso del deployment**
6. **Comunicar claramente al usuario**
7. **Usar el script automatizado, no comandos manuales**
8. **Si hay dudas, preguntar al usuario**

---

## ⚠️ Errores Comunes a Evitar

1. ❌ Modificar código sin leerlo primero
2. ❌ Deployar con errores de TypeScript
3. ❌ Olvidar `-m` cuando hay cambios en Prisma
4. ❌ Olvidar `-i` cuando hay nuevas dependencias
5. ❌ No verificar el resultado del deployment
6. ❌ Mensajes de commit vagos ("fix", "update")
7. ❌ No usar TodoWrite para tracking
8. ❌ Hacer deployment manual en vez de usar el script
9. ❌ **Usar `./deploy.sh` en vez del path absoluto** - Causa "no such file or directory"
10. ❌ **Compilar backend solo localmente** - Los cambios TypeScript NO se reflejan en producción si no se compila en servidor (el script ya lo hace automáticamente desde 2025-10-21)
11. ❌ **Usar deploy.sh para cambios en mobile** - La app móvil NO se despliega en servidor

---

## 📱 WORKFLOW PARA APP MÓVIL

### Cuándo usar este workflow:

- ✅ Cambios SOLO en `packages/mobile/`
- ✅ No requieren deployment al servidor
- ✅ No afectan backend ni frontend web
- ✅ Son cambios visuales, de UI, o de funcionalidad de la app

### ⚠️ Importante: La App Móvil es Diferente

La app móvil tiene un ciclo de desarrollo completamente independiente:

- **NO se despliega en el servidor** (como backend/web)
- **NO usa deploy.sh**
- Los cambios se prueban con **Expo Go** o **simuladores**
- Los usuarios actualizan desde **App Store / Play Store**

### 📋 Proceso para Cambios en Mobile

#### PASO 1: Análisis y Planificación

1. **Entender el requerimiento**
   - Identificar qué pantallas o componentes cambiar
   - Verificar si necesita cambios en queries/mutations GraphQL
   - Determinar si afecta autenticación o storage

2. **Crear plan con TodoWrite**
   ```
   - Analizar código existente
   - Identificar archivos a modificar
   - Implementar cambios
   - Probar en Expo Go/Simulador
   - Commit y push
   ```

#### PASO 2: Implementación

1. **Modificar archivos en `packages/mobile/`:**
   - Pantallas: `app/` (Login, Visitas, Perfil, Detalle)
   - Componentes: `src/components/`
   - GraphQL: `src/graphql/`
   - Contextos: `src/contexts/`
   - Utilidades: `src/utils/`
   - Configuración: `src/config/`

2. **Seguir convenciones de React Native:**
   - Usar `StyleSheet.create()` para estilos
   - Componentes de Gluestack UI para UI
   - TypeScript types en `src/types/`
   - Formatters en `src/utils/`

#### PASO 3: Testing Local

1. **Iniciar servidor de desarrollo:**
   ```bash
   cd /Users/anibalfigueroaramirez/XYZ/devocionales4.0/packages/mobile
   npm start
   ```

2. **Probar cambios:**
   - **Opción A**: Expo Go en dispositivo físico (escanear QR)
   - **Opción B**: iOS Simulator (presionar `i` en terminal)
   - **Opción C**: Android Emulator (presionar `a` en terminal)

3. **Verificar:**
   - [ ] Los cambios son visibles en la app
   - [ ] No hay errores en consola
   - [ ] La funcionalidad funciona correctamente
   - [ ] La navegación sigue funcionando
   - [ ] El login/logout funcionan

#### PASO 4: Commit y Push

1. **Agregar archivos modificados:**
   ```bash
   git add packages/mobile
   ```

2. **Crear commit descriptivo:**
   ```bash
   git commit -m "Feature/Fix: Descripción clara del cambio

   ## Mobile
   - Cambio específico 1
   - Cambio específico 2
   - Cambio específico 3

   ## Testing
   - Probado en iOS/Android
   - Funcionalidad verificada

   🤖 Generated with [Claude Code](https://claude.com/claude-code)

   Co-Authored-By: Claude <noreply@anthropic.com>"
   ```

3. **Push al repositorio:**
   ```bash
   git push
   ```

#### PASO 5: Comunicar al Usuario

**Mensaje al usuario debe incluir:**

1. **Resumen de cambios:**
   ```markdown
   ## Cambios Implementados en App Móvil

   ### Pantallas/Componentes Modificados
   - Pantalla de Visitas: Agregado filtro por fecha
   - VisitaCard: Mejorado diseño de badges

   ### Funcionalidad
   - Nuevo filtro permite buscar visitas por rango de fechas
   - UI más limpia y moderna
   ```

2. **Instrucciones de testing:**
   ```markdown
   ## 🧪 Cómo Probar

   1. cd packages/mobile
   2. npm start
   3. Escanear QR con Expo Go
   4. Verificar que los filtros funcionen
   ```

3. **Notas importantes:**
   ```markdown
   ## 📝 Notas

   - ✅ Cambios commiteados y pusheados
   - ✅ Probado en iOS y Android
   - ⚠️ Los usuarios verán cambios cuando descarguen nueva versión
   - ℹ️ Para distribución: usar EAS Build cuando esté listo
   ```

### 🚫 LO QUE NO DEBES HACER para Mobile

- ❌ **NO usar deploy.sh** - El script es solo para backend/web
- ❌ **NO actualizar release.json** - Eso es para la web app
- ❌ **NO hacer deployment al servidor** - Mobile no vive en el servidor
- ❌ **NO preocuparse por PM2 o Nginx** - Son para backend/web

### ✅ Checklist para Cambios en Mobile

Antes de hacer commit:

- [ ] Código modificado en `packages/mobile/`
- [ ] Testing realizado con `npm start` + Expo Go/Simulador
- [ ] No hay errores en consola
- [ ] Funcionalidad verificada manualmente
- [ ] Navegación sigue funcionando
- [ ] Login/logout funcionan (si aplica)
- [ ] Commit descriptivo creado
- [ ] Push al repositorio realizado
- [ ] Usuario informado sobre cambios

### 📦 Distribución (Opcional)

**Solo cuando necesites publicar nueva versión a las stores:**

```bash
# Instalar EAS CLI (una vez)
npm install -g eas-cli

# Login a Expo
eas login

# Build para iOS (TestFlight)
eas build --platform ios --profile production

# Build para Android (Play Store)
eas build --platform android --profile production

# Submit a stores
eas submit --platform ios
eas submit --platform android
```

**Nota:** La distribución normalmente se hace cuando hay múltiples cambios acumulados, no por cada commit.

### 🎯 Ejemplo Completo: Cambio en Mobile

**Escenario:** Usuario pide "Agregar búsqueda de visitas por familia en la app móvil"

1. **Identificar alcance:**
   - Solo Mobile ✓
   - Pantalla: `app/(tabs)/visitas.tsx`
   - Componente: posiblemente `VisitaCard.tsx`

2. **TodoWrite:**
   ```
   1. [in_progress] Analizar VisitasPage actual
   2. [pending] Agregar campo de búsqueda
   3. [pending] Implementar filtrado
   4. [pending] Probar en Expo Go
   5. [pending] Commit y push
   ```

3. **Implementación:**
   - Agregar `SearchBar` component
   - Implementar filtrado en `visitas.tsx`
   - Actualizar estado local

4. **Testing:**
   ```bash
   cd packages/mobile
   npm start
   # Probar búsqueda en app
   ```

5. **Commit:**
   ```bash
   git add packages/mobile
   git commit -m "Feature: Búsqueda de visitas por familia en app móvil

   ## Mobile
   - Agregado campo de búsqueda en VisitasPage
   - Implementado filtrado local por nombre de familia
   - UI mejorada con Gluestack SearchBar

   ## Testing
   - Probado en iOS Simulator
   - Probado en Android Emulator
   - Búsqueda funciona correctamente

   🤖 Generated with [Claude Code](https://claude.com/claude-code)

   Co-Authored-By: Claude <noreply@anthropic.com>"
   git push
   ```

6. **Comunicar:**
   ```markdown
   ## ✅ Cambios Implementados

   He agregado funcionalidad de búsqueda en la app móvil:

   ### Pantalla de Visitas
   - Campo de búsqueda en la parte superior
   - Filtrado en tiempo real por nombre de familia
   - UI integrada con Gluestack

   ### Testing
   - ✅ Probado en iOS y Android
   - ✅ Búsqueda funciona correctamente
   - ✅ Sin errores

   ### Para Probar
   ```bash
   cd packages/mobile
   npm start
   # Escanear QR con Expo Go
   ```

   Los cambios están en el repositorio. Para que los usuarios los vean, necesitarás publicar una nueva versión en las stores cuando estés listo.
   ```

---

**Este workflow debe seguirse en TODOS los cambios que requieran deployment (backend/web).**

**Para cambios en mobile, usar el "WORKFLOW PARA APP MÓVIL" descrito arriba.**

La consistencia es clave para mantener el proyecto estable y deployments exitosos. 🚀
