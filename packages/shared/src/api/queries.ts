import { ApiClient } from './client';
import type {
  Query,
  CreateQueryRequest,
  RunQueryRequest,
  RunSession,
  RunResult,
  PaginatedResponse,
  PaginationParams
} from './types';

export class QueriesApi {
  constructor(private client: ApiClient) {}

  async getQueries(params: { projectId: string; category?: string } & PaginationParams) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    return this.client.get<{
      queries: Query[];
      pagination: PaginatedResponse<Query>['pagination'];
    }>(`/api/queries?${searchParams.toString()}`);
  }

  async createQuery(data: CreateQueryRequest) {
    return this.client.post<Query>('/api/queries', data);
  }

  async runQueries(data: RunQueryRequest) {
    return this.client.post<{
      sessionId: string;
      status: string;
      message: string;
    }>('/api/queries/run', data);
  }

  async getSession(sessionId: string) {
    return this.client.get<RunSession>(`/api/queries/sessions/${sessionId}`);
  }

  async getSessionResults(sessionId: string) {
    return this.client.get<RunResult[]>(`/api/queries/sessions/${sessionId}/results`);
  }

  async getSessions(params: { projectId: string; status?: string } & PaginationParams) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    return this.client.get<{
      sessions: RunSession[];
      pagination: PaginatedResponse<RunSession>['pagination'];
    }>(`/api/queries/sessions?${searchParams.toString()}`);
  }
}