'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { AlertCircle, Building, Globe, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProjectFormProps {
  onSuccess?: (project: any) => void;
  onCancel?: () => void;
  className?: string;
}

export function ProjectForm({ onSuccess, onCancel, className }: ProjectFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await api.createProject(formData);

      if (response.error) {
        throw new Error(response.error.message);
      }

      onSuccess?.(response.data);

      // Reset form
      setFormData({ name: '', domain: '', description: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = formData.name.trim() && formData.domain.trim();

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5" />
          Create New Project
        </CardTitle>
        <CardDescription>
          Add a project to start tracking your AI findability
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error Message */}
          {error && (
            <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Project Name */}
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
              <Building className="h-4 w-4" />
              Project Name
            </label>
            <Input
              id="name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="My Awesome Project"
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              Choose a descriptive name for your project
            </p>
          </div>

          {/* Domain */}
          <div className="space-y-2">
            <label htmlFor="domain" className="text-sm font-medium flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Domain
            </label>
            <Input
              id="domain"
              type="text"
              required
              value={formData.domain}
              onChange={(e) => setFormData(prev => ({ ...prev, domain: e.target.value }))}
              placeholder="example.com"
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              The primary domain for your project (without https://)
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Description (Optional)
            </label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of what this project does..."
              disabled={isSubmitting}
              className="min-h-[80px]"
            />
            <p className="text-xs text-muted-foreground">
              Help your team understand what this project is about
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Creating...
                </>
              ) : (
                <>
                  <Building className="mr-2 h-4 w-4" />
                  Create Project
                </>
              )}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}