'use client';

import { useCallback, useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { UserTable } from '@/components/admin/UserTable';
import { apiClient } from '@/lib/apiClient';
import type { AdminUser } from '@/types/admin';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get<{ users: AdminUser[]; total: number }>('/api/admin/users');
      setUsers(data.users);
      setTotal(data.total ?? data.users.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleSuspend(id: string) {
    const target = users.find((u) => u.id === id);
    const nextStatus = target?.status === 'suspended' ? 'active' : 'suspended';
    try {
      await apiClient.patch(`/api/admin/users/${id}`, { status: nextStatus });
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status: nextStatus } : u)));
    } catch {
      void refresh();
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this user and all their data? This cannot be undone.')) return;
    try {
      await apiClient.del(`/api/admin/users/${id}`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setTotal((t) => Math.max(0, t - 1));
    } catch {
      void refresh();
    }
  }

  return (
    <div className="space-y-5 max-w-6xl">
      <PageHeader title="User Management" subtitle={loading ? 'Loading…' : `${total} users registered`} />
      {error ? <p className="text-sm font-sans text-danger">{error}</p> : null}
      <UserTable users={users} loading={loading} onSuspend={handleSuspend} onDelete={handleDelete} />
    </div>
  );
}
