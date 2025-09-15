export const AI_MODELS = {
  GPT_4: 'gpt-4',
  GPT_35: 'gpt-3.5-turbo',
  CLAUDE_3: 'claude-3-opus-20240229',
  CLAUDE_35: 'claude-3-5-sonnet-20241022',
  PERPLEXITY: 'pplx-70b-online',
  GEMINI: 'gemini-pro',
} as const;

export const QUERY_TYPES = {
  SDK: 'sdk',
  ENTERPRISE: 'enterprise',
  CUSTOM: 'custom',
} as const;

export const METRIC_TYPES = {
  PRESENCE: 'presence',
  PICK_RATE: 'pick_rate',
  SNIPPET_HEALTH: 'snippet_health',
  CITATIONS: 'citations',
  VALUE_PROP_ALIGNMENT: 'value_prop_alignment',
  COMPARATIVE_SHARE: 'comparative_share',
} as const;

export const SURFACE_TYPES = {
  LLMS_TXT: 'llms_txt',
  OPENAPI: 'openapi',
  MCP: 'mcp',
  TERRAFORM: 'terraform',
  HELM: 'helm',
  README: 'readme',
  COMPARE: 'compare',
  FAQ: 'faq',
} as const;

export const RUN_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export const EXECUTION_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  SUCCESS: 'success',
  FAILED: 'failed',
  TIMEOUT: 'timeout',
} as const;

export const PLANS = {
  STARTER: {
    name: 'starter',
    projects: 10,
    queries: 1000,
    models: 3,
    price: 499,
  },
  GROWTH: {
    name: 'growth',
    projects: 50,
    queries: 10000,
    models: 5,
    price: 1499,
  },
  ENTERPRISE: {
    name: 'enterprise',
    projects: -1, // unlimited
    queries: -1,
    models: -1,
    price: null, // custom
  },
} as const;