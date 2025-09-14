import { FastifyPluginAsync } from 'fastify';

const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/',
    {
      schema: {
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              timestamp: { type: 'string' },
              uptime: { type: 'number' },
              version: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '0.1.0',
      };
    }
  );

  fastify.get(
    '/ready',
    {
      schema: {
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              services: {
                type: 'object',
                properties: {
                  database: { type: 'boolean' },
                  redis: { type: 'boolean' },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      let dbHealthy = false;
      let redisHealthy = false;

      try {
        await fastify.prisma.$queryRaw`SELECT 1`;
        dbHealthy = true;
      } catch (error) {
        fastify.log.error('Database health check failed:', error);
      }

      try {
        await fastify.redis.ping();
        redisHealthy = true;
      } catch (error) {
        fastify.log.error('Redis health check failed:', error);
      }

      const isReady = dbHealthy && redisHealthy;

      return reply.code(isReady ? 200 : 503).send({
        status: isReady ? 'ready' : 'not ready',
        services: {
          database: dbHealthy,
          redis: redisHealthy,
        },
      });
    }
  );
};

export { healthRoutes };