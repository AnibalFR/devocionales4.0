# 🚀 Quick Start - App Móvil Devocionales 4.0

## Inicio Rápido (2 minutos)

### 1. Instalar dependencias (si no lo hiciste)
```bash
cd packages/mobile
npm install
```

### 2. Iniciar el servidor de desarrollo
```bash
npm start
```

### 3. Abrir en tu dispositivo

#### Opción A: Expo Go (Recomendado para desarrollo)
1. Instalar **Expo Go** desde:
   - [App Store (iOS)](https://apps.apple.com/app/expo-go/id982107779)
   - [Play Store (Android)](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. Escanear el QR code:
   - **iOS**: Usar la cámara del iPhone
   - **Android**: Usar la app Expo Go

#### Opción B: Simuladores/Emuladores
```bash
# iOS Simulator (solo en Mac)
npm run ios

# Android Emulator
npm run android
```

## Credenciales de Prueba

Usa las mismas credenciales de la aplicación web:

```
Email: tu@email.com
Contraseña: tu_password
```

## Pantallas Disponibles

1. **Login** - Autenticación con email/password
2. **Visitas** - Lista de todas las visitas (tab principal)
3. **Perfil** - Información del usuario y logout
4. **Detalle** - Ver información completa de una visita

## URLs del Backend

- **Desarrollo**: `http://localhost:4000/graphql`
- **Producción**: `https://www.registrodevocionales.com/graphql`

La app detecta automáticamente el ambiente usando `__DEV__`.

## Comandos Útiles

```bash
# Limpiar cache
npm start -- --clear

# Ver logs
# En la terminal donde corriste 'npm start'

# Recargar app
# Shake device o presiona 'r' en la terminal
```

## Solución de Problemas

### La app no se conecta al backend local

Si estás usando un dispositivo físico con Expo Go:

1. Asegúrate de estar en la misma red WiFi
2. El backend debe estar corriendo en `http://localhost:4000`
3. Si no funciona, edita `src/config/api.ts` y reemplaza `localhost` por la IP local de tu computadora

### Error de módulos nativos

```bash
# Limpiar todo y reinstalar
rm -rf node_modules
npm install
npm start -- --clear
```

### La app está en blanco

1. Asegúrate que el backend esté corriendo
2. Revisa los logs en la terminal
3. Recarga la app (shake device)

## Próximos Pasos

- [ ] Probar login
- [ ] Ver lista de visitas
- [ ] Abrir detalle de una visita
- [ ] Ver perfil
- [ ] Hacer logout

## Build para Testing Beta

Para crear builds para distribución:

```bash
# Instalar EAS CLI
npm install -g eas-cli

# Build para iOS (TestFlight)
eas build --platform ios --profile preview

# Build para Android (APK)
eas build --platform android --profile preview
```

¡Listo! La app debería estar funcionando 🎉
