import React from 'react';
import { getStraightPath, type EdgeProps } from 'reactflow';
import type { EdgeType } from '@/types/graph';

/**
 * How an edge is drawn right now.
 *   idle — nothing focused; the resting picture
 *   on   — the edge joins the focused paper to a paper in the visible relation set
 *   peek — as `on`, and the pointer is over that paper's row in the hover card
 *   dim  — something is focused and this edge is not part of it
 */
export type EdgeVisual = 'idle' | 'on' | 'peek' | 'dim';

export type GraphEdgeData = {
  visual: EdgeVisual;
  /** Cosine similarity 0..1 on semantic edges: thicker = closer in meaning. */
  weight?: number;
};

const INK = '#000000';
const ACCENT = '#0066FF';

/**
 * Three relationships, three line styles, readable without a legend:
 *   citation  solid black; the path is drawn cited -> citing, and when it is lit
 *             its dashes travel that way, so you watch influence arrive at the
 *             paper that builds on it
 *   semantic  dashed blue; thickness follows similarity
 *   co_author dotted black; hidden at rest so shared authorship never clutters
 *             the map, and revealed only for the paper you are looking at
 *
 * Straight centre-to-centre lines: with a force layout neighbours sit in
 * arbitrary directions, and curves loop back on themselves.
 */
function makeEdge(kind: EdgeType) {
  return function CustomEdge({ id, sourceX, sourceY, targetX, targetY, data }: EdgeProps<GraphEdgeData>) {
    const visual = data?.visual ?? 'idle';
    const lit = visual === 'on' || visual === 'peek';
    const w = Math.min(1, Math.max(0, data?.weight ?? 0.6));

    // For citations source is the citing paper, so start the path at the cited
    // end (target): path direction is then the direction influence travels.
    const [path] =
      kind === 'citation'
        ? getStraightPath({ sourceX: targetX, sourceY: targetY, targetX: sourceX, targetY: sourceY })
        : getStraightPath({ sourceX, sourceY, targetX, targetY });

    let stroke = INK;
    let width = 1.5;
    let opacity = 0.5;
    let dash: string | undefined;
    let cap: 'round' | 'butt' = 'butt';

    if (kind === 'citation') {
      stroke = lit ? (visual === 'peek' ? ACCENT : INK) : `url(#grad-${id})`;
      width = visual === 'peek' ? 3.5 : lit ? 2.5 : 1.5;
      opacity = lit ? 1 : 0.7;
      dash = lit ? '14 10' : undefined;
    } else if (kind === 'semantic_similarity') {
      stroke = ACCENT;
      width = lit ? 2 + w * 3 : 1 + w * 1.5;
      opacity = lit ? 1 : 0.5;
      dash = '6 4';
    } else {
      stroke = visual === 'peek' ? ACCENT : INK;
      width = visual === 'peek' ? 4 : 3;
      opacity = lit ? 1 : 0; // invisible until its paper is focused
      dash = '0.1 8';
      cap = 'round';
    }
    if (visual === 'dim') opacity = kind === 'co_author' ? 0 : 0.06;

    const flowing = kind === 'citation' && lit;

    return (
      <>
        {kind === 'citation' ? (
          <defs>
            {/* Faint at the cited paper, solid where it lands on the citing one. */}
            <linearGradient
              id={`grad-${id}`}
              gradientUnits="userSpaceOnUse"
              x1={targetX}
              y1={targetY}
              x2={sourceX}
              y2={sourceY}
            >
              <stop offset="0%" stopColor={INK} stopOpacity={0.2} />
              <stop offset="100%" stopColor={INK} stopOpacity={1} />
            </linearGradient>
          </defs>
        ) : null}
        <path
          id={id}
          d={path}
          fill="none"
          stroke={stroke}
          strokeWidth={width}
          strokeLinecap={cap}
          strokeDasharray={dash}
          className={flowing ? 'react-flow__edge-path tm-flow' : 'react-flow__edge-path'}
          style={
            {
              opacity,
              transition: 'opacity 0.25s, stroke-width 0.25s',
              ...(flowing ? { '--tm-flow-len': 24, '--tm-dur': '0.9s' } : {}),
            } as React.CSSProperties
          }
        />
      </>
    );
  };
}

export const CitationEdge = makeEdge('citation');
export const SemanticEdge = makeEdge('semantic_similarity');
export const CoAuthorEdge = makeEdge('co_author');

export const edgeTypes = {
  citation: CitationEdge,
  semantic_similarity: SemanticEdge,
  co_author: CoAuthorEdge,
};
