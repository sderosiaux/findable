'use client';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface LoadingProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullPage?: boolean;
}

export function Loading({ className, size = 'md', text, fullPage }: LoadingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  const LoadingContent = (
    <div className={cn('flex items-center justify-center gap-2', className)}>
      <Loader2 className={cn('animate-spin', sizeClasses[size])} />
      {text && <span className="text-muted-foreground">{text}</span>}
    </div>
  );

  if (fullPage) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {LoadingContent}
      </div>
    );
  }

  return LoadingContent;
}

interface LoadingCardProps {
  title?: string;
  description?: string;
  className?: string;
}

export function LoadingCard({ title, description, className }: LoadingCardProps) {
  return (
    <Card className={className}>
      <CardContent className="py-8">
        <div className="text-center space-y-4">
          <Loading size="lg" />
          {title && <h3 className="text-lg font-medium">{title}</h3>}
          {description && <p className="text-muted-foreground">{description}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

interface LoadingSkeletonProps {
  className?: string;
  lines?: number;
}

export function LoadingSkeleton({ className, lines = 3 }: LoadingSkeletonProps) {
  return (
    <div className={cn('animate-pulse space-y-2', className)}>
      {Array.from({ length: lines }, (_, i) => (
        <div
          key={i}
          className={cn(
            'h-4 bg-gray-200 rounded',
            i === lines - 1 ? 'w-2/3' : 'w-full'
          )}
        />
      ))}
    </div>
  );
}

interface LoadingGridProps {
  columns?: number;
  rows?: number;
  className?: string;
}

export function LoadingGrid({ columns = 3, rows = 2, className }: LoadingGridProps) {
  return (
    <div className={cn(
      'grid gap-4',
      columns === 2 && 'grid-cols-1 md:grid-cols-2',
      columns === 3 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
      columns === 4 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
      className
    )}>
      {Array.from({ length: columns * rows }, (_, i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded" />
                <div className="h-3 bg-gray-200 rounded w-5/6" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

interface LoadingTableProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export function LoadingTable({ rows = 5, columns = 4, className }: LoadingTableProps) {
  return (
    <div className={cn('animate-pulse', className)}>
      {/* Header */}
      <div className="border rounded-t-lg bg-gray-50 p-4">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }, (_, i) => (
            <div key={i} className="h-4 bg-gray-200 rounded w-3/4" />
          ))}
        </div>
      </div>

      {/* Rows */}
      <div className="border-x border-b rounded-b-lg">
        {Array.from({ length: rows }, (_, rowIndex) => (
          <div key={rowIndex} className="border-b last:border-b-0 p-4">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {Array.from({ length: columns }, (_, colIndex) => (
                <div
                  key={colIndex}
                  className={cn(
                    'h-4 bg-gray-200 rounded',
                    colIndex === 0 ? 'w-5/6' : colIndex === columns - 1 ? 'w-1/2' : 'w-3/4'
                  )}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Loading states for specific components
export const LoadingStates = {
  Dashboard: () => (
    <div className="space-y-6">
      <LoadingSkeleton lines={2} className="w-1/3" />
      <LoadingGrid columns={4} rows={1} />
      <LoadingCard title="Loading dashboard..." />
    </div>
  ),

  Projects: () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <LoadingSkeleton lines={2} className="w-1/4" />
        <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
      </div>
      <LoadingGrid columns={3} rows={2} />
    </div>
  ),

  ProjectDetail: () => (
    <div className="space-y-6">
      <LoadingSkeleton lines={3} className="w-1/2" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <LoadingCard className="lg:col-span-1" />
        <LoadingCard className="lg:col-span-2" />
      </div>
      <LoadingTable rows={3} columns={5} />
    </div>
  ),

  Metrics: () => (
    <div className="space-y-6">
      <LoadingGrid columns={4} rows={1} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <LoadingCard />
        <LoadingCard />
      </div>
    </div>
  ),
};