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

export type HeatmapMode = 'type' | 'recency' | 'citation' | 'relevance';

export type GraphControls = {
  zoom: number;
  showMinimap: boolean;
  heatmapMode: HeatmapMode;
};
