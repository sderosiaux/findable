/**
 * Dashboard Store
 * Zustand store for dashboard state management with real-time updates
 */

import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'

export interface DashboardMetrics {
  findabilityScore: number
  totalCitations: number
  competitorRank: number
  totalCompetitors: number
  monthlyChange: number
  weeklyChange: number
  lastUpdated: string
}

export interface TimeSeriesData {
  date: string
  score: number
  citations: number
  competitions: number
}

export interface TopLoss {
  id: string
  query: string
  competitor: string
  lostCitations: number
  impact: 'high' | 'medium' | 'low'
  trend: 'up' | 'down' | 'stable'
}

export interface RecentActivity {
  id: string
  type: 'citation' | 'run' | 'alert' | 'playbook'
  title: string
  description: string
  timestamp: string
  status: 'success' | 'warning' | 'error' | 'info'
}

export interface DashboardFilters {
  timeRange: '7d' | '30d' | '90d' | '1y'
  competitors: string[]
  queries: string[]
  surfaces: string[]
}

interface DashboardState {
  // Data
  metrics: DashboardMetrics | null
  timeSeriesData: TimeSeriesData[]
  topLosses: TopLoss[]
  recentActivity: RecentActivity[]

  // UI State
  loading: {
    metrics: boolean
    timeSeriesData: boolean
    topLosses: boolean
    recentActivity: boolean
  }

  // Filters
  filters: DashboardFilters

  // Real-time updates
  isRealTimeEnabled: boolean
  lastRefresh: string | null

  // Actions
  setMetrics: (metrics: DashboardMetrics) => void
  setTimeSeriesData: (data: TimeSeriesData[]) => void
  setTopLosses: (losses: TopLoss[]) => void
  setRecentActivity: (activity: RecentActivity[]) => void
  setFilters: (filters: Partial<DashboardFilters>) => void
  setLoading: (key: keyof DashboardState['loading'], loading: boolean) => void
  enableRealTime: () => void
  disableRealTime: () => void
  refreshData: () => Promise<void>
  reset: () => void
}

// Mock data generators for development
const generateMockMetrics = (): DashboardMetrics => ({
  findabilityScore: Math.floor(Math.random() * 40) + 60, // 60-100
  totalCitations: Math.floor(Math.random() * 500) + 100,
  competitorRank: Math.floor(Math.random() * 10) + 1,
  totalCompetitors: 15,
  monthlyChange: (Math.random() - 0.5) * 20, // -10 to +10
  weeklyChange: (Math.random() - 0.5) * 10, // -5 to +5
  lastUpdated: new Date().toISOString()
})

const generateMockTimeSeriesData = (days: number): TimeSeriesData[] => {
  const data: TimeSeriesData[] = []
  const now = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)

    data.push({
      date: date.toISOString().split('T')[0],
      score: Math.floor(Math.random() * 40) + 60,
      citations: Math.floor(Math.random() * 50) + 20,
      competitions: Math.floor(Math.random() * 20) + 5
    })
  }

  return data
}

const generateMockTopLosses = (): TopLoss[] => [
  {
    id: '1',
    query: 'AI content optimization',
    competitor: 'CompetitorA',
    lostCitations: 15,
    impact: 'high',
    trend: 'down'
  },
  {
    id: '2',
    query: 'SEO automation tools',
    competitor: 'CompetitorB',
    lostCitations: 8,
    impact: 'medium',
    trend: 'down'
  },
  {
    id: '3',
    query: 'Content findability',
    competitor: 'CompetitorC',
    lostCitations: 5,
    impact: 'low',
    trend: 'stable'
  }
]

const generateMockRecentActivity = (): RecentActivity[] => [
  {
    id: '1',
    type: 'citation',
    title: 'New Citation Found',
    description: 'Your content was cited in GPT-4 response for "AI SEO tools"',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
    status: 'success'
  },
  {
    id: '2',
    type: 'run',
    title: 'Query Run Completed',
    description: 'Batch run for 25 queries completed successfully',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 minutes ago
    status: 'success'
  },
  {
    id: '3',
    type: 'alert',
    title: 'Competitor Alert',
    description: 'CompetitorA gained 3 new citations in your target queries',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    status: 'warning'
  },
  {
    id: '4',
    type: 'playbook',
    title: 'Playbook Generated',
    description: 'New playbook created for improving "AI automation" queries',
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
    status: 'info'
  }
]

export const useDashboardStore = create<DashboardState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Initial state
      metrics: null,
      timeSeriesData: [],
      topLosses: [],
      recentActivity: [],

      loading: {
        metrics: false,
        timeSeriesData: false,
        topLosses: false,
        recentActivity: false
      },

      filters: {
        timeRange: '30d',
        competitors: [],
        queries: [],
        surfaces: []
      },

      isRealTimeEnabled: false,
      lastRefresh: null,

      // Actions
      setMetrics: (metrics) => set({ metrics }),

      setTimeSeriesData: (timeSeriesData) => set({ timeSeriesData }),

      setTopLosses: (topLosses) => set({ topLosses }),

      setRecentActivity: (recentActivity) => set({ recentActivity }),

      setFilters: (newFilters) =>
        set((state) => ({
          filters: { ...state.filters, ...newFilters }
        })),

      setLoading: (key, loading) =>
        set((state) => ({
          loading: { ...state.loading, [key]: loading }
        })),

      enableRealTime: () => set({ isRealTimeEnabled: true }),

      disableRealTime: () => set({ isRealTimeEnabled: false }),

      refreshData: async () => {
        const state = get()

        // Set loading states
        set({
          loading: {
            metrics: true,
            timeSeriesData: true,
            topLosses: true,
            recentActivity: true
          }
        })

        try {
          // Simulate API calls with delays
          await new Promise(resolve => setTimeout(resolve, 500))

          // Generate mock data based on current filters
          const days = state.filters.timeRange === '7d' ? 7 :
                      state.filters.timeRange === '30d' ? 30 :
                      state.filters.timeRange === '90d' ? 90 : 365

          const metrics = generateMockMetrics()
          const timeSeriesData = generateMockTimeSeriesData(days)
          const topLosses = generateMockTopLosses()
          const recentActivity = generateMockRecentActivity()

          set({
            metrics,
            timeSeriesData,
            topLosses,
            recentActivity,
            lastRefresh: new Date().toISOString(),
            loading: {
              metrics: false,
              timeSeriesData: false,
              topLosses: false,
              recentActivity: false
            }
          })
        } catch (error) {
          console.error('Failed to refresh dashboard data:', error)
          set({
            loading: {
              metrics: false,
              timeSeriesData: false,
              topLosses: false,
              recentActivity: false
            }
          })
        }
      },

      reset: () =>
        set({
          metrics: null,
          timeSeriesData: [],
          topLosses: [],
          recentActivity: [],
          loading: {
            metrics: false,
            timeSeriesData: false,
            topLosses: false,
            recentActivity: false
          },
          filters: {
            timeRange: '30d',
            competitors: [],
            queries: [],
            surfaces: []
          },
          isRealTimeEnabled: false,
          lastRefresh: null
        })
    }))
  )
)

// Selector hooks for performance optimization
export const useDashboardMetrics = () =>
  useDashboardStore((state) => state.metrics)

export const useDashboardTimeSeriesData = () =>
  useDashboardStore((state) => state.timeSeriesData)

export const useDashboardTopLosses = () =>
  useDashboardStore((state) => state.topLosses)

export const useDashboardRecentActivity = () =>
  useDashboardStore((state) => state.recentActivity)

export const useDashboardLoading = () =>
  useDashboardStore((state) => state.loading)

export const useDashboardFilters = () =>
  useDashboardStore((state) => state.filters)

export const useDashboardActions = () =>
  useDashboardStore((state) => ({
    setMetrics: state.setMetrics,
    setTimeSeriesData: state.setTimeSeriesData,
    setTopLosses: state.setTopLosses,
    setRecentActivity: state.setRecentActivity,
    setFilters: state.setFilters,
    setLoading: state.setLoading,
    enableRealTime: state.enableRealTime,
    disableRealTime: state.disableRealTime,
    refreshData: state.refreshData,
    reset: state.reset
  }))

// Real-time data subscription (would connect to WebSocket in production)
export const setupRealTimeUpdates = () => {
  return useDashboardStore.subscribe(
    (state) => state.isRealTimeEnabled,
    (isEnabled) => {
      if (isEnabled) {
        // Start real-time updates
        const interval = setInterval(() => {
          const state = useDashboardStore.getState()
          if (state.isRealTimeEnabled) {
            // Simulate real-time metric updates
            const currentMetrics = state.metrics
            if (currentMetrics) {
              const updatedMetrics = {
                ...currentMetrics,
                findabilityScore: Math.max(0, Math.min(100,
                  currentMetrics.findabilityScore + (Math.random() - 0.5) * 2
                )),
                totalCitations: Math.max(0,
                  currentMetrics.totalCitations + Math.floor((Math.random() - 0.7) * 3)
                ),
                lastUpdated: new Date().toISOString()
              }
              state.setMetrics(updatedMetrics)
            }
          }
        }, 30000) // Update every 30 seconds

        return () => clearInterval(interval)
      }
    }
  )
}