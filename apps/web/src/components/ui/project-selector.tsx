'use client';

import { useState } from 'react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface Project {
  id: string;
  name: string;
  slug: string;
  domain?: string;
}

interface ProjectSelectorProps {
  projects: Project[];
  selectedProject?: string;
  onProjectChange: (projectId: string) => void;
  onCreateProject?: () => void;
  className?: string;
}

export function ProjectSelector({
  projects,
  selectedProject,
  onProjectChange,
  onCreateProject,
  className,
}: ProjectSelectorProps) {
  const [open, setOpen] = useState(false);

  const selectedProjectData = projects.find((p) => p.id === selectedProject);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('justify-between min-w-[200px]', className)}
        >
          {selectedProjectData ? (
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center bg-blue-100 rounded text-xs font-medium text-blue-700">
                {selectedProjectData.name.charAt(0).toUpperCase()}
              </div>
              <span className="truncate">{selectedProjectData.name}</span>
            </div>
          ) : (
            'Select project...'
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0">
        <Command>
          <CommandInput placeholder="Search projects..." />
          <CommandEmpty>No projects found.</CommandEmpty>
          <CommandGroup>
            {projects.map((project) => (
              <CommandItem
                key={project.id}
                value={project.id}
                onSelect={() => {
                  onProjectChange(project.id);
                  setOpen(false);
                }}
              >
                <div className="flex items-center gap-2 flex-1">
                  <div className="flex h-6 w-6 items-center justify-center bg-blue-100 rounded text-xs font-medium text-blue-700">
                    {project.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{project.name}</div>
                    {project.domain && (
                      <div className="text-xs text-muted-foreground">{project.domain}</div>
                    )}
                  </div>
                </div>
                <Check
                  className={cn(
                    'ml-auto h-4 w-4',
                    selectedProject === project.id ? 'opacity-100' : 'opacity-0'
                  )}
                />
              </CommandItem>
            ))}
            {onCreateProject && (
              <>
                <div className="border-t my-1" />
                <CommandItem
                  onSelect={() => {
                    onCreateProject();
                    setOpen(false);
                  }}
                  className="text-blue-600"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create new project
                </CommandItem>
              </>
            )}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}