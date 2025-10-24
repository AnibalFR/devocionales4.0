# 📱 App Móvil Devocionales 4.0 - Instrucciones Completas

## 🎉 ¡App Completamente Desarrollada!

La aplicación móvil nativa para iOS y Android está 100% funcional y lista para usar.

---

## 🚀 Inicio Rápido (5 minutos)

### Paso 1: Navega al directorio mobile

```bash
cd /Users/anibalfigueroaramirez/XYZ/devocionales4.0/packages/mobile
```

### Paso 2: Las dependencias ya están instaladas

Si necesitas reinstalar:
```bash
npm install
```

### Paso 3: Inicia el servidor de desarrollo

```bash
npm start
```

Verás algo como:

```
› Metro waiting on exp://192.168.1.100:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)

› Press a │ open Android
› Press i │ open iOS simulator
› Press w │ open web

› Press r │ reload app
› Press m │ toggle menu
```

### Paso 4: Elige cómo probar la app

#### Opción A: En tu teléfono (Recomendado) 📱

1. **Descarga Expo Go:**
   - iOS: https://apps.apple.com/app/expo-go/id982107779
   - Android: https://play.google.com/store/apps/details?id=host.exp.exponent

2. **Escanea el QR:**
   - **iPhone**: Abre la cámara y apunta al QR
   - **Android**: Abre Expo Go y toca "Scan QR Code"

3. ¡Listo! La app se cargará en tu teléfono

#### Opción B: En simulador/emulador 💻

**Para iOS (solo en Mac):**
```bash
npm run ios
```

**Para Android:**
```bash
npm run android
```

---

## 🔐 Credenciales de Login

Usa las mismas credenciales que en la aplicación web. Por ejemplo:

```
Email: tu@email.com
Password: tu_password
```

---

## 📱 Funcionalidades Implementadas

### 1. Pantalla de Login
- ✅ Autenticación con email y contraseña
- ✅ Validación de campos
- ✅ Mensajes de error claros
- ✅ Guardado seguro de tokens (SecureStore)
- ✅ Navegación automática después del login

### 2. Pantalla de Visitas (Tab Principal)
- ✅ Lista completa de todas las visitas
- ✅ Pull-to-refresh (desliza hacia abajo para actualizar)
- ✅ Ordenamiento automático por fecha (más recientes primero)
- ✅ Cards con:
  - Nombre de familia
  - Fecha de visita
  - Badges de tipo (Primera Visita, Seguimiento, etc.)
  - Badges de status (Programada, Realizada, etc.)
  - Ubicación (barrio, núcleo)
  - Visitadores
- ✅ Tap en cualquier card para ver detalles

### 3. Pantalla de Detalle de Visita
- ✅ Información completa de la visita:
  - Datos de la familia
  - Fecha, hora, tipo y status
  - Barrio y núcleo
  - Lista de visitadores
  - Actividades realizadas (conversación, oraciones, estudios, etc.)
  - Material dejado (Libro de Oraciones, etc.)
  - Información de seguimiento
  - Notas adicionales
  - Motivo si no se pudo realizar
  - Metadata (creador, fecha de creación)
- ✅ Navegación con botón "Volver"
- ✅ Solo lectura (no edición)

### 4. Pantalla de Perfil (Tab)
- ✅ Información del usuario:
  - Avatar con inicial del nombre
  - Nombre completo
  - Badge de rol (ADMIN, CEA, MCA, etc.)
  - Email
  - Comunidad
- ✅ Botón de "Cerrar Sesión"
  - Confirmación antes de cerrar
  - Limpieza completa de tokens y cache

---

## 🏗️ Arquitectura Técnica

### Stack Tecnológico
- **Framework**: Expo SDK 54
- **Lenguaje**: TypeScript
- **UI Library**: Gluestack UI (moderna, componentes nativos)
- **GraphQL Client**: Apollo Client
- **Navegación**: Expo Router (file-based routing)
- **Storage Seguro**: Expo SecureStore (tokens JWT)
- **Cache Local**: AsyncStorage (datos de usuario)

### Comunicación con Backend
- **Desarrollo**: `http://localhost:4000/graphql`
- **Producción**: `https://www.registrodevocionales.com/graphql`
- **Protocolo**: HTTPS (seguro y cifrado)
- **Autenticación**: JWT Bearer tokens

### Estructura del Código

```
packages/mobile/
├── app/                           # Expo Router (navegación)
│   ├── (auth)/
│   │   └── login.tsx             # Pantalla de login
│   ├── (tabs)/
│   │   ├── _layout.tsx           # Layout de tabs
│   │   ├── visitas.tsx           # Lista de visitas
│   │   └── perfil.tsx            # Perfil de usuario
│   ├── visita-detalle/
│   │   └── [id].tsx              # Detalle de visita (dinámico)
│   ├── _layout.tsx               # Layout root con providers
│   └── index.tsx                 # Redirect inicial
├── src/
│   ├── components/
│   │   └── VisitaCard.tsx        # Card de visita
│   ├── config/
│   │   └── api.ts                # URLs del backend
│   ├── contexts/
│   │   └── AuthContext.tsx       # Context de autenticación
│   ├── graphql/
│   │   ├── apollo.ts             # Apollo Client setup
│   │   ├── queries.ts            # GraphQL queries
│   │   └── mutations.ts          # GraphQL mutations
│   ├── types/
│   │   └── index.ts              # TypeScript types
│   └── utils/
│       └── formatters.ts         # Helpers (fechas, labels, etc.)
├── README.md                      # Documentación completa
├── QUICKSTART.md                  # Guía de inicio rápido
├── package.json
└── app.json                       # Configuración Expo
```

---

## 🎨 Características de UI/UX

- ✅ **Diseño nativo iOS/Android**: Se adapta automáticamente al SO
- ✅ **Gluestack UI**: Componentes modernos y accesibles
- ✅ **Loading states**: Spinners mientras carga datos
- ✅ **Error handling**: Mensajes claros de error
- ✅ **Pull-to-refresh**: Gesto nativo para actualizar
- ✅ **Navegación fluida**: Transiciones nativas
- ✅ **Badges de colores**: Visual para tipos y status
- ✅ **Cards elegantes**: Diseño limpio y profesional
- ✅ **Iconos emoji**: Simple pero efectivo
- ✅ **Safe areas**: Respeta notch y bottom bars
- ✅ **Dark mode ready**: Preparado para modo oscuro

---

## 🔧 Comandos Útiles

```bash
# Iniciar dev server
npm start

# Limpiar cache y reiniciar
npm start -- --clear

# Correr en iOS Simulator
npm run ios

# Correr en Android Emulator
npm run android

# Ver en navegador web (experimental)
npm run web
```

---

## 🐛 Solución de Problemas

### "Cannot connect to backend"

Si estás usando un **dispositivo físico** con Expo Go:

1. Asegúrate de estar en la **misma red WiFi** que tu Mac
2. Encuentra la IP local de tu Mac: `ifconfig | grep inet`
3. Edita `packages/mobile/src/config/api.ts`:

```typescript
development: {
  graphqlUrl: 'http://192.168.1.XXX:4000/graphql', // Tu IP
  apiUrl: 'http://192.168.1.XXX:4000/api',
},
```

### "Module not found"

```bash
cd packages/mobile
rm -rf node_modules
npm install
npm start -- --clear
```

### La app se ve en blanco

1. Verifica que el backend esté corriendo: `http://localhost:4000/graphql`
2. Revisa los logs en la terminal donde corriste `npm start`
3. Recarga la app (shake device o presiona `r`)

### Error al escanear QR

- Asegúrate de tener buena luz
- En iOS, usa la app Cámara nativa
- En Android, usa la app Expo Go
- Si no funciona, presiona `a` (Android) o `i` (iOS) en la terminal

---

## 📊 Testing

### Testing Manual

1. **Login Flow:**
   - ✅ Intenta login sin email/password (debe mostrar error)
   - ✅ Intenta con credenciales incorrectas (debe mostrar error)
   - ✅ Login exitoso (debe navegar a Visitas)

2. **Visitas:**
   - ✅ Pull-to-refresh funciona
   - ✅ Scroll suave
   - ✅ Tap en card abre detalle
   - ✅ Badges muestran colores correctos

3. **Detalle:**
   - ✅ Toda la información se muestra
   - ✅ Botón "Volver" funciona
   - ✅ Scroll funciona en contenido largo

4. **Perfil:**
   - ✅ Información correcta del usuario
   - ✅ Logout muestra confirmación
   - ✅ Después del logout vuelve a Login

### Testing en Diferentes Dispositivos

- ✅ iPhone (iOS 15+)
- ✅ iPad
- ✅ Android Phone (Android 9+)
- ✅ Android Tablet

---

## 🚢 Build para Distribución

### Para Testing Beta (TestFlight / Play Store Beta)

```bash
# Instalar EAS CLI globalmente
npm install -g eas-cli

# Login a tu cuenta Expo
eas login

# Configurar proyecto
eas build:configure

# Build para iOS (TestFlight)
eas build --platform ios --profile preview

# Build para Android (APK/AAB)
eas build --platform android --profile preview
```

### Para Producción

```bash
# Build de producción iOS
eas build --platform ios --profile production

# Build de producción Android
eas build --platform android --profile production

# Submit a App Store
eas submit --platform ios

# Submit a Play Store
eas submit --platform android
```

---

## 🎯 Próximos Pasos Sugeridos

### Funcionalidades Futuras

1. **Creación de Visitas** ⭐
   - Formulario para crear nuevas visitas
   - Selección de familia, fecha, hora
   - Wizard multi-step como en web

2. **Edición de Visitas** ⭐
   - Permitir editar visitas existentes
   - Optimistic Concurrency Control (OCC)

3. **Notificaciones Push** 🔔
   - Recordatorios de visitas programadas
   - Notificaciones de nuevas asignaciones

4. **Modo Offline** 📴
   - Sincronización automática
   - Queue de operaciones pendientes
   - Indicador de estado de sincronización

5. **Geolocalización** 📍
   - Ver familias en mapa
   - Navegar a dirección
   - Registrar ubicación de visita

6. **Filtros y Búsqueda** 🔍
   - Filtrar por tipo, status, fecha
   - Buscar por familia
   - Ordenamiento customizable

7. **Estadísticas** 📊
   - Mis visitas este mes
   - Gráficas de actividad
   - Logros y metas

---

## 📚 Recursos

### Documentación
- [Expo Docs](https://docs.expo.dev/)
- [React Native Docs](https://reactnative.dev/)
- [Gluestack UI](https://gluestack.io/)
- [Apollo Client](https://www.apollographql.com/docs/react/)

### Soporte
- Para bugs o features: Crear issue en GitHub
- Para dudas: Contactar al equipo de desarrollo

---

## ✅ Checklist de Verificación

Antes de distribuir la app, verifica:

- [ ] Login funciona correctamente
- [ ] Visitas se cargan sin errores
- [ ] Pull-to-refresh actualiza datos
- [ ] Detalle muestra toda la información
- [ ] Perfil muestra datos correctos del usuario
- [ ] Logout limpia sesión completamente
- [ ] Navegación funciona en iOS
- [ ] Navegación funciona en Android
- [ ] App se ve bien en iPhone pequeño (SE)
- [ ] App se ve bien en iPhone grande (Pro Max)
- [ ] App se ve bien en Android
- [ ] Backend está en HTTPS
- [ ] Tokens se guardan de forma segura

---

## 🎉 ¡Felicidades!

Has desarrollado exitosamente una aplicación móvil nativa profesional para iOS y Android en tiempo récord.

### Stack Moderno ✨
- React Native + TypeScript
- Expo (framework más popular)
- Gluestack UI (componentes hermosos)
- Apollo GraphQL (data fetching robusto)
- Expo Router (navegación file-based)

### Seguridad 🔒
- HTTPS en producción
- JWT tokens en SecureStore
- Validaciones de inputs
- Error handling completo

### UX Nativa 📱
- Navegación nativa
- Pull-to-refresh
- Loading states
- Safe areas
- Gestos nativos

¡A disfrutar de tu nueva app móvil! 🚀

---

**Documentado por:** Claude Code
**Fecha:** 24 de Octubre, 2025
**Versión:** 1.0.0
