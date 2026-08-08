'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { UserDetailPanel } from '@/components/admin/UserDetailPanel';
import { Skeleton } from '@/components/ui/Skeleton';
import { apiClient } from '@/lib/apiClient';
import type { AdminUser } from '@/types/admin';

export default function AdminUserDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { user: data } = await apiClient.get<{ user: AdminUser }>(`/api/admin/users/${params.id}`);
      setUser(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleSuspend() {
    if (!user) return;
    const nextStatus = user.status === 'suspended' ? 'active' : 'suspended';
    await apiClient.patch(`/api/admin/users/${user.id}`, { status: nextStatus }).catch(() => undefined);
    void refresh();
  }

  async function handlePromote() {
    if (!user) return;
    await apiClient.patch(`/api/admin/users/${user.id}`, { role: 'admin' }).catch(() => undefined);
    void refresh();
  }

  async function handleSaveNotes(adminNotes: string) {
    if (!user) return;
    // Let errors propagate — the panel surfaces them next to the textarea.
    await apiClient.patch(`/api/admin/users/${user.id}`, { adminNotes });
    void refresh();
  }

  async function handleDelete() {
    if (!user) return;
    if (!window.confirm('Delete this user and all their data? This cannot be undone.')) return;
    try {
      await apiClient.del(`/api/admin/users/${user.id}`);
      router.push('/admin/users');
    } catch {
      void refresh();
    }
  }

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
        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : error || !user ? (
          <p className="text-sm font-sans text-danger">{error ?? 'User not found.'}</p>
        ) : (
          <UserDetailPanel
            user={user}
            onSuspend={handleSuspend}
            onPromote={handlePromote}
            onDelete={handleDelete}
            onSaveNotes={handleSaveNotes}
          />
        )}
      </div>
    </div>
  );
}
