import React from 'react';
import { Tooltip } from '@/components/ui/Tooltip';

type CoverageScoreProps = {
  score: number;
};

export function CoverageScore({ score }: CoverageScoreProps) {
  // Traffic-light coverage. Tokens: success (green), warning (amber), danger (red).
  const tone =
    score >= 75
      ? { text: 'text-success', border: 'border-success', label: 'Good coverage' }
      : score >= 40
      ? { text: 'text-warning', border: 'border-warning', label: 'Moderate coverage' }
      : { text: 'text-danger', border: 'border-danger', label: 'Low coverage' };

  return (
    <Tooltip content={`${tone.label} — based on number of papers, recency, and citation count.`}>
      <span
        className={[
          'inline-flex items-center gap-1 px-2 h-7 border-2 bg-white text-[10px] font-sans font-black uppercase tracking-wider',
          tone.border,
          tone.text,
        ].join(' ')}
      >
        {score}% coverage
      </span>
    </Tooltip>
  );
}
