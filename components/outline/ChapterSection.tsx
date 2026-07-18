'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';
import type { OutlineSection } from '@/types/thesis';

type ChapterSectionProps = {
  section: OutlineSection;
  isSelected: boolean;
  onClick: () => void;
  onDelete?: () => void;
  depth?: number;
};

export function ChapterSection({ section, isSelected, onClick, onDelete, depth = 0 }: ChapterSectionProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    paddingLeft: depth * 16,
  };

  return (
    <div ref={setNodeRef} style={style} className="px-3 py-1">
      <div
        className={[
          'w-full flex items-center gap-2 px-3 h-10 border-2 border-black text-left transition-colors duration-150 group',
          isSelected ? 'bg-black text-white' : 'bg-white text-black hover:bg-black/5',
        ].join(' ')}
      >
        <span
          {...attributes}
          {...listeners}
          className={['cursor-grab flex-shrink-0', isSelected ? 'text-white/60' : 'text-black/30'].join(' ')}
          aria-label="Drag to reorder"
        >
          <GripVertical size={14} strokeWidth={2} />
        </span>

        <button
          onClick={onClick}
          className="flex-1 min-w-0 flex items-center gap-2 text-[11px] font-sans font-black uppercase tracking-tight"
          aria-current={isSelected ? 'true' : undefined}
        >
          <span className="flex-1 truncate">{section.title}</span>
        </button>

        {section.paperCount !== undefined && section.paperCount > 0 ? (
          <span
            className={[
              'flex-shrink-0 text-[10px] font-black px-1.5 h-5 flex items-center border-2',
              isSelected ? 'border-white text-white' : 'border-black text-black',
            ].join(' ')}
          >
            {section.paperCount}
          </span>
        ) : null}

        {onDelete ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            aria-label="Delete section"
            className={[
              'flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity',
              isSelected ? 'text-white/60 hover:text-red-400' : 'text-black/30 hover:text-red-600',
            ].join(' ')}
          >
            <Trash2 size={13} strokeWidth={2} />
          </button>
        ) : null}
      </div>
    </div>
  );
}
