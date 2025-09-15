'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Minus, Target, Zap, Search, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricValue {
  id: string;
  name: string;
  value: number;
  previousValue?: number;
  target?: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  description: string;
  lastUpdated: string;
}

interface MetricsDashboardProps {
  metrics: MetricValue[];
  timeRange: '1h' | '24h' | '7d' | '30d';
  onTimeRangeChange: (range: '1h' | '24h' | '7d' | '30d') => void;
  onRefresh?: () => void;
  className?: string;
}

const metricIcons = {
  'presence-score': Target,
  'pick-rate': Award,
  'snippet-health': Zap,
  'citation-coverage': Search,
};

const trendIcons = {
  up: TrendingUp,
  down: TrendingDown,
  stable: Minus,
};

const trendColors = {
  up: 'text-green-500',
  down: 'text-red-500',
  stable: 'text-gray-500',
};

function MetricCard({ metric }: { metric: MetricValue }) {
  const Icon = metricIcons[metric.id as keyof typeof metricIcons] || Target;
  const TrendIcon = trendIcons[metric.trend];
  const trendColor = trendColors[metric.trend];

  const change = metric.previousValue
    ? ((metric.value - metric.previousValue) / metric.previousValue) * 100
    : 0;

  const getPerformanceColor = (value: number, target?: number) => {
    if (!target) return 'text-foreground';
    const ratio = value / target;
    if (ratio >= 0.9) return 'text-green-600';
    if (ratio >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">
              {metric.name}
            </CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <TrendIcon className={cn('h-3 w-3', trendColor)} />
            {metric.previousValue && (
              <span className={cn('text-xs font-medium', trendColor)}>
                {change > 0 ? '+' : ''}{change.toFixed(1)}%
              </span>
            )}
          </div>
        </div>
        <CardDescription className="text-xs">
          {metric.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <span className={cn(
              'text-2xl font-bold',
              getPerformanceColor(metric.value, metric.target)
            )}>
              {metric.value.toFixed(1)}
            </span>
            <span className="text-sm text-muted-foreground">
              {metric.unit}
            </span>
          </div>

          {metric.target && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Target: {metric.target}{metric.unit}</span>
                <span>{((metric.value / metric.target) * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className={cn(
                    'h-1.5 rounded-full transition-all',
                    metric.value >= metric.target * 0.9 ? 'bg-green-500' :
                    metric.value >= metric.target * 0.7 ? 'bg-yellow-500' : 'bg-red-500'
                  )}
                  style={{
                    width: `${Math.min((metric.value / metric.target) * 100, 100)}%`
                  }}
                />
              </div>
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            Updated {new Date(metric.lastUpdated).toLocaleTimeString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function OverviewCard({ metrics }: { metrics: MetricValue[] }) {
  const averageScore = metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length;
  const positiveMetrics = metrics.filter(m => m.trend === 'up').length;
  const totalMetrics = metrics.length;

  const getOverallHealth = () => {
    if (averageScore >= 80) return { label: 'Excellent', color: 'bg-green-100 text-green-800' };
    if (averageScore >= 60) return { label: 'Good', color: 'bg-yellow-100 text-yellow-800' };
    if (averageScore >= 40) return { label: 'Needs Work', color: 'bg-orange-100 text-orange-800' };
    return { label: 'Critical', color: 'bg-red-100 text-red-800' };
  };

  const health = getOverallHealth();

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="text-lg">Findability Overview</CardTitle>
        <CardDescription>
          Your current search performance across all AI models and surfaces
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center space-y-2">
            <div className="text-3xl font-bold text-foreground">
              {averageScore.toFixed(1)}
            </div>
            <div className="text-sm text-muted-foreground">Average Score</div>
            <Badge className={health.color} variant="secondary">
              {health.label}
            </Badge>
          </div>

          <div className="text-center space-y-2">
            <div className="text-3xl font-bold text-green-600">
              {positiveMetrics}
            </div>
            <div className="text-sm text-muted-foreground">
              Improving Metrics
            </div>
            <div className="text-xs text-muted-foreground">
              out of {totalMetrics} total
            </div>
          </div>

          <div className="text-center space-y-2">
            <div className="text-3xl font-bold text-blue-600">
              {metrics.filter(m => m.target && m.value >= m.target).length}
            </div>
            <div className="text-sm text-muted-foreground">
              Targets Met
            </div>
            <div className="text-xs text-muted-foreground">
              goals achieved
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function MetricsDashboard({
  metrics,
  timeRange,
  onTimeRangeChange,
  onRefresh,
  className
}: MetricsDashboardProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Performance Metrics</h2>
          <p className="text-muted-foreground">
            Track your findability across AI models and search surfaces
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={onTimeRangeChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh}>
              Refresh
            </Button>
          )}
        </div>
      </div>

      {/* Overview */}
      {metrics.length > 0 && (
        <OverviewCard metrics={metrics} />
      )}

      {/* Metric Cards */}
      {metrics.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric) => (
            <MetricCard key={metric.id} metric={metric} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8">
            <div className="text-center space-y-2">
              <Target className="h-12 w-12 text-muted-foreground mx-auto" />
              <h3 className="text-lg font-medium">No Metrics Available</h3>
              <p className="text-muted-foreground">
                Run some queries to start collecting performance metrics
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}