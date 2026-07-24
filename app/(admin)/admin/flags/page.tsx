'use client';

import { useCallback, useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { FlagQueue } from '@/components/admin/FlagQueue';
import { apiClient } from '@/lib/apiClient';
import type { FlagItem } from '@/types/admin';

export default function AdminFlagsPage() {
  const [items, setItems] = useState<FlagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { items: data } = await apiClient.get<{ items: FlagItem[] }>('/api/admin/flags');
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load flags');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function updateFlag(id: string, status: FlagItem['status']) {
    setItems((prev) => prev.map((f) => (f.id === id ? { ...f, status } : f)));
    try {
      await apiClient.patch('/api/admin/flags', { id, status });
    } catch {
      void refresh();
    }
  }

  const pending = items.filter((f) => f.status === 'pending').length;

  return (
    <div className="space-y-5 max-w-4xl">
      <PageHeader
        title="Flag Queue"
        subtitle={loading ? 'Loading…' : `${pending} pending ${pending === 1 ? 'flag requires' : 'flags require'} review.`}
      />
      {error ? <p className="text-sm font-sans text-danger">{error}</p> : null}
      <FlagQueue
        items={items}
        onDismiss={(id) => void updateFlag(id, 'dismissed')}
        onAction={(id) => void updateFlag(id, 'actioned')}
      />
    </div>
  );
}
