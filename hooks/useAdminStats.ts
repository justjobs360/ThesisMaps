'use client';

import { useState, useEffect } from 'react';
import type { AdminStats } from '@/types/admin';
import { MOCK_ADMIN_STATS } from '@/lib/mockData';

export function useAdminStats() {
  const [stats, setStats] = useState<AdminStats>(MOCK_ADMIN_STATS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      try {
        const res = await fetch('/api/admin/stats');
        if (!res.ok) throw new Error('Failed to load stats');
        const data = (await res.json()) as AdminStats;
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    void fetchStats();
  }, []);

  return { stats, loading, error };
}
