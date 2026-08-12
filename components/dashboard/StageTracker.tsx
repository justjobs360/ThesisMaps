'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { THESIS_STAGES, type ThesisStage } from '@/types/thesis';
import { Tooltip } from '@/components/ui/Tooltip';

type StageTrackerProps = {
  currentStage: ThesisStage;
  /** When provided, steps become clickable to move the project to that stage. */
  onStageClick?: (stage: ThesisStage) => void;
  /** Shows a saving indicator and blocks further clicks while persisting. */
  saving?: boolean;
};

export function StageTracker({ currentStage, onStageClick, saving = false }: StageTrackerProps) {
  const currentIndex = THESIS_STAGES.findIndex((s) => s.id === currentStage);
  const interactive = Boolean(onStageClick);

  return (
    <nav aria-label="Thesis progress" className="bg-surface border border-border rounded-md p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-sans font-medium text-text-muted uppercase tracking-wide">Research Stage</p>
        {saving ? (
          <span className="text-[10px] font-sans font-black uppercase tracking-widest text-accent animate-pulse">
            Saving…
          </span>
        ) : interactive ? (
          <span className="text-[10px] font-sans font-medium uppercase tracking-widest text-text-muted hidden sm:block">
            Click a step to change stage
          </span>
        ) : null}
      </div>
      <ol className="flex items-center gap-0">
        {THESIS_STAGES.map((stage, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isUpcoming = index > currentIndex;

          return (
            <React.Fragment key={stage.id}>
              <li className="flex flex-col items-center gap-2">
                <Tooltip
                  content={
                    interactive && !isCurrent ? `Set stage to ${stage.label}` : stage.label
                  }
                  side="top"
                >
                  <button
                    onClick={() => onStageClick?.(stage.id)}
                    disabled={!interactive || saving || isCurrent}
                    aria-current={isCurrent ? 'step' : undefined}
                    aria-label={`${stage.label}${isCompleted ? ' (completed)' : isCurrent ? ' (current)' : ''}${
                      interactive && !isCurrent ? ' — click to set as current stage' : ''
                    }`}
                    className={[
                      'w-8 h-8 rounded-full flex items-center justify-center text-xs font-sans font-medium transition-all duration-150',
                      isCompleted ? 'bg-success text-white' : '',
                      isCurrent ? 'bg-accent text-white ring-4 ring-accent/20 cursor-default' : '',
                      isUpcoming ? 'bg-background border-2 border-border text-text-muted' : '',
                      interactive && !isCurrent && !saving
                        ? 'cursor-pointer hover:ring-4 hover:ring-accent/30 hover:border-accent'
                        : '',
                      saving ? 'opacity-60' : '',
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
