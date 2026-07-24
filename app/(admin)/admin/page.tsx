'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatsCard } from '@/components/admin/StatsCard';
import { ActivityFeed } from '@/components/admin/ActivityFeed';
import { SignupChart, DauChart, TopQueriesChart, type DataPoint } from '@/components/admin/AnalyticsCharts';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAdminStats } from '@/hooks/useAdminStats';
import { apiClient } from '@/lib/apiClient';
import { Users, FolderOpen, Search, MessageSquare, BookOpen } from 'lucide-react';

type ChartData = { signups: DataPoint[]; dau: DataPoint[]; topQueries: DataPoint[] };

export default function AdminOverviewPage() {
  const { stats, activity, loading, error } = useAdminStats();
  const [charts, setCharts] = useState<ChartData>({ signups: [], dau: [], topQueries: [] });

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get<ChartData>('/api/admin/analytics')
      .then((data) => {
        if (!cancelled) setCharts(data);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6 max-w-6xl">
      <PageHeader title="Admin Overview" subtitle="Platform health and activity summary." />

      {error ? (
        <div className="bg-surface border border-border rounded-md p-5">
          <p className="text-sm font-sans text-danger">Failed to load stats: {error}</p>
        </div>
      ) : null}

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatsCard label="Total Users" value={stats.totalUsers} icon={<Users size={16} strokeWidth={1.5} />} sub={`+${stats.newUsersLast30d} this month`} />
          <StatsCard label="Active (7d)" value={stats.activeUsersLast7d} icon={<Users size={16} strokeWidth={1.5} />} />
          <StatsCard label="Projects" value={stats.totalProjects} icon={<FolderOpen size={16} strokeWidth={1.5} />} />
          <StatsCard label="Papers Saved" value={stats.totalPapersSaved} icon={<BookOpen size={16} strokeWidth={1.5} />} />
          <StatsCard label="Searches (30d)" value={stats.totalSearchesLast30d} icon={<Search size={16} strokeWidth={1.5} />} />
          <StatsCard label="Open Tickets" value={stats.openFeedbackTickets} icon={<MessageSquare size={16} strokeWidth={1.5} />} sub={`${stats.pendingFlags} pending flags`} />
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-5">
        <SignupChart data={charts.signups} />
        <DauChart data={charts.dau} />
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        <div className="md:col-span-2">
          <TopQueriesChart data={charts.topQueries} />
        </div>
        <section aria-labelledby="activity-heading" className="bg-surface border border-border rounded-md p-5 shadow-sm">
          <h2 id="activity-heading" className="text-sm font-sans font-semibold text-text-primary mb-4">Recent Admin Activity</h2>
          {loading ? <Skeleton className="h-32 w-full" /> : <ActivityFeed items={activity} />}
        </section>
      </div>
    </div>
  );
}
