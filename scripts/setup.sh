#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
    echo -e "${GREEN}[SETUP]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if running on macOS or Linux
OS="$(uname -s)"
case "${OS}" in
    Linux*)     MACHINE=Linux;;
    Darwin*)    MACHINE=Mac;;
    *)          MACHINE="UNKNOWN:${OS}"
esac

print_step "🚀 Starting Findable development setup on ${MACHINE}..."

# Check for required tools
print_step "Checking required tools..."

check_command() {
    if ! command -v $1 &> /dev/null; then
        print_error "$1 is not installed. Please install it first."
        exit 1
    else
        print_step "✓ $1 is installed"
    fi
}

check_command node
check_command npm
check_command docker
check_command python3

# Check Node.js version
NODE_VERSION=$(node --version | cut -d. -f1 | sed 's/v//')
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version must be 18 or higher. Current version: $(node --version)"
    exit 1
fi

# Check Python version
PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d. -f1,2)
REQUIRED_PYTHON="3.11"
if [ "$(echo "$PYTHON_VERSION < $REQUIRED_PYTHON" | bc)" -eq 1 ]; then
    print_warning "Python version should be 3.11 or higher. Current version: $PYTHON_VERSION"
fi

# Create environment file if it doesn't exist
print_step "Setting up environment configuration..."
if [ ! -f .env ]; then
    cp .env.example .env
    print_step "Created .env file from .env.example"
    print_warning "Please update .env with your configuration values"
else
    print_step ".env file already exists"
fi

# Install Node dependencies
print_step "Installing Node.js dependencies..."
npm install

# Install Python dependencies for services
print_step "Installing Python dependencies..."
cd services/runner && pip3 install -r requirements.txt && cd ../..
cd services/executor && pip3 install -r requirements.txt && cd ../..
cd services/parser && pip3 install -r requirements.txt && cd ../..
cd services/collector && pip3 install -r requirements.txt && cd ../..

# Setup database
print_step "Setting up database..."
if docker ps | grep -q postgres-findable; then
    print_step "PostgreSQL container is already running"
else
    docker-compose up -d postgres redis
    print_step "Started PostgreSQL and Redis containers"

    # Wait for PostgreSQL to be ready
    print_step "Waiting for PostgreSQL to be ready..."
    sleep 5
fi

# Run database migrations
print_step "Running database migrations..."
cd packages/database
npx prisma generate
npx prisma migrate dev --name init
cd ../..

# Build shared packages
print_step "Building shared packages..."
npm run build:packages

# Verify setup
print_step "Verifying setup..."
npm run typecheck || print_warning "TypeScript check failed - please review errors"

print_step "✅ Development setup complete!"
echo ""
echo "To start the development servers, run:"
echo "  npm run dev"
echo ""
echo "Services will be available at:"
echo "  - Web App: http://localhost:3000"
echo "  - API: http://localhost:3001"
echo "  - PostgreSQL: localhost:5432"
echo "  - Redis: localhost:6379"
echo ""
print_warning "Remember to:"
echo "  1. Update your .env file with API keys and secrets"
echo "  2. Configure your IDE for TypeScript and ESLint"
echo "  3. Run 'docker-compose up' to start all services"