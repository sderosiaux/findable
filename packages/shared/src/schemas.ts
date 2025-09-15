import { z } from 'zod';
import { AI_MODELS, QUERY_TYPES, METRIC_TYPES, SURFACE_TYPES } from './constants';

// Auth schemas
export const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  organizationName: z.string().min(2, 'Organization name must be at least 2 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Project schemas
export const createProjectSchema = z.object({
  name: z.string().min(2, 'Project name must be at least 2 characters'),
  domain: z.string().url('Invalid URL').optional(),
  oneLiner: z.string().max(200, 'One-liner must be 200 characters or less').optional(),
  competitors: z.array(z.string()).optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

// Query schemas
export const createQuerySetSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(2),
  type: z.enum([QUERY_TYPES.SDK, QUERY_TYPES.ENTERPRISE, QUERY_TYPES.CUSTOM]),
  queries: z.array(z.string()).min(1, 'At least one query is required'),
});

export const runQuerySchema = z.object({
  projectId: z.string().uuid(),
  queries: z.array(z.string()).min(1),
  models: z.array(z.enum([
    AI_MODELS.GPT_4,
    AI_MODELS.GPT_35,
    AI_MODELS.CLAUDE_3,
    AI_MODELS.CLAUDE_35,
    AI_MODELS.PERPLEXITY,
    AI_MODELS.GEMINI,
  ])),
  runCount: z.number().int().min(1).max(10).default(1),
});

// Metrics schemas
export const getMetricsSchema = z.object({
  projectId: z.string().uuid(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  metricType: z.enum([
    METRIC_TYPES.PRESENCE,
    METRIC_TYPES.PICK_RATE,
    METRIC_TYPES.SNIPPET_HEALTH,
    METRIC_TYPES.CITATIONS,
  ]).optional(),
  interval: z.enum(['hour', 'day', 'week', 'month']).optional(),
});

// Surface schemas
export const validateSurfaceSchema = z.object({
  projectId: z.string().uuid(),
  surfaceType: z.enum([
    SURFACE_TYPES.LLMS_TXT,
    SURFACE_TYPES.OPENAPI,
    SURFACE_TYPES.MCP,
    SURFACE_TYPES.TERRAFORM,
    SURFACE_TYPES.HELM,
  ]),
  url: z.string().url(),
});

// Playbook schemas
export const createPlaybookSchema = z.object({
  projectId: z.string().uuid(),
  type: z.string(),
  priority: z.number().int().min(0).max(10),
  title: z.string().min(2),
  description: z.string().optional(),
  actions: z.array(z.object({
    type: z.string(),
    title: z.string(),
    description: z.string().optional(),
    targetUrl: z.string().url().optional(),
    template: z.string().optional(),
    automated: z.boolean().default(false),
  })),
});

// Validation helpers
export type SignupRequest = z.infer<typeof signupSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;
export type CreateProjectRequest = z.infer<typeof createProjectSchema>;
export type UpdateProjectRequest = z.infer<typeof updateProjectSchema>;
export type CreateQuerySetRequest = z.infer<typeof createQuerySetSchema>;
export type RunQueryRequest = z.infer<typeof runQuerySchema>;
export type GetMetricsRequest = z.infer<typeof getMetricsSchema>;
export type ValidateSurfaceRequest = z.infer<typeof validateSurfaceSchema>;
export type CreatePlaybookRequest = z.infer<typeof createPlaybookSchema>;