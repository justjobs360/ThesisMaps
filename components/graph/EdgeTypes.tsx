import React from 'react';
import { getBezierPath, BaseEdge, type EdgeProps } from 'reactflow';

function makeEdge(color: string, strokeDasharray?: string) {
  return function CustomEdge({
    id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, selected,
  }: EdgeProps) {
    const [edgePath] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
    return (
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: color,
          strokeWidth: 1.5,
          strokeDasharray: strokeDasharray ?? 'none',
          opacity: selected ? 1 : 0.45,
          transition: 'opacity 0.15s',
        }}
      />
    );
  };
}

// Brand palette on the dark canvas: neutral light citation lines, accent-blue
// semantic-similarity, muted co-author. No pastel/gold.
export const CitationEdge = makeEdge('#CBD5E1');
export const SemanticEdge = makeEdge('#0066FF', '6 3');
export const CoAuthorEdge = makeEdge('#64748B', '2 2');

export const edgeTypes = {
  citation: CitationEdge,
  semantic_similarity: SemanticEdge,
  co_author: CoAuthorEdge,
};
