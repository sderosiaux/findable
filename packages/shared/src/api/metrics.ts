import { ApiClient } from './client';
import type {
  ProjectMetrics,
  ComparisonMetrics
} from './types';

export class MetricsApi {
  constructor(private client: ApiClient) {}

  async getProjectMetrics(projectId: string, params?: {
    startDate?: string;
    endDate?: string;
    metricType?: string;
    granularity?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) {
          searchParams.append(key, value);
        }
      });
    }

    const query = searchParams.toString();
    const url = `/api/metrics/${projectId}${query ? `?${query}` : ''}`;

    return this.client.get<ProjectMetrics>(url);
  }

  async getComparisonMetrics(projectId: string) {
    return this.client.get<ComparisonMetrics>(`/api/metrics/${projectId}/comparison`);
  }

  async getOrganizationSummary(params?: {
    startDate?: string;
    endDate?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) {
          searchParams.append(key, value);
        }
      });
    }

    const query = searchParams.toString();
    const url = `/api/metrics/organization/summary${query ? `?${query}` : ''}`;

    return this.client.get<{
      totalProjects: number;
      totalQueries: number;
      totalRuns: number;
      avgPresenceScore: number;
      avgPickRate: number;
      projectBreakdown: Array<{
        projectId: string;
        projectName: string;
        presenceScore: number;
        pickRate: number;
        totalQueries: number;
      }>;
    }>(url);
  }
}