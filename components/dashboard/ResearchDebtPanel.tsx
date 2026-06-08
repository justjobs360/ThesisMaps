'use client';

import React from 'react';
import { BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MOCK_PAPERS } from '@/lib/mockData';
import type { Paper } from '@/types/paper';

type ResearchDebtPanelProps = {
  papers?: Paper[];
};

export function ResearchDebtPanel({ papers = MOCK_PAPERS.slice(0, 3) }: ResearchDebtPanelProps) {
  return (
    <section aria-labelledby="research-debt-heading" className="bg-surface border border-border rounded-md p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 id="research-debt-heading" className="text-sm font-sans font-semibold text-text-primary">Research Debt</h2>
          <p className="text-xs text-text-muted font-sans mt-0.5">Saved but unread papers that need your attention</p>
        </div>
        <BookOpen size={16} strokeWidth={1.5} className="text-text-muted" />
      </div>

      {papers.length === 0 ? (
        <p className="text-sm text-text-muted font-sans py-4 text-center">No unread papers — you are up to date.</p>
      ) : (
        <ul className="space-y-3">
          {papers.map((paper) => (
            <li key={paper.id} className="flex items-start justify-between gap-3 py-2 border-b border-border last:border-0">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-sans text-text-primary font-medium truncate">{paper.title}</p>
                <p className="text-xs font-sans text-text-muted mt-0.5">{paper.year} · {paper.authors[0]?.name}</p>
              </div>
              <Button size="sm" variant="secondary">Review</Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
