import React from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import type { GraphNode, HeatmapMode } from '@/types/graph';
import { nodeColor } from './nodeColor';

/**
 * A paper as a circle, sized by importance.
 *
 * Circles because edges can meet them from any direction without the elbowing
 * that fixed left/right handles forced on rectangles, and because area reads as
 * magnitude — which is the point of sizing by citations or connectedness.
 *
 * Brutalist rather than soft: flat fill, heavy black outline, and a hard offset
 * shadow for elevation. No gradients, no blur, no glow.
 */
export type PaperNodeData = GraphNode & {
  heatmapMode: HeatmapMode;
  maxCitations: number;
  yearRange: { min: number; max: number };
  radius: number;
  /** Something is selected and this node is neither it nor a neighbour. */
  dimmed: boolean;
  /** This node is the selection, or directly connected to it. */
  highlighted: boolean;
  /** Labels are suppressed for small nodes once the canvas gets busy. */
  showLabel: boolean;
};

const SHADOW_OFFSET = 5;

function PaperNodeImpl({ data, selected }: NodeProps<PaperNodeData>) {
  const fill = nodeColor(data, data.heatmapMode, data.maxCitations, data.yearRange);
  const r = data.radius;
  const size = r * 2;
  const isFocus = selected || data.highlighted;
  const border = isFocus ? 4 : 3;

  return (
    <div
      className="relative flex flex-col items-center transition-opacity duration-200"
      style={{ opacity: data.dimmed ? 0.12 : 1 }}
    >
      {/* Both handles sit dead-centre and hidden, so edges run centre-to-centre
          and their endpoints are covered by the circle itself. */}
      <Handle
        type="target"
        position={Position.Left}
        className="!opacity-0 !pointer-events-none"
        style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
      />

      <div className="relative" style={{ width: size, height: size }}>
        {/* Hard offset shadow: brutalist elevation, no blur. */}
        <span
          className="absolute rounded-full"
          style={{
            width: size,
            height: size,
            left: SHADOW_OFFSET,
            top: SHADOW_OFFSET,
            backgroundColor: isFocus ? '#0066FF' : '#000000',
          }}
          aria-hidden
        />
        <span
          className="absolute rounded-full cursor-pointer transition-all duration-150"
          style={{
            width: size,
            height: size,
            left: 0,
            top: 0,
            backgroundColor: fill,
            border: `${border}px solid #000000`,
          }}
          title={`${data.paper.title} (${data.paper.year || 'n.d.'}) — ${data.paper.citationCount.toLocaleString()} citations`}
        />
        {data.isBookmarked ? (
          <span
            className="absolute w-3 h-3 border-2 border-black bg-white"
            style={{ top: -4, right: -4 }}
            aria-hidden
          />
        ) : null}
      </div>

      {data.showLabel || isFocus ? (
        <div className="mt-2 w-[136px] text-center pointer-events-none">
          <p
            className={[
              'text-[10px] font-sans uppercase tracking-tight leading-tight line-clamp-2',
              isFocus ? 'font-black text-black' : 'font-bold text-black/75',
            ].join(' ')}
          >
            {data.paper.title}
          </p>
          <p className="text-[9px] font-sans font-bold text-black/40 mt-0.5 tracking-wider">
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

// Memoised so recolouring or selecting doesn't re-render every node.
export const PaperNode = React.memo(PaperNodeImpl);
