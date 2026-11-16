'use client';

import React from 'react';
import { GraphPreview } from './GraphPreview';

/**
 * Product previews for the marketing page. The graph lives in GraphPreview.tsx,
 * built on the same shared modules as the app's Knowledge Graph; the rest are
 * small static panels.
 */

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

/**
 * Coverage tones, drawn only from tokens the brutalist system already uses.
 *
 * These were `bg-success` (#2D6A4F dark green) and `bg-warning` (#B45309 amber).
 * Both are legitimate status colours in the APP, where they appear as text on
 * dense data screens — but as large fills on the marketing page they were two
 * more hues in a layout that is otherwise strictly black, white and #0066FF, and
 * they read as belonging to a different product for the same reason the graph's
 * ochre-and-teal year ramp did.
 *
 * Red survives the cull because `danger` (#FF0000) is already a brand token and
 * flat red on white is squarely inside this idiom; green and amber are not.
 * Severity still reads without hue memory, because the three tones differ in
 * weight as well as colour: red alarms, black is neutral, blue is healthy.
 */
const TONE_HEALTHY = 'bg-accent';
const TONE_NEUTRAL = 'bg-black';
const TONE_CRITICAL = 'bg-danger';

function OutlinePreview() {
  const rows = [
    { title: '1. Introduction', count: 8, pct: 82, tone: TONE_HEALTHY },
    { title: '2. Literature Review', count: 14, pct: 61, tone: TONE_HEALTHY },
    { title: '3. Methodology', count: 4, pct: 34, tone: TONE_NEUTRAL },
    { title: '4. Analysis', count: 1, pct: 12, tone: TONE_CRITICAL },
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
  // Three distinct tags need three distinguishable tones. Both of the amber ones
  // collapsed onto the same colour once amber was dropped, so they split across
  // the remaining two: black for the factual conflict, accent for the weakest of
  // the three. Ordered red > black > blue, which is also their severity order.
  const items = [
    { label: 'Sample size may not generalise', tag: 'Challenge', tone: TONE_CRITICAL },
    { label: 'Conflicting result in Zhou 2021', tag: 'Contradicts', tone: TONE_NEUTRAL },
    { label: 'Baseline choice needs defending', tag: 'Critique', tone: TONE_HEALTHY },
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
  story = false,
}: {
  kind: PreviewKind;
  animated?: boolean;
  interactive?: boolean;
  /** Graph only: play the pile-to-map scroll story. */
  story?: boolean;
}) {
  if (kind === 'graph') return <GraphPreview animated={animated} interactive={interactive} story={story} />;

  return (
    <div className="relative w-full h-full overflow-hidden" role="img" aria-label={LABELS[kind]}>
      {kind === 'sources' ? <SourcesPreview /> : null}
      {kind === 'outline' ? <OutlinePreview /> : null}
      {kind === 'gaps' ? <GapsPreview /> : null}
      {kind === 'defence' ? <DefencePreview /> : null}
    </div>
  );
}
