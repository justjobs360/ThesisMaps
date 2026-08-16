import type { GraphData, GraphNode, NodeSizeMode } from '@/types/graph';

/**
 * Node radius in px.
 *
 * The old grid gave every paper an identical 180x70 box, so a 11,500-citation
 * foundational paper carried exactly the same visual weight as one with zero
 * citations. Radius now encodes importance.
 *
 * Area (not radius) is proportional to the metric — that's the honest encoding,
 * since the eye reads circle area as magnitude. A sqrt scale gets us there, and
 * it also keeps a single runaway outlier from flattening everything else, which
 * a linear scale would.
 */

export const MIN_RADIUS = 14;
export const MAX_RADIUS = 46;
export const UNIFORM_RADIUS = 22;

/** The original brutalist card proportions, kept as the base size. */
export const BASE_W = 180;
export const BASE_H = 70;

/**
 * Rectangle dimensions for a node.
 *
 * Nodes are cards rather than circles — it's the more distinctive look and it
 * lets the title and metadata live inside the node instead of floating beneath
 * it. Size still encodes importance: the sqrt-scaled radius is converted to a
 * uniform scale factor, so both axes grow together and the card keeps its shape.
 * Clamped so the largest paper stays readable without dwarfing the canvas.
 */
export function nodeBox(radius: number): { w: number; h: number } {
  const scale = Math.min(1.7, Math.max(0.72, radius / UNIFORM_RADIUS));
  return { w: Math.round(BASE_W * scale), h: Math.round(BASE_H * scale) };
}

/** How many edges each node has within this graph. */
export function degreeMap(data: GraphData): Map<string, number> {
  const degrees = new Map<string, number>();
  for (const n of data.nodes) degrees.set(n.id, 0);
  for (const e of data.edges) {
    degrees.set(e.source, (degrees.get(e.source) ?? 0) + 1);
    degrees.set(e.target, (degrees.get(e.target) ?? 0) + 1);
  }
  return degrees;
}

function metricFor(node: GraphNode, mode: NodeSizeMode, degrees: Map<string, number>): number {
  if (mode === 'connections') return degrees.get(node.id) ?? 0;
  return Math.max(0, node.paper.citationCount || 0);
}

/**
 * Builds a radius lookup for the whole graph. Scaling is relative to the largest
 * value present, so the biggest paper in *this* library always reaches MAX_RADIUS
 * and the spread stays readable whatever the absolute numbers are.
 */
export function radiusMap(data: GraphData, mode: NodeSizeMode): Map<string, number> {
  const radii = new Map<string, number>();

  if (mode === 'uniform') {
    for (const n of data.nodes) radii.set(n.id, UNIFORM_RADIUS);
    return radii;
  }

  const degrees = degreeMap(data);
  const values = data.nodes.map((n) => metricFor(n, mode, degrees));
  const max = Math.max(...values, 0);

  for (let i = 0; i < data.nodes.length; i++) {
    const node = data.nodes[i]!;
    const value = values[i] ?? 0;
    // sqrt so AREA tracks the metric; guard max=0 (e.g. a library where nothing
    // has citations yet) so every node falls back to the same readable size.
    const t = max > 0 ? Math.sqrt(value) / Math.sqrt(max) : 0;
    radii.set(node.id, MIN_RADIUS + t * (MAX_RADIUS - MIN_RADIUS));
  }

  return radii;
}
