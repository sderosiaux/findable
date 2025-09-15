import type { FastifyRequest, FastifyReply } from 'fastify';
import { verifyAccessToken } from './jwt';
import type { JWTPayload } from './types';

declare module 'fastify' {
  interface FastifyRequest {
    user?: JWTPayload;
  }
}

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'No authorization header provided',
      });
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Invalid authorization header format',
      });
    }

    const payload = verifyAccessToken(token);
    request.user = payload;
  } catch (error) {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: error instanceof Error ? error.message : 'Authentication failed',
    });
  }
}

export async function optionalAuth(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return; // Continue without authentication
    }

    const [type, token] = authHeader.split(' ');

    if (type === 'Bearer' && token) {
      const payload = verifyAccessToken(token);
      request.user = payload;
    }
  } catch {
    // Silently continue without authentication
  }
}