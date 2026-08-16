'use client';

import { useMemo } from 'react';
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type SimulationNodeDatum,
} from 'd3-force';
import type { GraphData, GraphViewMode } from '@/types/graph';

/**
 * d3-force layout for the knowledge graph.
 *
 * Replaces the old `(i % 4) * 240` grid, which imposed a structure on the data
 * instead of letting one emerge from it — connected papers could sit far apart
 * and unrelated ones adjacent, so position said nothing true.
 *
 * The simulation is run to completion **synchronously** and the final positions
 * handed to ReactFlow once. An earlier version ticked inside requestAnimationFrame
 * for an animated settle, but that meant the simulation and ReactFlow's drag
 * handling were both writing node positions every frame: dragging a node made it
 * jump or disappear as the two fought. Settling up front costs a few ms for a
 * library of this size and makes dragging behave exactly as you'd expect.
 */

type SimNode = SimulationNodeDatum & { id: string; radius: number };
type SimLink = { source: string | SimNode; target: string | SimNode; weight: number; type: string };

export type Positions = Map<string, { x: number; y: number }>;

/**
 * Link distance by edge type. Citation links are the hardest evidence of a real
 * relationship, so they pull tightest; field-overlap fallbacks are the weakest
 * claim and are allowed to sit loose.
 */
function linkDistance(type: string, weight: number): number {
  if (type === 'citation') return 150;
  if (type === 'semantic_similarity') {
    // weight is cosine similarity 0..1 — closer meaning, shorter link.
    return 300 - Math.min(1, Math.max(0, weight)) * 130;
  }
  return 260;
}

function linkStrength(type: string, weight: number): number {
  if (type === 'citation') return 0.8;
  if (type === 'semantic_similarity') return 0.2 + Math.min(1, Math.max(0, weight)) * 0.4;
  return 0.12;
}

export function useForceLayout(
  data: GraphData,
  radii: Map<string, number>,
  viewMode: GraphViewMode
): Positions {
  // Recompute only when the graph, the sizing or the view mode actually change —
  // not on every refetch that returns an identical graph with a new identity.
  const signature = useMemo(
    () =>
      data.nodes.map((n) => `${n.id}:${Math.round(radii.get(n.id) ?? 0)}`).join(',') +
      '|' +
      data.edges.map((e) => `${e.source}>${e.target}:${e.type}`).join(',') +
      '|' +
      viewMode,
    [data, radii, viewMode]
  );

  return useMemo(() => {
    const positions: Positions = new Map();
    if (data.nodes.length === 0) return positions;

    const years = data.nodes.map((n) => n.paper.year).filter((y) => y > 0);
    const minYear = years.length ? Math.min(...years) : 0;
    const maxYear = years.length ? Math.max(...years) : 0;
    const yearSpan = Math.max(1, maxYear - minYear);

    // Width scales with node count so a big library doesn't end up cramped.
    const width = Math.max(900, data.nodes.length * 90);
    const height = Math.max(600, data.nodes.length * 45);

    // Seed on a circle: identical starting points make the first ticks explode.
    const simNodes: SimNode[] = data.nodes.map((n, i) => {
      const angle = (i / data.nodes.length) * Math.PI * 2;
      const seed = Math.min(width, height) / 3;
      return {
        id: n.id,
        radius: radii.get(n.id) ?? 20,
        x: Math.cos(angle) * seed,
        y: Math.sin(angle) * seed,
      };
    });

    const byId = new Map(simNodes.map((n) => [n.id, n]));
    const simLinks: SimLink[] = data.edges
      .filter((e) => byId.has(e.source) && byId.has(e.target))
      .map((e) => ({ source: e.source, target: e.target, weight: e.weight ?? 0, type: e.type }));

    const sim = forceSimulation<SimNode>(simNodes)
      .force(
        'link',
        forceLink<SimNode, SimLink>(simLinks)
          .id((d) => d.id)
          .distance((l) => linkDistance(l.type, l.weight))
          .strength((l) => linkStrength(l.type, l.weight))
      )
      // Charge scales with radius so large nodes claim proportionate space
      // instead of swallowing their neighbours.
      .force('charge', forceManyBody<SimNode>().strength((d) => -400 - d.radius * 20))
      // Hard separation: circles and their labels must never overlap, whatever
      // the other forces want. The +54 leaves room for the two label lines.
      .force('collide', forceCollide<SimNode>().radius((d) => d.radius + 54).strength(1))
      .stop();

    if (viewMode === 'timeline') {
      // X becomes publication year, so horizontal position is literally
      // meaningful. Strong on X, weak on Y so the sim only relaxes stacking.
      sim
        .force(
          'x',
          forceX<SimNode>((d) => {
            const node = data.nodes.find((n) => n.id === d.id);
            const year = node?.paper.year ?? 0;
            if (!year) return -width / 2; // unknown year parks at the left edge
            return ((year - minYear) / yearSpan) * width - width / 2;
          }).strength(1)
        )
        .force('y', forceY<SimNode>(0).strength(0.05));
    } else {
      sim.force('center', forceCenter(0, 0));
    }

    // Run to a settled state up front. 400 ticks is comfortably past convergence
    // for libraries of this size and takes only a few milliseconds.
    sim.tick(400);
    sim.stop();

    for (const n of simNodes) positions.set(n.id, { x: n.x ?? 0, y: n.y ?? 0 });
    return positions;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);
}
