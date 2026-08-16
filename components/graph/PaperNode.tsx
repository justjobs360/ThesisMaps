import React from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import type { GraphNode, HeatmapMode } from '@/types/graph';
import { nodeColor } from './nodeColor';
import { nodeBox } from './nodeSize';

/**
 * A paper as a hard-edged card, sized by importance.
 *
 * Card rather than circle: it's the more distinctive look, and it keeps the
 * title and metadata *inside* the node instead of floating underneath, which is
 * what forced labels to be hidden when the canvas got busy. Size carries the
 * signal that the old fixed 180x70 grid threw away — an 11,000-citation paper is
 * now visibly bigger than one with none.
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
  showLabel: boolean;
};

function PaperNodeImpl({ data, selected }: NodeProps<PaperNodeData>) {
  const accent = nodeColor(data, data.heatmapMode, data.maxCitations, data.yearRange);
  const { w, h } = nodeBox(data.radius);
  const isFocus = selected || data.highlighted;

  // Below this the card can't fit two lines plus the meta row.
  const showMeta = h >= 60;

  return (
    <div className="relative transition-opacity duration-200" style={{ opacity: data.dimmed ? 0.12 : 1 }}>
      {/* Both handles sit dead-centre and hidden, so edges run centre-to-centre
          and their endpoints are covered by the card itself. */}
      <Handle
        type="target"
        position={Position.Left}
        className="!opacity-0 !pointer-events-none"
        style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
      />

      <div
        className="bg-white cursor-pointer transition-all duration-150 overflow-hidden flex flex-col justify-center"
        style={{
          width: w,
          height: h,
          // Brutalist: solid black edges, a thick colour bar for the heatmap, and
          // a hard offset shadow on focus rather than a soft glow.
          border: '2px solid #000000',
          borderLeft: `${Math.max(6, Math.round(w * 0.045))}px solid ${accent}`,
          boxShadow: isFocus ? '4px 4px 0 #000000' : undefined,
          outline: isFocus ? '2px solid #000000' : undefined,
          padding: `${Math.round(h * 0.12)}px ${Math.round(w * 0.06)}px`,
        }}
        title={`${data.paper.title} (${data.paper.year || 'n.d.'}) — ${data.paper.citationCount.toLocaleString()} citations`}
      >
        <p
          className={[
            'text-black font-sans leading-snug line-clamp-2',
            isFocus ? 'font-black' : 'font-semibold',
          ].join(' ')}
          style={{ fontSize: Math.max(10, Math.min(15, Math.round(h * 0.19))) }}
        >
          {data.paper.title}
        </p>
        {showMeta ? (
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-black/50 font-sans" style={{ fontSize: Math.max(9, Math.round(h * 0.14)) }}>
              {data.paper.year || '—'}
            </span>
            <span className="text-black/25 font-sans" style={{ fontSize: Math.max(9, Math.round(h * 0.14)) }}>
              ·
            </span>
            <span className="text-black/50 font-sans" style={{ fontSize: Math.max(9, Math.round(h * 0.14)) }}>
              {data.paper.citationCount.toLocaleString()} cit.
            </span>
          </div>
        ) : null}
      </div>

      {data.isBookmarked ? (
        <span
          className="absolute -top-1.5 -right-1.5 w-3 h-3 border-2 border-black"
          style={{ backgroundColor: accent }}
          aria-hidden
        />
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

// Memoised so recolouring or selecting doesn't re-render every card.
export const PaperNode = React.memo(PaperNodeImpl);
