import { ApiClient } from '@findable/shared/api/client';

const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
};

const onUnauthorized = (): void => {
  if (typeof window === 'undefined') return;

  localStorage.removeItem('auth_token');
  window.location.href = '/login';
};

export const apiClient = new ApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  getToken,
  onUnauthorized,
});

// Export configured API methods
export const api = {
  // Auth
  login: (credentials: { email: string; password: string }) =>
    apiClient.post('/auth/login', credentials),

  signup: (userData: { email: string; password: string; firstName: string; lastName: string; organizationName: string }) =>
    apiClient.post('/auth/signup', userData),

  logout: () => apiClient.post('/auth/logout'),

  me: () => apiClient.get('/auth/me'),

  // Projects
  getProjects: () => apiClient.get('/projects'),

  createProject: (data: { name: string; domain: string; description?: string }) =>
    apiClient.post('/projects', data),

  getProject: (id: string) => apiClient.get(`/projects/${id}`),

  updateProject: (id: string, data: Partial<{ name: string; domain: string; description: string }>) =>
    apiClient.patch(`/projects/${id}`, data),

  deleteProject: (id: string) => apiClient.delete(`/projects/${id}`),

  // Queries
  getQueries: (projectId: string) => apiClient.get(`/queries?projectId=${projectId}`),

  createQuery: (data: { projectId: string; content: string; models: string[]; surfaces: string[] }) =>
    apiClient.post('/queries', data),

  runQuery: (queryId: string) => apiClient.post(`/queries/${queryId}/run`),

  // Metrics
  getMetrics: (projectId: string, params?: { startDate?: string; endDate?: string; metricType?: string }) => {
    const query = new URLSearchParams();
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    if (params?.metricType) query.set('metricType', params.metricType);

    const queryString = query.toString();
    return apiClient.get(`/metrics/${projectId}${queryString ? `?${queryString}` : ''}`);
  },

  // Organizations
  getOrganization: () => apiClient.get('/organizations/me'),

  updateOrganization: (data: Partial<{ name: string; domain: string }>) =>
    apiClient.patch('/organizations/me', data),
};