/**
 * Dashboard Page
 * Main dashboard with AI Findability Score, metrics, and overview widgets
 */

import React, { useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  MetricCard,
  FindabilityScoreCard,
  CitationCountCard,
  CompetitorRankCard
} from '@/components/ui/metric-card'
import { FindabilityChart } from '@/components/charts/findability-chart'
import { DataTable } from '@/components/data/data-table'
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Target,
  Users,
  BarChart3,
  Play,
  Calendar,
  Filter,
  Download,
  Settings,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  useDashboardStore,
  useDashboardMetrics,
  useDashboardLoading,
  useDashboardFilters,
  useDashboardActions,
  useDashboardTopLosses,
  useDashboardRecentActivity
} from '@/stores/dashboard-store'
import {
  useRealTimeMetrics,
  useTimeSeriesData,
  useRealTimeConnection
} from '@/hooks/use-real-time-data'
import { ColumnDef } from '@tanstack/react-table'

// Types for table data
interface TopLoss {
  id: string
  query: string
  competitor: string
  lostCitations: number
  impact: 'high' | 'medium' | 'low'
  trend: 'up' | 'down' | 'stable'
}

interface RecentActivity {
  id: string
  type: 'citation' | 'run' | 'alert' | 'playbook'
  title: string
  description: string
  timestamp: string
  status: 'success' | 'warning' | 'error' | 'info'
}

// Table columns for top losses
const topLossesColumns: ColumnDef<TopLoss>[] = [
  {
    accessorKey: 'query',
    header: 'Query',
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue('query')}</div>
    )
  },
  {
    accessorKey: 'competitor',
    header: 'Competitor',
    cell: ({ row }) => (
      <div className="text-gray-600 dark:text-gray-400">
        {row.getValue('competitor')}
      </div>
    )
  },
  {
    accessorKey: 'lostCitations',
    header: 'Lost Citations',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <span className="font-medium text-red-600">
          -{row.getValue('lostCitations')}
        </span>
        <TrendingDown className="h-4 w-4 text-red-500" />
      </div>
    )
  },
  {
    accessorKey: 'impact',
    header: 'Impact',
    cell: ({ row }) => {
      const impact = row.getValue('impact') as string
      return (
        <Badge
          variant={
            impact === 'high' ? 'destructive' :
            impact === 'medium' ? 'secondary' :
            'outline'
          }
        >
          {impact}
        </Badge>
      )
    }
  }
]

// Table columns for recent activity
const recentActivityColumns: ColumnDef<RecentActivity>[] = [
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => {
      const type = row.getValue('type') as string
      const icons = {
        citation: Target,
        run: Play,
        alert: AlertTriangle,
        playbook: BarChart3
      }
      const Icon = icons[type as keyof typeof icons]

      return (
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-gray-500" />
          <span className="capitalize">{type}</span>
        </div>
      )
    }
  },
  {
    accessorKey: 'title',
    header: 'Title',
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.getValue('title')}</div>
        <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
          {row.original.description}
        </div>
      </div>
    )
  },
  {
    accessorKey: 'timestamp',
    header: 'Time',
    cell: ({ row }) => {
      const timestamp = new Date(row.getValue('timestamp'))
      const now = new Date()
      const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60))

      let timeAgo = ''
      if (diffInMinutes < 1) {
        timeAgo = 'Just now'
      } else if (diffInMinutes < 60) {
        timeAgo = `${diffInMinutes}m ago`
      } else if (diffInMinutes < 1440) {
        timeAgo = `${Math.floor(diffInMinutes / 60)}h ago`
      } else {
        timeAgo = `${Math.floor(diffInMinutes / 1440)}d ago`
      }

      return (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {timeAgo}
        </div>
      )
    }
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      return (
        <Badge
          variant={
            status === 'success' ? 'default' :
            status === 'warning' ? 'secondary' :
            status === 'error' ? 'destructive' :
            'outline'
          }
        >
          {status}
        </Badge>
      )
    }
  }
]

function DashboardHeader() {
  const filters = useDashboardFilters()
  const { setFilters, refreshData } = useDashboardActions()
  const loading = useDashboardLoading()

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Dashboard
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Monitor your AI findability performance and track improvements
        </p>
      </div>

      <div className="flex items-center gap-4">
        <Select
          value={filters.timeRange}
          onValueChange={(value: any) => setFilters({ timeRange: value })}
        >
          <SelectTrigger className="w-32">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">7 days</SelectItem>
            <SelectItem value="30d">30 days</SelectItem>
            <SelectItem value="90d">90 days</SelectItem>
            <SelectItem value="1y">1 year</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>

        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={refreshData}
          disabled={Object.values(loading).some(Boolean)}
        >
          <RefreshCw className={cn(
            'h-4 w-4 mr-2',
            Object.values(loading).some(Boolean) && 'animate-spin'
          )} />
          Refresh
        </Button>

        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>
    </div>
  )
}

function MetricsOverview() {
  const metrics = useDashboardMetrics()
  const loading = useDashboardLoading()

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <FindabilityScoreCard
        score={metrics?.findabilityScore}
        loading={loading.metrics}
      />

      <CitationCountCard
        count={metrics?.totalCitations}
        change={metrics?.weeklyChange}
        loading={loading.metrics}
      />

      <CompetitorRankCard
        rank={metrics?.competitorRank}
        total={metrics?.totalCompetitors}
        change={metrics?.monthlyChange}
        loading={loading.metrics}
      />

      <MetricCard
        title="Monthly Growth"
        value={metrics?.monthlyChange || 0}
        format="percentage"
        change={metrics?.monthlyChange}
        changeType={
          metrics?.monthlyChange && metrics.monthlyChange > 0 ? 'positive' :
          metrics?.monthlyChange && metrics.monthlyChange < 0 ? 'negative' :
          'neutral'
        }
        trend={
          metrics?.monthlyChange && metrics.monthlyChange > 0 ? 'up' :
          metrics?.monthlyChange && metrics.monthlyChange < 0 ? 'down' :
          'flat'
        }
        loading={loading.metrics}
        icon={<BarChart3 className="h-5 w-5" />}
      />
    </div>
  )
}

function ChartsSection() {
  const filters = useDashboardFilters()
  const timeSeriesData = useDashboardStore((state) => state.timeSeriesData)
  const loading = useDashboardLoading()
  const { setFilters } = useDashboardActions()

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="lg:col-span-2">
        <FindabilityChart
          data={timeSeriesData}
          loading={loading.timeSeriesData}
          timeRange={filters.timeRange}
          onTimeRangeChange={(range) => setFilters({ timeRange: range as any })}
          showComparisons={true}
        />
      </div>
    </div>
  )
}

function InsightsSection() {
  const topLosses = useDashboardTopLosses()
  const recentActivity = useDashboardRecentActivity()
  const loading = useDashboardLoading()

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-red-500" />
            Top Losses vs Rivals
          </CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Queries where competitors are gaining citations
          </p>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={topLossesColumns}
            data={topLosses}
            loading={loading.topLosses}
            enablePagination={false}
            enableRowSelection={false}
            enableColumnVisibility={false}
            className="border-0"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            Recent Activity
          </CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Latest updates across your campaigns
          </p>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={recentActivityColumns}
            data={recentActivity}
            loading={loading.recentActivity}
            enablePagination={false}
            enableRowSelection={false}
            enableColumnVisibility={false}
            className="border-0"
          />
        </CardContent>
      </Card>
    </div>
  )
}

function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Common tasks and shortcuts
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Button variant="outline" className="justify-start">
            <Play className="h-4 w-4 mr-2" />
            Run New Query
          </Button>

          <Button variant="outline" className="justify-start">
            <Users className="h-4 w-4 mr-2" />
            Add Competitor
          </Button>

          <Button variant="outline" className="justify-start">
            <Target className="h-4 w-4 mr-2" />
            Create Alert
          </Button>

          <Button variant="outline" className="justify-start">
            <BarChart3 className="h-4 w-4 mr-2" />
            Generate Playbook
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function Dashboard() {
  const { refreshData } = useDashboardActions()

  // Set up real-time data fetching
  useRealTimeMetrics({ refetchInterval: 30000 })
  useTimeSeriesData('30d', { refetchInterval: 60000 })
  useRealTimeConnection()

  // Initial data load
  useEffect(() => {
    refreshData()
  }, [refreshData])

  return (
    <div className="space-y-8 p-8">
      <DashboardHeader />

      <MetricsOverview />

      <ChartsSection />

      <InsightsSection />

      <QuickActions />
    </div>
  )
}