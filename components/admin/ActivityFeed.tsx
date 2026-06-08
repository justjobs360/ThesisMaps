import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import type { AdminActivityLog } from '@/types/admin';

type ActivityFeedProps = {
  items: AdminActivityLog[];
};

export function ActivityFeed({ items }: ActivityFeedProps) {
  if (!items.length) {
    return <p className="text-sm font-sans text-text-muted text-center py-6">No recent activity.</p>;
  }

  return (
    <ol className="space-y-3">
      {items.map((item) => (
        <li key={item.id} className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center text-xs font-medium text-accent font-sans flex-shrink-0 mt-0.5">
            {(item.adminName?.[0] ?? 'A').toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-sans text-text-primary">
              <span className="font-medium">{item.adminName ?? 'Admin'}</span>{' '}
              <span className="text-text-muted">{item.action}</span>
              {item.targetType ? (
                <span className="text-text-muted"> on {item.targetType}</span>
              ) : null}
            </p>
            <p className="text-xs text-text-muted font-sans mt-0.5">
              {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
