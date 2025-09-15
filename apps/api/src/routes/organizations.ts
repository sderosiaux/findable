import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { hasPermission, Permission } from '@findable/auth';

const updateOrganizationSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
  website: z.string().url().optional(),
  logoUrl: z.string().url().optional(),
});

const inviteUserSchema = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'MEMBER', 'VIEWER']),
});

const updateUserRoleSchema = z.object({
  role: z.enum(['ADMIN', 'MEMBER', 'VIEWER']),
});

const organizationRoutes: FastifyPluginAsync = async (fastify) => {
  // Get current organization
  fastify.get(
    '/',
    {
      onRequest: [fastify.authenticate],
      schema: {
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              slug: { type: 'string' },
              description: { type: 'string', nullable: true },
              website: { type: 'string', nullable: true },
              logoUrl: { type: 'string', nullable: true },
              plan: { type: 'string' },
              createdAt: { type: 'string' },
              updatedAt: { type: 'string' },
              _count: {
                type: 'object',
                properties: {
                  users: { type: 'number' },
                  projects: { type: 'number' },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { organizationId } = request.user!;

      const organization = await fastify.prisma.organization.findUnique({
        where: { id: organizationId },
        include: {
          _count: {
            select: {
              users: true,
              projects: true,
            },
          },
        },
      });

      if (!organization) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Organization not found',
        });
      }

      return organization;
    }
  );

  // Update organization
  fastify.patch(
    '/',
    {
      onRequest: [fastify.authenticate],
      schema: {
        body: updateOrganizationSchema,
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              slug: { type: 'string' },
              description: { type: 'string', nullable: true },
              website: { type: 'string', nullable: true },
              logoUrl: { type: 'string', nullable: true },
              plan: { type: 'string' },
              updatedAt: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { organizationId, role } = request.user!;
      const updates = request.body as z.infer<typeof updateOrganizationSchema>;

      // Check permission
      if (!hasPermission(role, Permission.ORG_EDIT)) {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'You do not have permission to edit this organization',
        });
      }

      const organization = await fastify.prisma.organization.update({
        where: { id: organizationId },
        data: updates,
      });

      return organization;
    }
  );

  // Get organization members
  fastify.get(
    '/members',
    {
      onRequest: [fastify.authenticate],
      schema: {
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' },
                role: { type: 'string' },
                emailVerified: { type: 'boolean' },
                createdAt: { type: 'string' },
                lastLoginAt: { type: 'string', nullable: true },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { organizationId, role } = request.user!;

      // Check permission
      if (!hasPermission(role, Permission.ORG_VIEW)) {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'You do not have permission to view organization members',
        });
      }

      const members = await fastify.prisma.user.findMany({
        where: { organizationId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          emailVerified: true,
          createdAt: true,
          lastLoginAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return members;
    }
  );

  // Invite user to organization
  fastify.post<{ Body: z.infer<typeof inviteUserSchema> }>(
    '/members/invite',
    {
      onRequest: [fastify.authenticate],
      schema: {
        body: inviteUserSchema,
        response: {
          201: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              invitation: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  email: { type: 'string' },
                  role: { type: 'string' },
                  expiresAt: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { organizationId, role } = request.user!;
      const { email, role: inviteRole } = request.body;

      // Check permission
      if (!hasPermission(role, Permission.USER_INVITE)) {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'You do not have permission to invite users',
        });
      }

      // Check if user already exists in organization
      const existingUser = await fastify.prisma.user.findFirst({
        where: {
          email,
          organizationId,
        },
      });

      if (existingUser) {
        return reply.status(409).send({
          error: 'Conflict',
          message: 'User is already a member of this organization',
        });
      }

      // In a real implementation, you would:
      // 1. Create an invitation record
      // 2. Send an email with invitation link
      // 3. Handle invitation acceptance

      // For now, we'll return a success message
      return reply.status(201).send({
        message: 'Invitation sent successfully',
        invitation: {
          id: 'inv_' + Math.random().toString(36).substr(2, 9),
          email,
          role: inviteRole,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
      });
    }
  );

  // Update user role
  fastify.patch<{
    Params: { userId: string };
    Body: z.infer<typeof updateUserRoleSchema>;
  }>(
    '/members/:userId/role',
    {
      onRequest: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
          },
          required: ['userId'],
        },
        body: updateUserRoleSchema,
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              email: { type: 'string' },
              name: { type: 'string' },
              role: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { organizationId, role, userId: currentUserId } = request.user!;
      const { userId } = request.params;
      const { role: newRole } = request.body;

      // Check permission
      if (!hasPermission(role, Permission.USER_EDIT)) {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'You do not have permission to edit user roles',
        });
      }

      // Can't change your own role
      if (userId === currentUserId) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'You cannot change your own role',
        });
      }

      // Check if user exists in organization
      const user = await fastify.prisma.user.findFirst({
        where: {
          id: userId,
          organizationId,
        },
      });

      if (!user) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'User not found in this organization',
        });
      }

      // Can't change owner's role
      if (user.role === 'OWNER') {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Cannot change the role of the organization owner',
        });
      }

      // Update role
      const updatedUser = await fastify.prisma.user.update({
        where: { id: userId },
        data: { role: newRole },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      });

      return updatedUser;
    }
  );

  // Remove user from organization
  fastify.delete<{ Params: { userId: string } }>(
    '/members/:userId',
    {
      onRequest: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
          },
          required: ['userId'],
        },
        response: {
          204: {
            type: 'null',
          },
        },
      },
    },
    async (request, reply) => {
      const { organizationId, role, userId: currentUserId } = request.user!;
      const { userId } = request.params;

      // Check permission
      if (!hasPermission(role, Permission.USER_DELETE)) {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'You do not have permission to remove users',
        });
      }

      // Can't remove yourself
      if (userId === currentUserId) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'You cannot remove yourself from the organization',
        });
      }

      // Check if user exists in organization
      const user = await fastify.prisma.user.findFirst({
        where: {
          id: userId,
          organizationId,
        },
      });

      if (!user) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'User not found in this organization',
        });
      }

      // Can't remove owner
      if (user.role === 'OWNER') {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Cannot remove the organization owner',
        });
      }

      // Remove user from organization
      await fastify.prisma.user.delete({
        where: { id: userId },
      });

      return reply.status(204).send();
    }
  );
};

export { organizationRoutes };