// User and Auth types
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  organization: Organization;
}

export interface Organization {
  id: string;
  name: string;
  plan: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    organizationId: string;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  organizationName: string;
}

// Project types
export interface Project {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  oneLiner?: string;
  competitors: string[];
  keywords: string[];
  settings: Record<string, any>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    queries: number;
    runSessions: number;
  };
}

export interface CreateProjectRequest {
  name: string;
  domain?: string;
  oneLiner?: string;
  competitors?: string[];
  keywords?: string[];
}

export interface UpdateProjectRequest {
  name?: string;
  domain?: string;
  oneLiner?: string;
  competitors?: string[];
  keywords?: string[];
  settings?: Record<string, any>;
  isActive?: boolean;
}

// Query types
export interface Query {
  id: string;
  projectId: string;
  text: string;
  category: 'product' | 'competitor' | 'brand' | 'general';
  tags: string[];
  createdAt: string;
  _count?: {
    results: number;
  };
}

export interface CreateQueryRequest {
  projectId: string;
  text: string;
  category?: 'product' | 'competitor' | 'brand' | 'general';
  tags?: string[];
}

export interface RunQueryRequest {
  projectId: string;
  queries: string[];
  models: string[];
  surfaces?: string[];
  priority?: 'low' | 'normal' | 'high';
}

export interface RunSession {
  id: string;
  projectId: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  priority: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  metadata: Record<string, any>;
  errorMessage?: string;
  _count?: {
    results: number;
  };
}

export interface RunResult {
  id: string;
  queryId: string;
  queryText: string;
  model: {
    id: string;
    name: string;
    provider: string;
  };
  responseText: string;
  citations: string[];
  extractedSnippets: string[];
  mentions: string[];
  executionTimeMs: number;
  surface: string;
  createdAt: string;
}

// Metrics types
export interface MetricsSummary {
  presenceScore: number;
  pickRate: number;
  snippetPassRate: number;
  citationCoverage: number;
  totalRuns: number;
  totalQueries: number;
  completedSessions: number;
}

export interface TimeSeriesMetric {
  time: string;
  metricType: string;
  value: number;
}

export interface CompetitorMetric {
  name: string;
  pickRate: number;
  mentions: number;
}

export interface ProjectMetrics {
  summary: MetricsSummary;
  timeSeries: TimeSeriesMetric[];
  competitors: CompetitorMetric[];
}

export interface ComparativeTask {
  task: string;
  ourScore: number;
  competitors: Array<{
    name: string;
    score: number;
  }>;
}

export interface ComparisonMetrics {
  tasks: ComparativeTask[];
}

// Pagination types
export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface PaginationResponse {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationResponse;
}

// Error types
export interface ApiError {
  message: string;
  code?: string;
}