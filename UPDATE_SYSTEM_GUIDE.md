# Sistema de Notificación de Actualizaciones

## 📋 Descripción General

Este sistema detecta automáticamente cuando hay una nueva versión de la aplicación disponible y notifica a los usuarios de manera inteligente y no invasiva.

## 🏗️ Arquitectura

### Backend
- **Endpoint REST**: `/api/release` - Sirve información de la versión actual
- **Archivo**: `packages/backend/release.json` - Contiene buildId, notas y flags

### Frontend
- **Hook**: `useAppVersion` - Detecta nuevas versiones vía polling (cada 5 min)
- **Componentes**:
  - `UpdateToast` - Notificación discreta para actualizaciones menores
  - `UpdateModal` - Modal para actualizaciones críticas

## 🚀 Flujo de Deployment

### 1. Antes del Deployment

Edita `packages/backend/release.json` con las notas del release:

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

### 2. Durante el Deployment

El script `deploy.sh` automáticamente:
- Genera un BUILD_ID único (timestamp + git hash)
- Actualiza el buildId en release.json
- Compila el frontend con el BUILD_ID embebido
- Despliega ambos (backend + frontend)

```bash
# Deployment normal
./deploy.sh

# Con commit automático
./deploy.sh -c "Agrega nuevas features"

# Con migraciones
./deploy.sh -m
```

### 3. Después del Deployment

Los usuarios verán automáticamente:
- **Toast discreto** si `requiresReload = false` y `requiresReauth = false`
- **Modal automático** si `requiresReload = true` o `requiresReauth = true`

## 🎛️ Configuración de Flags

### `requiresReload: false, requiresReauth: false`
**Uso**: Actualizaciones menores (mejoras UI, fixes pequeños)
- Muestra toast discreto en esquina inferior derecha
- Usuario puede actualizar cuando quiera con "Actualizar ahora"
- O ignorar con "Más tarde"

### `requiresReload: true, requiresReauth: false`
**Uso**: Actualizaciones importantes (nuevas features, cambios significativos)
- Muestra modal automático al detectar nueva versión
- Usuario debe actualizar para continuar
- Limpia cache de Apollo antes de recargar
- No permite cerrar el modal con ESC o click fuera

### `requiresReload: true, requiresReauth: true`
**Uso**: Actualizaciones críticas (cambios en autenticación, schema, seguridad)
- Muestra modal automático con advertencia
- Botón "Cerrar sesión y actualizar" en lugar de solo "Actualizar"
- Cierra sesión, limpia tokens y recarga
- No permite cerrar el modal

## 📝 Ejemplos de Uso

### Ejemplo 1: Actualización Menor
```json
{
  "buildId": "20250120-143022-a1b2c3d",
  "notes": [
    "Mejoras visuales en diseño de tablas",
    "Corrección de typos"
  ],
  "requiresReload": false,
  "requiresReauth": false
}
```
**Resultado**: Toast discreto, usuario actualiza cuando quiera.

### Ejemplo 2: Nueva Feature Importante
```json
{
  "buildId": "20250120-143022-a1b2c3d",
  "notes": [
    "Nueva funcionalidad de exportación a Excel",
    "Mejoras en el sistema de reportes",
    "Actualización de dependencias de seguridad"
  ],
  "requiresReload": true,
  "requiresReauth": false
}
```
**Resultado**: Modal automático, usuario debe actualizar.

### Ejemplo 3: Cambio en Autenticación
```json
{
  "buildId": "20250120-143022-a1b2c3d",
  "notes": [
    "Actualización del sistema de autenticación",
    "Mejoras de seguridad importantes"
  ],
  "requiresReload": true,
  "requiresReauth": true
}
```
**Resultado**: Modal automático que requiere logout + reload.

## 🔧 Personalización

### Cambiar Intervalo de Polling

En `packages/web/src/hooks/useAppVersion.ts`:
```typescript
const POLL_INTERVAL = 5 * 60 * 1000; // 5 minutos (cambiar según necesites)
```

### Modificar Estilos

Los componentes usan Tailwind CSS. Edita:
- `packages/web/src/components/UpdateToast.tsx`
- `packages/web/src/components/UpdateModal.tsx`

### Cambiar URL del Endpoint

En `packages/web/src/hooks/useAppVersion.ts`:
```typescript
const RELEASE_URL = `${import.meta.env.VITE_GRAPHQL_URL}/api/release`;
```

## 🧪 Testing Local

1. Inicia el backend:
```bash
cd packages/backend
npm run dev
```

2. Verifica el endpoint:
```bash
curl http://localhost:4000/api/release
```

3. Inicia el frontend:
```bash
cd packages/web
npm run dev
```

4. Para simular una actualización:
   - Edita `packages/backend/release.json` y cambia el `buildId`
   - Espera 5 minutos o recarga la pestaña para forzar detección

## ⚠️ Troubleshooting

### No se detecta la nueva versión
- Verifica que el endpoint `/api/release` responda correctamente
- Revisa que el buildId en `release.json` sea diferente al del build actual
- Asegúrate de que no haya errores en la consola del navegador

### El toast no desaparece
- El toast se mantiene visible hasta que el usuario lo cierre o actualice
- Esto es intencional para recordarle que hay una actualización

### El modal no se puede cerrar
- Si `requiresReload = true`, el modal no se puede cerrar
- Esto es intencional para forzar la actualización en cambios críticos

## 📚 Referencias

- Template de release: `RELEASE_TEMPLATE.json`
- Script de deployment: `deploy.sh`
- Documentación de deployment: `DEPLOY_README.md`
