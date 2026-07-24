'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';
import type { AdminStats, AdminActivityLog } from '@/types/admin';

const EMPTY_STATS: AdminStats = {
  totalUsers: 0,
  newUsersLast30d: 0,
  activeUsersLast7d: 0,
  totalProjects: 0,
  totalPapersSaved: 0,
  totalSearchesLast30d: 0,
  openFeedbackTickets: 0,
  pendingFlags: 0,
};

export function useAdminStats() {
  const [stats, setStats] = useState<AdminStats>(EMPTY_STATS);
  const [activity, setActivity] = useState<AdminActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get<AdminStats & { recentActivity?: AdminActivityLog[] }>('/api/admin/stats')
      .then((data) => {
        if (cancelled) return;
        setStats(data);
        setActivity(data.recentActivity ?? []);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unknown error');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { stats, activity, loading, error };
}
