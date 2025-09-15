import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { hasPermission, Permission } from '@findable/auth';

const runQuerySchema = z.object({
  projectId: z.string().uuid(),
  queries: z.array(z.string().min(1).max(1000)).min(1).max(10),
  models: z.array(z.enum(['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo', 'claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku', 'perplexity'])),
  surfaces: z.array(z.enum(['web', 'social', 'news', 'academic'])).optional(),
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
});

const createQuerySchema = z.object({
  projectId: z.string().uuid(),
  text: z.string().min(1).max(1000),
  category: z.enum(['product', 'competitor', 'brand', 'general']).default('general'),
  tags: z.array(z.string()).max(10).optional(),
});

// Queue session for processing by runner service
async function queueSessionForProcessing(
  fastify: any,
  sessionId: string,
  priority: string = 'normal'
) {
  try {
    const RUNNER_SERVICE_URL = process.env.RUNNER_SERVICE_URL || 'http://localhost:8001';

    // Send request to Python runner service
    const response = await fetch(`${RUNNER_SERVICE_URL}/sessions/queue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_id: sessionId,
        priority,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Runner service error: ${error}`);
    }

    const result = await response.json();
    fastify.log.info(`Session ${sessionId} queued for processing:`, result);
    return true;
  } catch (error) {
    fastify.log.error(`Failed to queue session ${sessionId}:`, error);
    // Fall back to updating session status as failed
    await fastify.prisma.runSession.update({
      where: { id: sessionId },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : 'Failed to queue session',
      },
    });
    throw error;
  }
}

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

      const { organizationId, role } = request.user!;
      const { projectId, queries, models, surfaces, priority } = request.body as z.infer<
        typeof runQuerySchema
      >;

      // Check permission
      if (!hasPermission(role, Permission.QUERY_RUN)) {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'You do not have permission to run queries',
        });
      }

      // Verify project ownership
      const project = await fastify.prisma.project.findFirst({
        where: {
          id: projectId,
          organizationId,
          isActive: true,
        },
      });

      if (!project) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Project not found',
        });
      }

      // Create run session
      const session = await fastify.prisma.runSession.create({
        data: {
          projectId,
          status: 'PENDING',
          priority,
          metadata: {
            queries,
            models,
            surfaces: surfaces || ['web'],
            timestamp: new Date().toISOString(),
          },
        },
      });

      // Queue the job (in production, this would use Redis/BullMQ)
      setImmediate(async () => {
        try {
          // Update session status
          await fastify.prisma.runSession.update({
            where: { id: session.id },
            data: {
              status: 'RUNNING',
              startedAt: new Date(),
            },
          });

          // Queue session for processing by runner service
          await queueSessionForProcessing(fastify, session.id, priority);

          // Session status will be updated by the runner service
          // No need to update to COMPLETED here since it's handled asynchronously
        } catch (error) {
          fastify.log.error('Query execution failed:', error);
          await fastify.prisma.runSession.update({
            where: { id: session.id },
            data: {
              status: 'FAILED',
              completedAt: new Date(),
              errorMessage: error instanceof Error ? error.message : 'Unknown error',
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
      const { organizationId, role } = request.user!;

      // Check permission
      if (!hasPermission(role, Permission.QUERY_VIEW)) {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'You do not have permission to view query sessions',
        });
      }

      const session = await fastify.prisma.runSession.findFirst({
        where: {
          id,
          project: {
            organizationId,
          },
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          _count: {
            select: {
              results: true,
            },
          },
        },
      });

      if (!session) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Session not found',
        });
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
      const { organizationId, role } = request.user!;

      // Check permission
      if (!hasPermission(role, Permission.QUERY_VIEW)) {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'You do not have permission to view query results',
        });
      }

      // Verify session ownership
      const session = await fastify.prisma.runSession.findFirst({
        where: {
          id,
          project: {
            organizationId,
          },
        },
      });

      if (!session) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Session not found',
        });
      }

      const results = await fastify.prisma.runResult.findMany({
        where: { sessionId: id },
        include: {
          model: {
            select: {
              id: true,
              name: true,
              provider: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      return results.map((result) => ({
        id: result.id,
        queryId: result.queryId,
        queryText: result.queryText,
        model: {
          id: result.model.id,
          name: result.model.name,
          provider: result.model.provider,
        },
        responseText: result.responseText,
        citations: result.citations,
        extractedSnippets: result.extractedSnippets,
        mentions: result.mentions,
        executionTimeMs: result.executionTimeMs,
        surface: result.surface,
        createdAt: result.createdAt,
      }));
    }
  );

  // Create individual query
  fastify.post<{ Body: z.infer<typeof createQuerySchema> }>(
    '/',
    {
      onRequest: [fastify.authenticate],
      schema: {
        body: createQuerySchema,
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              projectId: { type: 'string' },
              text: { type: 'string' },
              category: { type: 'string' },
              tags: { type: 'array', items: { type: 'string' } },
              createdAt: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { organizationId, role } = request.user!;
      const { projectId, text, category, tags } = request.body;

      // Check permission
      if (!hasPermission(role, Permission.QUERY_CREATE)) {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'You do not have permission to create queries',
        });
      }

      // Verify project ownership
      const project = await fastify.prisma.project.findFirst({
        where: {
          id: projectId,
          organizationId,
          isActive: true,
        },
      });

      if (!project) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Project not found',
        });
      }

      const query = await fastify.prisma.query.create({
        data: {
          projectId,
          text,
          category,
          tags: tags || [],
        },
      });

      return reply.status(201).send(query);
    }
  );

  // List queries for a project
  fastify.get<{ Querystring: { projectId: string; category?: string; limit?: number; offset?: number } }>(
    '/',
    {
      onRequest: [fastify.authenticate],
      schema: {
        querystring: {
          type: 'object',
          properties: {
            projectId: { type: 'string' },
            category: { type: 'string' },
            limit: { type: 'number', minimum: 1, maximum: 100, default: 20 },
            offset: { type: 'number', minimum: 0, default: 0 },
          },
          required: ['projectId'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              queries: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    text: { type: 'string' },
                    category: { type: 'string' },
                    tags: { type: 'array', items: { type: 'string' } },
                    createdAt: { type: 'string' },
                    _count: {
                      type: 'object',
                      properties: {
                        results: { type: 'number' },
                      },
                    },
                  },
                },
              },
              pagination: {
                type: 'object',
                properties: {
                  total: { type: 'number' },
                  limit: { type: 'number' },
                  offset: { type: 'number' },
                  hasMore: { type: 'boolean' },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { organizationId, role } = request.user!;
      const { projectId, category, limit = 20, offset = 0 } = request.query;

      // Check permission
      if (!hasPermission(role, Permission.QUERY_VIEW)) {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'You do not have permission to view queries',
        });
      }

      // Verify project ownership
      const project = await fastify.prisma.project.findFirst({
        where: {
          id: projectId,
          organizationId,
        },
      });

      if (!project) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Project not found',
        });
      }

      const where = {
        projectId,
        ...(category && { category }),
      };

      const [queries, total] = await Promise.all([
        fastify.prisma.query.findMany({
          where,
          include: {
            _count: {
              select: {
                results: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        fastify.prisma.query.count({ where }),
      ]);

      return {
        queries,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      };
    }
  );

  // List sessions for a project
  fastify.get<{ Querystring: { projectId: string; status?: string; limit?: number; offset?: number } }>(
    '/sessions',
    {
      onRequest: [fastify.authenticate],
      schema: {
        querystring: {
          type: 'object',
          properties: {
            projectId: { type: 'string' },
            status: { type: 'string' },
            limit: { type: 'number', minimum: 1, maximum: 50, default: 10 },
            offset: { type: 'number', minimum: 0, default: 0 },
          },
          required: ['projectId'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              sessions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    status: { type: 'string' },
                    priority: { type: 'string' },
                    startedAt: { type: 'string', nullable: true },
                    completedAt: { type: 'string', nullable: true },
                    createdAt: { type: 'string' },
                    metadata: { type: 'object' },
                    _count: {
                      type: 'object',
                      properties: {
                        results: { type: 'number' },
                      },
                    },
                  },
                },
              },
              pagination: {
                type: 'object',
                properties: {
                  total: { type: 'number' },
                  limit: { type: 'number' },
                  offset: { type: 'number' },
                  hasMore: { type: 'boolean' },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { organizationId, role } = request.user!;
      const { projectId, status, limit = 10, offset = 0 } = request.query;

      // Check permission
      if (!hasPermission(role, Permission.QUERY_VIEW)) {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'You do not have permission to view query sessions',
        });
      }

      // Verify project ownership
      const project = await fastify.prisma.project.findFirst({
        where: {
          id: projectId,
          organizationId,
        },
      });

      if (!project) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Project not found',
        });
      }

      const where = {
        projectId,
        ...(status && { status: status.toUpperCase() }),
      };

      const [sessions, total] = await Promise.all([
        fastify.prisma.runSession.findMany({
          where,
          include: {
            _count: {
              select: {
                results: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        fastify.prisma.runSession.count({ where }),
      ]);

      return {
        sessions,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      };
    }
  );
};

export { queryRoutes };