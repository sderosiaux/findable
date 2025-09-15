import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { cn } from '@/lib/utils';
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: number | string;
  change?: number;
  format?: 'number' | 'percentage' | 'currency';
  icon?: React.ReactNode;
  status?: 'success' | 'warning' | 'error' | 'neutral';
  className?: string;
}

export function MetricCard({
  title,
  value,
  change,
  format = 'number',
  icon,
  status = 'neutral',
  className,
}: MetricCardProps) {
  const formatValue = () => {
    if (typeof value === 'string') return value;

    switch (format) {
      case 'percentage':
        return `${(value * 100).toFixed(1)}%`;
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(value);
      default:
        return new Intl.NumberFormat('en-US').format(value);
    }
  };

  const formatChange = () => {
    if (change === undefined || change === null) return null;

    const isPositive = change > 0;
    const isNeutral = change === 0;
    const changePercent = Math.abs(change * 100).toFixed(1);

    return (
      <div
        className={cn(
          'flex items-center text-xs font-medium',
          isPositive && 'text-green-600',
          !isPositive && !isNeutral && 'text-red-600',
          isNeutral && 'text-gray-500'
        )}
      >
        {isPositive && <ArrowUpIcon className="mr-1 h-3 w-3" />}
        {!isPositive && !isNeutral && <ArrowDownIcon className="mr-1 h-3 w-3" />}
        {isNeutral && <MinusIcon className="mr-1 h-3 w-3" />}
        {changePercent}%
      </div>
    );
  };

  const statusColors = {
    success: 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950',
    warning: 'border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950',
    error: 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950',
    neutral: '',
  };

  return (
    <Card className={cn(statusColors[status], className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatValue()}</div>
        {change !== undefined && (
          <div className="mt-1">{formatChange()}</div>
        )}
      </CardContent>
    </Card>
  );
}