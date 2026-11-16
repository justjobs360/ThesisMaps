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
  /** Something is focused and this node is neither it nor in its visible relations. */
  dimmed: boolean;
  /** This node is the focus, or in the focus's visible relation set. */
  highlighted: boolean;
  /** This node is the focus itself (hovered, else selected). */
  focused: boolean;
  /** "Vaswani 2017" — the only text on the canvas; the full title lives in the card. */
  label: string;
  /** Whether the collision pass found room for a resting label. */
  showLabel: boolean;
};

const SHADOW_OFFSET = 5;

function PaperNodeImpl({ data, selected }: NodeProps<PaperNodeData>) {
  const fill = nodeColor(data, data.heatmapMode, data.maxCitations, data.yearRange);
  const r = data.radius;
  const size = r * 2;
  const isFocus = selected || data.focused;
  const border = isFocus || data.highlighted ? 4 : 3;
  const labelled = data.showLabel || isFocus || data.highlighted;

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
        />
        {/* Dashed seed ring, as on the homepage preview. */}
        {data.type === 'seed' ? (
          <span
            className="absolute rounded-full pointer-events-none"
            style={{ inset: -9, border: '1.5px dashed #0066FF', opacity: 0.6 }}
            aria-hidden
          />
        ) : null}
        {data.isBookmarked ? (
          <span
            className="absolute w-3 h-3 border-2 border-black bg-white"
            style={{ top: -4, right: -4 }}
            aria-hidden
          />
        ) : null}
      </div>

      {labelled ? (
        <span
          className={[
            'mt-1 whitespace-nowrap px-1.5 py-px text-[11px] font-sans font-black leading-tight pointer-events-none select-none transition-colors duration-150',
            isFocus ? 'bg-black text-white' : 'bg-white/85 text-black',
          ].join(' ')}
        >
          {data.label}
        </span>
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
