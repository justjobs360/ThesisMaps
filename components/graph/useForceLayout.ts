'use client';

import { useEffect, useRef, useState } from 'react';
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type Simulation,
  type SimulationNodeDatum,
} from 'd3-force';
import type { GraphData, GraphViewMode } from '@/types/graph';

/**
 * d3-force layout for the knowledge graph.
 *
 * Replaces the previous `(i % 4) * 240` grid, which imposed a structure on the
 * data instead of letting one emerge from it — connected papers sat far apart,
 * unrelated ones sat adjacent, and the arrangement said nothing true.
 *
 * The simulation only computes coordinates; ReactFlow still renders, so zoom,
 * pan, the minimap, SVG export and the detail panel all keep working.
 */

export type SimNode = SimulationNodeDatum & { id: string; radius: number };
type SimLink = { source: string | SimNode; target: string | SimNode; weight: number; type: string };

export type Positions = Map<string, { x: number; y: number }>;

/**
 * Link distance by edge type. Citation links are the hardest evidence of a real
 * relationship, so they pull tightest; field-overlap fallbacks are the weakest
 * claim and are allowed to sit loose.
 */
function linkDistance(type: string, weight: number): number {
  if (type === 'citation') return 110;
  if (type === 'semantic_similarity') {
    // weight is cosine similarity 0..1 — closer meaning, shorter link.
    return 220 - Math.min(1, Math.max(0, weight)) * 110;
  }
  return 200;
}

function linkStrength(type: string, weight: number): number {
  if (type === 'citation') return 0.9;
  if (type === 'semantic_similarity') return 0.25 + Math.min(1, Math.max(0, weight)) * 0.5;
  return 0.2;
}

export function useForceLayout(
  data: GraphData,
  radii: Map<string, number>,
  viewMode: GraphViewMode,
  width = 1200,
  height = 700
): { positions: Positions; settled: boolean; pin: (id: string, x: number, y: number) => void; release: (id: string) => void } {
  const [positions, setPositions] = useState<Positions>(new Map());
  const [settled, setSettled] = useState(false);
  const simRef = useRef<Simulation<SimNode, undefined> | null>(null);
  const nodesRef = useRef<SimNode[]>([]);
  const frameRef = useRef<number | null>(null);

  // Re-run whenever the graph, the sizing, or the view mode changes.
  // `data.nodes.length` + the id list keep this from re-firing on every fetch
  // that returns an identical graph with a fresh object identity.
  const signature = data.nodes.map((n) => n.id).join(',') + '|' + data.edges.length + '|' + viewMode;

  useEffect(() => {
    if (data.nodes.length === 0) return;

    const years = data.nodes.map((n) => n.paper.year).filter((y) => y > 0);
    const minYear = years.length ? Math.min(...years) : 0;
    const maxYear = years.length ? Math.max(...years) : 0;
    const yearSpan = Math.max(1, maxYear - minYear);

    // Seed on a circle rather than at the origin: identical start positions make
    // the first ticks explode unpredictably.
    const simNodes: SimNode[] = data.nodes.map((n, i) => {
      const angle = (i / data.nodes.length) * Math.PI * 2;
      const seedRadius = Math.min(width, height) / 3;
      return {
        id: n.id,
        radius: radii.get(n.id) ?? 20,
        x: Math.cos(angle) * seedRadius,
        y: Math.sin(angle) * seedRadius,
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
      // Charge scales with radius so big nodes claim proportionate space rather
      // than swallowing their neighbours.
      .force('charge', forceManyBody<SimNode>().strength((d) => -220 - d.radius * 12))
      // Hard separation: circles must never overlap, whatever the forces want.
      .force('collide', forceCollide<SimNode>().radius((d) => d.radius + 26).strength(0.9))
      .alphaDecay(0.025);

    if (viewMode === 'timeline') {
      // X is publication year — position becomes literally meaningful. Strong X,
      // weak Y so the simulation only relaxes vertical stacking within a year.
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
        .force('y', forceY<SimNode>(0).strength(0.06))
        .force('center', null);
    } else {
      sim.force('center', forceCenter(0, 0)).force('x', null).force('y', null);
    }

    simRef.current = sim;
    nodesRef.current = simNodes;
    setSettled(false);

    // Drive ticks ourselves so React state updates once per frame instead of
    // once per tick — d3's own timer would outpace rendering.
    sim.stop();
    const step = () => {
      sim.tick();
      const next: Positions = new Map();
      for (const n of nodesRef.current) next.set(n.id, { x: n.x ?? 0, y: n.y ?? 0 });
      setPositions(next);

      if (sim.alpha() > 0.02) {
        frameRef.current = requestAnimationFrame(step);
      } else {
        frameRef.current = null;
        setSettled(true);
      }
    };
    frameRef.current = requestAnimationFrame(step);

    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      sim.stop();
      simRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, radii, width, height]);

  /** Pins a node under the cursor while it's being dragged. */
  const pin = (id: string, x: number, y: number) => {
    const node = nodesRef.current.find((n) => n.id === id);
    if (!node) return;
    node.fx = x;
    node.fy = y;
    const sim = simRef.current;
    if (sim && sim.alpha() < 0.1) {
      sim.alpha(0.3);
      if (frameRef.current === null) {
        const step = () => {
          sim.tick();
          const next: Positions = new Map();
          for (const n of nodesRef.current) next.set(n.id, { x: n.x ?? 0, y: n.y ?? 0 });
          setPositions(next);
          if (sim.alpha() > 0.02) frameRef.current = requestAnimationFrame(step);
          else frameRef.current = null;
        };
        frameRef.current = requestAnimationFrame(step);
      }
    }
  };

  /** Lets a dragged node rejoin the simulation. */
  const release = (id: string) => {
    const node = nodesRef.current.find((n) => n.id === id);
    if (!node) return;
    node.fx = null;
    node.fy = null;
  };

  return { positions, settled, pin, release };
}
