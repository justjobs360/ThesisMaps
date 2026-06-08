'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ChevronRight } from 'lucide-react';
import type { OutlineSection } from '@/types/thesis';
import { CoverageScore } from './CoverageScore';

type ChapterSectionProps = {
  section: OutlineSection;
  isSelected: boolean;
  onClick: () => void;
  depth?: number;
};

export function ChapterSection({ section, isSelected, onClick, depth = 0 }: ChapterSectionProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, paddingLeft: depth * 16 }}
    >
      <button
        onClick={onClick}
        className={[
          'w-full flex items-center gap-2 px-3 py-2 rounded text-sm font-sans text-left transition-colors duration-150 group',
          isSelected ? 'bg-accent/10 text-text-primary font-medium' : 'text-text-muted hover:text-text-primary hover:bg-background',
        ].join(' ')}
        aria-current={isSelected ? 'true' : undefined}
      >
        <span
          {...attributes}
          {...listeners}
          className="cursor-grab text-text-muted opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Drag to reorder"
        >
          <GripVertical size={14} strokeWidth={1.5} />
        </span>
        <ChevronRight size={12} strokeWidth={1.5} className={isSelected ? 'text-accent' : 'text-text-muted'} />
        <span className="flex-1 truncate">{section.title}</span>
        {section.paperCount !== undefined && section.paperCount > 0 ? (
          <span className="flex-shrink-0 text-xs bg-background border border-border px-1.5 py-0.5 rounded text-text-muted">
            {section.paperCount}
          </span>
        ) : null}
      </button>
    </div>
  );
}
