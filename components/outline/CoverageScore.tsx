import React from 'react';
import { Tooltip } from '@/components/ui/Tooltip';

type CoverageScoreProps = {
  score: number;
};

export function CoverageScore({ score }: CoverageScoreProps) {
  const color = score >= 75 ? 'text-success' : score >= 40 ? 'text-warning' : 'text-danger';
  const bg = score >= 75 ? 'bg-success/10 border-success/20' : score >= 40 ? 'bg-warning/10 border-warning/20' : 'bg-danger/10 border-danger/20';
  const label = score >= 75 ? 'Good coverage' : score >= 40 ? 'Moderate coverage' : 'Low coverage';

  return (
    <Tooltip content={`${label} — based on number of papers, recency, and citation count.`}>
      <span className={['inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-sans font-medium', bg, color].join(' ')}>
        {score}% coverage
      </span>
    </Tooltip>
  );
}
