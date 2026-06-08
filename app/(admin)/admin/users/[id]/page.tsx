import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { UserDetailPanel } from '@/components/admin/UserDetailPanel';
import { MOCK_ADMIN_USERS } from '@/lib/mockData';

export const metadata: Metadata = { title: 'Admin — User Detail', robots: { index: false } };

export default function AdminUserDetailPage({ params }: { params: { id: string } }) {
  const user = MOCK_ADMIN_USERS.find((u) => u.id === params.id) ?? MOCK_ADMIN_USERS[0]!;

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <Link
          href="/admin/users"
          className="flex items-center gap-1 text-sm font-sans text-text-muted hover:text-text-primary transition-colors mb-4"
        >
          <ChevronLeft size={14} strokeWidth={1.5} /> Back to Users
        </Link>
        <h1 className="font-serif text-2xl text-text-primary">User Detail</h1>
      </div>

      <div className="bg-surface border border-border rounded-md p-6 shadow-sm">
        <UserDetailPanel user={user} />
      </div>
    </div>
  );
}
