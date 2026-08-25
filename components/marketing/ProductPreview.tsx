'use client';

import React, { useCallback, useRef, useState } from 'react';
import { yearColor } from '@/components/graph/nodeColor';

/**
 * Product previews for the marketing page.
 *
 * The graph mirrors the real Knowledge Graph so the homepage and the app read as
 * one product: circles sized by citation count, coloured by publication year via
 * the same `yearColor` ramp, on light ground. It is deliberately unframed — no
 * black box, no hard rectangle edge — so it sits in the page rather than looking
 * like a screenshot dropped into it.
 *
 * Plain SVG rather than ReactFlow or d3: the marketing route stays light. Motion
 * is CSS-only (the .tm-* rules in globals.css, all reduced-motion gated there).
 */

const EDGE_CITATION = '#94A3B8';
const EDGE_SEMANTIC = '#0066FF';

const VIEW_W = 1080;
const VIEW_H = 550;
const MIN_R = 18;
const MAX_R = 54;

type PreviewNode = {
  id: string;
  x: number;
  y: number;
  /** Surname of the first author — the resting label, per the design brief. */
  author: string;
  title: string;
  year: number;
  citations: number;
  /** Ambient drift offset + timing, so each node moves independently. */
  dx: number;
  dy: number;
  dur: number;
};

const NODES: PreviewNode[] = [
  // Positions verified to clear each other at full circle size including the
  // label block beneath, with room for the drift, so nodes never collide.
  { id: 'a', x: 200, y: 150, author: 'Vaswani', title: 'Attention Is All You Need', year: 2017, citations: 112000, dx: 16, dy: -12, dur: 26 },
  { id: 'b', x: 520, y: 110, author: 'Bahdanau', title: 'Neural Machine Translation', year: 2015, citations: 24000, dx: -13, dy: 15, dur: 31 },
  { id: 'c', x: 210, y: 360, author: 'He', title: 'Deep Residual Learning', year: 2016, citations: 210000, dx: 12, dy: 14, dur: 29 },
  { id: 'd', x: 560, y: 290, author: 'Devlin', title: 'BERT: Pre-training', year: 2019, citations: 88000, dx: -15, dy: -11, dur: 34 },
  { id: 'e', x: 520, y: 450, author: 'Ranathunga', title: 'Low-Resource NMT Survey', year: 2021, citations: 1400, dx: 14, dy: -16, dur: 27 },
  { id: 'f', x: 900, y: 180, author: 'Kaplan', title: 'Scaling Laws for LMs', year: 2020, citations: 6200, dx: -12, dy: 15, dur: 32 },
  { id: 'g', x: 920, y: 380, author: 'Tay', title: 'Transformer Variants', year: 2022, citations: 900, dx: 15, dy: 12, dur: 28 },
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

// Area tracks citations on a sqrt scale, mirroring components/graph/nodeSize.ts.
const MAX_CITATIONS = Math.max(...NODES.map((n) => n.citations));
const radiusOf = (citations: number) =>
  MIN_R + (Math.sqrt(citations) / Math.sqrt(MAX_CITATIONS)) * (MAX_R - MIN_R);

const shortCount = (n: number) => (n >= 1000 ? `${Math.round(n / 1000)}k` : `${n}`);

const YEARS = NODES.map((n) => n.year);
const YEAR_RANGE = { min: Math.min(...YEARS), max: Math.max(...YEARS) };

/** Soft bezier between two node centres, matching the app's edge shape. */
function curve(a: Point, b: Point): string {
  const dx = Math.max(50, Math.abs(b.x - a.x) / 2);
  return `M ${a.x} ${a.y} C ${a.x + dx} ${a.y}, ${b.x - dx} ${b.y}, ${b.x} ${b.y}`;
}

/** Approximate path length, used to seed the draw-in dash pattern. */
function roughLen(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y) * 1.3;
}

/** Direct neighbours of a node, for hover isolation. */
function neighboursOf(id: string): Set<string> {
  const set = new Set<string>([id]);
  for (const e of EDGES) {
    if (e.from === id) set.add(e.to);
    if (e.to === id) set.add(e.from);
  }
  return set;
}

function GraphPreview({ animated, interactive }: { animated: boolean; interactive: boolean }) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [positions, setPositions] = useState<Record<string, Point>>(() =>
    Object.fromEntries(NODES.map((n) => [n.id, { x: n.x, y: n.y }]))
  );
  const [grabbed, setGrabbed] = useState<Set<string>>(() => new Set());
  const [hovered, setHovered] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const drag = useRef<{ id: string; startX: number; startY: number; origin: Point } | null>(null);

  const active = hovered ? neighboursOf(hovered) : null;

  const unitsPerPixel = useCallback(() => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return 1;
    return VIEW_W / rect.width / zoom;
  }, [zoom]);

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
      const r = MAX_R + 40;
      const x = clamp(d.origin.x + (e.clientX - d.startX) * scale, r, VIEW_W - r);
      const y = clamp(d.origin.y + (e.clientY - d.startY) * scale, r, VIEW_H - r - 24);
      setPositions((prev) => ({ ...prev, [d.id]: { x, y } }));
    },
    [unitsPerPixel]
  );

  const handlePointerUp = useCallback(() => {
    drag.current = null;
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!interactive) return;
      setZoom((z) => clamp(z * (e.deltaY < 0 ? 1.12 : 0.89), 0.6, 2.4));
    },
    [interactive]
  );

  const zoomBtn =
    'w-7 h-7 flex items-center justify-center border-2 border-black bg-white text-black text-sm font-black leading-none hover:bg-black hover:text-white transition-colors';

  return (
    <div className="relative w-full h-full">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
        onWheel={handleWheel}
        role="img"
        aria-label="Preview of the ThesisMaps knowledge graph: papers as circles sized by citation count and coloured by publication year, joined by citation and similarity links"
      >
        <defs>
          {/* Direction without arrowheads: each link fades from near-transparent
              at the source to full strength at the target. */}
          {EDGES.map((e) => {
            const a = positions[e.from];
            const b = positions[e.to];
            if (!a || !b) return null;
            const stroke = e.semantic ? EDGE_SEMANTIC : EDGE_CITATION;
            return (
              <linearGradient
                key={`grad-${e.from}-${e.to}`}
                id={`tm-edge-${e.from}-${e.to}`}
                gradientUnits="userSpaceOnUse"
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
              >
                <stop offset="0%" stopColor={stroke} stopOpacity={0.12} />
                <stop offset="100%" stopColor={stroke} stopOpacity={1} />
              </linearGradient>
            );
          })}
        </defs>

        <g style={{ transform: `scale(${zoom})`, transformOrigin: 'center', transition: 'transform 0.18s ease-out' }}>
          {/* Edges first so the circles paint over their endpoints. */}
          <g>
            {EDGES.map((e, i) => {
              const a = positions[e.from];
              const b = positions[e.to];
              if (!a || !b) return null;
              const touches = active ? active.has(e.from) && active.has(e.to) : false;
              const dim = active ? !touches : false;
              const len = Math.round(roughLen(a, b));
              return (
                <path
                  key={`${e.from}-${e.to}`}
                  d={curve(a, b)}
                  fill="none"
                  stroke={`url(#tm-edge-${e.from}-${e.to})`}
                  strokeWidth={touches ? 2.5 : 1.25}
                  strokeLinecap="round"
                  opacity={dim ? 0.06 : touches ? 1 : 0.34}
                  className={[animated && !active ? 'tm-draw' : '', touches ? 'tm-flow' : ''].join(' ').trim() || undefined}
                  style={
                    {
                      transition: 'opacity 0.25s, stroke-width 0.25s',
                      ...(touches ? { strokeDasharray: '14 10', '--tm-flow-len': 24, '--tm-dur': '0.9s' } : {}),
                      ...(animated && !active
                        ? { strokeDasharray: len, '--tm-draw-len': len, '--tm-delay': `${0.05 * i}s` }
                        : {}),
                    } as React.CSSProperties
                  }
                />
              );
            })}
          </g>

          {NODES.map((n, i) => {
            const p = positions[n.id] ?? { x: n.x, y: n.y };
            const drifting = animated && !grabbed.has(n.id) && !active;
            const r = radiusOf(n.citations);
            const isActive = active ? active.has(n.id) : false;
            const isFocus = hovered === n.id;
            const fill = yearColor(n.year, YEAR_RANGE);
            return (
              <g
                key={n.id}
                className={[
                  drifting ? 'tm-drift' : '',
                  animated ? 'tm-enter' : '',
                  interactive ? 'cursor-grab active:cursor-grabbing' : '',
                ].join(' ').trim() || undefined}
                style={{
                  ...(drifting
                    ? ({ '--tm-dx': `${n.dx}px`, '--tm-dy': `${n.dy}px`, '--tm-dur': `${n.dur}s` } as React.CSSProperties)
                    : {}),
                  ...(animated ? ({ '--tm-delay': `${0.35 + i * 0.07}s` } as React.CSSProperties) : {}),
                  opacity: active && !isActive ? 0.14 : 1,
                  transition: 'opacity 0.25s',
                  ...(interactive ? { touchAction: 'none' as const } : {}),
                }}
                onPointerDown={interactive ? (e) => handlePointerDown(e, n.id) : undefined}
                onPointerMove={interactive ? handlePointerMove : undefined}
                onPointerUp={interactive ? handlePointerUp : undefined}
                onPointerCancel={interactive ? handlePointerUp : undefined}
                onMouseEnter={() => setHovered(n.id)}
                onMouseLeave={() => setHovered(null)}
              >
                {isFocus ? <circle cx={p.x} cy={p.y} r={r + 9} fill="#0066FF" opacity={0.13} /> : null}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={r}
                  fill={fill}
                  stroke="#000000"
                  strokeWidth={isFocus ? 3.5 : 2}
                  style={{ transition: 'stroke-width 0.15s' }}
                />
                {/* Rest state is surname + year only, so the graph reads clean.
                    Title and citation count arrive on hover. */}
                <text
                  x={p.x}
                  y={p.y + r + 19}
                  textAnchor="middle"
                  fill="#000000"
                  fontSize={13}
                  fontWeight={700}
                  fontFamily="var(--font-dm-sans), system-ui, sans-serif"
                >
                  {n.author} {n.year}
                </text>
                {isFocus ? (
                  <>
                    <text
                      x={p.x}
                      y={p.y + r + 36}
                      textAnchor="middle"
                      fill="#000000"
                      fontSize={12}
                      fontWeight={600}
                      fontFamily="var(--font-dm-sans), system-ui, sans-serif"
                    >
                      {n.title.length > 28 ? `${n.title.slice(0, 27)}…` : n.title}
                    </text>
                    <text
                      x={p.x}
                      y={p.y + r + 51}
                      textAnchor="middle"
                      fill="#666666"
                      fontSize={11}
                      fontFamily="var(--font-dm-sans), system-ui, sans-serif"
                    >
                      {shortCount(n.citations)} citations
                    </text>
                  </>
                ) : null}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Affordance label: a real label top-left, not a 9px whisper in a corner. */}
      {interactive ? (
        <span className="absolute top-0 left-0 flex items-center gap-1.5 px-2.5 py-1.5 border-2 border-black bg-white text-[9px] font-sans font-black uppercase tracking-widest text-black pointer-events-none select-none">
          Drag · hover to isolate
        </span>
      ) : null}

      {interactive ? (
        <div className="absolute top-0 right-0 flex gap-1">
          <button onClick={() => setZoom((z) => clamp(z * 1.15, 0.6, 2.4))} aria-label="Zoom in" className={zoomBtn}>
            +
          </button>
          <button onClick={() => setZoom((z) => clamp(z * 0.87, 0.6, 2.4))} aria-label="Zoom out" className={zoomBtn}>
            −
          </button>
        </div>
      ) : null}
    </div>
  );
}

/** One line explaining both encodings, mirroring the Knowledge Graph legend. */
export function GraphLegend() {
  return (
    <div className="mt-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[10px] font-sans font-bold uppercase tracking-widest text-black/60">
      <span className="flex items-end gap-1.5">
        <span className="rounded-full border-2 border-black bg-white" style={{ width: 8, height: 8 }} />
        <span className="rounded-full border-2 border-black bg-white" style={{ width: 13, height: 13 }} />
        <span className="rounded-full border-2 border-black bg-white" style={{ width: 19, height: 19 }} />
        <span className="ml-1">Size = citations</span>
      </span>
      <span className="flex items-center gap-2">
        <span>{YEAR_RANGE.min}</span>
        <span
          className="h-2.5 w-28 border-2 border-black"
          style={{ background: `linear-gradient(90deg, ${yearColor(YEAR_RANGE.min, YEAR_RANGE)}, ${yearColor(YEAR_RANGE.max, YEAR_RANGE)})` }}
          aria-hidden
        />
        <span>{YEAR_RANGE.max}</span>
        <span className="ml-1">Colour = year</span>
      </span>
    </div>
  );
}

/** Layout for the non-graph previews. */
function PanelStack({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <div className="w-full max-w-[520px] space-y-2">{children}</div>
    </div>
  );
}

const ROW = 'border-2 border-black bg-white px-3 py-2 flex items-center gap-3';

function SourcesPreview() {
  const sources = [
    { name: 'Semantic Scholar', count: '214' },
    { name: 'OpenAlex', count: '186' },
    { name: 'arXiv', count: '92' },
    { name: 'CrossRef', count: '77' },
    { name: 'PubMed', count: '41' },
  ];
  return (
    <PanelStack>
      {sources.map((s, i) => (
        <div key={s.name} className={ROW}>
          <span className="w-1.5 h-1.5 bg-accent flex-shrink-0" aria-hidden />
          <span className="flex-1 text-[11px] font-sans font-black uppercase tracking-tight text-black truncate">{s.name}</span>
          <span className="text-[10px] font-sans font-bold text-black/40">{s.count} results</span>
          {i === 0 ? (
            <span className="text-[9px] font-sans font-black uppercase tracking-widest text-white bg-black px-1.5 py-0.5">Deduped</span>
          ) : null}
        </div>
      ))}
    </PanelStack>
  );
}

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

export type PreviewKind = 'graph' | 'sources' | 'outline' | 'gaps' | 'defence';

const LABELS: Record<Exclude<PreviewKind, 'graph'>, string> = {
  sources: 'Preview of multi-source search: results from eight academic databases, deduplicated into one list',
  outline: 'Preview of the outline builder: thesis chapters with assigned paper counts and coverage scores',
  gaps: 'Preview of gap detection: topic clusters ranked by how under-researched they are',
  defence: 'Preview of defence readiness: anticipated counter-arguments and critiques',
};

export function ProductPreview({
  kind,
  animated = false,
  interactive = false,
}: {
  kind: PreviewKind;
  animated?: boolean;
  interactive?: boolean;
}) {
  if (kind === 'graph') return <GraphPreview animated={animated} interactive={interactive} />;

  return (
    <div className="relative w-full h-full overflow-hidden" role="img" aria-label={LABELS[kind]}>
      {kind === 'sources' ? <SourcesPreview /> : null}
      {kind === 'outline' ? <OutlinePreview /> : null}
      {kind === 'gaps' ? <GapsPreview /> : null}
      {kind === 'defence' ? <DefencePreview /> : null}
    </div>
  );
}
