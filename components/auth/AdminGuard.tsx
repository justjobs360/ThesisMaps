'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/apiClient';

/**
 * Client-side gate for /admin/*: requires a signed-in user whose users.role is
 * 'admin' (checked against /api/me). Non-admins are sent to /dashboard,
 * signed-out visitors to /login. Server routes remain the source of truth —
 * every /api/admin/* route still enforces requireAdmin() independently.
 */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [role, setRole] = useState<'checking' | 'admin' | 'denied'>('checking');

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
      return;
    }
    let cancelled = false;
    apiClient
      .get<{ user: { role: string } }>('/api/me')
      .then(({ user: me }) => {
        if (!cancelled) setRole(me.role === 'admin' ? 'admin' : 'denied');
      })
      .catch(() => {
        if (!cancelled) setRole('denied');
      });
    return () => {
      cancelled = true;
    };
  }, [user, loading, router, pathname]);

  useEffect(() => {
    if (role === 'denied') router.push('/dashboard');
  }, [role, router]);

  if (loading || role === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-[10px] font-sans font-black uppercase tracking-[0.2em] animate-pulse">Verifying admin access…</p>
      </div>
    );
  }

  if (!user || role !== 'admin') return null;

  return <>{children}</>;
}
