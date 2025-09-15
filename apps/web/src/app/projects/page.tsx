'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LoadingStates } from '@/components/ui/loading';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { ProjectForm } from '@/components/ui/project-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import {
  Plus,
  Building,
  Globe,
  Calendar,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  BarChart3,
} from 'lucide-react';
import Link from 'next/link';

export default function ProjectsPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const queryClient = useQueryClient();

  // Fetch projects
  const { data: projectsData, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await api.getProjects();
      if (response.error) throw new Error(response.error.message);
      return response.data;
    },
  });

  const projects = projectsData?.projects || [];

  const handleProjectCreated = (newProject: any) => {
    // Refresh projects list
    queryClient.invalidateQueries({ queryKey: ['projects'] });
    setShowCreateForm(false);
  };

  if (showCreateForm) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="max-w-2xl mx-auto">
            <ProjectForm
              onSuccess={handleProjectCreated}
              onCancel={() => setShowCreateForm(false)}
            />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Projects</h1>
            <p className="text-muted-foreground">
              Manage your AI findability projects
            </p>
          </div>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>

        {/* Projects Grid */}
        {isLoading ? (
          <LoadingStates.Projects />
        ) : projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project: any) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <EmptyState onCreateProject={() => setShowCreateForm(true)} />
        )}
      </div>
    </DashboardLayout>
  );
}

function ProjectCard({ project }: { project: any }) {
  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              {project.name}
            </CardTitle>
            <CardDescription className="flex items-center gap-1">
              <Globe className="h-3 w-3" />
              {project.domain}
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Description */}
          {project.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {project.description}
            </p>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Queries:</span>
              <span className="ml-1 font-medium">{project._count?.queries || 0}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Last run:</span>
              <span className="ml-1 font-medium">
                {project.lastRunAt
                  ? new Date(project.lastRunAt).toLocaleDateString()
                  : 'Never'
                }
              </span>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-2">
            <Badge
              variant={project.status === 'active' ? 'default' : 'secondary'}
              className="text-xs"
            >
              {project.status || 'active'}
            </Badge>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {new Date(project.createdAt).toLocaleDateString()}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Link href={`/projects/${project.id}`} className="flex-1">
              <Button variant="outline" size="sm" className="w-full">
                <Eye className="mr-2 h-4 w-4" />
                View
              </Button>
            </Link>
            <Link href={`/projects/${project.id}/metrics`}>
              <Button variant="outline" size="sm">
                <BarChart3 className="h-4 w-4" />
              </Button>
            </Link>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ onCreateProject }: { onCreateProject: () => void }) {
  return (
    <Card className="text-center py-16">
      <CardContent>
        <div className="space-y-4">
          <div className="mx-auto h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center">
            <Building className="h-8 w-8 text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg font-medium">No projects yet</h3>
            <p className="text-muted-foreground">
              Create your first project to start tracking AI findability
            </p>
          </div>
          <Button onClick={onCreateProject}>
            <Plus className="mr-2 h-4 w-4" />
            Create Your First Project
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}