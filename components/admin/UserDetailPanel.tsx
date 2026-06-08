'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { AdminUser } from '@/types/admin';

type UserDetailPanelProps = {
  user: AdminUser;
  onSuspend?: () => void;
  onDelete?: () => void;
  onPromote?: () => void;
};

export function UserDetailPanel({ user, onSuspend, onDelete, onPromote }: UserDetailPanelProps) {
  const [notes, setNotes] = useState(user.adminNotes ?? '');

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-full bg-accent/20 flex items-center justify-center text-xl font-medium text-accent font-sans flex-shrink-0">
          {(user.name?.[0] ?? user.email[0] ?? 'U').toUpperCase()}
        </div>
        <div>
          <h2 className="font-serif text-xl text-text-primary">{user.name ?? '—'}</h2>
          <p className="text-sm text-text-muted font-sans">{user.email}</p>
          <div className="flex gap-2 mt-2">
            <Badge variant={user.status === 'active' ? 'success' : 'warning'}>{user.status}</Badge>
            <Badge variant={user.plan === 'pro' ? 'accent' : 'muted'}>{user.plan}</Badge>
            {user.role === 'admin' ? <Badge variant="danger">Admin</Badge> : null}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm font-sans">
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wide font-medium">Joined</p>
          <p className="text-text-primary">{format(new Date(user.createdAt), 'PPP')}</p>
        </div>
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wide font-medium">Last Active</p>
          <p className="text-text-primary">
            {user.lastActiveAt ? format(new Date(user.lastActiveAt), 'PPP') : '—'}
          </p>
        </div>
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wide font-medium">Projects</p>
          <p className="text-text-primary">{user.projectCount ?? 0}</p>
        </div>
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wide font-medium">User ID</p>
          <p className="text-text-primary font-mono text-xs">{user.id}</p>
        </div>
      </div>

      <div>
        <label htmlFor="admin-notes" className="block text-xs text-text-muted uppercase tracking-wide font-medium font-sans mb-2">
          Admin Notes
        </label>
        <textarea
          id="admin-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full rounded border border-border bg-background px-3 py-2 text-sm font-sans text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent resize-none"
          placeholder="Internal notes about this user…"
        />
      </div>

      <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
        {user.role !== 'admin' ? (
          <Button size="sm" variant="secondary" onClick={onPromote}>Promote to Admin</Button>
        ) : null}
        <Button size="sm" variant="secondary" onClick={onSuspend}>
          {user.status === 'suspended' ? 'Unsuspend' : 'Suspend'}
        </Button>
        <Button size="sm" variant="danger" onClick={onDelete}>Delete Account</Button>
      </div>
    </div>
  );
}
