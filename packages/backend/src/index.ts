import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';
import { prisma, getUserIdFromToken, type Context } from './context';

async function startServer() {
  const server = new ApolloServer<Context>({
    typeDefs,
    resolvers,
    introspection: process.env.GRAPHQL_INTROSPECTION === 'true',
    includeStacktraceInErrorResponses: process.env.NODE_ENV === 'development',
  });

  const { url } = await startStandaloneServer(server, {
    listen: { port: Number(process.env.PORT) || 4000 },
    context: async ({ req }): Promise<Context> => {
      // Extraer token del header Authorization
      const authHeader = req.headers.authorization || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : undefined;

      const userId = getUserIdFromToken(token);

      return {
        prisma,
        userId,
      };
    },
  });

  console.log('');
  console.log('🚀 Devocionales 4.0 Backend');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📡 GraphQL Server: ${url}`);
  console.log(`🔍 GraphQL Playground: ${url}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('📝 Usuarios de prueba:');
  console.log('   CEA:         cea@devocionales.local / password123');
  console.log('   COLABORADOR: colaborador@devocionales.local / password123');
  console.log('   VISITANTE:   visitante@devocionales.local / password123');
  console.log('');
}

startServer().catch((error) => {
  console.error('❌ Error starting server:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});
