'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { ProjectTable } from '@/components/admin/ProjectTable';
import { apiClient } from '@/lib/apiClient';
import type { ThesisProject } from '@/types/thesis';

type ProjectRow = ThesisProject & { ownerEmail?: string; paperCount?: number; collaboratorCount?: number };

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get<{ projects: ProjectRow[]; total: number }>('/api/admin/projects')
      .then((data) => {
        if (cancelled) return;
        setProjects(data.projects);
        setTotal(data.total ?? data.projects.length);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load projects');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-5 max-w-6xl">
      <PageHeader title="Project Browser" subtitle={loading ? 'Loading…' : `${total} projects total`} />
      {error ? <p className="text-sm font-sans text-danger">{error}</p> : null}
      <ProjectTable projects={projects} loading={loading} />
    </div>
  );
}
