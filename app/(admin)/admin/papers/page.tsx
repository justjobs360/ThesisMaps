'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PaperTable } from '@/components/admin/PaperTable';
import { apiClient } from '@/lib/apiClient';
import type { Paper } from '@/types/paper';

export default function AdminPapersPage() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get<{ papers: Paper[]; total: number }>('/api/admin/papers')
      .then((data) => {
        if (cancelled) return;
        setPapers(data.papers);
        setTotal(data.total ?? data.papers.length);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load papers');
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
      <PageHeader title="Paper Database" subtitle={loading ? 'Loading…' : `${total} papers indexed`} />
      {error ? <p className="text-sm font-sans text-danger">{error}</p> : null}
      <PaperTable papers={papers} loading={loading} />
    </div>
  );
}
