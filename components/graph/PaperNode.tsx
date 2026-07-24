import React from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import type { GraphNode, HeatmapMode } from '@/types/graph';
import { nodeColor } from './nodeColor';

// The node carries the current heatmap mode + max citation count so it can
// recolour itself reactively when the "Color by …" control changes.
export type PaperNodeData = GraphNode & { heatmapMode: HeatmapMode; maxCitations: number };

export function PaperNode({ data, selected }: NodeProps<PaperNodeData>) {
  const borderColor = nodeColor(data, data.heatmapMode, data.maxCitations);

  return (
    <>
      <Handle type="target" position={Position.Left} className="!opacity-0" />
      <div
        style={{
          borderLeftColor: borderColor,
          outline: selected ? `2px solid ${borderColor}` : undefined,
          outlineOffset: selected ? '2px' : undefined,
        }}
        className="relative w-[180px] h-[70px] bg-white border-2 border-black border-l-4 px-3 py-2 cursor-pointer transition-all duration-150 hover:shadow-impact"
      >
        <p className="text-black text-[13px] font-sans leading-snug line-clamp-2 font-semibold">
          {data.paper.title}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-black/50 text-[11px] font-sans">{data.paper.year || '—'}</span>
          <span className="text-black/30 text-[11px] font-sans">·</span>
          <span className="text-black/50 text-[11px] font-sans">{data.paper.citationCount.toLocaleString()} cit.</span>
        </div>
        {data.isBookmarked ? (
          <div
            className="absolute -top-1 -right-1 w-3 h-3 border-2 border-black"
            style={{ backgroundColor: borderColor }}
            aria-hidden
          />
        ) : null}
      </div>
      <Handle type="source" position={Position.Right} className="!opacity-0" />
    </>
  );
}
