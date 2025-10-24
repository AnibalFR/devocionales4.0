// Configuración de URLs del backend
const ENV = {
  development: {
    graphqlUrl: 'http://localhost:4000/graphql',
    apiUrl: 'http://localhost:4000/api',
  },
  production: {
    graphqlUrl: 'https://www.registrodevocionales.com/graphql',
    apiUrl: 'https://www.registrodevocionales.com/api',
  },
};

// Detectar si estamos en desarrollo o producción
const isDevelopment = __DEV__;

export const API_CONFIG = isDevelopment ? ENV.development : ENV.production;
