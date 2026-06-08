import React from 'react';
import { getBezierPath, BaseEdge, type EdgeProps } from 'reactflow';

function makeEdge(strokeDasharray?: string, color = '#4B5563') {
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
          opacity: selected ? 1 : 0.4,
          transition: 'opacity 0.15s',
        }}
      />
    );
  };
}

export const CitationEdge = makeEdge(undefined, '#6B7280');
export const SemanticEdge = makeEdge('6 3', '#9CA3AF');
export const CoAuthorEdge = makeEdge('2 2', '#D1D5DB');

export const edgeTypes = {
  citation: CitationEdge,
  semantic_similarity: SemanticEdge,
  co_author: CoAuthorEdge,
};
