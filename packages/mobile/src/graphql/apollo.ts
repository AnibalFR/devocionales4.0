import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import * as SecureStore from 'expo-secure-store';
import { API_CONFIG } from '../config/api';

// HTTP Link para conectar con el backend
const httpLink = createHttpLink({
  uri: API_CONFIG.graphqlUrl,
});

// Auth Link para agregar el token JWT a cada request
const authLink = setContext(async (_, { headers }) => {
  try {
    // Obtener token de SecureStore
    const token = await SecureStore.getItemAsync('token');

    return {
      headers: {
        ...headers,
        authorization: token ? `Bearer ${token}` : '',
      },
    };
  } catch (error) {
    console.error('Error al obtener token:', error);
    return { headers };
  }
});

// Error Link para manejar errores de autenticación
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path, extensions }) => {
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      );

      // Si el token expiró o es inválido, el AuthContext manejará el logout
      if (extensions?.code === 'UNAUTHENTICATED') {
        // Esto será manejado por el AuthContext
        console.log('Token no autenticado');
      }
    });
  }

  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
  }
});

// Crear cliente Apollo
export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
});
