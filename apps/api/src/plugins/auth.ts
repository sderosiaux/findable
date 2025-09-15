import fp from 'fastify-plugin';
import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { authenticate as authMiddleware, type JWTPayload } from '@findable/auth';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
  interface FastifyRequest {
    user?: JWTPayload;
  }
}

const authPlugin: FastifyPluginAsync = fp(async (fastify) => {
  // Decorate fastify with authenticate method
  fastify.decorate('authenticate', authMiddleware);

  // Add hook to handle optional authentication
  fastify.addHook('onRequest', async (request, reply) => {
    // Skip auth for public routes
    const publicRoutes = [
      '/health',
      '/auth/login',
      '/auth/register',
      '/auth/refresh',
      '/auth/logout',
      '/documentation',
    ];
    const isPublicRoute = publicRoutes.some((route) =>
      request.url.startsWith(route)
    );

    // Don't auto-authenticate on public routes
    if (!isPublicRoute && request.headers.authorization) {
      try {
        // Try to authenticate but don't fail if it doesn't work
        // Individual routes will handle authentication requirements
        await authMiddleware(request, reply);
      } catch {
        // Silent fail - let route handlers decide
      }
    }
  });
});

export { authPlugin };