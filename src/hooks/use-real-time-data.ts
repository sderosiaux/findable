/**
 * Real-time Data Hooks
 * Custom hooks for data fetching with React Query integration
 */

import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useDashboardStore } from '@/stores/dashboard-store'
import { useCallback, useEffect } from 'react'

// Types
export interface QueryOptions {
  refetchInterval?: number
  staleTime?: number
  cacheTime?: number
  enabled?: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  nextCursor?: string
  hasMore: boolean
  total: number
}

// Dashboard hooks
export function useRealTimeMetrics(options: QueryOptions = {}) {
  const { setMetrics, setLoading } = useDashboardStore()

  return useQuery({
    queryKey: ['dashboard', 'metrics'],
    queryFn: async () => {
      // Simulate API call
      setLoading('metrics', true)
      await new Promise(resolve => setTimeout(resolve, 500))

      const metrics = {
        findabilityScore: Math.floor(Math.random() * 40) + 60,
        totalCitations: Math.floor(Math.random() * 500) + 100,
        competitorRank: Math.floor(Math.random() * 10) + 1,
        totalCompetitors: 15,
        monthlyChange: (Math.random() - 0.5) * 20,
        weeklyChange: (Math.random() - 0.5) * 10,
        lastUpdated: new Date().toISOString()
      }

      setMetrics(metrics)
      setLoading('metrics', false)
      return metrics
    },
    refetchInterval: options.refetchInterval || 30000, // 30 seconds
    staleTime: options.staleTime || 15000, // 15 seconds
    cacheTime: options.cacheTime || 5 * 60 * 1000, // 5 minutes
    enabled: options.enabled !== false,
    onError: () => setLoading('metrics', false)
  })
}

export function useTimeSeriesData(timeRange: string = '30d', options: QueryOptions = {}) {
  const { setTimeSeriesData, setLoading } = useDashboardStore()

  return useQuery({
    queryKey: ['dashboard', 'timeSeries', timeRange],
    queryFn: async () => {
      setLoading('timeSeriesData', true)
      await new Promise(resolve => setTimeout(resolve, 800))

      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365
      const data = Array.from({ length: days }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - (days - 1 - i))

        return {
          date: date.toISOString().split('T')[0],
          score: Math.floor(Math.random() * 40) + 60,
          citations: Math.floor(Math.random() * 50) + 20,
          competitions: Math.floor(Math.random() * 20) + 5
        }
      })

      setTimeSeriesData(data)
      setLoading('timeSeriesData', false)
      return data
    },
    refetchInterval: options.refetchInterval || 60000, // 1 minute
    staleTime: options.staleTime || 30000, // 30 seconds
    enabled: options.enabled !== false,
    onError: () => setLoading('timeSeriesData', false)
  })
}

// Runs hooks
export function useRuns(filters: any = {}, options: QueryOptions = {}) {
  return useInfiniteQuery({
    queryKey: ['runs', filters],
    queryFn: async ({ pageParam = null }) => {
      await new Promise(resolve => setTimeout(resolve, 600))

      // Mock paginated data
      const mockRuns = Array.from({ length: 20 }, (_, i) => ({
        id: `run-${pageParam || 0}-${i}`,
        query: `Query ${i + 1}`,
        status: ['completed', 'running', 'failed'][Math.floor(Math.random() * 3)],
        citations: Math.floor(Math.random() * 10),
        duration: Math.floor(Math.random() * 5000) + 1000,
        timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString()
      }))

      return {
        data: mockRuns,
        nextCursor: Math.random() > 0.3 ? `cursor-${Date.now()}` : null,
        hasMore: Math.random() > 0.3,
        total: 1000
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    refetchInterval: options.refetchInterval || 10000, // 10 seconds
    staleTime: options.staleTime || 5000,
    enabled: options.enabled !== false
  })
}

export function useRunDetails(runId: string, options: QueryOptions = {}) {
  return useQuery({
    queryKey: ['runs', runId],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 400))

      return {
        id: runId,
        query: 'Sample Query',
        status: 'completed',
        citations: [
          {
            id: '1',
            source: 'ChatGPT',
            content: 'This is a citation snippet...',
            confidence: 0.95,
            timestamp: new Date().toISOString()
          },
          {
            id: '2',
            source: 'Claude',
            content: 'Another citation example...',
            confidence: 0.87,
            timestamp: new Date().toISOString()
          }
        ],
        logs: [
          { level: 'info', message: 'Starting query execution', timestamp: new Date().toISOString() },
          { level: 'success', message: 'Query completed successfully', timestamp: new Date().toISOString() }
        ],
        duration: 2500,
        timestamp: new Date().toISOString()
      }
    },
    enabled: !!runId && options.enabled !== false,
    staleTime: options.staleTime || 30000
  })
}

// Executor hooks
export function useExecutorTasks(options: QueryOptions = {}) {
  return useQuery({
    queryKey: ['executor', 'tasks'],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 500))

      return Array.from({ length: 15 }, (_, i) => ({
        id: `task-${i}`,
        name: `Task ${i + 1}`,
        status: ['pending', 'running', 'completed', 'failed'][Math.floor(Math.random() * 4)],
        progress: Math.floor(Math.random() * 100),
        priority: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)],
        estimatedTime: Math.floor(Math.random() * 300) + 60,
        createdAt: new Date(Date.now() - Math.random() * 86400000).toISOString()
      }))
    },
    refetchInterval: options.refetchInterval || 5000, // 5 seconds
    staleTime: options.staleTime || 2000,
    enabled: options.enabled !== false
  })
}

// Comparisons hooks
export function useCompetitorComparisons(options: QueryOptions = {}) {
  return useQuery({
    queryKey: ['comparisons', 'competitors'],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 700))

      const competitors = ['CompetitorA', 'CompetitorB', 'CompetitorC', 'CompetitorD']
      const tasks = ['Content Optimization', 'SEO Analysis', 'Keyword Research', 'Link Building']

      return {
        matrix: competitors.map(competitor => ({
          competitor,
          tasks: tasks.map(task => ({
            task,
            score: Math.floor(Math.random() * 100),
            citations: Math.floor(Math.random() * 50),
            rank: Math.floor(Math.random() * 10) + 1
          }))
        })),
        summary: {
          totalTasks: tasks.length,
          averageScore: Math.floor(Math.random() * 30) + 70,
          bestPerforming: tasks[Math.floor(Math.random() * tasks.length)],
          worstPerforming: tasks[Math.floor(Math.random() * tasks.length)]
        }
      }
    },
    refetchInterval: options.refetchInterval || 120000, // 2 minutes
    staleTime: options.staleTime || 60000,
    enabled: options.enabled !== false
  })
}

// Surfaces hooks
export function useSurfaceStatus(options: QueryOptions = {}) {
  return useQuery({
    queryKey: ['surfaces', 'status'],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 300))

      return [
        {
          id: 'llms-txt',
          name: 'llms.txt',
          status: 'healthy',
          lastCheck: new Date().toISOString(),
          uptime: 99.9,
          responseTime: 120
        },
        {
          id: 'openapi',
          name: 'OpenAPI',
          status: 'warning',
          lastCheck: new Date().toISOString(),
          uptime: 98.5,
          responseTime: 250
        },
        {
          id: 'mcp',
          name: 'MCP',
          status: 'error',
          lastCheck: new Date().toISOString(),
          uptime: 95.2,
          responseTime: 500
        }
      ]
    },
    refetchInterval: options.refetchInterval || 15000, // 15 seconds
    staleTime: options.staleTime || 10000,
    enabled: options.enabled !== false
  })
}

// Playbooks hooks
export function usePlaybooks(options: QueryOptions = {}) {
  return useQuery({
    queryKey: ['playbooks'],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 400))

      return Array.from({ length: 8 }, (_, i) => ({
        id: `playbook-${i}`,
        title: `Playbook ${i + 1}`,
        description: `Improve performance for query category ${i + 1}`,
        actions: Math.floor(Math.random() * 10) + 5,
        priority: Math.floor(Math.random() * 100),
        estimatedImpact: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)],
        status: ['draft', 'ready', 'running'][Math.floor(Math.random() * 3)],
        createdAt: new Date(Date.now() - Math.random() * 86400000).toISOString()
      }))
    },
    refetchInterval: options.refetchInterval || 30000,
    staleTime: options.staleTime || 15000,
    enabled: options.enabled !== false
  })
}

// Alerts hooks
export function useAlerts(options: QueryOptions = {}) {
  return useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 300))

      return Array.from({ length: 12 }, (_, i) => ({
        id: `alert-${i}`,
        type: ['citation_lost', 'competitor_gain', 'performance_drop', 'new_opportunity'][Math.floor(Math.random() * 4)],
        title: `Alert ${i + 1}`,
        message: `Alert message for item ${i + 1}`,
        severity: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)],
        read: Math.random() > 0.3,
        timestamp: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString()
      }))
    },
    refetchInterval: options.refetchInterval || 20000, // 20 seconds
    staleTime: options.staleTime || 10000,
    enabled: options.enabled !== false
  })
}

// Mutation hooks for actions
export function useCreateRun() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (runData: any) => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      return { id: `run-${Date.now()}`, ...runData }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['runs'] })
    }
  })
}

export function useExecutePlaybook() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (playbookId: string) => {
      await new Promise(resolve => setTimeout(resolve, 800))
      return { success: true, playbookId }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playbooks'] })
      queryClient.invalidateQueries({ queryKey: ['executor', 'tasks'] })
    }
  })
}

export function useMarkAlertAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (alertId: string) => {
      await new Promise(resolve => setTimeout(resolve, 200))
      return { success: true, alertId }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
    }
  })
}

// Custom hook for optimistic updates
export function useOptimisticUpdate() {
  const queryClient = useQueryClient()

  const updateCache = useCallback(<T>(
    queryKey: any[],
    updater: (oldData: T) => T
  ) => {
    queryClient.setQueryData(queryKey, updater)
  }, [queryClient])

  return { updateCache }
}

// Real-time connection hook
export function useRealTimeConnection() {
  const queryClient = useQueryClient()

  useEffect(() => {
    // Simulate WebSocket connection
    const interval = setInterval(() => {
      // Invalidate queries for real-time updates
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'metrics'] })
      queryClient.invalidateQueries({ queryKey: ['executor', 'tasks'] })
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
    }, 30000)

    return () => clearInterval(interval)
  }, [queryClient])
}