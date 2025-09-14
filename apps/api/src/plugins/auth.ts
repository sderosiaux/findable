import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';
import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
  interface FastifyRequest {
    user?: {
      id: string;
      email: string;
      organizationId: string;
      role: string;
    };
  }
}

const authPlugin: FastifyPluginAsync = fp(async (fastify) => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is required');
  }

  await fastify.register(jwt, {
    secret: jwtSecret,
    sign: {
      expiresIn: '7d',
    },
  });

  fastify.decorate('authenticate', async function (
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.code(401).send({ error: 'Unauthorized' });
    }
  });

  fastify.addHook('onRequest', async (request, reply) => {
    // Skip auth for public routes
    const publicRoutes = ['/health', '/auth/login', '/auth/signup', '/documentation'];
    const isPublicRoute = publicRoutes.some((route) =>
      request.url.startsWith(route)
    );

    if (!isPublicRoute && request.headers.authorization) {
      try {
        await request.jwtVerify();
      } catch (err) {
        // Token verification failed, but we'll let route handlers decide what to do
      }
    }
  });
});

export { authPlugin };