'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, X, Play, Bot } from 'lucide-react';

interface QueryBuilderProps {
  projectId?: string;
  onSubmit?: (data: QuerySubmission) => void;
  className?: string;
}

interface QuerySubmission {
  projectId: string;
  queries: string[];
  models: string[];
  surfaces: string[];
  priority: 'low' | 'normal' | 'high';
  runCount: number;
}

const availableModels = [
  { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI', icon: '🤖' },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'OpenAI', icon: '🚀' },
  { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'Anthropic', icon: '🧠' },
  { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', provider: 'Anthropic', icon: '📝' },
  { id: 'perplexity', name: 'Perplexity', provider: 'Perplexity', icon: '🔍' },
];

const surfaces = [
  { id: 'web', name: 'Web Search', description: 'General web search context' },
  { id: 'social', name: 'Social Media', description: 'Twitter, LinkedIn, etc.' },
  { id: 'news', name: 'News', description: 'News articles and reports' },
  { id: 'academic', name: 'Academic', description: 'Research papers and academic sources' },
];

export function QueryBuilder({ projectId, onSubmit, className }: QueryBuilderProps) {
  const [queries, setQueries] = useState<string[]>(['']);
  const [selectedModels, setSelectedModels] = useState<string[]>(['gpt-4', 'claude-3-opus']);
  const [selectedSurfaces, setSelectedSurfaces] = useState<string[]>(['web']);
  const [priority, setPriority] = useState<'low' | 'normal' | 'high'>('normal');
  const [runCount, setRunCount] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addQuery = () => {
    setQueries([...queries, '']);
  };

  const updateQuery = (index: number, value: string) => {
    const updated = [...queries];
    updated[index] = value;
    setQueries(updated);
  };

  const removeQuery = (index: number) => {
    if (queries.length > 1) {
      setQueries(queries.filter((_, i) => i !== index));
    }
  };

  const toggleModel = (modelId: string) => {
    setSelectedModels(prev =>
      prev.includes(modelId)
        ? prev.filter(id => id !== modelId)
        : [...prev, modelId]
    );
  };

  const toggleSurface = (surfaceId: string) => {
    setSelectedSurfaces(prev =>
      prev.includes(surfaceId)
        ? prev.filter(id => id !== surfaceId)
        : [...prev, surfaceId]
    );
  };

  const handleSubmit = async () => {
    if (!projectId || !queries.some(q => q.trim()) || selectedModels.length === 0) {
      return;
    }

    setIsSubmitting(true);

    const submission: QuerySubmission = {
      projectId,
      queries: queries.filter(q => q.trim()),
      models: selectedModels,
      surfaces: selectedSurfaces,
      priority,
      runCount,
    };

    try {
      await onSubmit?.(submission);
    } catch (error) {
      console.error('Failed to submit queries:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = projectId && queries.some(q => q.trim()) && selectedModels.length > 0;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="h-5 w-5" />
          Run New Queries
        </CardTitle>
        <CardDescription>
          Test your findability across multiple AI models and surfaces
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Queries Section */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Queries to Test</label>
          {queries.map((query, index) => (
            <div key={index} className="flex gap-2">
              <Textarea
                placeholder={`Enter query ${index + 1}...`}
                value={query}
                onChange={(e) => updateQuery(index, e.target.value)}
                className="min-h-[80px]"
              />
              {queries.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeQuery(index)}
                  className="mt-1"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addQuery} className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Add Another Query
          </Button>
        </div>

        {/* AI Models Section */}
        <div className="space-y-3">
          <label className="text-sm font-medium">AI Models</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {availableModels.map((model) => (
              <div
                key={model.id}
                className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedModels.includes(model.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => toggleModel(model.id)}
              >
                <Checkbox
                  checked={selectedModels.includes(model.id)}
                  onChange={() => toggleModel(model.id)}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{model.icon}</span>
                    <span className="font-medium">{model.name}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{model.provider}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Surfaces Section */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Search Surfaces</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {surfaces.map((surface) => (
              <div
                key={surface.id}
                className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedSurfaces.includes(surface.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => toggleSurface(surface.id)}
              >
                <Checkbox
                  checked={selectedSurfaces.includes(surface.id)}
                  onChange={() => toggleSurface(surface.id)}
                />
                <div className="flex-1">
                  <div className="font-medium">{surface.name}</div>
                  <div className="text-xs text-muted-foreground">{surface.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Priority</label>
            <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low Priority</SelectItem>
                <SelectItem value="normal">Normal Priority</SelectItem>
                <SelectItem value="high">High Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Runs per Query</label>
            <Select value={runCount.toString()} onValueChange={(value) => setRunCount(parseInt(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 run</SelectItem>
                <SelectItem value="3">3 runs</SelectItem>
                <SelectItem value="5">5 runs</SelectItem>
                <SelectItem value="10">10 runs</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={!isValid || isSubmitting}
          className="w-full"
          size="lg"
        >
          {isSubmitting ? (
            <>
              <Bot className="mr-2 h-4 w-4 animate-spin" />
              Running Queries...
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Run {queries.filter(q => q.trim()).length} {queries.filter(q => q.trim()).length === 1 ? 'Query' : 'Queries'}
            </>
          )}
        </Button>

        {/* Summary */}
        {isValid && (
          <div className="text-sm text-muted-foreground border-t pt-4">
            <div>
              This will run {queries.filter(q => q.trim()).length} {queries.filter(q => q.trim()).length === 1 ? 'query' : 'queries'}
              × {selectedModels.length} {selectedModels.length === 1 ? 'model' : 'models'}
              × {runCount} {runCount === 1 ? 'run' : 'runs'}
              = {queries.filter(q => q.trim()).length * selectedModels.length * runCount} total executions
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}