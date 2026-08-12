import React from 'react';

/**
 * Honest, dependency-free previews of the product for the marketing page.
 *
 * Geometry and colour are lifted from the real components so the preview can't
 * drift from the product: nodes are 180x70 white rects with a 4px left accent bar
 * (components/graph/PaperNode.tsx), the palette is components/graph/nodeColor.ts,
 * and the edge styling matches components/graph/EdgeTypes.tsx.
 *
 * Deliberately plain SVG/divs rather than ReactFlow or d3 — the marketing route
 * must stay light, and motion is CSS-only (see .tm-drift/.tm-pulse in globals.css,
 * which also honour prefers-reduced-motion).
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

type PreviewNode = {
  id: string;
  x: number;
  y: number;
  accent: string;
  title: string;
  meta: string;
  /** Drift offset + timing, so each node moves independently. */
  dx: number;
  dy: number;
  dur: number;
  delay: number;
};

const NODES: PreviewNode[] = [
  { id: 'a', x: 40,  y: 40,  accent: SEED,        title: 'Attention Is All You Need',   meta: '2017 · 112k cit.', dx: 7,  dy: -6, dur: 19, delay: 0 },
  { id: 'b', x: 330, y: 20,  accent: CITED,       title: 'Neural Machine Translation',  meta: '2015 · 24k cit.',  dx: -6, dy: 7,  dur: 23, delay: 1.5 },
  { id: 'c', x: 320, y: 165, accent: INFLUENTIAL, title: 'Deep Residual Learning',      meta: '2016 · 210k cit.', dx: 6,  dy: 6,  dur: 21, delay: 0.8 },
  { id: 'd', x: 620, y: 75,  accent: CITING,      title: 'BERT: Pre-training',          meta: '2019 · 88k cit.',  dx: -7, dy: -5, dur: 25, delay: 2.2 },
  { id: 'e', x: 600, y: 250, accent: CITED,       title: 'Low-Resource NMT Survey',     meta: '2021 · 1.4k cit.', dx: 5,  dy: -7, dur: 20, delay: 1.1 },
  { id: 'f', x: 900, y: 30,  accent: SEED,        title: 'Scaling Laws for LMs',        meta: '2020 · 6.2k cit.', dx: -5, dy: 6,  dur: 24, delay: 0.4 },
  { id: 'g', x: 890, y: 195, accent: CITING,      title: 'Transformer Variants',        meta: '2022 · 900 cit.',  dx: 6,  dy: 5,  dur: 22, delay: 1.9 },
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

const centre = (n: PreviewNode) => ({ cx: n.x + NODE_W / 2, cy: n.y + NODE_H / 2 });

/** Horizontal cubic bezier, matching ReactFlow's default edge shape. */
function edgePath(a: PreviewNode, b: PreviewNode): string {
  const { cx: x1, cy: y1 } = centre(a);
  const { cx: x2, cy: y2 } = centre(b);
  const dx = Math.max(40, Math.abs(x2 - x1) / 2);
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
}

function GraphPreview({ animated }: { animated: boolean }) {
  const byId = new Map(NODES.map((n) => [n.id, n]));

  return (
    <svg
      viewBox="0 0 1160 380"
      className="w-full h-full"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Preview of the ThesisMaps knowledge graph: saved papers connected by citation and semantic-similarity links"
    >
      {/* Edges first so the node rectangles paint over their endpoints — this is
          what lets nodes drift a few px without a line appearing to detach. */}
      <g>
        {EDGES.map((e, i) => {
          const a = byId.get(e.from);
          const b = byId.get(e.to);
          if (!a || !b) return null;
          return (
            <path
              key={`${e.from}-${e.to}`}
              d={edgePath(a, b)}
              fill="none"
              stroke={e.semantic ? EDGE_SEMANTIC : EDGE_CITATION}
              strokeWidth={1.5}
              strokeDasharray={e.semantic ? '6 3' : undefined}
              opacity={0.45}
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

      {NODES.map((n) => (
        <g
          key={n.id}
          className={animated ? 'tm-drift' : undefined}
          style={
            animated
              ? ({
                  '--tm-dx': `${n.dx}px`,
                  '--tm-dy': `${n.dy}px`,
                  '--tm-dur': `${n.dur}s`,
                  '--tm-delay': `${n.delay}s`,
                } as React.CSSProperties)
              : undefined
          }
        >
          <rect x={n.x} y={n.y} width={NODE_W} height={NODE_H} fill="#FFFFFF" stroke="#000000" strokeWidth={2} />
          <rect x={n.x} y={n.y} width={4} height={NODE_H} fill={n.accent} />
          <text x={n.x + 14} y={n.y + 27} fill="#000000" fontSize={12} fontWeight={600} fontFamily="var(--font-dm-sans), system-ui, sans-serif">
            {n.title}
          </text>
          <text x={n.x + 14} y={n.y + 48} fill="#666666" fontSize={10} fontFamily="var(--font-dm-sans), system-ui, sans-serif">
            {n.meta}
          </text>
        </g>
      ))}
    </svg>
  );
}

/** Small shared shell for the non-graph previews. */
function PanelShell({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="w-full h-full flex items-center justify-center p-2" role="img" aria-label={label}>
      <div className="w-full max-w-[520px] space-y-2">{children}</div>
    </div>
  );
}

const ROW = 'border-2 border-black bg-white px-3 py-2 flex items-center gap-3';

function OutlinePreview() {
  const rows: { title: string; count: number; pct: number; tone: string }[] = [
    { title: '1. Introduction', count: 8, pct: 82, tone: 'bg-success' },
    { title: '2. Literature Review', count: 14, pct: 61, tone: 'bg-success' },
    { title: '3. Methodology', count: 4, pct: 34, tone: 'bg-warning' },
    { title: '4. Analysis', count: 1, pct: 12, tone: 'bg-danger' },
  ];
  return (
    <PanelShell label="Preview of the outline builder: thesis chapters with assigned paper counts and coverage scores">
      {rows.map((r) => (
        <div key={r.title} className={ROW}>
          <span className="flex-1 text-[11px] font-sans font-black uppercase tracking-tight text-black truncate">{r.title}</span>
          <span className="text-[10px] font-sans font-bold text-black/40">{r.count} papers</span>
          <span className="w-16 h-2.5 border-2 border-black bg-white overflow-hidden flex-shrink-0">
            <span className={`block h-full ${r.tone}`} style={{ width: `${r.pct}%` }} />
          </span>
        </div>
      ))}
    </PanelShell>
  );
}

function GapsPreview() {
  const clusters: { name: string; score: number; high: boolean }[] = [
    { name: 'Low-resource translation', score: 78, high: true },
    { name: 'Evaluation metrics', score: 64, high: true },
    { name: 'Attention mechanisms', score: 28, high: false },
  ];
  return (
    <PanelShell label="Preview of gap detection: topic clusters ranked by how under-researched they are">
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
    </PanelShell>
  );
}

function DefencePreview() {
  const items: { label: string; tag: string; tone: string }[] = [
    { label: 'Sample size may not generalise', tag: 'Challenge', tone: 'bg-danger' },
    { label: 'Conflicting result in Zhou 2021', tag: 'Contradicts', tone: 'bg-warning' },
    { label: 'Baseline choice needs defending', tag: 'Critique', tone: 'bg-warning' },
  ];
  return (
    <PanelShell label="Preview of defence readiness: anticipated counter-arguments and critiques with prepared responses">
      {items.map((i) => (
        <div key={i.label} className="border-2 border-black bg-white p-3">
          <span className={`inline-block px-1.5 py-0.5 text-[9px] font-sans font-black uppercase tracking-widest text-white ${i.tone}`}>
            {i.tag}
          </span>
          <p className="mt-1.5 text-[11px] font-sans font-bold text-black leading-snug">{i.label}</p>
        </div>
      ))}
    </PanelShell>
  );
}

export type PreviewKind = 'graph' | 'outline' | 'gaps' | 'defence';

/**
 * @param kind    which product surface to depict
 * @param animated slow autonomous drift — hero only, so the feature rows stay static
 */
export function ProductPreview({ kind, animated = false }: { kind: PreviewKind; animated?: boolean }) {
  if (kind === 'outline') return <OutlinePreview />;
  if (kind === 'gaps') return <GapsPreview />;
  if (kind === 'defence') return <DefencePreview />;
  return <GraphPreview animated={animated} />;
}
