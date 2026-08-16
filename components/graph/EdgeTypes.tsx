import React from 'react';
import { getStraightPath, BaseEdge, type EdgeProps } from 'reactflow';

export type GraphEdgeData = {
  /** Something is selected and this edge doesn't touch it. */
  dimmed?: boolean;
  /** This edge connects the selection to a direct neighbour. */
  highlighted?: boolean;
};

/**
 * Straight centre-to-centre links, matching how force-directed citation maps are
 * conventionally drawn. Bezier curves were a hangover from the grid layout, where
 * every edge ran left-to-right; with a force layout neighbours sit in arbitrary
 * directions and curved edges loop back on themselves.
 *
 * Selecting a node bolds its direct connections and fades the rest, so structure
 * around one paper is readable instead of lost in a hairball.
 */
function makeEdge(color: string, strokeDasharray?: string) {
  return function CustomEdge({
    id, sourceX, sourceY, targetX, targetY, selected, data,
  }: EdgeProps<GraphEdgeData>) {
    const [edgePath] = getStraightPath({ sourceX, sourceY, targetX, targetY });
    const dimmed = data?.dimmed ?? false;
    const highlighted = data?.highlighted ?? false;

    return (
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: highlighted ? '#000000' : color,
          strokeWidth: highlighted ? 2.5 : 1.5,
          strokeDasharray: strokeDasharray ?? 'none',
          opacity: dimmed ? 0.06 : highlighted || selected ? 1 : 0.4,
          transition: 'opacity 0.2s, stroke-width 0.2s, stroke 0.2s',
        }}
      />
    );
  };
}

export const CitationEdge = makeEdge('#64748B');
export const SemanticEdge = makeEdge('#0066FF', '6 3');
export const CoAuthorEdge = makeEdge('#94A3B8', '2 2');

export const edgeTypes = {
  citation: CitationEdge,
  semantic_similarity: SemanticEdge,
  co_author: CoAuthorEdge,
};
