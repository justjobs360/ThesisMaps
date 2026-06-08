import type { Metadata } from 'next';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatsCard } from '@/components/admin/StatsCard';
import { ActivityFeed } from '@/components/admin/ActivityFeed';
import { SignupChart, DauChart, TopQueriesChart } from '@/components/admin/AnalyticsCharts';
import { MOCK_ADMIN_STATS } from '@/lib/mockData';
import { Users, FolderOpen, Search, MessageSquare, Flag, BookOpen } from 'lucide-react';

export const metadata: Metadata = { title: 'Admin Overview', robots: { index: false } };

const MOCK_ACTIVITY = [
  { id: '1', adminId: 'a1', adminName: 'Carol Davies', action: 'suspended user', targetType: 'user', targetId: 'u4', createdAt: '2024-07-20T15:00:00Z' },
  { id: '2', adminId: 'a1', adminName: 'Carol Davies', action: 'resolved feedback ticket', targetType: 'feedback', targetId: 'f1', createdAt: '2024-07-20T14:30:00Z' },
  { id: '3', adminId: 'a1', adminName: 'Carol Davies', action: 'dismissed flag', targetType: 'flag', targetId: 'fl2', createdAt: '2024-07-19T10:00:00Z' },
];

export default function AdminOverviewPage() {
  const stats = MOCK_ADMIN_STATS;

  return (
    <div className="space-y-6 max-w-6xl">
      <PageHeader title="Admin Overview" subtitle="Platform health and activity summary." />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatsCard label="Total Users" value={stats.totalUsers} icon={<Users size={16} strokeWidth={1.5} />} sub={`+${stats.newUsersLast30d} this month`} />
        <StatsCard label="Active (7d)" value={stats.activeUsersLast7d} icon={<Users size={16} strokeWidth={1.5} />} />
        <StatsCard label="Projects" value={stats.totalProjects} icon={<FolderOpen size={16} strokeWidth={1.5} />} />
        <StatsCard label="Papers Saved" value={stats.totalPapersSaved} icon={<BookOpen size={16} strokeWidth={1.5} />} />
        <StatsCard label="Searches (30d)" value={stats.totalSearchesLast30d} icon={<Search size={16} strokeWidth={1.5} />} />
        <StatsCard label="Open Tickets" value={stats.openFeedbackTickets} icon={<MessageSquare size={16} strokeWidth={1.5} />} sub={`${stats.pendingFlags} pending flags`} />
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <SignupChart />
        <DauChart />
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        <div className="md:col-span-2">
          <TopQueriesChart />
        </div>
        <section aria-labelledby="activity-heading" className="bg-surface border border-border rounded-md p-5 shadow-sm">
          <h2 id="activity-heading" className="text-sm font-sans font-semibold text-text-primary mb-4">Recent Admin Activity</h2>
          <ActivityFeed items={MOCK_ACTIVITY} />
        </section>
      </div>
    </div>
  );
}
