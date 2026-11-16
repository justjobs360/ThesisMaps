'use client';

import React, { useLayoutEffect, useRef, useState } from 'react';
import {
  RELATION_LABEL,
  ROLE_HINT,
  ROLE_LABEL,
  type NodeRole,
  type Related,
  type RelationKind,
  type Relations,
} from './relations';
import { compactCount } from './labels';

/**
 * What a paper is, and how it relates to the rest of the map.
 *
 * `RelationsCard` is the content; `HoverCard` floats it beside a node (the app
 * graph). The homepage docks the same content in a side pane instead, so the map
 * is never covered.
 *
 * Rows are live: hovering one calls `onPeek`, which the canvas uses to emphasise
 * the single edge to that paper, so a line of text maps to a line on the graph.
 */

export type CardPaper = {
  label: string;
  title: string;
  byline: string;
  year: number | null;
  citations: number;
  url?: string;
};

export type Anchor = { x: number; y: number; r: number };

const KIND_ORDER: RelationKind[] = ['buildsOn', 'builtOnBy', 'similar', 'coAuthor'];

const rowsFor = (rel: Relations, kind: RelationKind): Related[] =>
  kind === 'buildsOn' ? rel.buildsOn : kind === 'builtOnBy' ? rel.builtOnBy : kind === 'similar' ? rel.similar : rel.coAuthors;

export type Tone = 'light' | 'dark';

/** Class sets for the card on white (app) and on the homepage's dark stage. */
const TONE = {
  light: {
    eyebrow: 'text-accent',
    role: 'border-2 border-black text-black',
    title: 'text-black',
    meta: 'text-black/60',
    sep: 'text-black/30',
    rule: 'border-black',
    group: 'text-black/55',
    count: 'text-black/35',
    row: 'text-black hover:bg-black hover:text-white focus-visible:bg-black focus-visible:text-white',
    more: 'text-black/40',
    empty: 'text-black/50',
    ink: '#000',
    similar: '#0066FF',
  },
  dark: {
    eyebrow: 'text-[#6EA8FF]',
    role: 'border border-white/30 text-white/80',
    title: 'text-white',
    meta: 'text-white/55',
    sep: 'text-white/25',
    rule: 'border-white/15',
    group: 'text-white/45',
    count: 'text-white/30',
    row: 'text-white hover:bg-white hover:text-black focus-visible:bg-white focus-visible:text-black',
    more: 'text-white/35',
    empty: 'text-white/50',
    ink: '#fff',
    similar: '#4D94FF',
  },
} as const;

/** A sample of the line each relation is drawn with on the canvas. */
export function Swatch({ kind, tone = 'light' }: { kind: RelationKind; tone?: Tone }) {
  const t = TONE[tone];
  const style: React.CSSProperties =
    kind === 'similar'
      ? { borderTop: `2px dashed ${t.similar}` }
      : kind === 'coAuthor'
        ? { borderTop: `2px dotted ${t.ink}` }
        : { borderTop: `2px solid ${t.ink}` };
  return <span aria-hidden className="inline-block w-5 align-middle" style={style} />;
}

export function RelationsCard({
  paper,
  role,
  relations,
  labelOf,
  maxRows = 3,
  onPeek,
  onPick,
  footer,
  tone = 'light',
}: {
  tone?: Tone;
  paper: CardPaper;
  role: NodeRole;
  relations: Relations;
  labelOf: (id: string) => string;
  maxRows?: number;
  onPeek: (ids: ReadonlySet<string> | null) => void;
  onPick?: (id: string) => void;
  footer?: React.ReactNode;
}) {
  const t = TONE[tone];
  return (
    <div className="text-left">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className={`text-[10px] font-sans font-black uppercase tracking-widest ${t.eyebrow}`}>{paper.label}</span>
        <span
          title={ROLE_HINT[role]}
          className={`text-[9px] font-sans font-black uppercase tracking-widest px-1.5 py-0.5 cursor-help ${t.role}`}
        >
          {ROLE_LABEL[role]}
        </span>
      </div>

      <h3 className={`font-serif text-[19px] leading-[1.15] tracking-tight ${t.title}`}>
        {paper.url ? (
          <a href={paper.url} target="_blank" rel="noopener noreferrer" className="hover:underline underline-offset-2 decoration-2 decoration-accent">
            {paper.title}
          </a>
        ) : (
          paper.title
        )}
      </h3>
      <p className={`mt-1.5 text-[11px] font-sans font-medium ${t.meta}`}>
        {paper.byline}
        <span className={t.sep}> · </span>
        {paper.year ?? 'n.d.'}
        <span className={t.sep}> · </span>
        {compactCount(paper.citations)} citations
      </p>

      <div className={`mt-3 space-y-2.5 border-t-2 pt-2.5 ${t.rule}`}>
        {KIND_ORDER.map((kind) => {
          const rows = rowsFor(relations, kind);
          if (rows.length === 0) return null;
          const shown = rows.slice(0, maxRows);
          return (
            <section key={kind} aria-label={RELATION_LABEL[kind]}>
              <h4 className={`flex items-center gap-2 text-[9px] font-sans font-black uppercase tracking-[0.18em] mb-1 ${t.group}`}>
                <Swatch kind={kind} tone={tone} />
                {RELATION_LABEL[kind]}
                <span className={t.count}>{rows.length}</span>
              </h4>
              <ul>
                {shown.map((r) => (
                  <li key={r.edgeId}>
                    <button
                      type="button"
                      onMouseEnter={() => onPeek(new Set([r.id]))}
                      onMouseLeave={() => onPeek(null)}
                      onFocus={() => onPeek(new Set([r.id]))}
                      onBlur={() => onPeek(null)}
                      onClick={onPick ? () => onPick(r.id) : undefined}
                      className={`w-full flex items-baseline justify-between gap-3 px-1.5 -mx-1.5 py-0.5 text-left text-[12px] font-sans font-bold outline-none transition-colors duration-150 ${t.row}`}
                    >
                      <span className="truncate">{labelOf(r.id)}</span>
                      <span className="shrink-0 text-[10px] font-semibold opacity-60">
                        {kind === 'similar' && r.score != null
                          ? `${Math.round(r.score * 100)}%`
                          : kind === 'coAuthor' && r.names?.length
                            ? r.names.length > 1
                              ? `${r.names[0]} +${r.names.length - 1}`
                              : r.names[0]
                            : ''}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              {rows.length > shown.length ? (
                <p className={`text-[10px] font-sans font-semibold mt-0.5 ${t.more}`}>+{rows.length - shown.length} more</p>
              ) : null}
            </section>
          );
        })}
        {KIND_ORDER.every((k) => rowsFor(relations, k).length === 0) ? (
          <p className={`text-[11px] font-sans leading-snug ${t.empty}`}>
            No links to the other papers in this map yet. Save related work to connect it.
          </p>
        ) : null}
      </div>

      {footer ? <div className={`mt-3 border-t-2 pt-2 ${t.rule}`}>{footer}</div> : null}
    </div>
  );
}

const GAP = 10;

/**
 * `RelationsCard` floated beside a node. It stays open while the cursor travels
 * from the node into it: the wrapper carries transparent padding on the node side
 * (the "bridge"), and entering the card calls `onEnter` so the owner cancels its
 * close timer.
 */
export function HoverCard({
  anchor,
  bounds,
  topInset = 8,
  onEnter,
  onLeave,
  ...card
}: React.ComponentProps<typeof RelationsCard> & {
  anchor: Anchor;
  bounds: { w: number; h: number };
  /** Keep the card below controls pinned to the canvas's top edge. */
  topInset?: number;
  onEnter: () => void;
  onLeave: () => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  // Measure, then place: beside the node on whichever side has room, vertically
  // centred on it but clamped inside the canvas. Hidden until measured so it
  // never flashes at 0,0.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    const spaceRight = bounds.w - (anchor.x + anchor.r);
    const side = spaceRight >= width + GAP || spaceRight >= anchor.x - anchor.r ? 'right' : 'left';
    const left = side === 'right' ? anchor.x + anchor.r : anchor.x - anchor.r - width;
    const top = Math.max(topInset, Math.min(anchor.y - height / 2, bounds.h - height - 8));
    setPos({ left: Math.max(0, Math.min(left, bounds.w - width)), top });
  }, [anchor.x, anchor.y, anchor.r, bounds.w, bounds.h, card.relations, card.paper.title, topInset]);

  const side = pos && pos.left < anchor.x ? 'left' : 'right';

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={`${card.paper.label} — relationships`}
      className="absolute z-30"
      style={{ left: pos?.left ?? 0, top: pos?.top ?? 0, visibility: pos ? 'visible' : 'hidden' }}
      // Mouse (not pointer) events on purpose: the nodes use mouseenter/leave, and
      // browsers fire every pointer event before the compatibility mouse events —
      // so a pointerenter here would cancel the close timer *before* the node's
      // mouseleave started it, and the card would shut as the cursor arrived.
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onFocus={onEnter}
      onBlur={onLeave}
    >
      {/* Transparent bridge between the node and the card. */}
      <div style={side === 'right' ? { paddingLeft: GAP } : { paddingRight: GAP }}>
        <div className="w-[292px] max-w-[calc(100vw-32px)] bg-white border-2 border-black shadow-impact p-3.5">
          <RelationsCard {...card} />
        </div>
      </div>
    </div>
  );
}
