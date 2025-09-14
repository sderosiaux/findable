import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

const getMetricsSchema = z.object({
  projectId: z.string(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  metricType: z.enum(['presence', 'pick_rate', 'snippet_health', 'citations']).optional(),
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
      const { startDate, endDate, metricType } = request.query as any;

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
      const totalRuns = await fastify.prisma.runResult.count({
        where: {
          session: {
            projectId,
          },
        },
      });

      // Calculate presence score (simplified for now)
      const presenceMetrics = metrics.filter((m) => m.metricType === 'presence');
      const presenceScore =
        presenceMetrics.length > 0
          ? presenceMetrics.reduce((sum, m) => sum + m.value, 0) / presenceMetrics.length
          : 0;

      // Calculate other metrics (simplified)
      const pickRateMetrics = metrics.filter((m) => m.metricType === 'pick_rate');
      const pickRate =
        pickRateMetrics.length > 0
          ? pickRateMetrics.reduce((sum, m) => sum + m.value, 0) / pickRateMetrics.length
          : 0;

      // Mock competitor data (in production, this would be calculated from actual data)
      const competitors = project.competitors.map((name) => ({
        name,
        pickRate: Math.random() * 0.5,
        mentions: Math.floor(Math.random() * 100),
      }));

      return {
        summary: {
          presenceScore,
          pickRate,
          snippetPassRate: 0.85, // Mock value
          citationCoverage: 0.72, // Mock value
          totalRuns,
        },
        timeSeries: metrics.map((m) => ({
          time: m.time.toISOString(),
          metricType: m.metricType,
          value: m.value,
        })),
        competitors,
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

      // Mock comparative data (in production, this would be calculated from actual runs)
      const tasks = [
        {
          task: 'Send transactional email',
          ourScore: 0.75,
          competitors: project.competitors.map((name) => ({
            name,
            score: Math.random(),
          })),
        },
        {
          task: 'Authentication setup',
          ourScore: 0.82,
          competitors: project.competitors.map((name) => ({
            name,
            score: Math.random(),
          })),
        },
        {
          task: 'API integration',
          ourScore: 0.68,
          competitors: project.competitors.map((name) => ({
            name,
            score: Math.random(),
          })),
        },
      ];

      return { tasks };
    }
  );
};

export { metricsRoutes };