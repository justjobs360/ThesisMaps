import type { Metadata } from 'next';
import { PageHeader } from '@/components/layout/PageHeader';
import { UserTable } from '@/components/admin/UserTable';
import { MOCK_ADMIN_USERS } from '@/lib/mockData';

export const metadata: Metadata = { title: 'Admin — Users', robots: { index: false } };

export default function AdminUsersPage() {
  return (
    <div className="space-y-5 max-w-6xl">
      <PageHeader title="User Management" subtitle={`${MOCK_ADMIN_USERS.length} users registered`} />
      <UserTable users={MOCK_ADMIN_USERS} />
    </div>
  );
}
