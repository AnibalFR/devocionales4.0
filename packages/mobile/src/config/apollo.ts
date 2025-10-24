import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import getEnvVars from './api';

const { graphqlUrl } = getEnvVars();

const httpLink = createHttpLink({
  uri: graphqlUrl,
});

const authLink = setContext(async (_, { headers }) => {
  // Obtener el token de AsyncStorage
  const token = await AsyncStorage.getItem('@devocionales_token');

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
});

export default apolloClient;
