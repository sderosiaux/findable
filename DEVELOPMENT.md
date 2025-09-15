# Findable Development Guide

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment:**
   ```bash
   npm run setup
   ```

3. **Start development servers:**
   ```bash
   npm run dev
   ```

## Project Structure

```
findable/
├── apps/
│   ├── api/          # Fastify backend API
│   └── web/          # Next.js frontend
├── packages/
│   ├── auth/         # Authentication utilities
│   ├── database/     # Prisma schema and migrations
│   ├── shared/       # Shared utilities and types
│   └── ui/           # React component library
└── services/
    ├── runner/       # AI query execution service
    ├── executor/     # Task execution service
    ├── parser/       # Response parsing service
    └── collector/    # Data collection service
```

## Available Scripts

### Development
- `npm run dev` - Start all development servers
- `npm run build` - Build all packages
- `npm run typecheck` - Run TypeScript checks
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

### Database
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with demo data
- `npm run db:studio` - Open Prisma Studio

### Docker
- `npm run docker:up` - Start PostgreSQL and Redis
- `npm run docker:down` - Stop containers

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Database
DATABASE_URL=postgresql://findable:findable123@localhost:5432/findable

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# API
PORT=3001
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long

# AI APIs (optional for development)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
PERPLEXITY_API_KEY=
```

## Demo Data

The setup script creates demo data including:
- Demo organization: "Acme Corporation"
- Demo user: `demo@findable.ai` / `demo123!`
- Sample project: "SendGrid Alternative"
- Mock metrics and queries

## API Documentation

Once running, visit:
- API Documentation: http://localhost:3001/documentation
- Prisma Studio: http://localhost:5555 (after running `npm run db:studio`)

## Troubleshooting

### TypeScript Errors
Some TypeScript errors in the API package are expected during development. Run:
```bash
npm run typecheck
```

### Database Connection Issues
Ensure PostgreSQL is running:
```bash
npm run docker:up
```

### Port Conflicts
Default ports:
- Frontend: 3000
- API: 3001
- PostgreSQL: 5432
- Redis: 6379

## Architecture

### Authentication
- JWT-based with access/refresh tokens
- Role-based permissions (OWNER, ADMIN, MEMBER, VIEWER)
- Secure password hashing with bcrypt

### Database
- PostgreSQL with TimescaleDB for metrics
- Prisma ORM for type-safe database access
- Comprehensive schema for organizations, projects, queries

### API Client
- Type-safe API client in `@findable/shared`
- Automatic token management
- Error handling and retry logic

### Query Execution
- Async processing with session tracking
- Support for multiple AI models
- Mock simulation for development

### Metrics Collection
- Time-series data storage
- Real-time analytics
- Competitor analysis and reporting