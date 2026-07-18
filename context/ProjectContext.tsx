'use client';

import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/apiClient';
import type { ThesisProject } from '@/types/thesis';

type ProjectContextValue = {
  projects: ThesisProject[];
  currentProject: ThesisProject | null;
  /** Convenience: the active project's UUID (empty string until loaded). */
  projectId: string;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  setCurrentProjectId: (id: string) => void;
};

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [projects, setProjects] = useState<ThesisProject[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { projects: fetched } = await apiClient.get<{ projects: ThesisProject[] }>('/api/projects');
      setProjects(fetched);
      setCurrentId((prev) => prev ?? fetched[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    void refresh();
  }, [user, authLoading, refresh]);

  const currentProject = projects.find((p) => p.id === currentId) ?? projects[0] ?? null;

  return (
    <ProjectContext.Provider
      value={{
        projects,
        currentProject,
        projectId: currentProject?.id ?? '',
        loading,
        error,
        refresh,
        setCurrentProjectId: setCurrentId,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject(): ProjectContextValue {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProject must be used within ProjectProvider');
  return ctx;
}
