import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { authPlugin } from './plugins/auth';
import { dbPlugin } from './plugins/database';
import { redisPlugin } from './plugins/redis';
import { healthRoutes } from './routes/health';
import { authRoutes } from './routes/auth';
import { organizationRoutes } from './routes/organizations';
import { projectRoutes } from './routes/projects';
import { queryRoutes } from './routes/queries';
import { metricsRoutes } from './routes/metrics';
import { MetricsCollector } from './services/metrics-collector';

const server = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
});

async function main() {
  try {
    // Register security plugins
    await server.register(cors, {
      origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
      credentials: true,
    });

    await server.register(helmet, {
      contentSecurityPolicy: false,
    });

    await server.register(rateLimit, {
      max: 100,
      timeWindow: '1 minute',
    });

    // Register Swagger
    await server.register(swagger, {
      openapi: {
        info: {
          title: 'Findable API',
          description: 'AI SEO Platform API',
          version: '0.1.0',
        },
        servers: [
          {
            url: process.env.API_URL || 'http://localhost:3001',
            description: 'Development server',
          },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
            },
          },
        },
      },
    });

    await server.register(swaggerUi, {
      routePrefix: '/documentation',
      uiConfig: {
        docExpansion: 'list',
        deepLinking: false,
      },
    });

    // Register plugins
    await server.register(dbPlugin);
    await server.register(redisPlugin);
    await server.register(authPlugin);

    // Register routes
    await server.register(healthRoutes, { prefix: '/health' });
    await server.register(authRoutes, { prefix: '/auth' });
    await server.register(organizationRoutes, { prefix: '/api/organization' });
    await server.register(projectRoutes, { prefix: '/api/projects' });
    await server.register(queryRoutes, { prefix: '/api/queries' });
    await server.register(metricsRoutes, { prefix: '/api/metrics' });

    // Start server
    const port = parseInt(process.env.PORT || '3001', 10);
    const host = process.env.HOST || '0.0.0.0';

    await server.listen({ port, host });

    server.log.info(`Server listening on http://${host}:${port}`);
    server.log.info(`API Documentation: http://${host}:${port}/documentation`);

    // Start automatic metrics processing
    const metricsCollector = new MetricsCollector((server as any).prisma);
    const metricsInterval = metricsCollector.startAutomaticProcessing(5); // Every 5 minutes

    // Store the interval for cleanup
    (server as any).metricsInterval = metricsInterval;
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  server.log.info('SIGINT signal received: closing HTTP server');

  // Clean up metrics processing
  if ((server as any).metricsInterval) {
    clearInterval((server as any).metricsInterval);
  }

  await server.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  server.log.info('SIGTERM signal received: closing HTTP server');

  // Clean up metrics processing
  if ((server as any).metricsInterval) {
    clearInterval((server as any).metricsInterval);
  }

  await server.close();
  process.exit(0);
});

main();