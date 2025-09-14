import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

const runQuerySchema = z.object({
  projectId: z.string(),
  queries: z.array(z.string()).min(1),
  models: z.array(z.enum(['gpt-4', 'gpt-3.5', 'claude-3', 'perplexity'])),
  runCount: z.number().min(1).max(10).default(1),
});

const queryRoutes: FastifyPluginAsync = async (fastify) => {
  // Run queries
  fastify.post(
    '/run',
    {
      onRequest: [fastify.authenticate],
      schema: {
        body: runQuerySchema,
        response: {
          202: {
            type: 'object',
            properties: {
              sessionId: { type: 'string' },
              status: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { projectId, queries, models, runCount } = request.body as z.infer<
        typeof runQuerySchema
      >;

      // Verify project ownership
      const project = await fastify.prisma.project.findFirst({
        where: {
          id: projectId,
          organizationId: request.user!.organizationId,
        },
      });

      if (!project) {
        return reply.code(404).send({ error: 'Project not found' });
      }

      // Create run session
      const session = await fastify.prisma.runSession.create({
        data: {
          projectId,
          status: 'pending',
          metadata: {
            queries,
            models,
            runCount,
          },
        },
      });

      // Queue the job (in production, this would use a job queue like Bull/BullMQ)
      setImmediate(async () => {
        try {
          // Update session status
          await fastify.prisma.runSession.update({
            where: { id: session.id },
            data: {
              status: 'running',
              startedAt: new Date(),
            },
          });

          // TODO: Implement actual query execution
          // This would call the runner service

          // Update session status
          await fastify.prisma.runSession.update({
            where: { id: session.id },
            data: {
              status: 'completed',
              completedAt: new Date(),
            },
          });
        } catch (error) {
          fastify.log.error('Query execution failed:', error);
          await fastify.prisma.runSession.update({
            where: { id: session.id },
            data: {
              status: 'failed',
              completedAt: new Date(),
            },
          });
        }
      });

      return reply.code(202).send({
        sessionId: session.id,
        status: 'accepted',
        message: 'Query execution started',
      });
    }
  );

  // Get session status
  fastify.get(
    '/sessions/:id',
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
              projectId: { type: 'string' },
              status: { type: 'string' },
              startedAt: { type: 'string', nullable: true },
              completedAt: { type: 'string', nullable: true },
              metadata: { type: 'object' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      const session = await fastify.prisma.runSession.findFirst({
        where: {
          id,
          project: {
            organizationId: request.user!.organizationId,
          },
        },
      });

      if (!session) {
        return reply.code(404).send({ error: 'Session not found' });
      }

      return session;
    }
  );

  // Get session results
  fastify.get(
    '/sessions/:id/results',
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
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                queryId: { type: 'string' },
                queryText: { type: 'string' },
                modelId: { type: 'string' },
                responseText: { type: 'string' },
                citations: { type: 'array' },
                extractedSnippets: { type: 'array' },
                mentions: { type: 'array' },
                executionTimeMs: { type: 'number' },
                createdAt: { type: 'string' },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      // Verify session ownership
      const session = await fastify.prisma.runSession.findFirst({
        where: {
          id,
          project: {
            organizationId: request.user!.organizationId,
          },
        },
      });

      if (!session) {
        return reply.code(404).send({ error: 'Session not found' });
      }

      const results = await fastify.prisma.runResult.findMany({
        where: { sessionId: id },
        include: {
          model: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      return results.map((result) => ({
        id: result.id,
        queryId: result.queryId,
        queryText: result.queryText,
        modelId: result.model.name,
        responseText: result.responseText,
        citations: result.citations,
        extractedSnippets: result.extractedSnippets,
        mentions: result.mentions,
        executionTimeMs: result.executionTimeMs,
        createdAt: result.createdAt,
      }));
    }
  );
};

export { queryRoutes };