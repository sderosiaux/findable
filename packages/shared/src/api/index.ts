import { ApiClient } from './client';
import { AuthApi } from './auth';
import { ProjectsApi } from './projects';
import { QueriesApi } from './queries';
import { MetricsApi } from './metrics';
import { OrganizationsApi } from './organizations';

export * from './types';
export * from './client';
export * from './auth';
export * from './projects';
export * from './queries';
export * from './metrics';
export * from './organizations';

export interface FindableApiConfig {
  baseUrl: string;
  getToken?: () => string | null;
  onUnauthorized?: () => void;
}

export class FindableApi {
  public client: ApiClient;
  public auth: AuthApi;
  public projects: ProjectsApi;
  public queries: QueriesApi;
  public metrics: MetricsApi;
  public organizations: OrganizationsApi;

  constructor(config: FindableApiConfig) {
    this.client = new ApiClient(config);

    this.auth = new AuthApi(this.client);
    this.projects = new ProjectsApi(this.client);
    this.queries = new QueriesApi(this.client);
    this.metrics = new MetricsApi(this.client);
    this.organizations = new OrganizationsApi(this.client);
  }
}

// Factory function for easy instantiation
export function createFindableApi(config: FindableApiConfig): FindableApi {
  return new FindableApi(config);
}