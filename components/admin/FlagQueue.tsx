'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { FlagItem } from '@/types/admin';

type FlagQueueProps = {
  items: FlagItem[];
  onDismiss?: (id: string) => void;
  onAction?: (id: string) => void;
};

export function FlagQueue({ items, onDismiss, onAction }: FlagQueueProps) {
  if (!items.length) {
    return (
      <div className="text-center py-12">
        <p className="text-sm font-sans text-text-muted">No pending flags. Everything looks clean.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((flag) => (
        <li key={flag.id} className="border border-border rounded-md bg-surface p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={flag.status === 'pending' ? 'warning' : 'muted'}>
                  {flag.status}
                </Badge>
                <Badge variant="default">{flag.entityType}</Badge>
              </div>
              <p className="text-sm font-sans text-text-primary">{flag.reason}</p>
              <p className="text-xs text-text-muted font-sans mt-1">
                Flagged by {flag.flaggedByEmail ?? 'unknown'} · {format(new Date(flag.createdAt), 'MMM d, yyyy')}
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => onDismiss?.(flag.id)}>Dismiss</Button>
              <Button size="sm" variant="danger" onClick={() => onAction?.(flag.id)}>Take Action</Button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
