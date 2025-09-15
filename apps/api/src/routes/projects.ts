import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { hasPermission, Permission } from '@findable/auth';

const createProjectSchema = z.object({
  name: z.string().min(2).max(100),
  domain: z.string().url().optional(),
  oneLiner: z.string().max(200).optional(),
  competitors: z.array(z.string().url()).max(10).optional(),
  keywords: z.array(z.string()).max(20).optional(),
});

const updateProjectSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  domain: z.string().url().optional(),
  oneLiner: z.string().max(200).optional(),
  competitors: z.array(z.string().url()).max(10).optional(),
  keywords: z.array(z.string()).max(20).optional(),
  settings: z.object({}).optional(),
  isActive: z.boolean().optional(),
});

const projectRoutes: FastifyPluginAsync = async (fastify) => {
  // List projects
  fastify.get(
    '/',
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
                name: { type: 'string' },
                slug: { type: 'string' },
                domain: { type: 'string', nullable: true },
                oneLiner: { type: 'string', nullable: true },
                createdAt: { type: 'string' },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { organizationId, role } = request.user!;

      // Check permission
      if (!hasPermission(role, Permission.PROJECT_VIEW)) {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'You do not have permission to view projects',
        });
      }

      const projects = await fastify.prisma.project.findMany({
        where: {
          organizationId,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          domain: true,
          oneLiner: true,
          createdAt: true,
          _count: {
            select: {
              queries: true,
              runSessions: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return projects;
    }
  );

  // Create project
  fastify.post(
    '/',
    {
      onRequest: [fastify.authenticate],
      schema: {
        body: createProjectSchema,
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              slug: { type: 'string' },
              domain: { type: 'string', nullable: true },
              oneLiner: { type: 'string', nullable: true },
              createdAt: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { organizationId, role } = request.user!;
      const { name, domain, oneLiner, competitors, keywords } = request.body as z.infer<
        typeof createProjectSchema
      >;

      // Check permission
      if (!hasPermission(role, Permission.PROJECT_CREATE)) {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'You do not have permission to create projects',
        });
      }

      const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-');

      // Check if project with same slug exists
      const existingProject = await fastify.prisma.project.findFirst({
        where: {
          organizationId,
          slug,
        },
      });

      if (existingProject) {
        return reply.status(409).send({
          error: 'Conflict',
          message: 'Project with this name already exists',
        });
      }

      const project = await fastify.prisma.project.create({
        data: {
          name,
          slug,
          domain,
          oneLiner,
          competitors: competitors || [],
          keywords: keywords || [],
          organizationId,
          settings: {},
          isActive: true,
        },
      });

      return reply.status(201).send(project);
    }
  );

  // Get project
  fastify.get(
    '/:id',
    {
      onRequest: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              slug: { type: 'string' },
              domain: { type: 'string', nullable: true },
              oneLiner: { type: 'string', nullable: true },
              competitors: {
                type: 'array',
                items: { type: 'string' },
              },
              settings: { type: 'object' },
              createdAt: { type: 'string' },
              updatedAt: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const { organizationId, role } = request.user!;

      // Check permission
      if (!hasPermission(role, Permission.PROJECT_VIEW)) {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'You do not have permission to view projects',
        });
      }

      const project = await fastify.prisma.project.findFirst({
        where: {
          id,
          organizationId,
        },
        include: {
          _count: {
            select: {
              queries: true,
              runSessions: true,
            },
          },
        },
      });

      if (!project) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Project not found',
        });
      }

      return project;
    }
  );

  // Update project
  fastify.patch(
    '/:id',
    {
      onRequest: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
        },
        body: updateProjectSchema,
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const { organizationId, role } = request.user!;
      const updates = request.body as z.infer<typeof updateProjectSchema>;

      // Check permission
      if (!hasPermission(role, Permission.PROJECT_EDIT)) {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'You do not have permission to edit projects',
        });
      }

      const project = await fastify.prisma.project.findFirst({
        where: {
          id,
          organizationId,
        },
      });

      if (!project) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Project not found',
        });
      }

      // If name is being updated, generate new slug
      if (updates.name) {
        (updates as any).slug = updates.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      }

      const updatedProject = await fastify.prisma.project.update({
        where: { id },
        data: updates,
      });

      return updatedProject;
    }
  );

  // Delete project
  fastify.delete(
    '/:id',
    {
      onRequest: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const { organizationId, role } = request.user!;

      // Check permission
      if (!hasPermission(role, Permission.PROJECT_DELETE)) {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'You do not have permission to delete projects',
        });
      }

      const project = await fastify.prisma.project.findFirst({
        where: {
          id,
          organizationId,
        },
      });

      if (!project) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Project not found',
        });
      }

      // Soft delete by setting isActive to false
      await fastify.prisma.project.update({
        where: { id },
        data: { isActive: false },
      });

      return reply.status(204).send();
    }
  );
};

export { projectRoutes };