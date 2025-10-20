import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import express from 'express';
import cors from 'cors';
import { readFileSync } from 'fs';
import { join } from 'path';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';
import { prisma, getUserIdFromToken, type Context } from './context';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 4000;

  // Apollo Server
  const server = new ApolloServer<Context>({
    typeDefs,
    resolvers,
    introspection: process.env.GRAPHQL_INTROSPECTION === 'true',
    includeStacktraceInErrorResponses: process.env.NODE_ENV === 'development',
  });

  await server.start();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Endpoint para release info (sin caché)
  app.get('/api/release', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    try {
      const releasePath = join(__dirname, '..', 'release.json');
      const releaseData = readFileSync(releasePath, 'utf-8');
      res.json(JSON.parse(releaseData));
    } catch (error) {
      console.error('Error reading release.json:', error);
      res.status(500).json({ error: 'Could not read release information' });
    }
  });

  // GraphQL endpoint
  app.use(
    '/',
    cors<cors.CorsRequest>(),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }): Promise<Context> => {
        const authHeader = req.headers.authorization || '';
        const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
        const userId = getUserIdFromToken(token);

        return {
          prisma,
          userId,
        };
      },
    })
  );

  await new Promise<void>((resolve) => app.listen(PORT, resolve));

  console.log('');
  console.log('🚀 Devocionales 4.0 Backend');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📡 GraphQL Server: http://localhost:${PORT}/`);
  console.log(`🔍 GraphQL Playground: http://localhost:${PORT}/`);
  console.log(`📦 Release Info: http://localhost:${PORT}/api/release`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
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
