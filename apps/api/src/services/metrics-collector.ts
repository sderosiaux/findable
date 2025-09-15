/**
 * Metrics Collection Service
 * Automatically collects and stores metrics from completed query sessions
 */

import { PrismaClient } from '@findable/database';
import { MetricsCalculator, RunResult, Project } from '@findable/shared';

export class MetricsCollector {
  constructor(private prisma: PrismaClient) {}

  /**
   * Process a completed session and generate metrics
   */
  async processCompletedSession(sessionId: string): Promise<void> {
    try {
      // Get session details
      const session = await this.prisma.runSession.findUnique({
        where: { id: sessionId },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              domain: true,
              competitors: true,
              keywords: true,
            },
          },
          results: {
            include: {
              model: {
                select: {
                  name: true,
                  provider: true,
                },
              },
            },
          },
        },
      });

      if (!session || session.status !== 'COMPLETED') {
        throw new Error(`Session ${sessionId} not found or not completed`);
      }

      // Transform results for metrics calculation
      const results: RunResult[] = session.results.map(result => ({
        id: result.id,
        queryText: result.queryText,
        responseText: result.responseText,
        citations: Array.isArray(result.citations) ? result.citations : [],
        extractedSnippets: Array.isArray(result.extractedSnippets) ? result.extractedSnippets : [],
        mentions: Array.isArray(result.mentions) ? result.mentions : [],
        executionTimeMs: result.executionTimeMs,
        surface: result.surface,
        model: result.model,
      }));

      const project: Project = {
        id: session.project.id,
        name: session.project.name,
        domain: session.project.domain,
        competitors: Array.isArray(session.project.competitors) ? session.project.competitors : [],
        keywords: Array.isArray(session.project.keywords) ? session.project.keywords : [],
      };

      // Calculate metrics
      const metrics = MetricsCalculator.calculateAllMetrics(results, project);
      const timestamp = new Date();

      // Store metrics in database
      await this.prisma.$transaction(async (tx) => {
        for (const metric of metrics) {
          await tx.metric.create({
            data: {
              projectId: project.id,
              metricType: metric.metricType,
              value: metric.value,
              time: timestamp,
              metadata: metric.metadata,
            },
          });
        }

        // Update session with metrics processed flag
        await tx.runSession.update({
          where: { id: sessionId },
          data: {
            metadata: {
              ...session.metadata,
              metricsProcessed: true,
              metricsGeneratedAt: timestamp.toISOString(),
            },
          },
        });
      });

      console.log(`Metrics generated for session ${sessionId}:`, metrics);
    } catch (error) {
      console.error(`Failed to process metrics for session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Process metrics for all completed sessions that haven't been processed
   */
  async processUnprocessedSessions(): Promise<void> {
    try {
      // Find completed sessions without metrics
      const unprocessedSessions = await this.prisma.runSession.findMany({
        where: {
          status: 'COMPLETED',
          OR: [
            {
              metadata: {
                path: ['metricsProcessed'],
                equals: false,
              },
            },
            {
              metadata: {
                path: ['metricsProcessed'],
                equals: null,
              },
            },
          ],
        },
        select: {
          id: true,
        },
        take: 10, // Process in batches
      });

      console.log(`Processing ${unprocessedSessions.length} unprocessed sessions`);

      for (const session of unprocessedSessions) {
        try {
          await this.processCompletedSession(session.id);
        } catch (error) {
          console.error(`Failed to process session ${session.id}:`, error);
          // Continue with other sessions
        }
      }
    } catch (error) {
      console.error('Failed to process unprocessed sessions:', error);
      throw error;
    }
  }

  /**
   * Calculate real-time metrics for a project
   */
  async calculateRealtimeMetrics(projectId: string, hours: number = 24) {
    try {
      const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);

      // Get recent results
      const recentResults = await this.prisma.runResult.findMany({
        where: {
          session: {
            projectId,
            status: 'COMPLETED',
            completedAt: {
              gte: startTime,
            },
          },
        },
        include: {
          model: {
            select: {
              name: true,
              provider: true,
            },
          },
        },
      });

      // Get project details
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
        select: {
          id: true,
          name: true,
          domain: true,
          competitors: true,
          keywords: true,
        },
      });

      if (!project) {
        throw new Error(`Project ${projectId} not found`);
      }

      // Transform and calculate metrics
      const results: RunResult[] = recentResults.map(result => ({
        id: result.id,
        queryText: result.queryText,
        responseText: result.responseText,
        citations: Array.isArray(result.citations) ? result.citations : [],
        extractedSnippets: Array.isArray(result.extractedSnippets) ? result.extractedSnippets : [],
        mentions: Array.isArray(result.mentions) ? result.mentions : [],
        executionTimeMs: result.executionTimeMs,
        surface: result.surface,
        model: result.model,
      }));

      const projectData: Project = {
        id: project.id,
        name: project.name,
        domain: project.domain,
        competitors: Array.isArray(project.competitors) ? project.competitors : [],
        keywords: Array.isArray(project.keywords) ? project.keywords : [],
      };

      const metrics = MetricsCalculator.calculateAllMetrics(results, projectData);
      const competitorMetrics = MetricsCalculator.calculateCompetitorMetrics(results, projectData);

      return {
        metrics,
        competitorMetrics,
        timeRange: {
          start: startTime,
          end: new Date(),
          hours,
        },
        totalResults: results.length,
      };
    } catch (error) {
      console.error(`Failed to calculate realtime metrics for project ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * Schedule automatic metrics processing
   */
  startAutomaticProcessing(intervalMinutes: number = 5): NodeJS.Timer {
    console.log(`Starting automatic metrics processing every ${intervalMinutes} minutes`);

    return setInterval(async () => {
      try {
        await this.processUnprocessedSessions();
      } catch (error) {
        console.error('Automatic metrics processing failed:', error);
      }
    }, intervalMinutes * 60 * 1000);
  }
}