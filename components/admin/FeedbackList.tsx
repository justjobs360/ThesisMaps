'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import type { FeedbackItem } from '@/types/admin';

type FeedbackListProps = {
  items: FeedbackItem[];
};

const TYPE_VARIANT: Record<string, 'accent' | 'danger' | 'muted'> = {
  bug: 'danger',
  feature: 'accent',
  general: 'muted',
  content: 'muted',
};

export function FeedbackList({ items }: FeedbackListProps) {
  const [selected, setSelected] = useState<FeedbackItem | null>(null);

  return (
    <>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <button
              onClick={() => setSelected(item)}
              className="w-full text-left p-4 rounded-md border border-border bg-surface hover:border-text-muted transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={TYPE_VARIANT[item.type] ?? 'muted'}>{item.type}</Badge>
                    <Badge variant={item.status === 'open' ? 'warning' : item.status === 'resolved' ? 'success' : 'muted'}>
                      {item.status}
                    </Badge>
                  </div>
                  <p className="text-sm font-sans font-medium text-text-primary truncate">{item.subject}</p>
                  <p className="text-xs text-text-muted font-sans mt-0.5">
                    {item.userName ?? 'Anonymous'} · {format(new Date(item.createdAt), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>

      {selected ? (
        <Modal open title={selected.subject} onClose={() => setSelected(null)}>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Badge variant={TYPE_VARIANT[selected.type] ?? 'muted'}>{selected.type}</Badge>
              <Badge variant="muted">{selected.status}</Badge>
            </div>
            <p className="text-xs text-text-muted font-sans">
              From: {selected.userName ?? 'Anonymous'} ({selected.userEmail ?? '—'})
            </p>
            <p className="text-sm font-sans text-text-primary leading-relaxed border border-border rounded p-3 bg-background">
              {selected.message}
            </p>
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="secondary" onClick={() => setSelected(null)}>Close</Button>
              <Button size="sm" variant="primary">Mark Resolved</Button>
            </div>
          </div>
        </Modal>
      ) : null}
    </>
  );
}
