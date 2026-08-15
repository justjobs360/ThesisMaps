'use client';

import React, { useCallback, useRef, useState } from 'react';

/**
 * Honest, dependency-free previews of the product for the marketing page.
 *
 * Geometry and colour are lifted from the real components so the preview can't
 * drift from the product: nodes are 180x70 white rects with a 4px left accent bar
 * (components/graph/PaperNode.tsx), the palette is components/graph/nodeColor.ts,
 * and the edge styling matches components/graph/EdgeTypes.tsx.
 *
 * Deliberately plain SVG/divs rather than ReactFlow or d3 — the marketing route
 * must stay light. Ambient motion is CSS-only (.tm-drift/.tm-pulse in globals.css,
 * which honour prefers-reduced-motion); dragging is a few lines of pointer maths.
 */

// components/graph/nodeColor.ts
const SEED = '#0066FF';
const CITING = '#60A5FA';
const INFLUENTIAL = '#000000';
const CITED = '#94A3B8';
// components/graph/EdgeTypes.tsx
const EDGE_CITATION = '#64748B';
const EDGE_SEMANTIC = '#0066FF';

const NODE_W = 180;
const NODE_H = 70;
const VIEW_W = 1160;
const VIEW_H = 380;

type PreviewNode = {
  id: string;
  x: number;
  y: number;
  accent: string;
  title: string;
  meta: string;
  /** Ambient drift offset + timing, so each node moves independently. */
  dx: number;
  dy: number;
  dur: number;
  delay: number;
};

const NODES: PreviewNode[] = [
  { id: 'a', x: 40,  y: 40,  accent: SEED,        title: 'Attention Is All You Need',  meta: '2017 · 112k cit.', dx: 7,  dy: -6, dur: 19, delay: 0 },
  { id: 'b', x: 330, y: 20,  accent: CITED,       title: 'Neural Machine Translation', meta: '2015 · 24k cit.',  dx: -6, dy: 7,  dur: 23, delay: 1.5 },
  { id: 'c', x: 320, y: 165, accent: INFLUENTIAL, title: 'Deep Residual Learning',     meta: '2016 · 210k cit.', dx: 6,  dy: 6,  dur: 21, delay: 0.8 },
  { id: 'd', x: 620, y: 75,  accent: CITING,      title: 'BERT: Pre-training',         meta: '2019 · 88k cit.',  dx: -7, dy: -5, dur: 25, delay: 2.2 },
  { id: 'e', x: 600, y: 250, accent: CITED,       title: 'Low-Resource NMT Survey',    meta: '2021 · 1.4k cit.', dx: 5,  dy: -7, dur: 20, delay: 1.1 },
  { id: 'f', x: 900, y: 30,  accent: SEED,        title: 'Scaling Laws for LMs',       meta: '2020 · 6.2k cit.', dx: -5, dy: 6,  dur: 24, delay: 0.4 },
  { id: 'g', x: 890, y: 195, accent: CITING,      title: 'Transformer Variants',       meta: '2022 · 900 cit.',  dx: 6,  dy: 5,  dur: 22, delay: 1.9 },
];

type PreviewEdge = { from: string; to: string; semantic?: boolean };

const EDGES: PreviewEdge[] = [
  { from: 'a', to: 'b' },
  { from: 'a', to: 'c' },
  { from: 'b', to: 'd' },
  { from: 'c', to: 'd', semantic: true },
  { from: 'c', to: 'e' },
  { from: 'd', to: 'f' },
  { from: 'd', to: 'g', semantic: true },
  { from: 'e', to: 'g' },
];

type Point = { x: number; y: number };

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Horizontal cubic bezier, matching ReactFlow's default edge shape. */
function edgePath(a: Point, b: Point): string {
  const x1 = a.x + NODE_W / 2;
  const y1 = a.y + NODE_H / 2;
  const x2 = b.x + NODE_W / 2;
  const y2 = b.y + NODE_H / 2;
  const dx = Math.max(40, Math.abs(x2 - x1) / 2);
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
}

/**
 * Dark frame shared by every preview, so the white cards inside read as product
 * UI sitting on the graph canvas.
 */
function PreviewFrame({
  children,
  label,
  hint,
}: {
  children: React.ReactNode;
  label: string;
  hint?: string;
}) {
  return (
    <div
      className="relative w-full h-full overflow-hidden bg-black border-2 border-black shadow-impact"
      role="img"
      aria-label={label}
    >
      {/* Same dot grid as the product's graph canvas background. */}
      <div
        className="absolute inset-0 opacity-20 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]"
        aria-hidden
      />
      <div className="relative w-full h-full">{children}</div>
      {hint ? (
        <span className="absolute bottom-2 right-3 text-[9px] font-sans font-black uppercase tracking-widest text-white/40 pointer-events-none select-none">
          {hint}
        </span>
      ) : null}
    </div>
  );
}

function GraphPreview({ animated, interactive }: { animated: boolean; interactive: boolean }) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [positions, setPositions] = useState<Record<string, Point>>(() =>
    Object.fromEntries(NODES.map((n) => [n.id, { x: n.x, y: n.y }]))
  );
  // Nodes the user has grabbed stop drifting — their position is now user-owned,
  // otherwise the CSS animation would fight the drag.
  const [grabbed, setGrabbed] = useState<Set<string>>(() => new Set());
  const drag = useRef<{ id: string; startX: number; startY: number; origin: Point } | null>(null);

  /** viewBox units per screen pixel, so dragging tracks the cursor at any size. */
  const unitsPerPixel = useCallback(() => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return 1;
    return VIEW_W / rect.width;
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<SVGGElement>, id: string) => {
      if (!interactive) return;
      const origin = positions[id];
      if (!origin) return;
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      drag.current = { id, startX: e.clientX, startY: e.clientY, origin };
      setGrabbed((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
    },
    [interactive, positions]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGGElement>) => {
      const d = drag.current;
      if (!d) return;
      const scale = unitsPerPixel();
      const x = clamp(d.origin.x + (e.clientX - d.startX) * scale, 0, VIEW_W - NODE_W);
      const y = clamp(d.origin.y + (e.clientY - d.startY) * scale, 0, VIEW_H - NODE_H);
      setPositions((prev) => ({ ...prev, [d.id]: { x, y } }));
    },
    [unitsPerPixel]
  );

  const handlePointerUp = useCallback(() => {
    drag.current = null;
  }, []);

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className="w-full h-full"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Edges first so node rectangles paint over their endpoints — that is what
          lets a node drift or be dragged without a line appearing to detach. */}
      <g>
        {EDGES.map((e, i) => {
          const a = positions[e.from];
          const b = positions[e.to];
          if (!a || !b) return null;
          return (
            <path
              key={`${e.from}-${e.to}`}
              d={edgePath(a, b)}
              fill="none"
              stroke={e.semantic ? EDGE_SEMANTIC : EDGE_CITATION}
              strokeWidth={1.5}
              strokeDasharray={e.semantic ? '6 3' : undefined}
              opacity={0.5}
              className={animated && e.semantic ? 'tm-pulse' : undefined}
              style={
                animated && e.semantic
                  ? ({ '--tm-dur': `${6 + i}s`, '--tm-delay': `${i * 0.7}s` } as React.CSSProperties)
                  : undefined
              }
            />
          );
        })}
      </g>

      {NODES.map((n) => {
        const p = positions[n.id] ?? { x: n.x, y: n.y };
        const drifting = animated && !grabbed.has(n.id);
        return (
          <g
            key={n.id}
            className={[
              drifting ? 'tm-drift' : '',
              interactive ? 'cursor-grab active:cursor-grabbing' : '',
            ].join(' ').trim() || undefined}
            style={{
              ...(drifting
                ? ({
                    '--tm-dx': `${n.dx}px`,
                    '--tm-dy': `${n.dy}px`,
                    '--tm-dur': `${n.dur}s`,
                    '--tm-delay': `${n.delay}s`,
                  } as React.CSSProperties)
                : {}),
              // Stops touch-drag from scrolling the page instead of moving a node.
              ...(interactive ? { touchAction: 'none' as const } : {}),
            }}
            onPointerDown={interactive ? (e) => handlePointerDown(e, n.id) : undefined}
            onPointerMove={interactive ? handlePointerMove : undefined}
            onPointerUp={interactive ? handlePointerUp : undefined}
            onPointerCancel={interactive ? handlePointerUp : undefined}
          >
            <rect x={p.x} y={p.y} width={NODE_W} height={NODE_H} fill="#FFFFFF" stroke="#000000" strokeWidth={2} />
            <rect x={p.x} y={p.y} width={4} height={NODE_H} fill={n.accent} />
            <text x={p.x + 14} y={p.y + 27} fill="#000000" fontSize={12} fontWeight={600} fontFamily="var(--font-dm-sans), system-ui, sans-serif">
              {n.title}
            </text>
            <text x={p.x + 14} y={p.y + 48} fill="#666666" fontSize={10} fontFamily="var(--font-dm-sans), system-ui, sans-serif">
              {n.meta}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** Layout for the non-graph previews, inside the dark frame. */
function PanelStack({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <div className="w-full max-w-[520px] space-y-2">{children}</div>
    </div>
  );
}

const ROW = 'border-2 border-black bg-white px-3 py-2 flex items-center gap-3';

function OutlinePreview() {
  const rows = [
    { title: '1. Introduction', count: 8, pct: 82, tone: 'bg-success' },
    { title: '2. Literature Review', count: 14, pct: 61, tone: 'bg-success' },
    { title: '3. Methodology', count: 4, pct: 34, tone: 'bg-warning' },
    { title: '4. Analysis', count: 1, pct: 12, tone: 'bg-danger' },
  ];
  return (
    <PanelStack>
      {rows.map((r) => (
        <div key={r.title} className={ROW}>
          <span className="flex-1 text-[11px] font-sans font-black uppercase tracking-tight text-black truncate">{r.title}</span>
          <span className="text-[10px] font-sans font-bold text-black/40 hidden sm:inline">{r.count} papers</span>
          <span className="w-16 h-2.5 border-2 border-black bg-white overflow-hidden flex-shrink-0">
            <span className={`block h-full ${r.tone}`} style={{ width: `${r.pct}%` }} />
          </span>
        </div>
      ))}
    </PanelStack>
  );
}

function GapsPreview() {
  const clusters = [
    { name: 'Low-resource translation', score: 78, high: true },
    { name: 'Evaluation metrics', score: 64, high: true },
    { name: 'Attention mechanisms', score: 28, high: false },
  ];
  return (
    <PanelStack>
      {clusters.map((c) => (
        <div key={c.name} className="border-2 border-black bg-white p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-sans font-black uppercase tracking-tight text-black truncate">{c.name}</span>
            <span className="text-[10px] font-sans font-black text-accent ml-2">{c.score}%</span>
          </div>
          <div className="h-2.5 border-2 border-black bg-white overflow-hidden">
            <div className={c.high ? 'h-full bg-accent' : 'h-full bg-black'} style={{ width: `${c.score}%` }} />
          </div>
        </div>
      ))}
    </PanelStack>
  );
}

function DefencePreview() {
  const items = [
    { label: 'Sample size may not generalise', tag: 'Challenge', tone: 'bg-danger' },
    { label: 'Conflicting result in Zhou 2021', tag: 'Contradicts', tone: 'bg-warning' },
    { label: 'Baseline choice needs defending', tag: 'Critique', tone: 'bg-warning' },
  ];
  return (
    <PanelStack>
      {items.map((i) => (
        <div key={i.label} className="border-2 border-black bg-white p-3">
          <span className={`inline-block px-1.5 py-0.5 text-[9px] font-sans font-black uppercase tracking-widest text-white ${i.tone}`}>
            {i.tag}
          </span>
          <p className="mt-1.5 text-[11px] font-sans font-bold text-black leading-snug">{i.label}</p>
        </div>
      ))}
    </PanelStack>
  );
}

export type PreviewKind = 'graph' | 'outline' | 'gaps' | 'defence';

const LABELS: Record<PreviewKind, string> = {
  graph: 'Preview of the ThesisMaps knowledge graph: saved papers connected by citation and semantic-similarity links',
  outline: 'Preview of the outline builder: thesis chapters with assigned paper counts and coverage scores',
  gaps: 'Preview of gap detection: topic clusters ranked by how under-researched they are',
  defence: 'Preview of defence readiness: anticipated counter-arguments and critiques',
};

/**
 * @param kind        which product surface to depict
 * @param animated    slow ambient drift — hero only, so the feature rows stay cheap
 * @param interactive lets the viewer drag the graph nodes around
 */
export function ProductPreview({
  kind,
  animated = false,
  interactive = false,
}: {
  kind: PreviewKind;
  animated?: boolean;
  interactive?: boolean;
}) {
  const isGraph = kind === 'graph';
  return (
    <PreviewFrame
      label={LABELS[kind]}
      hint={isGraph && interactive ? 'Drag the papers' : undefined}
    >
      {kind === 'outline' ? (
        <OutlinePreview />
      ) : kind === 'gaps' ? (
        <GapsPreview />
      ) : kind === 'defence' ? (
        <DefencePreview />
      ) : (
        <GraphPreview animated={animated} interactive={interactive} />
      )}
    </PreviewFrame>
  );
}
