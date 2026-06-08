import type { Metadata } from 'next';
import { PageHeader } from '@/components/layout/PageHeader';
import { FeedbackList } from '@/components/admin/FeedbackList';
import { StatsCard } from '@/components/admin/StatsCard';
import { MOCK_FEEDBACK } from '@/lib/mockData';

export const metadata: Metadata = { title: 'Admin — Feedback', robots: { index: false } };

export default function AdminFeedbackPage() {
  const open = MOCK_FEEDBACK.filter((f) => f.status === 'open').length;
  const resolved = MOCK_FEEDBACK.filter((f) => f.status === 'resolved').length;

  return (
    <div className="space-y-5 max-w-4xl">
      <PageHeader title="Feedback" subtitle="User-submitted bug reports and feature requests." />

      <div className="grid grid-cols-3 gap-4">
        <StatsCard label="Open tickets" value={open} />
        <StatsCard label="In progress" value={MOCK_FEEDBACK.filter((f) => f.status === 'in_progress').length} />
        <StatsCard label="Resolved" value={resolved} />
      </div>

      <FeedbackList items={MOCK_FEEDBACK} />
    </div>
  );
}
