import { FastifyPluginAsync } from 'fastify';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  organizationName: z.string().min(2),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post(
    '/signup',
    {
      schema: {
        body: signupSchema,
        response: {
          201: {
            type: 'object',
            properties: {
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  email: { type: 'string' },
                  name: { type: 'string' },
                },
              },
              token: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { email, password, name, organizationName } = request.body as z.infer<
        typeof signupSchema
      >;

      // Check if user exists
      const existingUser = await fastify.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return reply.code(400).send({ error: 'User already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create organization and user
      const organization = await fastify.prisma.organization.create({
        data: {
          name: organizationName,
          slug: organizationName.toLowerCase().replace(/\s+/g, '-'),
          users: {
            create: {
              email,
              password: hashedPassword,
              name,
              role: 'OWNER',
            },
          },
        },
        include: {
          users: true,
        },
      });

      const user = organization.users[0];

      // Generate JWT
      const token = fastify.jwt.sign({
        id: user.id,
        email: user.email,
        organizationId: organization.id,
        role: user.role,
      });

      return reply.code(201).send({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        token,
      });
    }
  );

  fastify.post(
    '/login',
    {
      schema: {
        body: loginSchema,
        response: {
          200: {
            type: 'object',
            properties: {
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  email: { type: 'string' },
                  name: { type: 'string' },
                },
              },
              token: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { email, password } = request.body as z.infer<typeof loginSchema>;

      // Find user
      const user = await fastify.prisma.user.findUnique({
        where: { email },
        include: {
          organization: true,
        },
      });

      if (!user) {
        return reply.code(401).send({ error: 'Invalid credentials' });
      }

      // Verify password
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return reply.code(401).send({ error: 'Invalid credentials' });
      }

      // Generate JWT
      const token = fastify.jwt.sign({
        id: user.id,
        email: user.email,
        organizationId: user.organizationId,
        role: user.role,
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        token,
      };
    }
  );

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
        where: { id: request.user!.id },
        include: {
          organization: true,
        },
      });

      if (!user) {
        return reply.code(404).send({ error: 'User not found' });
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        organization: {
          id: user.organization.id,
          name: user.organization.name,
          plan: user.organization.plan,
        },
      };
    }
  );
};

export { authRoutes };