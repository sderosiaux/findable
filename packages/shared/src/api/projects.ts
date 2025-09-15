import { ApiClient } from './client';
import type {
  Project,
  CreateProjectRequest,
  UpdateProjectRequest
} from './types';

export class ProjectsApi {
  constructor(private client: ApiClient) {}

  async getProjects() {
    return this.client.get<Project[]>('/api/projects');
  }

  async getProject(id: string) {
    return this.client.get<Project>(`/api/projects/${id}`);
  }

  async createProject(data: CreateProjectRequest) {
    return this.client.post<Project>('/api/projects', data);
  }

  async updateProject(id: string, data: UpdateProjectRequest) {
    return this.client.patch<Project>(`/api/projects/${id}`, data);
  }

  async deleteProject(id: string) {
    return this.client.delete(`/api/projects/${id}`);
  }
}