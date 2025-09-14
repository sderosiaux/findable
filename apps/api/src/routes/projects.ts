import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

const createProjectSchema = z.object({
  name: z.string().min(2),
  domain: z.string().url().optional(),
  oneLiner: z.string().optional(),
  competitors: z.array(z.string()).optional(),
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
      const projects = await fastify.prisma.project.findMany({
        where: {
          organizationId: request.user!.organizationId,
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
      const { name, domain, oneLiner, competitors } = request.body as z.infer<
        typeof createProjectSchema
      >;

      const slug = name.toLowerCase().replace(/\s+/g, '-');

      // Check if project with same slug exists
      const existingProject = await fastify.prisma.project.findFirst({
        where: {
          organizationId: request.user!.organizationId,
          slug,
        },
      });

      if (existingProject) {
        return reply.code(400).send({ error: 'Project with this name already exists' });
      }

      const project = await fastify.prisma.project.create({
        data: {
          name,
          slug,
          domain,
          oneLiner,
          competitors: competitors || [],
          organizationId: request.user!.organizationId,
        },
      });

      return reply.code(201).send(project);
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

      const project = await fastify.prisma.project.findFirst({
        where: {
          id,
          organizationId: request.user!.organizationId,
        },
      });

      if (!project) {
        return reply.code(404).send({ error: 'Project not found' });
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
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            domain: { type: 'string' },
            oneLiner: { type: 'string' },
            competitors: {
              type: 'array',
              items: { type: 'string' },
            },
            settings: { type: 'object' },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const updates = request.body as any;

      const project = await fastify.prisma.project.findFirst({
        where: {
          id,
          organizationId: request.user!.organizationId,
        },
      });

      if (!project) {
        return reply.code(404).send({ error: 'Project not found' });
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

      const project = await fastify.prisma.project.findFirst({
        where: {
          id,
          organizationId: request.user!.organizationId,
        },
      });

      if (!project) {
        return reply.code(404).send({ error: 'Project not found' });
      }

      await fastify.prisma.project.delete({
        where: { id },
      });

      return reply.code(204).send();
    }
  );
};

export { projectRoutes };