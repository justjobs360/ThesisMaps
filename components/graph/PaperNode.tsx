import React from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import type { GraphNode } from '@/types/graph';

const NODE_BORDER_COLORS: Record<string, string> = {
  seed: '#C4973A',
  citing: '#3B82F6',
  cited: '#22C55E',
  influential: '#FFFFFF',
  bookmarked: '#C4973A',
};

export function PaperNode({ data, selected }: NodeProps<GraphNode>) {
  const borderColor = data.isBookmarked ? '#C4973A' : NODE_BORDER_COLORS[data.type] ?? '#4B5563';

  return (
    <>
      <Handle type="target" position={Position.Left} className="!opacity-0" />
      <div
        style={{
          borderLeftColor: borderColor,
          outline: selected ? `2px solid ${borderColor}` : undefined,
          outlineOffset: selected ? '2px' : undefined,
        }}
        className="w-[180px] h-[70px] bg-surface-dark border border-white/10 border-l-4 rounded-md px-3 py-2 cursor-pointer transition-all duration-150 hover:border-white/20"
      >
        <p className="text-white text-[13px] font-sans leading-snug line-clamp-2 font-medium">
          {data.paper.title}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-white/50 text-[11px] font-sans">{data.paper.year}</span>
          <span className="text-white/30 text-[11px] font-sans">·</span>
          <span className="text-white/50 text-[11px] font-sans">{data.paper.citationCount.toLocaleString()} cit.</span>
        </div>
        {data.isBookmarked ? (
          <div
            className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-graph-bg"
            style={{ backgroundColor: '#C4973A' }}
            aria-hidden
          />
        ) : null}
      </div>
      <Handle type="source" position={Position.Right} className="!opacity-0" />
    </>
  );
}
