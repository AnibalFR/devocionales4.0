const ENV = {
  production: {
    graphqlUrl: 'https://www.registrodevocionales.com/graphql',
    apiUrl: 'https://www.registrodevocionales.com/api',
  },
};

const getEnvVars = () => {
  return ENV.production;
};

export default getEnvVars;
