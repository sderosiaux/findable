import { AI_MODELS, QUERY_TYPES, METRIC_TYPES, SURFACE_TYPES, RUN_STATUS, EXECUTION_STATUS } from './constants';

export type AiModel = typeof AI_MODELS[keyof typeof AI_MODELS];
export type QueryType = typeof QUERY_TYPES[keyof typeof QUERY_TYPES];
export type MetricType = typeof METRIC_TYPES[keyof typeof METRIC_TYPES];
export type SurfaceType = typeof SURFACE_TYPES[keyof typeof SURFACE_TYPES];
export type RunStatus = typeof RUN_STATUS[keyof typeof RUN_STATUS];
export type ExecutionStatus = typeof EXECUTION_STATUS[keyof typeof EXECUTION_STATUS];

export interface User {
  id: string;
  email: string;
  name: string;
  organizationId: string;
  role: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  domain?: string;
  oneLiner?: string;
  competitors: string[];
  settings: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuerySet {
  id: string;
  projectId: string;
  name: string;
  type: QueryType;
  queries: string[];
  version: number;
  active: boolean;
  createdAt: Date;
}

export interface RunSession {
  id: string;
  projectId: string;
  querySetId?: string;
  status: RunStatus;
  startedAt?: Date;
  completedAt?: Date;
  metadata: Record<string, any>;
}

export interface RunResult {
  id: string;
  sessionId: string;
  queryId: string;
  modelId: string;
  queryText: string;
  responseText?: string;
  responseMetadata?: Record<string, any>;
  citations: Citation[];
  extractedSnippets: CodeSnippet[];
  mentions: string[];
  executionTimeMs?: number;
  createdAt: Date;
}

export interface Citation {
  url: string;
  title?: string;
  domain: string;
  relevance?: number;
}

export interface CodeSnippet {
  language: string;
  code: string;
  startLine?: number;
  endLine?: number;
  confidence?: number;
}

export interface Metric {
  id: string;
  time: Date;
  projectId: string;
  metricType: MetricType;
  value: number;
  dimensions: Record<string, any>;
  metadata: Record<string, any>;
}

export interface SurfaceStatus {
  id: string;
  projectId: string;
  surfaceType: SurfaceType;
  url?: string;
  status?: string;
  validationResults?: Record<string, any>;
  lastCheckedAt?: Date;
  contentHash?: string;
}

export interface Playbook {
  id: string;
  projectId: string;
  type: string;
  priority: number;
  title: string;
  description?: string;
  actions: PlaybookAction[];
  status: string;
  createdAt: Date;
}

export interface PlaybookAction {
  type: string;
  title: string;
  description?: string;
  targetUrl?: string;
  template?: string;
  automated: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}