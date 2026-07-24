'use client';

import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { apiClient } from '@/lib/apiClient';
import type { SavedPaper } from '@/types/paper';

type ResearchDebtPanelProps = {
  savedPapers: SavedPaper[];
  loading?: boolean;
};

export function ResearchDebtPanel({ savedPapers, loading }: ResearchDebtPanelProps) {
  const [reviewed, setReviewed] = useState<Set<string>>(new Set());

  const visible = savedPapers.filter((s) => !reviewed.has(s.id)).slice(0, 5);

  async function handleReview(saved: SavedPaper) {
    // Open the paper and mark it as read so it drops off the debt list.
    if (saved.paper.url) window.open(saved.paper.url, '_blank', 'noopener,noreferrer');
    setReviewed((prev) => new Set(prev).add(saved.id));
    try {
      await apiClient.patch('/api/papers/save', { savedId: saved.id, readStatus: 'read' });
    } catch {
      setReviewed((prev) => {
        const next = new Set(prev);
        next.delete(saved.id);
        return next;
      });
    }
  }

  return (
    <section aria-labelledby="research-debt-heading" className="bg-surface border border-border rounded-md p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 id="research-debt-heading" className="text-sm font-sans font-semibold text-text-primary">Research Debt</h2>
          <p className="text-xs text-text-muted font-sans mt-0.5">Saved but unread papers that need your attention</p>
        </div>
        <BookOpen size={16} strokeWidth={1.5} className="text-text-muted" />
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
      ) : visible.length === 0 ? (
        <p className="text-sm text-text-muted font-sans py-4 text-center">No unread papers — you are up to date.</p>
      ) : (
        <ul className="space-y-3">
          {visible.map((saved) => (
            <li key={saved.id} className="flex items-start justify-between gap-3 py-2 border-b border-border last:border-0">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-sans text-text-primary font-medium truncate">{saved.paper.title}</p>
                <p className="text-xs font-sans text-text-muted mt-0.5">
                  {saved.paper.year || '—'} · {saved.paper.authors[0]?.name ?? 'Unknown'}
                </p>
              </div>
              <Button size="sm" variant="secondary" onClick={() => void handleReview(saved)}>Review</Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
