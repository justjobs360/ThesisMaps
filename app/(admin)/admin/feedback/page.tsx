'use client';

import { useCallback, useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { FeedbackList } from '@/components/admin/FeedbackList';
import { StatsCard } from '@/components/admin/StatsCard';
import { apiClient } from '@/lib/apiClient';
import type { FeedbackItem } from '@/types/admin';

export default function AdminFeedbackPage() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { items: data } = await apiClient.get<{ items: FeedbackItem[] }>('/api/admin/feedback');
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load feedback');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleUpdateStatus(id: string, status: FeedbackItem['status']) {
    setItems((prev) => prev.map((f) => (f.id === id ? { ...f, status } : f)));
    try {
      await apiClient.patch('/api/admin/feedback', { id, status });
    } catch {
      void refresh();
    }
  }

  const open = items.filter((f) => f.status === 'open').length;
  const inProgress = items.filter((f) => f.status === 'in_progress').length;
  const resolved = items.filter((f) => f.status === 'resolved').length;

  return (
    <div className="space-y-5 max-w-4xl">
      <PageHeader title="Feedback" subtitle="User-submitted bug reports and feature requests." />

      <div className="grid grid-cols-3 gap-4">
        <StatsCard label="Open tickets" value={open} />
        <StatsCard label="In progress" value={inProgress} />
        <StatsCard label="Resolved" value={resolved} />
      </div>

      {error ? <p className="text-sm font-sans text-danger">{error}</p> : null}
      {loading ? (
        <p className="text-sm font-sans text-text-muted">Loading feedback…</p>
      ) : items.length === 0 ? (
        <p className="text-sm font-sans text-text-muted text-center py-10">No feedback submitted yet.</p>
      ) : (
        <FeedbackList items={items} onUpdateStatus={handleUpdateStatus} />
      )}
    </div>
  );
}
