import type { Metadata } from 'next';
import { PageHeader } from '@/components/layout/PageHeader';
import { FlagQueue } from '@/components/admin/FlagQueue';
import { MOCK_FLAGS } from '@/lib/mockData';

export const metadata: Metadata = { title: 'Admin — Flag Queue', robots: { index: false } };

export default function AdminFlagsPage() {
  return (
    <div className="space-y-5 max-w-4xl">
      <PageHeader
        title="Flag Queue"
        subtitle={`${MOCK_FLAGS.filter((f) => f.status === 'pending').length} pending flags require review.`}
      />
      <FlagQueue items={MOCK_FLAGS} />
    </div>
  );
}
