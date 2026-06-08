'use client';

import React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { MoreHorizontal } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Dropdown } from '@/components/ui/Dropdown';
import type { AdminUser } from '@/types/admin';

type UserTableProps = {
  users: AdminUser[];
  loading?: boolean;
  onSuspend?: (id: string) => void;
  onDelete?: (id: string) => void;
};

export function UserTable({ users, loading, onSuspend, onDelete }: UserTableProps) {
  return (
    <DataTable
      data={users}
      loading={loading}
      rowKey={(u) => u.id}
      emptyMessage="No users found."
      columns={[
        {
          key: 'name',
          header: 'User',
          render: (u) => (
            <Link href={`/admin/users/${u.id}`} className="flex items-center gap-3 hover:text-accent transition-colors">
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-xs font-medium text-accent font-sans flex-shrink-0">
                {(u.name?.[0] ?? u.email[0] ?? 'U').toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-text-primary truncate">{u.name ?? '—'}</p>
                <p className="text-xs text-text-muted truncate">{u.email}</p>
              </div>
            </Link>
          ),
        },
        {
          key: 'createdAt',
          header: 'Signed up',
          render: (u) => (
            <span className="text-text-muted">{format(new Date(u.createdAt), 'MMM d, yyyy')}</span>
          ),
        },
        {
          key: 'lastActiveAt',
          header: 'Last active',
          render: (u) => (
            <span className="text-text-muted">
              {u.lastActiveAt ? format(new Date(u.lastActiveAt), 'MMM d, yyyy') : '—'}
            </span>
          ),
        },
        {
          key: 'plan',
          header: 'Plan',
          render: (u) => (
            <Badge variant={u.plan === 'pro' ? 'accent' : 'muted'}>
              {u.plan.charAt(0).toUpperCase() + u.plan.slice(1)}
            </Badge>
          ),
        },
        {
          key: 'status',
          header: 'Status',
          render: (u) => (
            <Badge variant={u.status === 'active' ? 'success' : u.status === 'suspended' ? 'warning' : 'danger'}>
              {u.status.charAt(0).toUpperCase() + u.status.slice(1)}
            </Badge>
          ),
        },
        {
          key: 'projectCount',
          header: 'Projects',
          render: (u) => <span className="text-text-muted">{u.projectCount ?? 0}</span>,
        },
        {
          key: 'actions',
          header: '',
          render: (u) => (
            <Dropdown
              trigger={
                <button className="p-1 rounded hover:bg-background text-text-muted transition-colors" aria-label="User actions">
                  <MoreHorizontal size={16} strokeWidth={1.5} />
                </button>
              }
              items={[
                { label: 'View detail', onClick: () => { window.location.href = `/admin/users/${u.id}`; } },
                { label: 'Suspend', onClick: () => onSuspend?.(u.id), danger: u.status === 'active' },
                { label: 'Delete', onClick: () => onDelete?.(u.id), danger: true },
              ]}
            />
          ),
        },
      ]}
    />
  );
}
