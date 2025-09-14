-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create initial database schema
-- This will be replaced by Prisma migrations, but provides initial structure

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    plan VARCHAR(50) DEFAULT 'starter',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'MEMBER',
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    domain VARCHAR(255),
    one_liner TEXT,
    competitors JSONB DEFAULT '[]',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, slug)
);

-- Query sets table
CREATE TABLE IF NOT EXISTS query_sets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) CHECK (type IN ('sdk', 'enterprise', 'custom')),
    queries JSONB NOT NULL,
    version INTEGER DEFAULT 1,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI models table
CREATE TABLE IF NOT EXISTS ai_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    model_id VARCHAR(100) NOT NULL,
    api_config JSONB,
    rate_limits JSONB,
    active BOOLEAN DEFAULT true
);

-- Run sessions table
CREATE TABLE IF NOT EXISTS run_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    query_set_id UUID REFERENCES query_sets(id),
    status VARCHAR(50) DEFAULT 'pending',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'
);

-- Run results table
CREATE TABLE IF NOT EXISTS run_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES run_sessions(id) ON DELETE CASCADE,
    query_id VARCHAR(255) NOT NULL,
    model_id UUID REFERENCES ai_models(id),
    query_text TEXT NOT NULL,
    response_text TEXT,
    response_metadata JSONB,
    citations JSONB DEFAULT '[]',
    extracted_snippets JSONB DEFAULT '[]',
    mentions JSONB DEFAULT '[]',
    execution_time_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Metrics table (TimescaleDB hypertable)
CREATE TABLE IF NOT EXISTS metrics (
    time TIMESTAMPTZ NOT NULL,
    project_id UUID NOT NULL,
    metric_type VARCHAR(100) NOT NULL,
    dimensions JSONB DEFAULT '{}',
    value NUMERIC NOT NULL,
    metadata JSONB DEFAULT '{}'
);

-- Convert metrics to hypertable
SELECT create_hypertable('metrics', 'time', if_not_exists => TRUE);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_projects_organization ON projects(organization_id);
CREATE INDEX idx_run_results_session ON run_results(session_id);
CREATE INDEX idx_metrics_project_time ON metrics(project_id, time DESC);
CREATE INDEX idx_metrics_type_time ON metrics(metric_type, time DESC);

-- Insert default AI models
INSERT INTO ai_models (name, provider, model_id, api_config, active) VALUES
('GPT-4', 'openai', 'gpt-4', '{"temperature": 0.7}', true),
('GPT-3.5', 'openai', 'gpt-3.5-turbo', '{"temperature": 0.7}', true),
('Claude 3', 'anthropic', 'claude-3-opus', '{"temperature": 0.7}', true),
('Perplexity', 'perplexity', 'pplx-70b-online', '{"temperature": 0.7}', true)
ON CONFLICT DO NOTHING;