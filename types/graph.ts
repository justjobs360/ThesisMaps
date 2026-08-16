import type { Paper } from './paper';

export type NodeType = 'seed' | 'citing' | 'cited' | 'influential' | 'bookmarked';

export type GraphNode = {
  id: string;
  paper: Paper;
  type: NodeType;
  x?: number;
  y?: number;
  isBookmarked?: boolean;
};

export type EdgeType = 'citation' | 'semantic_similarity' | 'co_author';

export type GraphEdge = {
  id: string;
  source: string;
  target: string;
  type: EdgeType;
  weight?: number;
};

export type GraphData = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

export type HeatmapMode = 'type' | 'year' | 'recency' | 'citation' | 'relevance';

/**
 * What drives node radius.
 * - `citations`   global citation count — how important the paper is to the field
 * - `connections` in-graph degree — how connected it is *within this library*, which
 *                 is a different question: a famous paper can be globally huge but
 *                 linked to only one other paper the user has actually saved
 * - `uniform`     every node the same size
 */
export type NodeSizeMode = 'citations' | 'connections' | 'uniform';

/**
 * - `cluster`  free force layout; position carries no meaning beyond relatedness
 * - `timeline` x-axis pinned to publication year, y relaxed by the simulation
 */
export type GraphViewMode = 'cluster' | 'timeline';
