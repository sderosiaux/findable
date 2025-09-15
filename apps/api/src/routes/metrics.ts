import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { hasPermission, Permission } from '@findable/auth';
import { MetricsCollector } from '../services/metrics-collector';

const _getMetricsSchema = z.object({
  projectId: z.string().uuid(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  metricType: z.enum(['presence', 'pick_rate', 'snippet_health', 'citations']).optional(),
  granularity: z.enum(['hour', 'day', 'week', 'month']).default('day'),
});

const createMetricSchema = z.object({
  projectId: z.string().uuid(),
  metricType: z.enum(['presence', 'pick_rate', 'snippet_health', 'citations']),
  value: z.number().min(0).max(1),
  metadata: z.object({}).optional(),
});

const metricsRoutes: FastifyPluginAsync = async (fastify) => {
  // Get project metrics
  fastify.get(
    '/:projectId',
    {
      onRequest: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          properties: {
            projectId: { type: 'string' },
          },
        },
        querystring: {
          type: 'object',
          properties: {
            startDate: { type: 'string' },
            endDate: { type: 'string' },
            metricType: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              summary: {
                type: 'object',
                properties: {
                  presenceScore: { type: 'number' },
                  pickRate: { type: 'number' },
                  snippetPassRate: { type: 'number' },
                  citationCoverage: { type: 'number' },
                  totalRuns: { type: 'number' },
                },
              },
              timeSeries: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    time: { type: 'string' },
                    metricType: { type: 'string' },
                    value: { type: 'number' },
                  },
                },
              },
              competitors: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    pickRate: { type: 'number' },
                    mentions: { type: 'number' },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { projectId } = request.params as { projectId: string };
      const { startDate, endDate, metricType, granularity: _granularity = 'day' } = request.query as any;
      const { organizationId, role } = request.user!;

      // Check permission
      if (!hasPermission(role, Permission.REPORT_VIEW)) {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'You do not have permission to view metrics',
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

      // Build date filter
      const dateFilter: any = {};
      if (startDate) {
        dateFilter.gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.lte = new Date(endDate);
      }

      // Get metrics from database
      const metrics = await fastify.prisma.metric.findMany({
        where: {
          projectId,
          ...(Object.keys(dateFilter).length > 0 && { time: dateFilter }),
          ...(metricType && { metricType }),
        },
        orderBy: {
          time: 'asc',
        },
      });

      // Calculate summary statistics
      const [totalRuns, totalQueries, completedSessions] = await Promise.all([
        fastify.prisma.runResult.count({
          where: {
            session: {
              projectId,
            },
          },
        }),
        fastify.prisma.query.count({
          where: { projectId },
        }),
        fastify.prisma.runSession.count({
          where: {
            projectId,
            status: 'COMPLETED',
          },
        }),
      ]);

      // Calculate metrics by type
      const metricsByType = metrics.reduce((acc, metric) => {
        if (!acc[metric.metricType]) {
          acc[metric.metricType] = [];
        }
        acc[metric.metricType].push(metric.value);
        return acc;
      }, {} as Record<string, number[]>);

      const calculateAverage = (values: number[]) =>
        values.length > 0 ? values.reduce((sum, v) => sum + v, 0) / values.length : 0;

      const presenceScore = calculateAverage(metricsByType.presence || []);
      const pickRate = calculateAverage(metricsByType.pick_rate || []);
      const snippetPassRate = calculateAverage(metricsByType.snippet_health || []);
      const citationCoverage = calculateAverage(metricsByType.citations || []);

      // Get competitor mentions from run results
      const competitorMentions = await fastify.prisma.runResult.findMany({
        where: {
          session: {
            projectId,
          },
          mentions: {
            not: {
              equals: [],
            },
          },
        },
        select: {
          mentions: true,
        },
      });

      // Process competitor data
      const competitorStats = project.competitors.map((competitor) => {
        const mentions = competitorMentions.filter(result =>
          result.mentions.some(mention =>
            mention.toLowerCase().includes(competitor.toLowerCase())
          )
        ).length;

        return {
          name: competitor,
          pickRate: mentions > 0 ? mentions / totalRuns : 0,
          mentions,
        };
      });

      return {
        summary: {
          presenceScore: Number(presenceScore.toFixed(3)),
          pickRate: Number(pickRate.toFixed(3)),
          snippetPassRate: Number(snippetPassRate.toFixed(3)),
          citationCoverage: Number(citationCoverage.toFixed(3)),
          totalRuns,
          totalQueries,
          completedSessions,
        },
        timeSeries: metrics.map((m) => ({
          time: m.time.toISOString(),
          metricType: m.metricType,
          value: m.value,
        })),
        competitors: competitorStats,
      };
    }
  );

  // Get comparative metrics
  fastify.get(
    '/:projectId/comparison',
    {
      onRequest: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          properties: {
            projectId: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              tasks: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    task: { type: 'string' },
                    ourScore: { type: 'number' },
                    competitors: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          name: { type: 'string' },
                          score: { type: 'number' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { projectId } = request.params as { projectId: string };
      const { organizationId, role } = request.user!;

      // Check permission
      if (!hasPermission(role, Permission.REPORT_VIEW)) {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'You do not have permission to view comparative metrics',
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

      // Get actual comparative data from queries and results
      const queries = await fastify.prisma.query.findMany({
        where: { projectId },
        include: {
          results: {
            select: {
              mentions: true,
              citations: true,
              responseText: true,
            },
          },
        },
        take: 10, // Limit for performance
      });

      const tasks = await Promise.all(
        queries.map(async (query) => {
          // Calculate our score based on mentions in results
          const ourMentions = query.results.filter(result =>
            result.mentions.length > 0
          ).length;
          const ourScore = query.results.length > 0 ? ourMentions / query.results.length : 0;

          // Calculate competitor scores
          const competitorScores = project.competitors.map(competitor => {
            const competitorMentions = query.results.filter(result =>
              result.responseText.toLowerCase().includes(competitor.toLowerCase()) ||
              result.mentions.some(mention =>
                mention.toLowerCase().includes(competitor.toLowerCase())
              )
            ).length;

            return {
              name: competitor,
              score: query.results.length > 0 ? competitorMentions / query.results.length : 0,
            };
          });

          return {
            task: query.text.substring(0, 50) + (query.text.length > 50 ? '...' : ''),
            ourScore: Number(ourScore.toFixed(3)),
            competitors: competitorScores.map(comp => ({
              ...comp,
              score: Number(comp.score.toFixed(3)),
            })),
          };
        })
      );

      return { tasks };
    }
  );

  // Create metric (for internal use by analytics service)
  fastify.post<{ Body: z.infer<typeof createMetricSchema> }>(
    '/',
    {
      onRequest: [fastify.authenticate],
      schema: {
        body: createMetricSchema,
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              projectId: { type: 'string' },
              metricType: { type: 'string' },
              value: { type: 'number' },
              time: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { organizationId, role } = request.user!;
      const { projectId, metricType, value, metadata } = request.body;

      // Check permission (only admins and above can create metrics)
      if (!hasPermission(role, Permission.PROJECT_EDIT)) {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'You do not have permission to create metrics',
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

      const metric = await fastify.prisma.metric.create({
        data: {
          projectId,
          metricType,
          value,
          time: new Date(),
          metadata: metadata || {},
        },
      });

      return reply.status(201).send(metric);
    }
  );

  // Get aggregated metrics across all projects (org-level)
  fastify.get(
    '/organization/summary',
    {
      onRequest: [fastify.authenticate],
      schema: {
        querystring: {
          type: 'object',
          properties: {
            startDate: { type: 'string' },
            endDate: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              totalProjects: { type: 'number' },
              totalQueries: { type: 'number' },
              totalRuns: { type: 'number' },
              avgPresenceScore: { type: 'number' },
              avgPickRate: { type: 'number' },
              projectBreakdown: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    projectId: { type: 'string' },
                    projectName: { type: 'string' },
                    presenceScore: { type: 'number' },
                    pickRate: { type: 'number' },
                    totalQueries: { type: 'number' },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { organizationId, role } = request.user!;
      const { startDate, endDate } = request.query as any;

      // Check permission
      if (!hasPermission(role, Permission.ORG_VIEW)) {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'You do not have permission to view organization metrics',
        });
      }

      // Build date filter
      const dateFilter: any = {};
      if (startDate) {
        dateFilter.gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.lte = new Date(endDate);
      }

      // Get organization projects and their metrics
      const projects = await fastify.prisma.project.findMany({
        where: {
          organizationId,
          isActive: true,
        },
        include: {
          _count: {
            select: {
              queries: true,
              runSessions: true,
            },
          },
          metrics: {
            where: {
              ...(Object.keys(dateFilter).length > 0 && { time: dateFilter }),
            },
          },
        },
      });

      // Calculate aggregated metrics
      const projectBreakdown = projects.map(project => {
        const presenceMetrics = project.metrics.filter(m => m.metricType === 'presence');
        const pickRateMetrics = project.metrics.filter(m => m.metricType === 'pick_rate');

        const presenceScore = presenceMetrics.length > 0
          ? presenceMetrics.reduce((sum, m) => sum + m.value, 0) / presenceMetrics.length
          : 0;

        const pickRate = pickRateMetrics.length > 0
          ? pickRateMetrics.reduce((sum, m) => sum + m.value, 0) / pickRateMetrics.length
          : 0;

        return {
          projectId: project.id,
          projectName: project.name,
          presenceScore: Number(presenceScore.toFixed(3)),
          pickRate: Number(pickRate.toFixed(3)),
          totalQueries: project._count.queries,
        };
      });

      const totalProjects = projects.length;
      const totalQueries = projects.reduce((sum, p) => sum + p._count.queries, 0);
      const totalRuns = projects.reduce((sum, p) => sum + p._count.runSessions, 0);

      const avgPresenceScore = projectBreakdown.length > 0
        ? projectBreakdown.reduce((sum, p) => sum + p.presenceScore, 0) / projectBreakdown.length
        : 0;

      const avgPickRate = projectBreakdown.length > 0
        ? projectBreakdown.reduce((sum, p) => sum + p.pickRate, 0) / projectBreakdown.length
        : 0;

      return {
        totalProjects,
        totalQueries,
        totalRuns,
        avgPresenceScore: Number(avgPresenceScore.toFixed(3)),
        avgPickRate: Number(avgPickRate.toFixed(3)),
        projectBreakdown,
      };
    }
  );

  // Real-time metrics endpoint
  fastify.get(
    '/:projectId/realtime',
    {
      onRequest: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          properties: {
            projectId: { type: 'string' },
          },
        },
        querystring: {
          type: 'object',
          properties: {
            hours: { type: 'number', minimum: 1, maximum: 168, default: 24 },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              metrics: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    metricType: { type: 'string' },
                    value: { type: 'number' },
                    metadata: { type: 'object' },
                  },
                },
              },
              competitorMetrics: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    mentions: { type: 'number' },
                    recommendations: { type: 'number' },
                    pickRate: { type: 'number' },
                    mentionRate: { type: 'number' },
                  },
                },
              },
              timeRange: {
                type: 'object',
                properties: {
                  start: { type: 'string' },
                  end: { type: 'string' },
                  hours: { type: 'number' },
                },
              },
              totalResults: { type: 'number' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { projectId } = request.params as { projectId: string };
      const { hours = 24 } = request.query as { hours?: number };
      const { organizationId, role } = request.user!;

      // Check permission
      if (!hasPermission(role, Permission.REPORT_VIEW)) {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'You do not have permission to view real-time metrics',
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

      try {
        const metricsCollector = new MetricsCollector(fastify.prisma);
        const realtimeMetrics = await metricsCollector.calculateRealtimeMetrics(projectId, hours);

        return realtimeMetrics;
      } catch (error) {
        fastify.log.error('Failed to calculate real-time metrics:', error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to calculate real-time metrics',
        });
      }
    }
  );

  // Process session metrics endpoint
  fastify.post(
    '/sessions/:sessionId/process',
    {
      onRequest: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          properties: {
            sessionId: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { sessionId } = request.params as { sessionId: string };
      const { organizationId, role } = request.user!;

      // Check permission
      if (!hasPermission(role, Permission.QUERY_RUN)) {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'You do not have permission to process metrics',
        });
      }

      // Verify session ownership
      const session = await fastify.prisma.runSession.findFirst({
        where: {
          id: sessionId,
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

      try {
        const metricsCollector = new MetricsCollector(fastify.prisma);
        await metricsCollector.processCompletedSession(sessionId);

        return {
          success: true,
          message: 'Metrics processed successfully',
        };
      } catch (error) {
        fastify.log.error('Failed to process session metrics:', error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to process session metrics',
        });
      }
    }
  );
};

export { metricsRoutes };