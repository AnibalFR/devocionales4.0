# Devocionales 4.0 - App Móvil

App móvil para iOS y Android construida con Expo, React Native y TypeScript.

## Stack Tecnológico

- **Framework**: Expo SDK 54
- **Lenguaje**: TypeScript
- **UI Library**: Gluestack UI
- **GraphQL Client**: Apollo Client
- **Navegación**: Expo Router
- **Storage**: Expo SecureStore + AsyncStorage

## Estructura del Proyecto

```
app/
  ├── (auth)/
  │   └── login.tsx          # Pantalla de login
  ├── (tabs)/
  │   ├── visitas.tsx        # Listado de visitas
  │   └── perfil.tsx         # Perfil de usuario
  ├── visita-detalle/
  │   └── [id].tsx           # Detalle de visita
  └── _layout.tsx            # Layout root con providers
src/
  ├── config/                # Configuración
  ├── contexts/              # React contexts
  ├── graphql/               # Apollo Client y queries
  ├── types/                 # TypeScript types
  ├── utils/                 # Utilidades
  └── components/            # Componentes reutilizables
```

## Scripts Disponibles

```bash
# Iniciar desarrollo
npm start

# Correr en iOS
npm run ios

# Correr en Android
npm run android

# Correr en web
npm run web
```

## Configuración

### Variables de Entorno

Las URLs del backend se configuran en `src/config/api.ts`:

- **Desarrollo**: `http://localhost:4000/graphql`
- **Producción**: `https://www.registrodevocionales.com/graphql`

### Backend

La app se conecta al mismo backend GraphQL que la aplicación web usando HTTPS en producción.

## Funcionalidades

### Autenticación
- Login con email y contraseña
- Tokens JWT almacenados de forma segura en SecureStore
- Información de usuario en AsyncStorage
- Logout con limpieza de cache

### Visitas
- Listado de todas las visitas (read-only)
- Pull-to-refresh
- Ordenamiento por fecha (descendente)
- Detalle completo de cada visita
- Filtros visuales por tipo y status

### Perfil
- Información del usuario actual
- Rol y comunidad
- Botón de cerrar sesión

## Desarrollo

### Requisitos Previos

- Node.js 18+
- npm o pnpm
- Expo Go app (para testing en dispositivo físico)
- iOS Simulator (Mac) o Android Emulator

### Instalación

```bash
cd packages/mobile
npm install
npm start
```

### Testing en Dispositivos

1. Instalar Expo Go en tu dispositivo
2. Escanear el QR code que aparece en la terminal
3. La app se cargará en tu dispositivo

### Build para Producción

Para builds de producción, puedes usar EAS Build:

```bash
# Instalar EAS CLI
npm install -g eas-cli

# Login
eas login

# Configurar proyecto
eas build:configure

# Build para iOS
eas build --platform ios

# Build para Android
eas build --platform android
```

## Características

- ✅ Navegación nativa iOS/Android
- ✅ Autenticación segura con JWT
- ✅ Comunicación HTTPS
- ✅ UI moderna con Gluestack
- ✅ TypeScript en toda la app
- ✅ Manejo de errores GraphQL
- ✅ Loading states
- ✅ Pull-to-refresh
- ✅ Cache de Apollo Client
- ✅ Dark mode ready

## Próximas Funcionalidades

- [ ] Creación de visitas desde móvil
- [ ] Edición de visitas
- [ ] Notificaciones push
- [ ] Modo offline
- [ ] Sincronización automática
- [ ] Geolocalización para visitas

## Soporte

Para reportar bugs o solicitar features, crear un issue en el repositorio.
