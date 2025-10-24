// Configuración de URLs del backend
const ENV = {
  development: {
    // NOTA: En desarrollo móvil, usa el servidor de producción
    // porque 'localhost' en iOS/Android se refiere al dispositivo, no a tu Mac.
    //
    // Para desarrollo local con backend en tu Mac:
    // 1. Encuentra tu IP local: ifconfig | grep "inet " | grep -v 127.0.0.1
    // 2. Usa: http://TU_IP_LOCAL:4000/graphql (ej: http://192.168.1.100:4000/graphql)
    // 3. Asegúrate que el backend acepte conexiones de tu red local
    graphqlUrl: 'https://www.registrodevocionales.com/graphql',
    apiUrl: 'https://www.registrodevocionales.com/api',
  },
  production: {
    graphqlUrl: 'https://www.registrodevocionales.com/graphql',
    apiUrl: 'https://www.registrodevocionales.com/api',
  },
};

// Detectar si estamos en desarrollo o producción
const isDevelopment = __DEV__;

export const API_CONFIG = isDevelopment ? ENV.development : ENV.production;
