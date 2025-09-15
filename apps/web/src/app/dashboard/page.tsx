'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  Bot,
  TrendingUp,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Target,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { MetricCard } from '@/components/ui/metric-card';
import { FindabilityChart } from '@/components/charts/findability-chart';
import { CompetitorMatrix } from '@/components/charts/competitor-matrix';
import { QueryResults } from '@/components/data/query-results';
import { formatPercentage, formatNumber } from '@findable/shared';

export default function DashboardPage() {
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [timeRange, setTimeRange] = useState('7d');

  // Fetch projects
  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await fetch('/api/projects');
      if (!res.ok) throw new Error('Failed to fetch projects');
      return res.json();
    },
  });

  // Fetch metrics for selected project
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['metrics', selectedProject, timeRange],
    queryFn: async () => {
      if (!selectedProject) return null;
      const res = await fetch(`/api/metrics/${selectedProject}?range=${timeRange}`);
      if (!res.ok) throw new Error('Failed to fetch metrics');
      return res.json();
    },
    enabled: !!selectedProject,
  });

  // Mock data for demonstration
  const mockMetrics = {
    presenceScore: 0.75,
    presenceChange: 0.05,
    pickRate: 0.62,
    pickRateChange: -0.03,
    snippetHealth: 0.89,
    snippetHealthChange: 0.02,
    citationCoverage: 0.71,
    citationCoverageChange: 0.08,
    totalRuns: 1247,
    totalQueries: 156,
  };

  const currentMetrics = metrics || mockMetrics;

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor your AI findability and optimize your presence
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            Last 7 days
          </Button>
          <Button size="sm">Run Query</Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="AI Findability Score"
          value={currentMetrics.presenceScore}
          change={currentMetrics.presenceChange}
          format="percentage"
          icon={<Target className="h-4 w-4" />}
          status={currentMetrics.presenceScore > 0.7 ? 'success' : 'warning'}
        />
        <MetricCard
          title="Pick Rate"
          value={currentMetrics.pickRate}
          change={currentMetrics.pickRateChange}
          format="percentage"
          icon={<TrendingUp className="h-4 w-4" />}
          status={currentMetrics.pickRate > 0.5 ? 'success' : 'error'}
        />
        <MetricCard
          title="Snippet Health"
          value={currentMetrics.snippetHealth}
          change={currentMetrics.snippetHealthChange}
          format="percentage"
          icon={<CheckCircle className="h-4 w-4" />}
          status={currentMetrics.snippetHealth > 0.8 ? 'success' : 'warning'}
        />
        <MetricCard
          title="Citation Coverage"
          value={currentMetrics.citationCoverage}
          change={currentMetrics.citationCoverageChange}
          format="percentage"
          icon={<Activity className="h-4 w-4" />}
          status={currentMetrics.citationCoverage > 0.6 ? 'success' : 'warning'}
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="queries">Queries</TabsTrigger>
          <TabsTrigger value="competitors">Competitors</TabsTrigger>
          <TabsTrigger value="surfaces">Surfaces</TabsTrigger>
          <TabsTrigger value="playbooks">Playbooks</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Findability Trend</CardTitle>
                <CardDescription>Your AI visibility over time</CardDescription>
              </CardHeader>
              <CardContent>
                <FindabilityChart data={[]} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Model Performance</CardTitle>
                <CardDescription>Pick rate by AI model</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['GPT-4', 'Claude 3', 'Perplexity', 'Gemini'].map((model) => (
                    <div key={model} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bot className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{model}</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">{Math.floor(Math.random() * 40 + 60)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Query Results</CardTitle>
              <CardDescription>Latest AI responses and analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <QueryResults />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Queries Tab */}
        <TabsContent value="queries" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Query Performance</CardTitle>
              <CardDescription>Track how your queries perform across models</CardDescription>
            </CardHeader>
            <CardContent>
              <QueryResults detailed />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Competitors Tab */}
        <TabsContent value="competitors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Competitive Analysis</CardTitle>
              <CardDescription>How you rank against competitors</CardDescription>
            </CardHeader>
            <CardContent>
              <CompetitorMatrix />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Surfaces Tab */}
        <TabsContent value="surfaces" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              { name: 'llms.txt', status: 'valid', lastChecked: '2 hours ago' },
              { name: 'OpenAPI', status: 'warning', lastChecked: '1 day ago' },
              { name: 'MCP Server', status: 'error', lastChecked: 'Never' },
              { name: 'Terraform', status: 'valid', lastChecked: '3 hours ago' },
              { name: 'README', status: 'valid', lastChecked: '1 hour ago' },
              { name: '/compare', status: 'warning', lastChecked: '2 days ago' },
            ].map((surface) => (
              <Card key={surface.name}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{surface.name}</CardTitle>
                  {surface.status === 'valid' && <CheckCircle className="h-4 w-4 text-green-500" />}
                  {surface.status === 'warning' && <AlertCircle className="h-4 w-4 text-yellow-500" />}
                  {surface.status === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-muted-foreground">
                    Last checked: {surface.lastChecked}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Playbooks Tab */}
        <TabsContent value="playbooks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recommended Actions</CardTitle>
              <CardDescription>AI-powered recommendations to improve findability</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    priority: 'high',
                    title: 'Add llms.txt file',
                    description: 'Create a standard llms.txt file to improve AI discovery',
                    impact: '+15% findability',
                  },
                  {
                    priority: 'medium',
                    title: 'Update OpenAPI spec',
                    description: 'Your OpenAPI spec is missing key endpoints',
                    impact: '+8% pick rate',
                  },
                  {
                    priority: 'low',
                    title: 'Add comparison page',
                    description: 'Create /compare/confluent page for better positioning',
                    impact: '+5% competitive share',
                  },
                ].map((action, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            action.priority === 'high'
                              ? 'bg-red-100 text-red-700'
                              : action.priority === 'medium'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {action.priority}
                        </span>
                        <h4 className="font-medium">{action.title}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">{action.description}</p>
                      <p className="text-xs text-green-600 font-medium">{action.impact}</p>
                    </div>
                    <Button size="sm">Apply</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}