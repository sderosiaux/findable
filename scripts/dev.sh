#!/bin/bash

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_step() {
    echo -e "${GREEN}[DEV]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_step "🚀 Starting Findable development environment..."

# Check if .env exists
if [ ! -f .env ]; then
    print_warning ".env file not found. Creating from .env.example..."
    cp .env.example .env
    print_warning "Please update .env with your configuration"
fi

# Start Docker services
print_step "Starting Docker services (PostgreSQL & Redis)..."
docker-compose up -d postgres redis

# Wait for services to be ready
print_step "Waiting for services to be ready..."
sleep 3

# Generate Prisma client and run migrations
print_step "Setting up database..."
cd packages/database
npx prisma generate
npx prisma migrate dev --name init || echo "Migrations already applied"
cd ../..

# Start development servers
print_step "Starting development servers..."
npm run dev