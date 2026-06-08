'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { THESIS_STAGES, type ThesisStage } from '@/types/thesis';
import { Tooltip } from '@/components/ui/Tooltip';

type StageTrackerProps = {
  currentStage: ThesisStage;
  onStageClick?: (stage: ThesisStage) => void;
};

export function StageTracker({ currentStage, onStageClick }: StageTrackerProps) {
  const currentIndex = THESIS_STAGES.findIndex((s) => s.id === currentStage);

  return (
    <nav aria-label="Thesis progress" className="bg-surface border border-border rounded-md p-5 shadow-sm">
      <p className="text-xs font-sans font-medium text-text-muted uppercase tracking-wide mb-4">Research Stage</p>
      <ol className="flex items-center gap-0">
        {THESIS_STAGES.map((stage, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isUpcoming = index > currentIndex;

          return (
            <React.Fragment key={stage.id}>
              <li className="flex flex-col items-center gap-2">
                <Tooltip content={stage.label} side="top">
                  <button
                    onClick={() => onStageClick?.(stage.id)}
                    aria-current={isCurrent ? 'step' : undefined}
                    aria-label={`${stage.label}${isCompleted ? ' (completed)' : isCurrent ? ' (current)' : ''}`}
                    className={[
                      'w-8 h-8 rounded-full flex items-center justify-center text-xs font-sans font-medium transition-colors duration-150',
                      isCompleted ? 'bg-success text-white' : '',
                      isCurrent ? 'bg-accent text-white ring-4 ring-accent/20' : '',
                      isUpcoming ? 'bg-background border-2 border-border text-text-muted' : '',
                    ].join(' ')}
                  >
                    {isCompleted ? <Check size={14} strokeWidth={2} /> : index + 1}
                  </button>
                </Tooltip>
                <span className={[
                  'text-xs font-sans hidden sm:block whitespace-nowrap',
                  isCurrent ? 'text-text-primary font-medium' : 'text-text-muted',
                ].join(' ')}>
                  {stage.label}
                </span>
              </li>
              {index < THESIS_STAGES.length - 1 ? (
                <div className={[
                  'flex-1 h-0.5 mx-1 mb-5',
                  isCompleted ? 'bg-success' : 'bg-border',
                ].join(' ')} aria-hidden />
              ) : null}
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
