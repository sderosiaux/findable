# Findable 🔍

> AI SEO for products and platforms. Measure how models see you. Fix gaps. Win the pick at the moment of query.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20-green)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

## 🎯 What is Findable?

In an era where AI assistants are the new gatekeepers to user decisions, **if AI doesn't mention you, you don't exist**.

Findable is the first AI SEO platform that:
- 📊 **Measures** how AI models perceive your product
- ✅ **Validates** that AI-generated code actually works
- 🏆 **Tracks** competitive positioning in real-time
- 📈 **Provides** actionable playbooks for improvement
- 🔧 **Generates** standard files (llms.txt, OpenAPI, MCP)

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/sderosiaux/findable.git
cd findable

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run database migrations
npm run db:migrate

# Start development servers
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the dashboard.

## 🏗️ Architecture

Findable uses a modern microservices architecture:

```
┌─────────────────────────────────────────┐
│         Next.js Frontend (Web)          │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│         Node.js API Gateway             │
└────────────────┬────────────────────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
┌───▼───┐  ┌────▼────┐  ┌────▼────┐
│Runner │  │Executor │  │ Parser  │
│Service│  │Service  │  │Service  │
└───────┘  └─────────┘  └─────────┘
    │            │            │
    └────────────┼────────────┘
                 │
         ┌───────▼───────┐
         │  PostgreSQL   │
         │  TimescaleDB  │
         └───────────────┘
```

## 📦 Project Structure

```
findable/
├── apps/
│   ├── web/              # Next.js frontend
│   └── api/              # Node.js API gateway
├── services/
│   ├── runner/           # AI query execution
│   ├── executor/         # Code validation
│   ├── parser/           # Response analysis
│   └── collector/        # Web scraping
├── packages/
│   ├── shared/           # Shared utilities
│   ├── database/         # Database schemas
│   └── ui/               # UI components
└── docker/               # Docker configs
```

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Fastify, TypeScript, Python (services)
- **Database**: PostgreSQL, TimescaleDB, Redis
- **Infrastructure**: Docker, Kubernetes, AWS
- **AI Integration**: OpenAI, Anthropic, Perplexity APIs

## 📊 Key Features

### 🎯 AI Findability Score
Track how often your product appears in AI responses across different models and queries.

### 🏃 Code Execution Validation
Automatically validate that AI-generated code snippets actually work in sandboxed environments.

### 🥊 Competitive Analysis
Monitor how you rank against competitors in AI recommendations.

### 📋 Playbook Generation
Get AI-powered recommendations for improving your findability.

### 🔍 Surface Monitoring
Track standard files like `/llms.txt`, OpenAPI specs, and MCP servers.

## 🧪 Development

```bash
# Run tests
npm run test

# Type checking
npm run typecheck

# Linting
npm run lint

# Format code
npm run format

# Build all packages
npm run build
```

## 🐳 Docker Support

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 📚 Documentation

- [Implementation Plan](IMPLEMENTATION_PLAN.md)
- [Testing & CI/CD Strategy](TESTING_CICD_STRATEGY.md)
- [Executive Summary](EXECUTIVE_SUMMARY.md)
- [API Documentation](docs/API.md) (coming soon)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📈 Roadmap

### Phase 1: MVP (Weeks 1-4) ✅
- [x] Project setup and infrastructure
- [ ] Basic query runner for AI models
- [ ] Simple scoring system
- [ ] Dashboard UI

### Phase 2: Core Features (Weeks 5-8)
- [ ] Sandboxed code execution
- [ ] Advanced parsing with NLP
- [ ] Time-series metrics
- [ ] Scheduled monitoring

### Phase 3: Advanced (Weeks 9-12)
- [ ] Competitive benchmarking
- [ ] Playbook generation
- [ ] MCP/OpenAPI validation
- [ ] Multi-tenancy

### Phase 4: Enterprise (Weeks 13-16)
- [ ] SSO/SAML integration
- [ ] Custom query sets
- [ ] API access
- [ ] White-label options

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

Built with ❤️ by the Findable team.

---

**"If an AI can't find you, do you even exist?"**

[Website](https://findable.ai) | [Documentation](https://docs.findable.ai) | [API](https://api.findable.ai)