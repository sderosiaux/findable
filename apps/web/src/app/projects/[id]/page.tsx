'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LoadingStates } from '@/components/ui/loading';
import { useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { QueryBuilder } from '@/components/ui/query-builder';
import { ResultsViewer } from '@/components/ui/results-viewer';
import { MetricsDashboard } from '@/components/ui/metrics-dashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import {
  Building,
  Globe,
  Calendar,
  Play,
  BarChart3,
  Search,
  Settings,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

export default function ProjectPage() {
  const params = useParams();
  const projectId = params.id as string;
  const queryClient = useQueryClient();
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('7d');

  // Fetch project details
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const response = await api.getProject(projectId);
      if (response.error) throw new Error(response.error.message);
      return response.data;
    },
  });

  // Fetch project queries
  const { data: queriesData, isLoading: queriesLoading } = useQuery({
    queryKey: ['queries', projectId],
    queryFn: async () => {
      const response = await api.getQueries(projectId);
      if (response.error) throw new Error(response.error.message);
      return response.data;
    },
  });

  // Fetch metrics
  const { data: metricsData, isLoading: metricsLoading } = useQuery({
    queryKey: ['metrics', projectId, timeRange],
    queryFn: async () => {
      const response = await api.getMetrics(projectId);
      if (response.error) throw new Error(response.error.message);
      return response.data;
    },
  });

  const handleQuerySubmit = async (queryData: any) => {
    try {
      const response = await api.createQuery({
        projectId,
        content: queryData.queries[0], // Take first query for now
        models: queryData.models,
        surfaces: queryData.surfaces,
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      // Refresh queries list
      queryClient.invalidateQueries({ queryKey: ['queries', projectId] });

      // If successful, run the query
      if (response.data?.id) {
        await api.runQuery(response.data.id);
        // Refresh data after running
        queryClient.invalidateQueries({ queryKey: ['queries', projectId] });
        queryClient.invalidateQueries({ queryKey: ['metrics', projectId] });
      }
    } catch (error) {
      console.error('Failed to create/run query:', error);
      throw error;
    }
  };

  const handleRefreshMetrics = () => {
    queryClient.invalidateQueries({ queryKey: ['metrics', projectId] });
  };

  if (projectLoading) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <LoadingStates.ProjectDetail />
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold">Project Not Found</h1>
            <p className="text-muted-foreground">
              The project you're looking for doesn't exist or you don't have access to it.
            </p>
            <Link href="/projects">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Projects
              </Button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Mock metrics data for now
  const mockMetrics = [
    {
      id: 'presence-score',
      name: 'AI Findability Score',
      value: 75.4,
      previousValue: 72.1,
      target: 80,
      unit: '%',
      trend: 'up' as const,
      description: 'Overall visibility across AI models',
      lastUpdated: new Date().toISOString(),
    },
    {
      id: 'pick-rate',
      name: 'Pick Rate',
      value: 62.8,
      previousValue: 65.2,
      target: 70,
      unit: '%',
      trend: 'down' as const,
      description: 'How often your content is selected',
      lastUpdated: new Date().toISOString(),
    },
  ];

  // Mock results data
  const mockResults = [
    {
      id: '1',
      query: 'What is the best project management tool?',
      model: 'gpt-4',
      surface: 'web',
      status: 'completed' as const,
      response: 'Based on current market analysis, there are several excellent project management tools available...',
      citations: ['https://example.com/source1', 'https://example.com/source2'],
      confidence: 85,
      executionTime: 1250,
      createdAt: new Date().toISOString(),
      metadata: {
        rank: 3,
        snippet: 'Project management tools comparison',
        url: 'https://example.com/results',
      },
    },
  ];

  return (
    <DashboardLayout>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Link href="/projects">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Building className="h-8 w-8" />
                {project.name}
              </h1>
              <div className="flex items-center gap-4 text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Globe className="h-4 w-4" />
                  {project.domain}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Created {new Date(project.createdAt).toLocaleDateString()}
                </span>
                <Badge variant="outline">{project.status || 'active'}</Badge>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </div>
          </div>
          {project.description && (
            <p className="text-muted-foreground">{project.description}</p>
          )}
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="queries">Queries</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Queries:</span>
                      <span className="font-medium">{queriesData?.queries?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Run:</span>
                      <span className="font-medium">
                        {project.lastRunAt
                          ? new Date(project.lastRunAt).toLocaleDateString()
                          : 'Never'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant="outline">{project.status || 'active'}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Recent Activity</CardTitle>
                  <CardDescription>Latest query runs and results</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center text-muted-foreground py-8">
                    No recent activity found
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Metrics Overview */}
            <MetricsDashboard
              metrics={mockMetrics}
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
              onRefresh={handleRefreshMetrics}
            />
          </TabsContent>

          {/* Queries Tab */}
          <TabsContent value="queries" className="space-y-6">
            <QueryBuilder
              projectId={projectId}
              onSubmit={handleQuerySubmit}
              className="max-w-4xl"
            />

            {queriesLoading ? (
              <Card>
                <CardContent className="py-8">
                  <div className="text-center">Loading queries...</div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Query History</CardTitle>
                  <CardDescription>
                    Previous queries and their performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {queriesData?.queries?.length > 0 ? (
                    <div className="space-y-4">
                      {queriesData.queries.map((query: any) => (
                        <div key={query.id} className="border rounded p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium">{query.content}</p>
                              <p className="text-sm text-muted-foreground">
                                Created {new Date(query.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <Button variant="outline" size="sm">
                              <Play className="mr-2 h-4 w-4" />
                              Run Again
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      No queries found. Create your first query above.
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Metrics Tab */}
          <TabsContent value="metrics" className="space-y-6">
            <MetricsDashboard
              metrics={mockMetrics}
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
              onRefresh={handleRefreshMetrics}
            />
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="space-y-6">
            <ResultsViewer
              results={mockResults}
              onRefresh={() => {
                queryClient.invalidateQueries({ queryKey: ['queries', projectId] });
              }}
              onExport={(format) => {
                console.log('Export as:', format);
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}