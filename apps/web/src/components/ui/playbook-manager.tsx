'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Plus,
  Edit,
  Trash2,
  Play,
  Copy,
  BookOpen,
  Clock,
  Target,
  Users,
  MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Playbook {
  id: string;
  name: string;
  description: string;
  queries: string[];
  models: string[];
  surfaces: string[];
  schedule?: {
    frequency: 'manual' | 'daily' | 'weekly' | 'monthly';
    time?: string;
  };
  tags: string[];
  isActive: boolean;
  createdAt: string;
  lastRun?: string;
  runCount: number;
  author: string;
}

interface PlaybookManagerProps {
  playbooks: Playbook[];
  onCreatePlaybook?: (playbook: Omit<Playbook, 'id' | 'createdAt' | 'runCount'>) => void;
  onUpdatePlaybook?: (id: string, playbook: Partial<Playbook>) => void;
  onDeletePlaybook?: (id: string) => void;
  onRunPlaybook?: (id: string) => void;
  onDuplicatePlaybook?: (id: string) => void;
  className?: string;
}

const availableModels = [
  'gpt-4',
  'gpt-4-turbo',
  'claude-3-opus',
  'claude-3-sonnet',
  'perplexity'
];

const availableSurfaces = [
  'web',
  'social',
  'news',
  'academic'
];

const playbookTags = [
  'competitor-analysis',
  'brand-monitoring',
  'product-launch',
  'content-optimization',
  'seo-research',
  'market-research'
];

function PlaybookForm({
  playbook,
  onSave,
  onCancel
}: {
  playbook?: Playbook;
  onSave: (data: any) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: playbook?.name || '',
    description: playbook?.description || '',
    queries: playbook?.queries || [''],
    models: playbook?.models || ['gpt-4'],
    surfaces: playbook?.surfaces || ['web'],
    schedule: playbook?.schedule || { frequency: 'manual' as const },
    tags: playbook?.tags || [],
    isActive: playbook?.isActive ?? true,
    author: playbook?.author || 'Current User'
  });

  const addQuery = () => {
    setFormData(prev => ({
      ...prev,
      queries: [...prev.queries, '']
    }));
  };

  const updateQuery = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      queries: prev.queries.map((q, i) => i === index ? value : q)
    }));
  };

  const removeQuery = (index: number) => {
    if (formData.queries.length > 1) {
      setFormData(prev => ({
        ...prev,
        queries: prev.queries.filter((_, i) => i !== index)
      }));
    }
  };

  const toggleModel = (model: string) => {
    setFormData(prev => ({
      ...prev,
      models: prev.models.includes(model)
        ? prev.models.filter(m => m !== model)
        : [...prev.models, model]
    }));
  };

  const toggleSurface = (surface: string) => {
    setFormData(prev => ({
      ...prev,
      surfaces: prev.surfaces.includes(surface)
        ? prev.surfaces.filter(s => s !== surface)
        : [...prev.surfaces, surface]
    }));
  };

  const toggleTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{playbook ? 'Edit Playbook' : 'Create New Playbook'}</CardTitle>
        <CardDescription>
          Define queries and testing parameters for automated findability analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Playbook name..."
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the purpose of this playbook..."
                className="min-h-[80px]"
              />
            </div>
          </div>

          {/* Queries */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Test Queries</label>
            {formData.queries.map((query, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={query}
                  onChange={(e) => updateQuery(index, e.target.value)}
                  placeholder={`Query ${index + 1}...`}
                />
                {formData.queries.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeQuery(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addQuery}>
              <Plus className="mr-2 h-4 w-4" />
              Add Query
            </Button>
          </div>

          {/* Models */}
          <div className="space-y-3">
            <label className="text-sm font-medium">AI Models</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {availableModels.map(model => (
                <div
                  key={model}
                  className={cn(
                    'flex items-center space-x-2 p-2 border rounded cursor-pointer',
                    formData.models.includes(model)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                  onClick={() => toggleModel(model)}
                >
                  <Checkbox
                    checked={formData.models.includes(model)}
                    onChange={() => toggleModel(model)}
                  />
                  <span className="text-sm">{model}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Surfaces */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Search Surfaces</label>
            <div className="grid grid-cols-2 gap-2">
              {availableSurfaces.map(surface => (
                <div
                  key={surface}
                  className={cn(
                    'flex items-center space-x-2 p-2 border rounded cursor-pointer',
                    formData.surfaces.includes(surface)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                  onClick={() => toggleSurface(surface)}
                >
                  <Checkbox
                    checked={formData.surfaces.includes(surface)}
                    onChange={() => toggleSurface(surface)}
                  />
                  <span className="text-sm capitalize">{surface}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Schedule */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Schedule</label>
            <Select
              value={formData.schedule.frequency}
              onValueChange={(value: any) => setFormData(prev => ({
                ...prev,
                schedule: { ...prev.schedule, frequency: value }
              }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Tags</label>
            <div className="flex flex-wrap gap-2">
              {playbookTags.map(tag => (
                <Badge
                  key={tag}
                  variant={formData.tags.includes(tag) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button type="submit">
              {playbook ? 'Update Playbook' : 'Create Playbook'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function PlaybookCard({ playbook, onEdit, onDelete, onRun, onDuplicate }: {
  playbook: Playbook;
  onEdit?: () => void;
  onDelete?: () => void;
  onRun?: () => void;
  onDuplicate?: () => void;
}) {
  return (
    <Card className={cn('transition-all hover:shadow-md', !playbook.isActive && 'opacity-60')}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{playbook.name}</CardTitle>
            <CardDescription>{playbook.description}</CardDescription>
          </div>
          <div className="flex gap-1">
            {onRun && (
              <Button variant="outline" size="sm" onClick={onRun}>
                <Play className="h-4 w-4" />
              </Button>
            )}
            <Button variant="outline" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          {playbook.tags.map(tag => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Queries:</span>
              <span className="ml-2 font-medium">{playbook.queries.length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Models:</span>
              <span className="ml-2 font-medium">{playbook.models.length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Schedule:</span>
              <span className="ml-2 font-medium capitalize">{playbook.schedule?.frequency || 'manual'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Runs:</span>
              <span className="ml-2 font-medium">{playbook.runCount}</span>
            </div>
          </div>

          {playbook.lastRun && (
            <div className="text-xs text-muted-foreground">
              Last run: {new Date(playbook.lastRun).toLocaleString()}
            </div>
          )}

          <div className="flex gap-2">
            {onEdit && (
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}
            {onDuplicate && (
              <Button variant="outline" size="sm" onClick={onDuplicate}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </Button>
            )}
            {onDelete && (
              <Button variant="outline" size="sm" onClick={onDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function PlaybookManager({
  playbooks,
  onCreatePlaybook,
  onUpdatePlaybook,
  onDeletePlaybook,
  onRunPlaybook,
  onDuplicatePlaybook,
  className
}: PlaybookManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingPlaybook, setEditingPlaybook] = useState<Playbook | null>(null);
  const [filterTag, setFilterTag] = useState<string>('all');

  const filteredPlaybooks = playbooks.filter(playbook =>
    filterTag === 'all' || playbook.tags.includes(filterTag)
  );

  const allTags = [...new Set(playbooks.flatMap(p => p.tags))];

  const handleSave = (data: any) => {
    if (editingPlaybook) {
      onUpdatePlaybook?.(editingPlaybook.id, data);
    } else {
      onCreatePlaybook?.(data);
    }
    setShowForm(false);
    setEditingPlaybook(null);
  };

  const handleEdit = (playbook: Playbook) => {
    setEditingPlaybook(playbook);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingPlaybook(null);
  };

  if (showForm) {
    return (
      <PlaybookForm
        playbook={editingPlaybook || undefined}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Playbooks</h2>
          <p className="text-muted-foreground">
            Manage your testing scenarios and automation workflows
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={filterTag} onValueChange={setFilterTag}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tags</SelectItem>
              {allTags.map(tag => (
                <SelectItem key={tag} value={tag}>
                  {tag}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Playbook
          </Button>
        </div>
      </div>

      {/* Playbooks Grid */}
      {filteredPlaybooks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlaybooks.map((playbook) => (
            <PlaybookCard
              key={playbook.id}
              playbook={playbook}
              onEdit={() => handleEdit(playbook)}
              onDelete={() => onDeletePlaybook?.(playbook.id)}
              onRun={() => onRunPlaybook?.(playbook.id)}
              onDuplicate={() => onDuplicatePlaybook?.(playbook.id)}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto" />
              <div>
                <h3 className="text-lg font-medium">No Playbooks Found</h3>
                <p className="text-muted-foreground">
                  {filterTag === 'all'
                    ? 'Create your first playbook to start automating your findability tests'
                    : `No playbooks found with the "${filterTag}" tag`
                  }
                </p>
              </div>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create First Playbook
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}