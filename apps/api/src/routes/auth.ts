import { FastifyPluginAsync } from 'fastify';
import {
  hashPassword,
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  LoginSchema,
  RegisterSchema,
  RefreshTokenSchema,
  type LoginInput,
  type RegisterInput,
  type JWTPayload,
} from '@findable/auth';

const authRoutes: FastifyPluginAsync = async (fastify) => {
  // Register new user and organization
  fastify.post<{ Body: RegisterInput }>(
    '/register',
    {
      schema: {
        body: RegisterSchema,
        response: {
          201: {
            type: 'object',
            properties: {
              accessToken: { type: 'string' },
              refreshToken: { type: 'string' },
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  email: { type: 'string' },
                  name: { type: 'string' },
                  organizationId: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { email, password, name, organizationName } = request.body;

      // Check if user already exists
      const existingUser = await fastify.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return reply.status(409).send({
          error: 'Conflict',
          message: 'User with this email already exists',
        });
      }

      // Create organization and user in transaction
      const result = await fastify.prisma.$transaction(async (tx) => {
        // Create organization
        const organization = await tx.organization.create({
          data: {
            name: organizationName,
            slug: organizationName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            plan: 'TRIAL',
          },
        });

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Create user
        const user = await tx.user.create({
          data: {
            email,
            password: hashedPassword,
            name,
            organizationId: organization.id,
            role: 'OWNER',
            emailVerified: false,
          },
        });

        return { user, organization };
      });

      // Generate tokens
      const jwtPayload: JWTPayload = {
        userId: result.user.id,
        email: result.user.email,
        organizationId: result.organization.id,
        role: result.user.role as any,
      };

      const accessToken = generateAccessToken(jwtPayload);
      const refreshToken = generateRefreshToken(jwtPayload);

      return reply.status(201).send({
        accessToken,
        refreshToken,
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          organizationId: result.organization.id,
        },
      });
    }
  );

  // Login
  fastify.post<{ Body: LoginInput }>(
    '/login',
    {
      schema: {
        body: LoginSchema,
        response: {
          200: {
            type: 'object',
            properties: {
              accessToken: { type: 'string' },
              refreshToken: { type: 'string' },
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  email: { type: 'string' },
                  name: { type: 'string' },
                  organizationId: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { email, password } = request.body;

      // Find user
      const user = await fastify.prisma.user.findUnique({
        where: { email },
        include: { organization: true },
      });

      if (!user) {
        return reply.status(401).send({
          error: 'Unauthorized',
          message: 'Invalid email or password',
        });
      }

      // Verify password
      const isValid = await verifyPassword(password, user.password);
      if (!isValid) {
        return reply.status(401).send({
          error: 'Unauthorized',
          message: 'Invalid email or password',
        });
      }

      // Update last login
      await fastify.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      // Generate tokens
      const jwtPayload: JWTPayload = {
        userId: user.id,
        email: user.email,
        organizationId: user.organizationId,
        role: user.role as any,
      };

      const accessToken = generateAccessToken(jwtPayload);
      const refreshToken = generateRefreshToken(jwtPayload);

      return reply.send({
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          organizationId: user.organizationId,
        },
      });
    }
  );

  // Refresh token
  fastify.post<{ Body: { refreshToken: string } }>(
    '/refresh',
    {
      schema: {
        body: RefreshTokenSchema,
        response: {
          200: {
            type: 'object',
            properties: {
              accessToken: { type: 'string' },
              refreshToken: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { refreshToken } = request.body;

      try {
        // Verify refresh token
        const payload = verifyRefreshToken(refreshToken);

        // Check if user still exists and is active
        const user = await fastify.prisma.user.findUnique({
          where: { id: payload.userId },
        });

        if (!user) {
          return reply.status(401).send({
            error: 'Unauthorized',
            message: 'User not found',
          });
        }

        // Generate new tokens
        const newPayload: JWTPayload = {
          userId: user.id,
          email: user.email,
          organizationId: user.organizationId,
          role: user.role as any,
        };

        const newAccessToken = generateAccessToken(newPayload);
        const newRefreshToken = generateRefreshToken(newPayload);

        return reply.send({
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        });
      } catch (error) {
        return reply.status(401).send({
          error: 'Unauthorized',
          message: 'Invalid or expired refresh token',
        });
      }
    }
  );

  // Get current user
  fastify.get(
    '/me',
    {
      onRequest: [fastify.authenticate],
      schema: {
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              email: { type: 'string' },
              name: { type: 'string' },
              role: { type: 'string' },
              organization: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  plan: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const user = await fastify.prisma.user.findUnique({
        where: { id: request.user!.userId },
        include: {
          organization: true,
        },
      });

      if (!user) {
        return reply.status(404).send({ error: 'User not found' });
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organization: {
          id: user.organization.id,
          name: user.organization.name,
          plan: user.organization.plan,
        },
      };
    }
  );

  // Logout (optional - mainly for client-side token cleanup)
  fastify.post('/logout', {
    handler: async (request, reply) => {
      // In a more complex implementation, you might want to:
      // - Invalidate refresh tokens in a database
      // - Add tokens to a blacklist
      // - Clear server-side sessions

      return reply.send({
        message: 'Logged out successfully',
      });
    },
  });
};

export { authRoutes };