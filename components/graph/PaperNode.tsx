import React from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import type { GraphNode, HeatmapMode } from '@/types/graph';
import { nodeColor } from './nodeColor';

/**
 * A paper as a circle sized by importance.
 *
 * Circles (not the old 180x70 rectangles) because edges can meet a circle from
 * any direction without the elbowing that fixed left/right handles forced, and
 * because area reads as magnitude — which is the whole point of sizing nodes by
 * citations or connectedness.
 */
export type PaperNodeData = GraphNode & {
  heatmapMode: HeatmapMode;
  maxCitations: number;
  yearRange: { min: number; max: number };
  radius: number;
  /** Something is selected and this node is not it or its neighbour. */
  dimmed: boolean;
  /** This node is the selection, or directly connected to it. */
  highlighted: boolean;
  /** Labels are suppressed for small nodes once the canvas gets busy. */
  showLabel: boolean;
};

function PaperNodeImpl({ data, selected }: NodeProps<PaperNodeData>) {
  const fill = nodeColor(data, data.heatmapMode, data.maxCitations, data.yearRange);
  const size = data.radius * 2;
  const isFocus = selected || data.highlighted;

  return (
    <div
      className="relative flex flex-col items-center transition-opacity duration-200"
      style={{ opacity: data.dimmed ? 0.15 : 1 }}
    >
      {/* Both handles sit dead-centre and hidden, so edges run centre-to-centre
          and their endpoints are covered by the circle itself. */}
      <Handle
        type="target"
        position={Position.Left}
        className="!opacity-0 !pointer-events-none"
        style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
      />

      <div
        className="rounded-full border-2 cursor-pointer transition-all duration-150"
        style={{
          width: size,
          height: size,
          backgroundColor: fill,
          borderColor: isFocus ? '#000000' : 'rgba(0,0,0,0.35)',
          borderWidth: isFocus ? 3 : 2,
          boxShadow: isFocus ? '0 0 0 4px rgba(0,102,255,0.25)' : undefined,
        }}
        title={`${data.paper.title} — ${data.paper.year || 'n.d.'}, ${data.paper.citationCount.toLocaleString()} citations`}
      />

      {data.isBookmarked ? (
        <span
          className="absolute w-3 h-3 border-2 border-black bg-white rounded-full"
          style={{ top: -2, right: `calc(50% - ${data.radius + 6}px)` }}
          aria-hidden
        />
      ) : null}

      {data.showLabel || isFocus ? (
        <div className="mt-1.5 w-[132px] text-center pointer-events-none">
          <p
            className={[
              'text-[10px] font-sans leading-tight line-clamp-2',
              isFocus ? 'font-black text-black' : 'font-semibold text-black/70',
            ].join(' ')}
          >
            {data.paper.title}
          </p>
          <p className="text-[9px] font-sans text-black/40 mt-0.5">
            {data.paper.year || '—'} · {data.paper.citationCount.toLocaleString()}
          </p>
        </div>
      ) : null}

      <Handle
        type="source"
        position={Position.Right}
        className="!opacity-0 !pointer-events-none"
        style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
      />
    </div>
  );
}

// Memoised: the simulation updates positions every frame while settling, and
// without this every node would re-render on each tick.
export const PaperNode = React.memo(PaperNodeImpl);
