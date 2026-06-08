import type { Metadata } from 'next';
import { PageHeader } from '@/components/layout/PageHeader';
import { PaperTable } from '@/components/admin/PaperTable';
import { MOCK_PAPERS } from '@/lib/mockData';

export const metadata: Metadata = { title: 'Admin — Papers', robots: { index: false } };

export default function AdminPapersPage() {
  return (
    <div className="space-y-5 max-w-6xl">
      <PageHeader title="Paper Database" subtitle={`${MOCK_PAPERS.length} papers indexed`} />
      <PaperTable papers={MOCK_PAPERS} />
    </div>
  );
}
