# Findable UI Component Architecture - Implementation Guide

## Overview
This comprehensive UI component architecture provides a scalable, professional foundation for the Findable AI SEO platform. Built with Next.js 14+, shadcn/ui, Tailwind CSS, Zustand, and React Query.

## 🏗️ Architecture Summary

### 1. Design System Foundation (`/src/lib/design-tokens.ts`)
```typescript
// Centralized design tokens for consistency
export const colors = {
  primary: { 50: '#f0f9ff', 500: '#0ea5e9', 900: '#0c4a6e' },
  success: { 500: '#10b981' },
  warning: { 500: '#f59e0b' },
  error: { 500: '#ef4444' }
}

export const typography = {
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }]
  }
}
```

### 2. Component Hierarchy

#### Core UI Components
- **MetricCard** (`/src/components/ui/metric-card.tsx`)
  - Real-time data display with trend indicators
  - Multiple variants: FindabilityScoreCard, CitationCountCard, CompetitorRankCard
  - Loading states and status indicators

- **DataTable** (`/src/components/data/data-table.tsx`)
  - Advanced table with sorting, filtering, pagination
  - Row selection and column visibility controls
  - Virtual scrolling optimization for large datasets

- **FindabilityChart** (`/src/components/charts/findability-chart.tsx`)
  - Interactive time-series visualization
  - Multiple chart types: line, area, combined views
  - Real-time updates with smooth animations

#### Layout Components
- **AppShell** (`/src/components/layout/app-shell.tsx`)
  - Responsive layout with collapsible sidebar
  - Mobile-optimized navigation
  - User menu and search integration

### 3. State Management (`/src/stores/dashboard-store.ts`)
```typescript
// Zustand store with real-time capabilities
export const useDashboardStore = create<DashboardState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      metrics: null,
      timeSeriesData: [],
      loading: { metrics: false, timeSeriesData: false },
      filters: { timeRange: '30d' },
      isRealTimeEnabled: false,

      refreshData: async () => {
        // Async data fetching with loading states
      }
    }))
  )
)
```

### 4. Data Fetching Strategy (`/src/hooks/use-real-time-data.ts`)
```typescript
// React Query integration with real-time updates
export function useRealTimeMetrics(options: QueryOptions = {}) {
  return useQuery({
    queryKey: ['dashboard', 'metrics'],
    queryFn: fetchMetrics,
    refetchInterval: 30000, // 30 seconds
    staleTime: 15000
  })
}

export function useRuns(filters: any = {}) {
  return useInfiniteQuery({
    queryKey: ['runs', filters],
    queryFn: fetchRuns,
    getNextPageParam: (lastPage) => lastPage.nextCursor
  })
}
```

## 🎨 Design Patterns

### Professional UI Patterns
1. **Metric Cards with Real-time Updates**
   - Animated number transitions
   - Color-coded status indicators
   - Trend arrows and percentage changes

2. **Advanced Data Tables**
   - Column sorting and filtering
   - Row selection with bulk actions
   - Pagination and virtual scrolling

3. **Interactive Charts**
   - Zoomable time-series with Recharts
   - Multiple data series support
   - Custom tooltips and legends

4. **Responsive Layout**
   - Tablet-first design approach
   - Collapsible navigation sidebar
   - Mobile-optimized interactions

### Dark Mode Support
```typescript
// Automatic dark mode with proper color tokens
const theme = {
  light: { bg: '#ffffff', text: '#111827' },
  dark: { bg: '#0a0a0a', text: '#fafafa' }
}
```

## 📊 Key Features Implemented

### Dashboard Page (`/src/pages/dashboard.tsx`)
```typescript
export default function Dashboard() {
  // Real-time data hooks
  useRealTimeMetrics({ refetchInterval: 30000 })
  useTimeSeriesData('30d', { refetchInterval: 60000 })

  return (
    <div className="space-y-8 p-8">
      <DashboardHeader />
      <MetricsOverview />      // 4 metric cards
      <ChartsSection />        // Interactive charts
      <InsightsSection />      // Top losses & activity
      <QuickActions />         // Action buttons
    </div>
  )
}
```

### Real-time Updates
- WebSocket simulation for live data
- Optimistic updates for better UX
- Smart refresh intervals (30s for metrics, 1m for charts)

### Performance Optimizations
- React Query caching and background updates
- Zustand state management with selectors
- Virtual scrolling for large datasets
- Component code splitting

## 🚀 Implementation Guide

### 1. Install Dependencies
```bash
npm install @tanstack/react-query @tanstack/react-table
npm install zustand recharts
npm install @radix-ui/react-* # shadcn/ui components
npm install lucide-react clsx tailwind-merge
```

### 2. Setup Providers
```typescript
// app/layout.tsx or _app.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppShell } from '@/components/layout/app-shell'

const queryClient = new QueryClient()

export default function RootLayout({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AppShell>
        {children}
      </AppShell>
    </QueryClientProvider>
  )
}
```

### 3. Page Implementation Examples

#### Runs Page
```typescript
import { DataTable } from '@/components/data/data-table'
import { useRuns } from '@/hooks/use-real-time-data'

export default function RunsPage() {
  const { data, fetchNextPage, hasNextPage } = useRuns()

  return (
    <DataTable
      columns={runsColumns}
      data={data?.pages.flatMap(page => page.data) || []}
      searchKey="query"
      searchPlaceholder="Search queries..."
      onRowClick={(run) => router.push(`/runs/${run.id}`)}
    />
  )
}
```

#### Executor Page
```typescript
import { useExecutorTasks } from '@/hooks/use-real-time-data'
import { MetricCard } from '@/components/ui/metric-card'

export default function ExecutorPage() {
  const { data: tasks, isLoading } = useExecutorTasks()

  const runningTasks = tasks?.filter(t => t.status === 'running').length || 0

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard
          title="Running Tasks"
          value={runningTasks}
          loading={isLoading}
          status={runningTasks > 10 ? 'warning' : 'success'}
        />
      </div>

      <DataTable
        columns={taskColumns}
        data={tasks || []}
        loading={isLoading}
      />
    </div>
  )
}
```

## 🎯 Next Steps

### Page Implementations Needed
1. **Runs Page** - Query results and citations management
2. **Executor Page** - Task monitoring and logs viewer
3. **Comparisons Page** - Competitor analysis matrix
4. **Surfaces Page** - Integration status dashboard
5. **Playbooks Page** - Action recommendations
6. **Alerts Page** - Notification management

### Advanced Features to Add
1. **Real-time WebSocket Integration**
2. **Advanced Filtering System**
3. **Export Functionality**
4. **User Preferences**
5. **Notification System**
6. **Help Documentation**

### Performance Enhancements
1. **Code Splitting by Page**
2. **Image Optimization**
3. **Bundle Analysis**
4. **Caching Strategy**
5. **Error Boundaries**

## 📁 File Structure
```
src/
├── components/
│   ├── ui/                 # Basic UI components
│   │   ├── metric-card.tsx
│   │   └── ...shadcn components
│   ├── charts/             # Chart components
│   │   └── findability-chart.tsx
│   ├── data/               # Data display components
│   │   └── data-table.tsx
│   └── layout/             # Layout components
│       └── app-shell.tsx
├── hooks/                  # Custom hooks
│   └── use-real-time-data.ts
├── stores/                 # State management
│   └── dashboard-store.ts
├── lib/                    # Utilities
│   └── design-tokens.ts
└── pages/                  # Page components
    └── dashboard.tsx
```

This architecture provides a solid foundation for rapid development while maintaining professional quality and scalability. The component library is designed for reuse across all pages, and the real-time data patterns can be extended to any part of the application.