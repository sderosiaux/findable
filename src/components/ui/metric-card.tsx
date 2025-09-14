/**
 * MetricCard Component
 * Displays key metrics with real-time updates, trend indicators, and professional styling
 */

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface MetricCardProps {
  title: string
  value: string | number
  previousValue?: string | number
  change?: number
  changeType?: 'positive' | 'negative' | 'neutral'
  trend?: 'up' | 'down' | 'flat'
  format?: 'number' | 'currency' | 'percentage' | 'score'
  size?: 'sm' | 'md' | 'lg'
  status?: 'success' | 'warning' | 'error' | 'info'
  loading?: boolean
  description?: string
  subtitle?: string
  icon?: React.ReactNode
  onClick?: () => void
  className?: string
}

const formatValue = (value: string | number, format: string = 'number'): string => {
  if (typeof value !== 'number') return value.toString()

  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value)
    case 'percentage':
      return `${value.toFixed(1)}%`
    case 'score':
      return `${value}/100`
    default:
      return new Intl.NumberFormat('en-US').format(value)
  }
}

const getTrendIcon = (trend?: string) => {
  switch (trend) {
    case 'up':
      return <TrendingUp className="h-4 w-4" />
    case 'down':
      return <TrendingDown className="h-4 w-4" />
    case 'flat':
      return <Minus className="h-4 w-4" />
    default:
      return null
  }
}

const getChangeColor = (changeType?: string) => {
  switch (changeType) {
    case 'positive':
      return 'text-green-600 dark:text-green-400'
    case 'negative':
      return 'text-red-600 dark:text-red-400'
    case 'neutral':
      return 'text-gray-600 dark:text-gray-400'
    default:
      return 'text-gray-600 dark:text-gray-400'
  }
}

const getStatusColor = (status?: string) => {
  switch (status) {
    case 'success':
      return 'border-l-green-500 bg-green-50/50 dark:bg-green-950/50'
    case 'warning':
      return 'border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/50'
    case 'error':
      return 'border-l-red-500 bg-red-50/50 dark:bg-red-950/50'
    case 'info':
      return 'border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/50'
    default:
      return ''
  }
}

export function MetricCard({
  title,
  value,
  previousValue,
  change,
  changeType,
  trend,
  format = 'number',
  size = 'md',
  status,
  loading = false,
  description,
  subtitle,
  icon,
  onClick,
  className
}: MetricCardProps) {
  const sizeClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }

  const textSizes = {
    sm: {
      title: 'text-sm',
      value: 'text-2xl',
      change: 'text-xs'
    },
    md: {
      title: 'text-sm',
      value: 'text-3xl',
      change: 'text-sm'
    },
    lg: {
      title: 'text-base',
      value: 'text-4xl',
      change: 'text-base'
    }
  }

  if (loading) {
    return (
      <Card className={cn('transition-all duration-200', className)}>
        <CardContent className={sizeClasses[size]}>
          <div className="space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <TooltipProvider>
      <Card
        className={cn(
          'transition-all duration-200 hover:shadow-cardHover border-l-4',
          status && getStatusColor(status),
          onClick && 'cursor-pointer hover:scale-[1.02]',
          className
        )}
        onClick={onClick}
      >
        <CardContent className={sizeClasses[size]}>
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                {icon && (
                  <div className="text-gray-500 dark:text-gray-400">
                    {icon}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <h3 className={cn(
                    'font-medium text-gray-700 dark:text-gray-300',
                    textSizes[size].title
                  )}>
                    {title}
                  </h3>
                  {description && (
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">{description}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>

              {subtitle && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {subtitle}
                </p>
              )}

              <div className="flex items-end gap-3">
                <p className={cn(
                  'font-bold text-gray-900 dark:text-gray-100',
                  textSizes[size].value
                )}>
                  {formatValue(value, format)}
                </p>

                {change !== undefined && (
                  <div className={cn(
                    'flex items-center gap-1 pb-1',
                    getChangeColor(changeType),
                    textSizes[size].change
                  )}>
                    {getTrendIcon(trend)}
                    <span className="font-medium">
                      {change > 0 && '+'}{change}%
                    </span>
                  </div>
                )}
              </div>

              {previousValue && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Previous: {formatValue(previousValue, format)}
                </p>
              )}
            </div>

            {status && (
              <Badge
                variant={
                  status === 'success' ? 'default' :
                  status === 'warning' ? 'secondary' :
                  status === 'error' ? 'destructive' : 'outline'
                }
                className="ml-2"
              >
                {status}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}

// Preset metric cards for common use cases
export function FindabilityScoreCard({ score, loading }: { score?: number; loading?: boolean }) {
  const getScoreStatus = (score: number) => {
    if (score >= 80) return 'success'
    if (score >= 60) return 'warning'
    return 'error'
  }

  return (
    <MetricCard
      title="AI Findability Score"
      value={score || 0}
      format="score"
      size="lg"
      status={score ? getScoreStatus(score) : undefined}
      loading={loading}
      description="How easily AI can find and cite your content"
      icon={<TrendingUp className="h-5 w-5" />}
    />
  )
}

export function CitationCountCard({
  count,
  change,
  loading
}: {
  count?: number
  change?: number
  loading?: boolean
}) {
  return (
    <MetricCard
      title="Total Citations"
      value={count || 0}
      change={change}
      changeType={change && change > 0 ? 'positive' : change && change < 0 ? 'negative' : 'neutral'}
      trend={change && change > 0 ? 'up' : change && change < 0 ? 'down' : 'flat'}
      loading={loading}
      description="Times your content was cited by AI"
    />
  )
}

export function CompetitorRankCard({
  rank,
  total,
  change,
  loading
}: {
  rank?: number
  total?: number
  change?: number
  loading?: boolean
}) {
  return (
    <MetricCard
      title="Competitor Rank"
      value={rank ? `#${rank}` : '-'}
      subtitle={total ? `out of ${total}` : undefined}
      change={change}
      changeType={change && change < 0 ? 'positive' : change && change > 0 ? 'negative' : 'neutral'}
      trend={change && change < 0 ? 'up' : change && change > 0 ? 'down' : 'flat'}
      loading={loading}
      description="Your ranking compared to competitors"
    />
  )
}