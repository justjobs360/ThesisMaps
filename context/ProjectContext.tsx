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
  /** Creates a project, then selects it. Returns the new project. */
  createProject: (input: { title: string; field?: string }) => Promise<ThesisProject>;
};

const ProjectContext = createContext<ProjectContextValue | null>(null);

// The active project is remembered per browser. Without this the selection
// resets to projects[0] on every reload, which makes switching look broken.
const STORAGE_KEY = 'thesismaps:currentProjectId';

function readStoredId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null; // private mode / storage disabled
  }
}

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [projects, setProjects] = useState<ThesisProject[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Rehydrate the last selection on mount (client only, so SSR stays stable).
  useEffect(() => {
    const stored = readStoredId();
    if (stored) setCurrentId(stored);
  }, []);

  const selectProject = useCallback((id: string) => {
    setCurrentId(id);
    try {
      window.localStorage.setItem(STORAGE_KEY, id);
    } catch {
      /* storage unavailable — selection still works for this session */
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { projects: fetched } = await apiClient.get<{ projects: ThesisProject[] }>('/api/projects');
      setProjects(fetched);
      // Keep the current selection if it still exists, else fall back to the first.
      setCurrentId((prev) => (prev && fetched.some((p) => p.id === prev) ? prev : fetched[0]?.id ?? null));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project');
    } finally {
      setLoading(false);
    }
  }, []);

  const createProject = useCallback(
    async (input: { title: string; field?: string }) => {
      const { project } = await apiClient.post<{ project: ThesisProject }>('/api/projects', input);
      setProjects((prev) => [...prev, project]);
      selectProject(project.id);
      return project;
    },
    [selectProject]
  );

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
        setCurrentProjectId: selectProject,
        createProject,
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
