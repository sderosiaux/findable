'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, XCircle, Clock, ExternalLink, Filter, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RunResult {
  id: string;
  query: string;
  model: string;
  surface: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  response: string;
  citations: string[];
  confidence: number;
  executionTime: number;
  createdAt: string;
  metadata: {
    rank?: number;
    snippet?: string;
    url?: string;
  };
}

interface ResultsViewerProps {
  results: RunResult[];
  onRefresh?: () => void;
  onExport?: (format: 'csv' | 'json') => void;
  className?: string;
}

const statusIcons = {
  pending: Clock,
  running: Clock,
  completed: CheckCircle,
  failed: XCircle,
};

const statusColors = {
  pending: 'text-yellow-500',
  running: 'text-blue-500',
  completed: 'text-green-500',
  failed: 'text-red-500',
};

export function ResultsViewer({ results, onRefresh, onExport, className }: ResultsViewerProps) {
  const [filterModel, setFilterModel] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('createdAt');

  const filteredResults = results.filter(result => {
    const modelMatch = filterModel === 'all' || result.model === filterModel;
    const statusMatch = filterStatus === 'all' || result.status === filterStatus;
    return modelMatch && statusMatch;
  });

  const sortedResults = [...filteredResults].sort((a, b) => {
    switch (sortBy) {
      case 'confidence':
        return b.confidence - a.confidence;
      case 'executionTime':
        return a.executionTime - b.executionTime;
      case 'createdAt':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  const uniqueModels = [...new Set(results.map(r => r.model))];

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Query Results</CardTitle>
            <CardDescription>
              {results.length} total results • {filteredResults.length} showing
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {onExport && (
              <Select onValueChange={(value) => onExport(value as 'csv' | 'json')}>
                <SelectTrigger className="w-32">
                  <Download className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Export" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">Export CSV</SelectItem>
                  <SelectItem value="json">Export JSON</SelectItem>
                </SelectContent>
              </Select>
            )}
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh}>
                Refresh
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 pt-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterModel} onValueChange={setFilterModel}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Models</SelectItem>
                {uniqueModels.map(model => (
                  <SelectItem key={model} value={model}>
                    {model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="running">Running</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Latest First</SelectItem>
              <SelectItem value="confidence">High Confidence</SelectItem>
              <SelectItem value="executionTime">Fastest</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {sortedResults.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No results match your filters
            </div>
          ) : (
            sortedResults.map((result) => {
              const StatusIcon = statusIcons[result.status];
              return (
                <div
                  key={result.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <StatusIcon className={cn('h-4 w-4', statusColors[result.status])} />
                        <Badge variant="secondary" className="text-xs">
                          {result.model}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {result.surface}
                        </Badge>
                      </div>
                      <p className="font-medium text-sm truncate">
                        {result.query}
                      </p>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <div>{new Date(result.createdAt).toLocaleString()}</div>
                      <div>{result.executionTime}ms</div>
                    </div>
                  </div>

                  {/* Response */}
                  {result.status === 'completed' && (
                    <div className="space-y-2">
                      <div className="text-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">Response:</span>
                          <Badge variant="outline" className="text-xs">
                            {result.confidence}% confidence
                          </Badge>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                          {result.response}
                        </p>
                      </div>

                      {/* Citations */}
                      {result.citations.length > 0 && (
                        <div className="text-sm">
                          <span className="font-medium">Citations:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {result.citations.slice(0, 3).map((citation, index) => (
                              <a
                                key={index}
                                href={citation}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 underline"
                              >
                                Source {index + 1}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            ))}
                            {result.citations.length > 3 && (
                              <span className="text-xs text-muted-foreground">
                                +{result.citations.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Metadata */}
                      {result.metadata.rank && (
                        <div className="text-xs text-muted-foreground">
                          Rank: #{result.metadata.rank}
                          {result.metadata.url && (
                            <a
                              href={result.metadata.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 text-blue-600 hover:text-blue-800 underline"
                            >
                              View Result
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Error state */}
                  {result.status === 'failed' && (
                    <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                      Query execution failed. Please try again.
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}