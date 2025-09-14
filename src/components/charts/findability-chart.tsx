/**
 * FindabilityChart Component
 * Interactive time-series chart for AI Findability Score with trend analysis
 * Built with Recharts for performance and customization
 */

import React, { useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart
} from 'recharts'
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
import { CalendarDays, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DataPoint {
  date: string
  score: number
  citations: number
  competitions: number
  trend?: 'up' | 'down' | 'stable'
}

interface FindabilityChartProps {
  data: DataPoint[]
  loading?: boolean
  timeRange?: '7d' | '30d' | '90d' | '1y'
  onTimeRangeChange?: (range: string) => void
  showComparisons?: boolean
  className?: string
}

const timeRanges = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
  { value: '1y', label: '1 year' }
]

// Mock data for demonstration
const generateMockData = (days: number): DataPoint[] => {
  const data: DataPoint[] = []
  const now = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)

    // Generate realistic trending data
    const baseScore = 65 + Math.sin(i / 10) * 15 + Math.random() * 10
    const score = Math.max(0, Math.min(100, baseScore))

    data.push({
      date: date.toISOString().split('T')[0],
      score: Math.round(score),
      citations: Math.floor(50 + Math.random() * 100),
      competitions: Math.floor(10 + Math.random() * 20),
      trend: score > (data[data.length - 1]?.score || score) ? 'up' : 'down'
    })
  }

  return data
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-white dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
        <p className="font-medium text-gray-900 dark:text-gray-100">
          {new Date(label).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })}
        </p>
        <div className="mt-2 space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Findability Score: <span className="font-medium text-gray-900 dark:text-gray-100">
                {data.score}/100
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Citations: <span className="font-medium text-gray-900 dark:text-gray-100">
                {data.citations}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Competitors: <span className="font-medium text-gray-900 dark:text-gray-100">
                {data.competitions}
              </span>
            </span>
          </div>
        </div>
      </div>
    )
  }
  return null
}

const ScoreGauge = ({ score }: { score: number }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Fair'
    return 'Needs Improvement'
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <div className="w-24 h-24 rounded-full border-8 border-gray-200 dark:border-gray-700">
          <div
            className={cn(
              'absolute inset-0 rounded-full border-8 border-transparent',
              score >= 80 ? 'border-t-green-500 border-r-green-500' :
              score >= 60 ? 'border-t-yellow-500 border-r-yellow-500' :
              'border-t-red-500 border-r-red-500'
            )}
            style={{
              transform: `rotate(${(score / 100) * 270 - 135}deg)`,
              borderTopColor: 'transparent',
              borderRightColor: 'transparent'
            }}
          />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn('text-2xl font-bold', getScoreColor(score))}>
            {score}
          </span>
        </div>
      </div>
      <div>
        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {getScoreLabel(score)}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          AI Findability Score
        </p>
      </div>
    </div>
  )
}

export function FindabilityChart({
  data: propData,
  loading = false,
  timeRange = '30d',
  onTimeRangeChange,
  showComparisons = true,
  className
}: FindabilityChartProps) {
  const [activeTab, setActiveTab] = useState('score')

  // Use mock data if no data provided
  const data = propData.length > 0 ? propData : generateMockData(
    timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365
  )

  const currentScore = data[data.length - 1]?.score || 0
  const previousScore = data[data.length - 2]?.score || 0
  const scoreChange = currentScore - previousScore

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              AI Findability Trends
            </CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Track your content's discoverability by AI systems
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={onTimeRangeChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeRanges.map((range) => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Current Score Display */}
        <div className="flex items-center justify-between pt-4">
          <ScoreGauge score={currentScore} />
          <div className="flex items-center gap-2">
            {scoreChange !== 0 && (
              <Badge
                variant={scoreChange > 0 ? 'default' : 'destructive'}
                className="flex items-center gap-1"
              >
                {scoreChange > 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {Math.abs(scoreChange)} points
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="score">Findability Score</TabsTrigger>
            <TabsTrigger value="citations">Citations</TabsTrigger>
            <TabsTrigger value="combined">Combined View</TabsTrigger>
          </TabsList>

          <TabsContent value="score" className="space-y-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    stroke="#6b7280"
                  />
                  <YAxis domain={[0, 100]} stroke="#6b7280" />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={80} stroke="#10b981" strokeDasharray="5 5" label="Excellent" />
                  <ReferenceLine y={60} stroke="#f59e0b" strokeDasharray="5 5" label="Good" />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fill="url(#scoreGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="citations" className="space-y-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    stroke="#6b7280"
                  />
                  <YAxis stroke="#6b7280" />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="citations"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="combined" className="space-y-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    stroke="#6b7280"
                  />
                  <YAxis yAxisId="score" domain={[0, 100]} stroke="#6b7280" />
                  <YAxis yAxisId="citations" orientation="right" stroke="#6b7280" />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    yAxisId="score"
                    type="monotone"
                    dataKey="score"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    name="Findability Score"
                  />
                  <Line
                    yAxisId="citations"
                    type="monotone"
                    dataKey="citations"
                    stroke="#10b981"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Citations"
                  />
                  {showComparisons && (
                    <Line
                      yAxisId="citations"
                      type="monotone"
                      dataKey="competitions"
                      stroke="#f97316"
                      strokeWidth={2}
                      strokeDasharray="3 3"
                      name="Competitor Mentions"
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}