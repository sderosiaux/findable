# Testing & CI/CD Strategy for Findable

## 🧪 Testing Philosophy

### Core Principles
1. **Test Pyramid**: More unit tests, fewer E2E tests
2. **Shift Left**: Catch issues early in development
3. **Fast Feedback**: Sub-5 minute CI runs
4. **Production Parity**: Test environments mirror production
5. **Automated Everything**: No manual testing for regressions

## 📊 Testing Coverage Targets

| Test Type | Coverage Target | Run Time |
|-----------|----------------|----------|
| Unit Tests | 80%+ | < 30s |
| Integration Tests | 60%+ | < 2m |
| E2E Tests | Critical paths | < 5m |
| Performance Tests | Key endpoints | < 10m |
| Security Tests | OWASP Top 10 | < 15m |

## 🔧 Testing Stack

### JavaScript/TypeScript Testing
```json
{
  "unit": "Jest + React Testing Library",
  "integration": "Supertest",
  "e2e": "Playwright",
  "performance": "k6",
  "visual": "Percy"
}
```

### Python Testing
```json
{
  "unit": "pytest",
  "integration": "pytest + testcontainers",
  "async": "pytest-asyncio",
  "mocking": "unittest.mock + responses"
}
```

## 🎯 Test Categories

### 1. Unit Tests

**Backend (Node.js)**
```typescript
// Example: Testing the scoring service
describe('ScoringService', () => {
  describe('calculatePresenceScore', () => {
    it('should return 1.0 when product appears in all runs', () => {
      const runs = [
        { mentions: ['Findable', 'our product'] },
        { mentions: ['Findable'] }
      ];
      expect(calculatePresenceScore(runs)).toBe(1.0);
    });

    it('should return 0.5 when product appears in half the runs', () => {
      const runs = [
        { mentions: ['Findable'] },
        { mentions: ['Competitor'] }
      ];
      expect(calculatePresenceScore(runs)).toBe(0.5);
    });
  });
});
```

**Frontend (React)**
```typescript
// Example: Testing MetricCard component
describe('MetricCard', () => {
  it('renders metric value and trend', () => {
    render(
      <MetricCard
        title="Findability Score"
        value={0.75}
        trend={0.05}
        status="success"
      />
    );
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('+5%')).toBeInTheDocument();
  });
});
```

### 2. Integration Tests

**API Integration**
```typescript
describe('POST /api/queries/run', () => {
  it('should execute query on multiple models', async () => {
    const response = await request(app)
      .post('/api/queries/run')
      .set('Authorization', 'Bearer token')
      .send({
        projectId: 'test-project',
        queries: ['Send email Node.js'],
        models: ['gpt-4', 'claude-3']
      });

    expect(response.status).toBe(202);
    expect(response.body.sessionId).toBeDefined();
  });
});
```

**Database Integration**
```python
@pytest.mark.integration
async def test_metrics_aggregation():
    # Insert test data
    await insert_metrics(project_id, test_metrics)

    # Run aggregation
    result = await aggregate_metrics(
        project_id,
        start_time=datetime.now() - timedelta(days=7),
        end_time=datetime.now()
    )

    assert result['presence_score'] == 0.75
    assert len(result['time_series']) == 7
```

### 3. E2E Tests

**Critical User Journeys**
```typescript
// playwright/specs/dashboard.spec.ts
test('User can view and analyze findability metrics', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');

  // Navigate to dashboard
  await page.waitForURL('/dashboard');

  // Verify metrics are displayed
  await expect(page.locator('.metric-card')).toHaveCount(6);
  await expect(page.locator('.findability-chart')).toBeVisible();

  // Run new query
  await page.click('button:has-text("Run Query")');
  await page.fill('[name="query"]', 'Kafka encryption');
  await page.click('button:has-text("Execute")');

  // Verify results
  await page.waitForSelector('.query-results');
  await expect(page.locator('.citation-link')).toHaveCount(3);
});
```

### 4. Performance Tests

**k6 Load Testing**
```javascript
// k6/scenarios/api-load.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Spike
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(99)<500'], // 99% of requests under 500ms
    http_req_failed: ['rate<0.01'],   // Error rate under 1%
  },
};

export default function () {
  const response = http.get('https://api.findable.ai/projects');
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  sleep(1);
}
```

### 5. Security Tests

**OWASP ZAP Configuration**
```yaml
# .zap/scan-config.yaml
context:
  name: "Findable Security Scan"
  urls:
    - "https://staging.findable.ai"
  authentication:
    method: "json"
    loginUrl: "https://staging.findable.ai/api/auth/login"
    loginData: '{"email": "test@example.com", "password": "password"}'

policies:
  - SQL Injection
  - Cross Site Scripting
  - Security Headers
  - Sensitive Data Exposure
  - API Security

alerts:
  - level: HIGH
    action: FAIL_BUILD
  - level: MEDIUM
    action: WARN
```

## 🚀 CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/main.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '20'
  PYTHON_VERSION: '3.11'

jobs:
  # 1. Code Quality
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

      - name: Run Prettier
        run: npm run format:check

      - name: Python linting
        run: |
          pip install black flake8 mypy
          black --check services/
          flake8 services/
          mypy services/

  # 2. Unit Tests
  unit-tests:
    runs-on: ubuntu-latest
    needs: lint
    strategy:
      matrix:
        service: [api, runner, executor, parser]

    steps:
      - uses: actions/checkout@v3

      - name: Setup environment
        uses: ./.github/actions/setup-env
        with:
          service: ${{ matrix.service }}

      - name: Run unit tests
        run: |
          npm run test:unit -- --coverage
          pytest services/${{ matrix.service }}/tests/unit --cov

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
          flags: ${{ matrix.service }}

  # 3. Integration Tests
  integration-tests:
    runs-on: ubuntu-latest
    needs: unit-tests
    services:
      postgres:
        image: timescale/timescaledb:latest-pg16
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Setup environment
        uses: ./.github/actions/setup-env

      - name: Run migrations
        run: npm run db:migrate

      - name: Run integration tests
        run: |
          npm run test:integration
          pytest services/tests/integration

  # 4. Build & Security Scan
  build:
    runs-on: ubuntu-latest
    needs: integration-tests
    steps:
      - uses: actions/checkout@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Build images
        run: |
          docker compose build

      - name: Run Trivy security scan
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: 'findable-api:latest'
          format: 'sarif'
          output: 'trivy-results.sarif'

      - name: Upload Trivy results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'

      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

  # 5. E2E Tests
  e2e-tests:
    runs-on: ubuntu-latest
    needs: build
    if: github.event_name == 'push'
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to staging
        run: |
          kubectl apply -f k8s/staging/
          kubectl wait --for=condition=ready pod -l app=findable --timeout=300s

      - name: Run Playwright tests
        run: |
          npx playwright install
          npm run test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/

  # 6. Performance Tests
  performance-tests:
    runs-on: ubuntu-latest
    needs: e2e-tests
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3

      - name: Run k6 tests
        uses: grafana/k6-action@v0.3.0
        with:
          filename: k6/scenarios/api-load.js
          cloud: true
        env:
          K6_CLOUD_TOKEN: ${{ secrets.K6_CLOUD_TOKEN }}

  # 7. Deploy to Production
  deploy:
    runs-on: ubuntu-latest
    needs: [e2e-tests, performance-tests]
    if: github.ref == 'refs/heads/main'
    environment:
      name: production
      url: https://findable.ai

    steps:
      - uses: actions/checkout@v3

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Deploy to EKS
        run: |
          aws eks update-kubeconfig --name findable-prod
          kubectl apply -f k8s/production/
          kubectl rollout status deployment/findable-api -n production

      - name: Run smoke tests
        run: npm run test:smoke

      - name: Notify deployment
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Production deployment completed'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

## 🔄 Continuous Deployment Strategy

### Deployment Environments

| Environment | Trigger | Approval | Rollback |
|------------|---------|----------|----------|
| Development | Every commit | Automatic | Automatic |
| Staging | PR to main | Automatic | Automatic |
| Production | Merge to main | Manual gate | One-click |

### Blue-Green Deployment

```yaml
# k8s/production/deployment.yaml
apiVersion: v1
kind: Service
metadata:
  name: findable-api
spec:
  selector:
    app: findable-api
    version: $VERSION
  ports:
    - port: 80
      targetPort: 3000
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: findable-api-blue
spec:
  replicas: 3
  selector:
    matchLabels:
      app: findable-api
      version: blue
  template:
    metadata:
      labels:
        app: findable-api
        version: blue
    spec:
      containers:
      - name: api
        image: findable/api:$BLUE_VERSION
        ports:
        - containerPort: 3000
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: findable-api-green
spec:
  replicas: 3
  selector:
    matchLabels:
      app: findable-api
      version: green
  template:
    metadata:
      labels:
        app: findable-api
        version: green
    spec:
      containers:
      - name: api
        image: findable/api:$GREEN_VERSION
        ports:
        - containerPort: 3000
```

### Rollback Strategy

```bash
#!/bin/bash
# scripts/rollback.sh

ENVIRONMENT=$1
PREVIOUS_VERSION=$(kubectl get deployment findable-api -o jsonpath='{.metadata.annotations.previous-version}')

echo "Rolling back to version: $PREVIOUS_VERSION"

# Update deployment
kubectl set image deployment/findable-api api=findable/api:$PREVIOUS_VERSION

# Wait for rollout
kubectl rollout status deployment/findable-api

# Run smoke tests
npm run test:smoke

if [ $? -eq 0 ]; then
  echo "Rollback successful"
else
  echo "Rollback failed, manual intervention required"
  exit 1
fi
```

## 📊 Monitoring & Alerting

### Test Metrics Dashboard

```yaml
# grafana/dashboards/ci-cd.json
{
  "dashboard": {
    "title": "CI/CD Pipeline Metrics",
    "panels": [
      {
        "title": "Build Success Rate",
        "targets": [
          {
            "expr": "sum(rate(ci_build_success_total[5m])) / sum(rate(ci_build_total[5m]))"
          }
        ]
      },
      {
        "title": "Average Build Time",
        "targets": [
          {
            "expr": "avg(ci_build_duration_seconds)"
          }
        ]
      },
      {
        "title": "Test Coverage Trend",
        "targets": [
          {
            "expr": "ci_test_coverage_percent"
          }
        ]
      },
      {
        "title": "Deployment Frequency",
        "targets": [
          {
            "expr": "sum(increase(deployments_total[7d]))"
          }
        ]
      }
    ]
  }
}
```

### Alert Rules

```yaml
# prometheus/alerts/ci-cd.yml
groups:
  - name: ci_cd_alerts
    rules:
      - alert: HighBuildFailureRate
        expr: |
          (sum(rate(ci_build_failed_total[1h])) / sum(rate(ci_build_total[1h]))) > 0.1
        for: 30m
        labels:
          severity: warning
        annotations:
          summary: "High CI build failure rate"
          description: "Build failure rate is {{ $value | humanizePercentage }}"

      - alert: LowTestCoverage
        expr: ci_test_coverage_percent < 70
        for: 1h
        labels:
          severity: warning
        annotations:
          summary: "Test coverage below threshold"
          description: "Coverage is {{ $value }}%, should be above 70%"

      - alert: DeploymentFailed
        expr: deployment_status{environment="production"} == 0
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Production deployment failed"
          description: "Deployment to production has failed"
```

## 🎯 Quality Gates

### Pre-commit Hooks

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.4.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-added-large-files
        args: ['--maxkb=500']

  - repo: https://github.com/psf/black
    rev: 23.1.0
    hooks:
      - id: black
        language_version: python3.11

  - repo: local
    hooks:
      - id: eslint
        name: ESLint
        entry: npm run lint
        language: system
        files: \.(js|jsx|ts|tsx)$

      - id: jest
        name: Jest Tests
        entry: npm run test:unit -- --findRelatedTests
        language: system
        files: \.(js|jsx|ts|tsx)$
```

### Pull Request Checks

```yaml
# .github/pull_request_template.md
## PR Checklist

- [ ] Tests pass locally
- [ ] Code coverage maintained/improved
- [ ] No security vulnerabilities
- [ ] Documentation updated
- [ ] Performance impact assessed
- [ ] Database migrations reviewed
- [ ] Feature flag configured (if applicable)

## Testing Evidence
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing completed

## Deployment Notes
<!-- Any special deployment considerations -->
```

## 📈 Continuous Improvement

### Metrics to Track

| Metric | Target | Current |
|--------|--------|---------|
| Lead Time | < 2 days | - |
| Deployment Frequency | > 5/week | - |
| MTTR | < 1 hour | - |
| Change Failure Rate | < 5% | - |
| Test Coverage | > 80% | - |
| Build Time | < 5 min | - |
| Test Execution Time | < 10 min | - |

### Feedback Loops

1. **Daily Stand-ups**: Review CI/CD failures
2. **Weekly Retrospectives**: Analyze pipeline improvements
3. **Monthly Reviews**: Assess quality metrics trends
4. **Quarterly Audits**: Security and performance testing review

---

This comprehensive testing and CI/CD strategy ensures Findable maintains high quality, security, and reliability while enabling rapid iteration and deployment.