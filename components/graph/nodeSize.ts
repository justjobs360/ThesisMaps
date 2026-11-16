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

export const MIN_RADIUS = 16;
export const MAX_RADIUS = 52;
export const UNIFORM_RADIUS = 24;

/**
 * Keep-out radius used by the force simulation.
 *
 * Bigger than the circle itself because each node carries a "Surname Year" pill
 * underneath (~90px wide); without the floor, small nodes pack close enough that
 * their labels overlap even though the circles don't. The floor was 88 when the
 * label was a 136px two-line title block.
 */
export function keepOutRadius(radius: number): number {
  return Math.max(radius + 26, 68);
}

/**
 * Area-proportional radius for one value, relative to the largest in view. The
 * homepage preview calls this directly with its own radius bounds.
 */
export function sqrtRadius(value: number, max: number, minR = MIN_RADIUS, maxR = MAX_RADIUS): number {
  const t = max > 0 ? Math.sqrt(Math.max(0, value)) / Math.sqrt(max) : 0;
  return minR + t * (maxR - minR);
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
    radii.set(node.id, sqrtRadius(value, max));
  }

  return radii;
}
