'use client';

import Link from 'next/link';
import { Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export function AdminTopbar() {
  const { user } = useAuth();
  const initials = (user?.displayName?.[0] ?? user?.email?.[0] ?? 'A').toUpperCase();

  return (
    <header className="fixed top-0 left-[220px] right-0 h-[52px] bg-admin-bg border-b border-border flex items-center px-5 gap-4 z-20">
      <div className="flex items-center gap-2 text-sm font-sans text-text-muted">
        <Shield size={14} strokeWidth={1.5} className="text-accent" />
        <span className="font-medium text-text-primary">Admin Panel</span>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="text-xs font-sans text-text-muted hover:text-text-primary transition-colors"
        >
          Exit Admin
        </Link>
        <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-xs font-medium text-accent font-sans">
          {initials}
        </div>
      </div>
    </header>
  );
}
