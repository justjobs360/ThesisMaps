'use client';

import React, { useCallback, useRef, useState } from 'react';

/**
 * Honest, dependency-free previews of the product for the marketing page.
 *
 * The graph preview mirrors the real knowledge graph: circles sized by citation
 * count, straight centre-to-centre links, and hover-to-isolate. Colour and edge
 * styling come from components/graph/nodeColor.ts and EdgeTypes.tsx so the two
 * can't drift apart.
 *
 * Deliberately plain SVG rather than ReactFlow or d3 — the marketing route must
 * stay light. Ambient motion is CSS-only (.tm-drift/.tm-pulse in globals.css,
 * which honour prefers-reduced-motion); drag and hover are a few lines each.
 */

// components/graph/nodeColor.ts
const SEED = '#0066FF';
const CITING = '#60A5FA';
const INFLUENTIAL = '#000000';
const CITED = '#94A3B8';
// components/graph/EdgeTypes.tsx
const EDGE_CITATION = '#64748B';
const EDGE_SEMANTIC = '#0066FF';

const VIEW_W = 1160;
const VIEW_H = 380;
const MIN_R = 16;
const MAX_R = 46;

type PreviewNode = {
  id: string;
  x: number;
  y: number;
  accent: string;
  title: string;
  year: number;
  citations: number;
  /** Ambient drift offset + timing, so each node moves independently. */
  dx: number;
  dy: number;
  dur: number;
  delay: number;
};

const NODES: PreviewNode[] = [
  { id: 'a', x: 110, y: 105, accent: SEED,        title: 'Attention Is All You Need',  year: 2017, citations: 112000, dx: 7,  dy: -6, dur: 19, delay: 0 },
  { id: 'b', x: 360, y: 60,  accent: CITED,       title: 'Neural Machine Translation', year: 2015, citations: 24000,  dx: -6, dy: 7,  dur: 23, delay: 1.5 },
  { id: 'c', x: 380, y: 240, accent: INFLUENTIAL, title: 'Deep Residual Learning',     year: 2016, citations: 210000, dx: 6,  dy: 6,  dur: 21, delay: 0.8 },
  { id: 'd', x: 650, y: 140, accent: CITING,      title: 'BERT: Pre-training',         year: 2019, citations: 88000,  dx: -7, dy: -5, dur: 25, delay: 2.2 },
  { id: 'e', x: 700, y: 300, accent: CITED,       title: 'Low-Resource NMT Survey',    year: 2021, citations: 1400,   dx: 5,  dy: -7, dur: 20, delay: 1.1 },
  { id: 'f', x: 950, y: 90,  accent: SEED,        title: 'Scaling Laws for LMs',       year: 2020, citations: 6200,   dx: -5, dy: 6,  dur: 24, delay: 0.4 },
  { id: 'g', x: 960, y: 265, accent: CITING,      title: 'Transformer Variants',       year: 2022, citations: 900,    dx: 6,  dy: 5,  dur: 22, delay: 1.9 },
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

// Area tracks citations, same sqrt encoding as components/graph/nodeSize.ts.
const MAX_CITATIONS = Math.max(...NODES.map((n) => n.citations));
const radiusOf = (citations: number) =>
  MIN_R + (Math.sqrt(citations) / Math.sqrt(MAX_CITATIONS)) * (MAX_R - MIN_R);

const shortCount = (n: number) => (n >= 1000 ? `${Math.round(n / 1000)}k` : `${n}`);

/** Direct neighbours of a node, for hover isolation. */
function neighboursOf(id: string): Set<string> {
  const set = new Set<string>([id]);
  for (const e of EDGES) {
    if (e.from === id) set.add(e.to);
    if (e.to === id) set.add(e.from);
  }
  return set;
}

/**
 * Dark frame shared by every preview, so the content inside reads as product UI
 * sitting on a canvas.
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
  // Grabbed nodes stop drifting — position becomes user-owned, so the CSS
  // animation doesn't fight the drag.
  const [grabbed, setGrabbed] = useState<Set<string>>(() => new Set());
  const [hovered, setHovered] = useState<string | null>(null);
  const drag = useRef<{ id: string; startX: number; startY: number; origin: Point } | null>(null);

  const active = hovered ? neighboursOf(hovered) : null;

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
      const r = MAX_R;
      const x = clamp(d.origin.x + (e.clientX - d.startX) * scale, r, VIEW_W - r);
      const y = clamp(d.origin.y + (e.clientY - d.startY) * scale, r, VIEW_H - r - 24);
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
      {/* Edges first so the circles paint over their endpoints — that's what lets
          a node drift or be dragged without a line appearing to detach. */}
      <g>
        {EDGES.map((e, i) => {
          const a = positions[e.from];
          const b = positions[e.to];
          if (!a || !b) return null;
          const touches = active ? active.has(e.from) && active.has(e.to) : false;
          const dim = active ? !touches : false;
          return (
            <line
              key={`${e.from}-${e.to}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={touches ? '#FFFFFF' : e.semantic ? EDGE_SEMANTIC : EDGE_CITATION}
              strokeWidth={touches ? 2.5 : 1.5}
              strokeDasharray={e.semantic ? '6 3' : undefined}
              opacity={dim ? 0.08 : touches ? 1 : 0.5}
              className={animated && e.semantic && !active ? 'tm-pulse' : undefined}
              style={
                {
                  transition: 'opacity 0.2s, stroke-width 0.2s',
                  ...(animated && e.semantic && !active
                    ? { '--tm-dur': `${6 + i}s`, '--tm-delay': `${i * 0.7}s` }
                    : {}),
                } as React.CSSProperties
              }
            />
          );
        })}
      </g>

      {NODES.map((n) => {
        const p = positions[n.id] ?? { x: n.x, y: n.y };
        const drifting = animated && !grabbed.has(n.id) && !active;
        const r = radiusOf(n.citations);
        const isActive = active ? active.has(n.id) : false;
        const isFocus = hovered === n.id;
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
              opacity: active && !isActive ? 0.15 : 1,
              transition: 'opacity 0.2s',
              ...(interactive ? { touchAction: 'none' as const } : {}),
            }}
            onPointerDown={interactive ? (e) => handlePointerDown(e, n.id) : undefined}
            onPointerMove={interactive ? handlePointerMove : undefined}
            onPointerUp={interactive ? handlePointerUp : undefined}
            onPointerCancel={interactive ? handlePointerUp : undefined}
            onMouseEnter={() => setHovered(n.id)}
            onMouseLeave={() => setHovered(null)}
          >
            <circle
              cx={p.x}
              cy={p.y}
              r={r}
              fill={n.accent}
              stroke={isFocus ? '#FFFFFF' : 'rgba(255,255,255,0.55)'}
              strokeWidth={isFocus ? 3 : 2}
              style={{ transition: 'stroke-width 0.15s' }}
            />
            <text
              x={p.x}
              y={p.y + r + 16}
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize={12}
              fontWeight={600}
              fontFamily="var(--font-dm-sans), system-ui, sans-serif"
            >
              {n.title.length > 26 ? `${n.title.slice(0, 25)}…` : n.title}
            </text>
            <text
              x={p.x}
              y={p.y + r + 30}
              textAnchor="middle"
              fill="rgba(255,255,255,0.45)"
              fontSize={10}
              fontFamily="var(--font-dm-sans), system-ui, sans-serif"
            >
              {n.year} · {shortCount(n.citations)} cit.
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
  graph: 'Preview of the ThesisMaps knowledge graph: papers as circles sized by citation count, connected by citation and semantic-similarity links',
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
      hint={isGraph ? (interactive ? 'Drag · hover to isolate' : 'Hover to isolate') : undefined}
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
