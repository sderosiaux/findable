# Findable UI Component Architecture

## Design System Foundation

### Color Tokens
```typescript
// colors/tokens.ts
export const colors = {
  // Brand Colors
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    500: '#0ea5e9', // Primary blue
    600: '#0284c7',
    700: '#0369a1',
    900: '#0c4a6e'
  },

  // Semantic Colors
  success: {
    50: '#ecfdf5',
    500: '#10b981',
    600: '#059669'
  },
  warning: {
    50: '#fffbeb',
    500: '#f59e0b',
    600: '#d97706'
  },
  error: {
    50: '#fef2f2',
    500: '#ef4444',
    600: '#dc2626'
  },

  // Neutral Scale
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
    950: '#030712'
  },

  // Dark Mode
  dark: {
    bg: '#0a0a0a',
    surface: '#141414',
    border: '#262626',
    text: '#fafafa'
  }
}
```

### Typography Scale
```typescript
// typography/tokens.ts
export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'monospace']
  },

  fontSize: {
    xs: ['12px', '16px'],
    sm: ['14px', '20px'],
    base: ['16px', '24px'],
    lg: ['18px', '28px'],
    xl: ['20px', '28px'],
    '2xl': ['24px', '32px'],
    '3xl': ['30px', '36px'],
    '4xl': ['36px', '40px']
  },

  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700'
  }
}
```

### Spacing System
```typescript
// spacing/tokens.ts
export const spacing = {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px'
}
```

## Component Hierarchy

### 1. Layout Components
```
├── AppShell
│   ├── Sidebar
│   │   ├── SidebarHeader
│   │   ├── SidebarNav
│   │   └── SidebarFooter
│   ├── Header
│   │   ├── Breadcrumbs
│   │   ├── UserMenu
│   │   └── ThemeToggle
│   └── MainContent
```

### 2. Core UI Components
```
├── Forms
│   ├── Input
│   ├── Select
│   ├── DateRangePicker
│   ├── SearchInput
│   └── FilterGroup
├── Data Display
│   ├── MetricCard
│   ├── DataTable
│   ├── Chart
│   │   ├── LineChart
│   │   ├── BarChart
│   │   ├── HeatMap
│   │   └── ComparisonMatrix
│   ├── Badge
│   ├── StatusIndicator
│   └── ProgressBar
├── Navigation
│   ├── Tabs
│   ├── Pagination
│   └── Breadcrumbs
└── Feedback
    ├── LoadingSpinner
    ├── EmptyState
    ├── ErrorBoundary
    └── Toast
```

### 3. Page-Specific Components
```
├── Dashboard
│   ├── FindabilityScore
│   ├── PickMap
│   ├── TopLosses
│   └── RecentActivity
├── Runs
│   ├── QueryResults
│   ├── CitationList
│   └── SnippetCard
├── Executor
│   ├── TaskList
│   ├── LogViewer
│   └── StatusGrid
├── Comparisons
│   ├── CompetitorMatrix
│   ├── TaskComparison
│   └── PerformanceChart
├── Surfaces
│   ├── SurfaceStatus
│   ├── IntegrationCard
│   └── HealthCheck
├── Playbooks
│   ├── ActionRanking
│   ├── PlaybookCard
│   └── DraftGenerator
└── Alerts
    ├── AlertConfig
    ├── AlertHistory
    └── NotificationCenter
```

## State Management Patterns

### Zustand Store Structure
```typescript
// stores/index.ts
interface AppState {
  // UI State
  ui: {
    sidebarCollapsed: boolean
    theme: 'light' | 'dark'
    activeFilters: Record<string, any>
  }

  // Data State
  dashboard: DashboardState
  runs: RunsState
  executor: ExecutorState
  comparisons: ComparisonsState
  surfaces: SurfacesState
  playbooks: PlaybooksState
  alerts: AlertsState
}
```

### Data Fetching Strategy
```typescript
// Using React Query with optimistic updates
const useRealTimeMetrics = () => {
  return useQuery({
    queryKey: ['metrics', 'realtime'],
    queryFn: fetchMetrics,
    refetchInterval: 30000, // 30 seconds
    staleTime: 15000
  })
}

const useInfiniteRuns = () => {
  return useInfiniteQuery({
    queryKey: ['runs'],
    queryFn: fetchRuns,
    getNextPageParam: (lastPage) => lastPage.nextCursor
  })
}
```

## Key UI Patterns

### 1. Metric Cards with Real-time Updates
- Animated number transitions
- Color-coded status indicators
- Trend arrows and mini charts
- Loading skeletons

### 2. Data Tables with Advanced Features
- Virtual scrolling for large datasets
- Column sorting and filtering
- Row selection and bulk actions
- Expandable rows for details

### 3. Interactive Charts
- Zoomable time-series charts
- Clickable data points
- Tooltip with rich context
- Export functionality

### 4. Smart Empty States
- Contextual illustrations
- Clear next steps
- Quick action buttons
- Help documentation links

### 5. Progressive Disclosure
- Collapsible sections
- Modal overlays for details
- Drawer panels for filters
- Accordion for FAQ/help

## Responsive Design Strategy

### Breakpoints
```typescript
export const breakpoints = {
  sm: '640px',   // Mobile landscape
  md: '768px',   // Tablet
  lg: '1024px',  // Desktop
  xl: '1280px',  // Large desktop
  '2xl': '1536px' // Extra large
}
```

### Layout Adaptations
- Tablet-first design philosophy
- Collapsible sidebar on mobile
- Stack cards vertically on small screens
- Horizontal scroll for tables
- Bottom sheet navigation on mobile

## Dark Mode Implementation
```typescript
// theme/provider.tsx
const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
```

## Animation Patterns
```typescript
// animations/variants.ts
export const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 }
}

export const slideIn = {
  initial: { x: -300 },
  animate: { x: 0 },
  exit: { x: -300 },
  transition: { type: 'spring', stiffness: 300, damping: 30 }
}
```

## Accessibility Features
- Keyboard navigation support
- Screen reader optimized
- High contrast mode
- Focus management
- ARIA labels and descriptions
- Semantic HTML structure

This architecture provides a solid foundation for building a professional, scalable SaaS platform while maintaining development velocity through component reuse and consistent patterns.