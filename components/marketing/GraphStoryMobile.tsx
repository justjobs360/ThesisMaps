'use client';

import React, { useMemo } from 'react';
import { yearColor } from '@/components/graph/nodeColor';
import { sqrtRadius } from '@/components/graph/nodeSize';
import { computeFocus, type Focus } from '@/components/graph/shared/relations';
import {
  BY_ID,
  CHAPTERS,
  EDGES,
  MAX_CITATIONS,
  NODES,
  ORDER,
  YEAR_RANGE,
  chainFocus,
  labelOf,
  lineColor,
} from './GraphPreview';

/**
 * The homepage graph for phones: one still frame of the story, in a portrait
 * layout (time runs top to bottom), built from the same papers, links and
 * chapter text as desktop (./GraphPreview).
 *
 * It was a self-playing loop, but re-rendering the SVG every frame lagged on
 * phones, so it now renders once — the 2014 -> 2025 lineage lit, everything else
 * faded back — and the only motion is the CSS dash flow along the lit lines
 * (stilled for reduced motion by globals.css). The interactive, scroll-driven
 * version stays on screens with a pointer and room.
 */

const W = 360;
const H = 540;

const AXIS_X = 40;
const Y0 = 34;
const Y1 = 500;
const YEAR_MIN = 2014;
const YEAR_MAX = 2026;
const yearY = (year: number) => Y0 + ((year - YEAR_MIN) / (YEAR_MAX - YEAR_MIN)) * (Y1 - Y0);

/** Hand-placed x per paper (and a small y nudge where two share a year) so nothing overlaps. */
const PLACE: Record<string, [number, number]> = {
  sutskever: [118, 0], bahdanau: [214, 0], vaswani: [148, 0], radford: [262, 0],
  devlin: [116, -4], liu: [262, 10], brown: [182, 0], hu: [284, 0],
  ouyang: [128, -6], wei: [262, 10], touvron: [196, 0], deepseek: [150, 0],
};

const MIN_R = 7;
const MAX_R = 22;
const rOf = (citations: number) => sqrtRadius(citations, MAX_CITATIONS, MIN_R, MAX_R);
const POS = new Map(NODES.map((n) => [n.id, { x: PLACE[n.id]![0], y: yearY(n.year) + PLACE[n.id]![1] }]));

/** When each chapter starts, as a fraction of the loop. Same chapters, same order, as desktop. */
const CHAPTER_AT = [0, 0.1, 0.4, 0.5, 0.63, 0.76, 0.88];

const CARD_W = 168;
const CARD_H = 46;
const TILT = [-5, 4, -3, 6, -6, 3, -4, 5, -2, 6, -5, 3];

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const phase = (p: number, a: number, b: number) => easeInOut(Math.min(1, Math.max(0, (p - a) / (b - a))));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** The moment shown on phones: the 2014 -> 2025 lineage lit, everything else faded back. */
const STILL = 0.56;

export function GraphStoryMobile({ bare = false }: { /** Just the map: no caption (used inside the mobile showcase card). */ bare?: boolean }) {
  // A single frame, not a clock: re-rendering the whole SVG every frame was too
  // heavy for phones. The only motion left is the CSS dash flow on the lit lines.
  const p = STILL;

  const chapterIdx = CHAPTER_AT.reduce((at, c, i) => (p >= c ? i : at), 0);
  const chapter = CHAPTERS[chapterIdx]!;

  // Same focus rules as desktop: a chain, or one paper's relations of some kinds.
  const focus: Focus | null = useMemo(() => {
    if (chapter.chain) return chainFocus(chapter.chain);
    if (chapter.focus) return computeFocus(chapter.focus, EDGES, chapter.kinds ? new Set(chapter.kinds) : null, null);
    return null;
  }, [chapter]);

  // Everything below is a pure function of p — no CSS transitions or keyframes —
  // so the loop plays identically everywhere, like a video, and nothing can
  // stall or restart on a re-render.
  const chT = phase(p, CHAPTER_AT[chapterIdx]!, CHAPTER_AT[chapterIdx]! + 0.025);
  const dimTo = (inFocus: boolean, low: number) => (focus && !inFocus ? lerp(1, low, chT) : 1);
  const lineT = phase(p, 0.36, 0.48);
  const axisT = phase(p, 0.22, 0.32);
  const fadeOut = 1 - phase(p, 0.97, 1);

  return (
    <div aria-label="Example map: twelve papers placed by year, with one line of ideas from 2014 to 2025 highlighted" role="img">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block" style={{ opacity: fadeOut }}>
        <defs>
          {EDGES.filter((e) => e.type === 'citation').map((e) => {
            const a = POS.get(e.target)!;
            const b = POS.get(e.source)!;
            return (
              <linearGradient key={e.id} id={`m-${e.id}`} gradientUnits="userSpaceOnUse" x1={a.x} y1={a.y} x2={b.x} y2={b.y}>
                <stop offset="0%" stopColor={lineColor(BY_ID.get(e.target)!.year)} />
                <stop offset="100%" stopColor={lineColor(BY_ID.get(e.source)!.year)} />
              </linearGradient>
            );
          })}
        </defs>

        {/* Time runs down the left edge: one black rule with year marks. */}
        <g style={{ opacity: axisT }} aria-hidden>
          <line x1={AXIS_X} x2={AXIS_X} y1={Y0} y2={Y1} stroke="#000" strokeWidth={2} />
          {Array.from({ length: YEAR_MAX - YEAR_MIN + 1 }, (_, i) => YEAR_MIN + i).map((y) => (
            <g key={y}>
              <line x1={AXIS_X - 5} x2={AXIS_X} y1={yearY(y)} y2={yearY(y)} stroke="#000" strokeWidth={2} />
              {y % 2 === 0 ? (
                <text x={AXIS_X - 9} y={yearY(y) + 3.5} textAnchor="end" fontSize={9} fontWeight={700} fill="#000" fillOpacity={0.45} fontFamily="var(--font-dm-sans), system-ui, sans-serif">
                  {y}
                </text>
              ) : null}
            </g>
          ))}
        </g>

        {/* Lines: drawn in, faint at rest; lit ones carry the year colours and flow old -> new. */}
        <g>
          {EDGES.map((e) => {
            const lit = focus?.edges.has(e.id) ?? false;
            const dim = focus != null && !lit;
            const a = POS.get(e.type === 'citation' ? e.target : e.source)!;
            const b = POS.get(e.type === 'citation' ? e.source : e.target)!;
            const len = Math.hypot(b.x - a.x, b.y - a.y);
            if (e.type === 'citation') {
              return (
                <path
                  key={e.id}
                  d={`M ${a.x} ${a.y} L ${b.x} ${b.y}`}
                  fill="none"
                  stroke={lit ? `url(#m-${e.id})` : '#000'}
                  strokeLinecap="round"
                  strokeDasharray={lit ? '9 7' : len}
                  strokeDashoffset={lit ? undefined : len * (1 - lineT)}
                  className={lit ? 'tm-flow' : undefined}
                  style={lit ? ({ '--tm-flow-len': 16, '--tm-dur': '1.1s' } as React.CSSProperties) : undefined}
                  strokeWidth={lit ? lerp(1.2, 3, chT) : 1.2}
                  opacity={dim ? lerp(0.25, 0.06, chT) : lit ? lerp(0.25, 1, chT) : 0.25}
                />
              );
            }
            if (e.type !== 'co_author') return null;
            const bow = Math.min(0.3 * len, 50);
            const cx = (a.x + b.x) / 2 + ((b.y - a.y) / (len || 1)) * bow;
            const cy = (a.y + b.y) / 2 - ((b.x - a.x) / (len || 1)) * bow;
            return (
              <path
                key={e.id}
                d={`M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`}
                fill="none"
                stroke="#000"
                strokeLinecap="round"
                strokeDasharray="0.1 6"
                strokeWidth={2.5}
                opacity={lit ? 0.85 * chT : 0}
              />
            );
          })}
        </g>

        {/* Papers: a stack of cards that deals out, each folding into its circle. */}
        {[...NODES].sort((a, b) => ORDER.get(b.id)! - ORDER.get(a.id)!).map((n) => {
          const order = ORDER.get(n.id)!;
          const start = 0.1 + order * 0.018;
          const t = phase(p, start, start + 0.12);
          const to = POS.get(n.id)!;
          const r = rOf(n.citations);
          // The stack: centred, each sheet a few px off the one below.
          const sx = W / 2 + (order - 5.5) * 2.5;
          const sy = H * 0.42 + (order - 5.5) * 2;
          const x = lerp(sx, to.x, t);
          const y = lerp(sy, to.y, t) - Math.sin(Math.PI * t) * 30;
          const w = lerp(CARD_W, r * 2, t);
          const h = lerp(CARD_H, r * 2, t);
          const inFocus = focus ? focus.nodes.has(n.id) : true;
          const isFocus = chapter.focus === n.id;
          const labelRight = to.x < 230;
          return (
            <g key={n.id} opacity={dimTo(inFocus, 0.2)}>
              <g transform={`rotate(${lerp(TILT[order]!, 0, t)} ${x} ${y})`}>
                {t < 1 ? <rect x={x - w / 2 + 3 * (1 - t)} y={y - h / 2 + 3 * (1 - t)} width={w} height={h} rx={(Math.min(w, h) / 2) * t} fill="#000" /> : null}
                <rect
                  x={x - w / 2}
                  y={y - h / 2}
                  width={w}
                  height={h}
                  rx={(Math.min(w, h) / 2) * t}
                  fill={t > 0.5 ? yearColor(n.year, YEAR_RANGE) : '#fff'}
                  stroke="#000"
                  strokeWidth={isFocus ? 3 : 2}
                />
                {t < 0.4 ? (
                  <g style={{ opacity: 1 - t * 2.5 }}>
                    <text x={x - w / 2 + 10} y={y - 5} fontSize={8} fontWeight={900} letterSpacing="0.1em" fill="#0066FF" fontFamily="var(--font-dm-sans), system-ui, sans-serif">
                      {labelOf(n.id).toUpperCase()}
                    </text>
                    <text x={x - w / 2 + 10} y={y + 10} fontSize={11} fill="#000" fontFamily="var(--font-display), Georgia, serif">
                      {n.title.length > 26 ? `${n.title.slice(0, 25)}…` : n.title}
                    </text>
                  </g>
                ) : null}
              </g>
              {t >= 1 ? (
                <text
                  x={labelRight ? to.x + r + 5 : to.x - r - 5}
                  y={to.y + 3.5}
                  textAnchor={labelRight ? 'start' : 'end'}
                  fontSize={10}
                  fontWeight={800}
                  fill="#000"
                  stroke="#fff"
                  strokeWidth={3.5}
                  paintOrder="stroke"
                  fontFamily="var(--font-dm-sans), system-ui, sans-serif"
                >
                  {labelOf(n.id)}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>

      {bare ? null : (
      <div className="mt-3 border-t-2 border-black pt-3">
        <p className="text-[10px] font-sans font-black uppercase tracking-[0.2em] text-accent">Sample map · 12 papers, 2014 to 2025</p>
        <p className="mt-2 font-serif text-[22px] leading-[1.15] tracking-tight text-black">{chapter.text}</p>
      </div>
      )}
    </div>
  );
}
