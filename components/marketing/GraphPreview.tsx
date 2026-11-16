'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { yearColor } from '@/components/graph/nodeColor';
import { sqrtRadius } from '@/components/graph/nodeSize';
import { byline, compactCount, shortLabel } from '@/components/graph/shared/labels';
import { estimateLabelWidth, placeLabels } from '@/components/graph/shared/labelLayout';
import {
  RELATION_LABEL,
  ROLE_HINT,
  ROLE_LABEL,
  coAuthorPairs,
  computeFocus,
  getRelations,
  type Related,
  type RelationKind,
  type Focus,
  type RelEdge,
} from '@/components/graph/shared/relations';

/**
 * The homepage hero graph.
 *
 * Drawn in the page's own language — white ground, black rules, the electric
 * blue, serif titles — so it reads as part of the page rather than a widget
 * dropped into it. Earlier passes (a framed card over the map, then a dark navy
 * stage with glows) both broke away from everything around them.
 *
 * Horizontal position is publication year. At rest the lines are faint black
 * hairlines; hover a paper and its lines turn blue and their dashes flow from the
 * older paper to the newer one, so you watch what it builds on and what built on
 * it. Details sit in a strip beneath the map, between two black rules like the
 * thesis-stage strip below it, so the map is never covered and the strip never
 * changes height.
 *
 * Plain SVG and CSS, no libraries. Motion is in globals.css (.tm-*), reduced-motion
 * gated there.
 */

const INK = '#000000';
const ACCENT = '#0066FF';
const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';

/** Picks up after the hero's headline and buttons have landed (app/page.tsx). */
const ENTRANCE_START = 0.75;

/**
 * Layout is authored in a 1080x540 design space but drawn in real pixels (the
 * SVG's coordinates are its measured size, positions scaled by k), so labels and
 * hairlines stay crisp at any column width instead of shrinking with the SVG.
 */
const VIEW_W = 1080;
const VIEW_H = 500;
const MIN_R = 13;
const MAX_R = 44;
const LABEL_PX = 12;

const YEAR_MIN = 2014;
const YEAR_MAX = 2026;
const YEAR_RANGE = { min: YEAR_MIN, max: YEAR_MAX };
const X0 = 40;
const X1 = 1040;
const AXIS_Y = 462;
/** Hand-placed y values were authored with extra headroom; this lifts them under the hint line. */
const Y_SHIFT = 38;
/** Design-space x of a year's start. */
const yearX = (year: number) => X0 + ((year - YEAR_MIN) / (YEAR_MAX - YEAR_MIN)) * (X1 - X0);

type PreviewNode = {
  id: string;
  /** Offset into the paper's year, in design units — x stays inside its year. */
  jx: number;
  y: number;
  authors: string[];
  title: string;
  year: number;
  /** Rounded; this is a sample library. */
  citations: number;
  seed?: boolean;
};

// Twelve real papers, so every line is a true statement. y values placed by hand
// so no line passes through a circle.
const NODES: PreviewNode[] = [
  { id: 'sutskever', jx: 14, y: 300, year: 2014, citations: 28000, title: 'Sequence to Sequence Learning with Neural Networks', authors: ['Ilya Sutskever', 'Oriol Vinyals', 'Quoc V. Le'] },
  { id: 'bahdanau', jx: 10, y: 170, year: 2015, citations: 24000, title: 'Neural Machine Translation by Jointly Learning to Align and Translate', authors: ['Dzmitry Bahdanau', 'Kyunghyun Cho', 'Yoshua Bengio'] },
  { id: 'vaswani', jx: 14, y: 265, year: 2017, citations: 112000, seed: true, title: 'Attention Is All You Need', authors: ['Ashish Vaswani', 'Noam Shazeer', 'Niki Parmar', 'Jakob Uszkoreit', 'Llion Jones', 'Aidan N. Gomez', 'Łukasz Kaiser', 'Illia Polosukhin'] },
  { id: 'radford', jx: 16, y: 405, year: 2018, citations: 12000, title: 'Improving Language Understanding by Generative Pre-Training', authors: ['Alec Radford', 'Karthik Narasimhan', 'Tim Salimans', 'Ilya Sutskever'] },
  { id: 'devlin', jx: 10, y: 135, year: 2019, citations: 88000, title: 'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding', authors: ['Jacob Devlin', 'Ming-Wei Chang', 'Kenton Lee', 'Kristina Toutanova'] },
  { id: 'liu', jx: 30, y: 420, year: 2019, citations: 22000, title: 'RoBERTa: A Robustly Optimized BERT Pretraining Approach', authors: ['Yinhan Liu', 'Myle Ott', 'Naman Goyal', 'Jingfei Du', 'Mandar Joshi', 'Danqi Chen', 'Omer Levy', 'Mike Lewis', 'Luke Zettlemoyer', 'Veselin Stoyanov'] },
  { id: 'brown', jx: 30, y: 280, year: 2020, citations: 42000, title: 'Language Models are Few-Shot Learners', authors: ['Tom B. Brown', 'Benjamin Mann', 'Nick Ryder', 'Melanie Subbiah', 'Jared Kaplan', 'Alec Radford', 'Ilya Sutskever', 'Dario Amodei'] },
  { id: 'hu', jx: 30, y: 125, year: 2021, citations: 12000, title: 'LoRA: Low-Rank Adaptation of Large Language Models', authors: ['Edward J. Hu', 'Yelong Shen', 'Phillip Wallis', 'Zeyuan Allen-Zhu', 'Yuanzhi Li', 'Shean Wang', 'Lu Wang', 'Weizhu Chen'] },
  { id: 'ouyang', jx: 26, y: 300, year: 2022, citations: 12000, title: 'Training Language Models to Follow Instructions with Human Feedback', authors: ['Long Ouyang', 'Jeff Wu', 'Xu Jiang', 'Diogo Almeida', 'Carroll L. Wainwright', 'Pamela Mishkin', 'Paul Christiano', 'Jan Leike', 'Ryan Lowe'] },
  { id: 'wei', jx: 14, y: 430, year: 2022, citations: 10000, title: 'Chain-of-Thought Prompting Elicits Reasoning in Large Language Models', authors: ['Jason Wei', 'Xuezhi Wang', 'Dale Schuurmans', 'Maarten Bosma', 'Brian Ichter', 'Fei Xia', 'Ed Chi', 'Quoc V. Le', 'Denny Zhou'] },
  { id: 'touvron', jx: 30, y: 150, year: 2023, citations: 15000, title: 'Llama 2: Open Foundation and Fine-Tuned Chat Models', authors: ['Hugo Touvron', 'Louis Martin', 'Kevin Stone', 'Peter Albert'] },
  { id: 'deepseek', jx: 30, y: 330, year: 2025, citations: 4000, title: 'DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning', authors: ['DeepSeek-AI'] },
];

/** `source` cites `target` — one clear lineage per paper, not every true citation. */
const CITES: [string, string][] = [
  ['bahdanau', 'sutskever'],
  ['vaswani', 'sutskever'], ['vaswani', 'bahdanau'],
  ['radford', 'vaswani'],
  ['devlin', 'vaswani'],
  ['liu', 'devlin'],
  ['brown', 'vaswani'], ['brown', 'devlin'], ['brown', 'radford'],
  ['hu', 'brown'],
  ['ouyang', 'brown'],
  ['wei', 'brown'],
  ['touvron', 'ouyang'],
  ['deepseek', 'wei'], ['deepseek', 'ouyang'],
];

/** Close in meaning, with an illustrative cosine similarity. Shown only on focus. */
const SIMILAR: [string, string, number][] = [
  ['wei', 'ouyang', 0.72],
  ['touvron', 'deepseek', 0.7],
];

const EDGES: RelEdge[] = [
  ...CITES.map(([source, target]) => ({ id: `c-${source}-${target}`, source, target, type: 'citation' as const })),
  ...SIMILAR.map(([source, target, weight]) => ({ id: `s-${source}-${target}`, source, target, type: 'semantic_similarity' as const, weight })),
  // Shared authorship is computed exactly as the app computes it.
  ...coAuthorPairs(NODES.map((n) => ({ id: n.id, authors: n.authors }))).map(({ a, b, names }) => ({
    id: `a-${a}-${b}`,
    source: a,
    target: b,
    type: 'co_author' as const,
    names,
  })),
];

/** Papers the idle demo steps through: a chain from old to new. */
const DEMO = ['devlin', 'brown', 'deepseek', 'vaswani'];
const DEMO_FIRST_MS = 3600;
const DEMO_STEP_MS = 3600;

type Point = { x: number; y: number };

/**
 * The scroll story starts in the hero. The reading list is scattered as paper
 * cards in the hero's empty space — right of the headline and below the buttons,
 * never over the text. The cards are fixed to the viewport, so as the hero
 * scrolls away they come with you, drifting into a loose scatter over the map
 * area (PIN_SCATTER), and once the map pins they are dealt into their years.
 */
const CARD_W = 200;
const CARD_H = 76;
/** Cards keep this far from the viewport edge, so none is ever cut off. */
const CARD_EDGE = 20;
const TILT = [-5, 4, -3, 6, -6, 3, -4, 5, -2, 6, -5, 3];
/** Pre-deal scatter over the map: fractions of viewport width and map height. */
const PIN_SCATTER: [number, number][] = [
  [0.08, 0.14], [0.26, 0.07], [0.44, 0.12], [0.63, 0.06], [0.82, 0.14], [0.92, 0.38],
  [0.85, 0.7], [0.66, 0.84], [0.45, 0.8], [0.25, 0.86], [0.09, 0.66], [0.14, 0.4],
];
type StageGeo = { vw: number; vh: number };

/**
 * Hero slots: a loose ring around the centred hero text, as fractions of the
 * viewport (y measured below the 64px header), with a depth tier — 0 near, 1 mid,
 * 2 far. Far cards are smaller and lighter, so the ring reads as papers floating
 * at different distances rather than a grid. Clamped so none is ever cut off.
 */
const HERO_SLOTS: [number, number, 0 | 1 | 2][] = [
  [0.11, 0.16, 2], [0.12, 0.4, 0], [0.09, 0.63, 1], [0.15, 0.87, 2],
  [0.89, 0.14, 1], [0.88, 0.4, 2], [0.91, 0.63, 0], [0.85, 0.87, 1],
  [0.34, 0.95, 1], [0.66, 0.95, 2], [0.3, 0.05, 2], [0.7, 0.05, 1],
];
const DEPTH_SCALE = [1, 0.86, 0.72];
const DEPTH_OPACITY = [1, 0.85, 0.6];

function heroSpot(i: number, g: StageGeo): Point & { depth: 0 | 1 | 2 } {
  const [fx, fy, depth] = HERO_SLOTS[i]!;
  const w = CARD_W * DEPTH_SCALE[depth]!;
  const h = CARD_H * DEPTH_SCALE[depth]!;
  const top = 64;
  return {
    x: clamp(fx * g.vw, w / 2 + CARD_EDGE, g.vw - w / 2 - CARD_EDGE),
    y: clamp(top + fy * (g.vh - top), top + h / 2 + 12, g.vh - h / 2 - CARD_EDGE),
    depth,
  };
}

/**
 * Lit-line colour by year: light grey for the oldest work, darkening to grey,
 * then into light blue, the brand blue and deep navy for the newest. Each lit
 * citation line is a gradient from the cited paper's year to the citing paper's, so a
 * line's colour shows how far forward in time it reaches.
 */
const LINE_STOPS: [number, [number, number, number]][] = [
  [2014, [0xd4, 0xd6, 0xdb]],
  [2017, [0x86, 0x8b, 0x94]],
  [2019, [0x7f, 0xb2, 0xff]],
  [2022, [0x00, 0x66, 0xff]],
  [2026, [0x0a, 0x1f, 0x3d]],
];
function lineColor(year: number): string {
  const y = clamp(year, LINE_STOPS[0]![0], LINE_STOPS[LINE_STOPS.length - 1]![0]);
  let i = 0;
  while (i < LINE_STOPS.length - 2 && y > LINE_STOPS[i + 1]![0]) i++;
  const [y0, c0] = LINE_STOPS[i]!;
  const [y1, c1] = LINE_STOPS[i + 1]!;
  const t = (y - y0) / (y1 - y0);
  const mix = (a: number, b: number) => Math.round(a + (b - a) * t);
  return `rgb(${mix(c0[0], c1[0])}, ${mix(c0[1], c1[1])}, ${mix(c0[2], c1[2])})`;
}

/** Year order, so history assembles left to right. */
const ORDER = new Map([...NODES].sort((a, b) => a.year - b.year || a.jx - b.jx).map((n, i) => [n.id, i]));

/**
 * The story told over the pinned scroll, one chapter at a time. Each chapter
 * lights one true thing on the map and says it in a sentence. Ranges are story
 * progress (0..1); the map itself finishes assembling by ~0.46.
 */
type Chapter = {
  from: number;
  text: string;
  /** Light this paper's relations... */
  focus?: string;
  /** ...restricted to these kinds (all if omitted). */
  kinds?: RelationKind[];
  /** Or light a chain of papers, oldest first, joined by citations. */
  chain?: string[];
};
const CHAPTERS: Chapter[] = [
  { from: 0, text: 'Twelve papers on your desk, and no idea how they connect.' },
  { from: 0.12, text: 'ThesisMaps puts every paper in its place.' },
  { from: 0.4, text: 'Left to right is time. Every line runs from a paper to the work it builds on.' },
  { from: 0.52, text: 'Follow one idea across eleven years: sequence learning, attention, GPT-3, instruction following, reasoning.', chain: ['sutskever', 'vaswani', 'brown', 'ouyang', 'deepseek'] },
  { from: 0.64, text: 'Spot the hinges. Three later papers here build directly on GPT-3.', focus: 'brown', kinds: ['builtOnBy'] },
  { from: 0.76, text: 'See the people too. Ilya Sutskever and Quoc Le tie the 2014 paper to three later ones.', focus: 'sutskever', kinds: ['coAuthor'] },
  { from: 0.88, text: 'Now map your own library.' },
];
/** Interaction starts with the last chapter. */
const LIVE_AT = 0.88;

/** Focus for a citation chain: its papers, and the citation edges between consecutive ones. */
function chainFocus(chain: string[]): Focus {
  const nodes = new Set(chain);
  const edges = new Map<string, 'on'>();
  for (let i = 1; i < chain.length; i++) {
    const e = EDGES.find(
      (x) => x.type === 'citation' && ((x.source === chain[i] && x.target === chain[i - 1]) || (x.source === chain[i - 1] && x.target === chain[i]))
    );
    if (e) edges.set(e.id, 'on');
  }
  return { nodes, edges };
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
/** 0 before `a`, 1 after `b`, eased in between. */
const phase = (p: number, a: number, b: number) => easeInOut(Math.min(1, Math.max(0, (p - a) / (b - a))));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

const MAX_CITATIONS = Math.max(...NODES.map((n) => n.citations));
const radiusOf = (citations: number) => sqrtRadius(citations, MAX_CITATIONS, MIN_R, MAX_R);

const BY_ID = new Map(NODES.map((n) => [n.id, n]));
const LABELS = new Map(NODES.map((n) => [n.id, shortLabel(n.authors, n.year, n.title)]));
const labelOf = (id: string) => LABELS.get(id) ?? '';

/** History unfolds left to right: each paper enters at its year's moment. */
const nodeDelay = (n: PreviewNode) => ENTRANCE_START + (n.year - YEAR_MIN) * 0.1;
/** A line draws only once both of its papers exist. */
const edgeDelay = (e: RelEdge) => Math.max(nodeDelay(BY_ID.get(e.source)!), nodeDelay(BY_ID.get(e.target)!)) + 0.15;

const YEARS = Array.from({ length: YEAR_MAX - YEAR_MIN + 1 }, (_, i) => YEAR_MIN + i);

/** Names a list the way a sentence would: "A", "A and B", "A, B and C". */
function joinWith(items: React.ReactNode[]): React.ReactNode[] {
  return items.flatMap((item, i) => (i === 0 ? [item] : [i === items.length - 1 ? ' and ' : ', ', item]));
}

/**
 * A paper's relationships told as a sentence rather than a table. Every paper
 * name is live: hover to light it on the map, click to move the story to it.
 */
function PaperStory({
  node,
  relations,
  onPeek,
  onPick,
  pinned,
}: {
  node: PreviewNode;
  relations: ReturnType<typeof getRelations>;
  onPeek: (ids: ReadonlySet<string> | null) => void;
  onPick: (id: string) => void;
  pinned: boolean;
}) {
  const ref = (r: Related) => (
    <button
      key={r.edgeId}
      type="button"
      onMouseEnter={() => onPeek(new Set([r.id]))}
      onMouseLeave={() => onPeek(null)}
      onFocus={() => onPeek(new Set([r.id]))}
      onBlur={() => onPeek(null)}
      onClick={() => onPick(r.id)}
      className="font-sans font-bold text-[0.8em] text-black underline decoration-accent decoration-2 underline-offset-4 hover:bg-black hover:text-white hover:no-underline focus-visible:bg-black focus-visible:text-white outline-none px-0.5"
    >
      {labelOf(r.id)}
    </button>
  );
  const { buildsOn, builtOnBy, similar, coAuthors } = relations;
  const names = Array.from(new Set(coAuthors.flatMap((r) => r.names ?? [])));
  return (
    <div className="tm-fade-up">
      <p className="text-[10px] font-sans font-black uppercase tracking-widest text-accent">
        {labelOf(node.id)} · {ROLE_LABEL[relations.role]}
        <span className="text-black/35"> · {compactCount(node.citations)} citations{pinned ? ' · pinned' : ''}</span>
      </p>
      <p className="mt-1 font-serif text-[clamp(1.2rem,1.9vw,1.6rem)] leading-[1.25] tracking-tight text-black max-w-[60ch]">
        <span className="italic">{node.title}</span>{' '}
        {buildsOn.length ? <>builds on {joinWith(buildsOn.map(ref))}. </> : <>cites nothing else in this map. </>}
        {builtOnBy.length ? <>{joinWith(builtOnBy.map(ref))} {builtOnBy.length === 1 ? 'builds' : 'build'} on it. </> : <>Nothing here builds on it yet. </>}
        {similar.length ? <>Closest in meaning: {joinWith(similar.map(ref))}. </> : null}
        {coAuthors.length ? <>Shares {names.length === 1 ? names[0] : 'authors'} with {joinWith(coAuthors.map(ref))}.</> : null}
      </p>
      <p className="mt-1.5 text-[11px] font-sans text-black/45">{byline(node.authors)} · {node.year} · {ROLE_HINT[relations.role]}</p>
    </div>
  );
}

function GraphPreview({
  animated,
  interactive,
  story = false,
}: {
  animated: boolean;
  interactive: boolean;
  /** Pin the section and morph a pile of papers into the map as the visitor scrolls. */
  story?: boolean;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const stickyRef = useRef<HTMLDivElement | null>(null);
  // Off on the server and on phones / reduced motion, where the finished map shows straight away.
  const [storyOn, setStoryOn] = useState(false);
  const [prog, setProg] = useState(0);
  /** 0 at the top of the page, 1 when the map pins: the cards travel from the hero to the map over it. */
  const [arrive, setArrive] = useState(0);
  const [geo, setGeo] = useState({ vw: 1440, vh: 800, colL: 0, colR: 1152, heroBottom: 600, frameLeft: 0, frameTop: 0, frameH: 400 });
  const frameRef = useRef<HTMLDivElement | null>(null);
  const [frameW, setFrameW] = useState(VIEW_W);
  const [frameH, setFrameH] = useState(0);
  const [ys, setYs] = useState<Record<string, number>>(() => Object.fromEntries(NODES.map((n) => [n.id, n.y])));
  const [hovered, setHovered] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const [demo, setDemo] = useState<string | null>(null);
  const [peek, setPeek] = useState<ReadonlySet<string> | null>(null);
  const [touched, setTouched] = useState(false);
  // The draw-in runs once; lines leaving focus must not replay it.
  const [settled, setSettled] = useState(!animated);
  const drag = useRef<{ id: string; startY: number; origin: number; moved: boolean } | null>(null);

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const measure = () => {
      setFrameW(el.clientWidth || VIEW_W);
      setFrameH(el.clientHeight);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (settled) return;
    const t = setTimeout(() => setSettled(true), (ENTRANCE_START + 2.4) * 1000);
    return () => clearTimeout(t);
  }, [settled]);

  useEffect(() => {
    if (!story) return;
    // Wide screens only: below ~1100px the centred hero text leaves no room for the ring.
    const mq = window.matchMedia('(min-width: 1100px) and (prefers-reduced-motion: no-preference)');
    const apply = () => setStoryOn(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [story]);

  // Scroll position -> story progress, once per frame.
  useEffect(() => {
    if (!storyOn) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const track = trackRef.current;
      const stage = stickyRef.current;
      const frame = frameRef.current;
      if (!track || !stage || !frame) return;
      const t = track.getBoundingClientRect();
      const s = stage.getBoundingClientRect();
      const f = frame.getBoundingClientRect();
      const top = parseFloat(getComputedStyle(stage).top) || 0;
      setProg(clamp((top - t.top) / Math.max(1, t.height - s.height), 0, 1));
      // The track's document top is also where the hero ends at scroll 0.
      const trackDocTop = t.top + window.scrollY;
      setArrive(clamp(window.scrollY / Math.max(1, trackDocTop - top), 0, 1));
      setGeo({
        vw: window.innerWidth,
        vh: window.innerHeight,
        colL: s.left,
        colR: s.right,
        heroBottom: trackDocTop,
        frameLeft: f.left,
        // Where the map sits once pinned, in viewport coordinates.
        frameTop: top + (f.top - s.top),
        frameH: f.height,
      });
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [storyOn]);

  /** Story progress, and the phases cut from it. Without the story everything is simply finished. */
  const P = storyOn ? prog : 1;
  const axisT = phase(P, 0.26, 0.34);
  const nodeT = phase(P, 0.3, 0.37);
  const cardsT = 1 - phase(P, 0.33, 0.38);
  const lineT = phase(P, 0.38, 0.48);
  const live = P >= LIVE_AT;
  const chapterIdx = storyOn ? CHAPTERS.reduce((at, c, i) => (P >= c.from ? i : at), 0) : CHAPTERS.length - 1;
  const chapter = CHAPTERS[chapterIdx]!;
  const done = P >= 0.999;
  /** Time-based entrance only when the scroll story is not doing the entrance itself. */
  const timed = animated && !storyOn;

  /** Design units -> pixels. Radii shrink more gently than distances on small screens. */
  // Pinned, the map fills the height between the header and the narration, so
  // vertical scale (ky) is fitted to that space rather than tied to the width —
  // capped so the layout never stretches more than a third, and centred if capped.
  const k = frameW / VIEW_W;
  const ky = storyOn && frameH > 0 ? Math.min(frameH / VIEW_H, k * 1.35) : k;
  const rk = Math.max(Math.min(k, ky), 0.7);
  const W = frameW;
  const H = storyOn && frameH > 0 ? frameH : VIEW_H * k;
  const offY = (H - VIEW_H * ky) / 2;
  const rOf = useCallback((citations: number) => radiusOf(citations) * rk, [rk]);

  const positions = useMemo<Record<string, Point>>(
    () => Object.fromEntries(NODES.map((n) => [n.id, { x: (yearX(n.year) + n.jx) * k, y: offY + ((ys[n.id] ?? n.y) - Y_SHIFT) * ky }])),
    [ys, k, ky, offY]
  );

  // Until the last chapter the story drives focus; after it, the visitor does.
  const scripted = storyOn && !live;
  const focusId = scripted ? chapter.focus ?? null : hovered ?? pinned ?? demo;
  const focus = useMemo(() => {
    if (scripted && chapter.chain) return chainFocus(chapter.chain);
    if (!focusId) return null;
    return computeFocus(focusId, EDGES, scripted && chapter.kinds ? new Set(chapter.kinds) : null, peek);
  }, [scripted, chapter, focusId, peek]);
  const relations = useMemo(() => (focusId ? getRelations(focusId, EDGES) : null), [focusId]);
  const focusNode = focusId ? BY_ID.get(focusId) : undefined;

  // The demo plays only while the map is on screen, never after the visitor has
  // touched it, and never for reduced motion.
  useEffect(() => {
    if (!interactive || touched || !done) {
      setDemo(null);
      return;
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const el = rootRef.current;
    if (!el) return;
    let step = 0;
    let first: ReturnType<typeof setTimeout> | null = null;
    let timer: ReturnType<typeof setInterval> | null = null;
    const stop = () => {
      if (first) clearTimeout(first);
      if (timer) clearInterval(timer);
      first = timer = null;
    };
    const io = new IntersectionObserver(
      ([entry]) => {
        stop();
        if (!entry?.isIntersecting) {
          setDemo(null);
          return;
        }
        first = setTimeout(() => {
          setDemo(DEMO[step++ % DEMO.length]!);
          timer = setInterval(() => setDemo(DEMO[step++ % DEMO.length]!), DEMO_STEP_MS);
        }, DEMO_FIRST_MS);
      },
      { threshold: 0.5 }
    );
    io.observe(el);
    return () => {
      stop();
      io.disconnect();
    };
  }, [interactive, touched, done]);

  const takeOver = useCallback(() => setTouched(true), []);
  const [portalReady, setPortalReady] = useState(false);
  useEffect(() => setPortalReady(true), []);

  /** Every paper is labelled; crowded ones move above or beside their circle. */
  const spots = useMemo(
    () =>
      placeLabels(
        NODES.map((n) => ({
          id: n.id,
          x: positions[n.id]!.x,
          y: positions[n.id]!.y,
          r: rOf(n.citations),
          priority: n.citations,
          w: estimateLabelWidth(labelOf(n.id), LABEL_PX),
          h: LABEL_PX + 6,
        }))
      ),
    [positions, rOf]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<SVGGElement>, id: string) => {
      if (!interactive) return;
      takeOver();
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      drag.current = { id, startY: e.clientY, origin: ys[id]!, moved: false };
    },
    [interactive, ys, takeOver]
  );

  // Vertical only: x is the publication year, so dragging rearranges the map
  // without rewriting history.
  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGGElement>) => {
      const d = drag.current;
      if (!d) return;
      if (!d.moved && Math.abs(e.clientY - d.startY) < 4) return;
      d.moved = true;
      const y = clamp(d.origin + (e.clientY - d.startY) / ky, MAX_R + 30 + Y_SHIFT, AXIS_Y + Y_SHIFT - MAX_R - 24);
      setYs((prev) => ({ ...prev, [d.id]: y }));
    },
    [ky]
  );

  // A press that never moved is a click: pin (or unpin) that paper.
  const handlePointerUp = useCallback(() => {
    const d = drag.current;
    drag.current = null;
    if (d && !d.moved) setPinned((prev) => (prev === d.id ? null : d.id));
  }, []);

  const pick = (id: string) => {
    takeOver();
    setPeek(null);
    setHovered(null);
    setPinned(id);
  };

  return (
    // The track is the scroll distance the story plays over; the stage inside it
    // pins to the viewport (below the 64px header) while it plays.
    <div ref={trackRef} className="relative" style={storyOn ? { height: '440vh' } : undefined}>
    <div
      ref={stickyRef}
      className={storyOn ? 'sticky top-16 flex flex-col py-6' : undefined}
      style={storyOn ? { height: 'calc(100svh - 4rem)' } : undefined}
    >
      {/* The pile. Spans the whole viewport, margins included — the mess is
          bigger than the column — and each card folds into its circle on the map. */}
      {/* The cards live in a viewport-fixed layer, portalled to <body> so no
          transformed ancestor (the hero's entrance animation) can re-anchor it. */}
      {storyOn && cardsT > 0 && portalReady
        ? createPortal(
            <div aria-hidden className="fixed inset-0 pointer-events-none z-30">
              {NODES.map((n) => {
                const order = ORDER.get(n.id)!;
                const hero = heroSpot(order, geo);
                const [px, py] = PIN_SCATTER[order]!;
                const pin = {
                  x: clamp(px * geo.vw, CARD_W / 2 + CARD_EDGE, geo.vw - CARD_W / 2 - CARD_EDGE),
                  y: geo.frameTop + py * geo.frameH,
                };
                const m = easeInOut(arrive);
                // Depth flattens out as the cards gather over the map.
                const ds = lerp(DEPTH_SCALE[hero.depth]!, 0.92, m);
                const sx = lerp(hero.x, pin.x, m);
                const sy = lerp(hero.y, pin.y, m);
                const start = 0.1 + order * 0.012;
                const t = phase(P, start, start + 0.16);
                const target = positions[n.id]!;
                const d = 2 * rOf(n.citations);
                const x = lerp(sx, geo.frameLeft + target.x, t);
                // A small lift on the way, so each paper is dealt rather than slid.
                const y = lerp(sy, geo.frameTop + target.y, t) - Math.sin(Math.PI * t) * 50;
                return (
                  <div
                    key={n.id}
                    className="absolute left-0 top-0"
                    style={{
                      transform: `translate(${x - CARD_W / 2}px, ${y - CARD_H / 2}px) rotate(${lerp(TILT[order]!, 0, t)}deg) scale(${lerp(ds, d / CARD_W, t)}, ${lerp(ds, d / CARD_H, t)})`,
                      opacity: cardsT * lerp(DEPTH_OPACITY[hero.depth]!, 1, m),
                      willChange: 'transform',
                    }}
                  >
                    {/* Inner layer owns the one-shot arrival, so it never fights the scroll transform. */}
                    <div
                      className="tm-card-in relative bg-white border-2 border-black overflow-hidden"
                      style={
                        {
                          width: CARD_W,
                          height: CARD_H,
                          borderRadius: `${t * 50}%`,
                          boxShadow: `${(4 - hero.depth) * (1 - t)}px ${(4 - hero.depth) * (1 - t)}px 0 #000`,
                          '--tm-delay': `${ENTRANCE_START + 0.35 + order * 0.06}s`,
                        } as React.CSSProperties
                      }
                    >
                      <div className="absolute inset-0" style={{ background: yearColor(n.year, YEAR_RANGE), opacity: t }} />
                      <div className="relative px-3.5 py-2.5" style={{ opacity: 1 - Math.min(1, t * 2.5) }}>
                        <p className="text-[9px] font-sans font-black uppercase tracking-widest text-accent">{labelOf(n.id)}</p>
                        <p className="mt-1 font-serif text-[15px] leading-[1.15] tracking-tight text-black line-clamp-2">{n.title}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>,
            document.body
          )
        : null}

    <div
      ref={rootRef}
      className={storyOn ? 'w-full flex-1 min-h-0 flex flex-col' : 'w-full'}
      // Focus is sticky inside the widget so the cursor can reach the strip
      // below; it lets go only when the pointer leaves the whole thing.
      onMouseLeave={() => {
        setHovered(null);
        setPeek(null);
      }}
      onPointerEnter={interactive ? takeOver : undefined}
      onFocus={interactive ? takeOver : undefined}
      style={{ pointerEvents: live ? undefined : 'none' }}
    >
      <div
        ref={frameRef}
        className={storyOn ? 'relative w-full flex-1 min-h-0' : 'relative w-full'}
        style={storyOn ? undefined : { aspectRatio: `${VIEW_W} / ${VIEW_H}` }}
      >
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-full overflow-visible"
          onClick={(e) => {
            if (!(e.target as Element).closest('[data-node]')) {
              setPinned(null);
              setHovered(null);
            }
          }}
          role="group"
          aria-label="Sample map of twelve language-model papers placed by publication year, 2014 to 2026. Lines join each paper to the work it builds on. Focus a paper to trace it."
        >
          <defs>
            {EDGES.filter((e) => e.type === 'citation').map((e) => {
              const from = positions[e.target]!;
              const to = positions[e.source]!;
              return (
                <linearGradient key={e.id} id={`ln-${e.id}`} gradientUnits="userSpaceOnUse" x1={from.x} y1={from.y} x2={to.x} y2={to.y}>
                  <stop offset="0%" stopColor={lineColor(BY_ID.get(e.target)!.year)} />
                  <stop offset="100%" stopColor={lineColor(BY_ID.get(e.source)!.year)} />
                </linearGradient>
              );
            })}
          </defs>

          {/* Edges first so the circles paint over their endpoints. */}
          <g>
            {EDGES.map((e) => {
              // Citation paths run cited -> citing: path direction is the
              // direction influence travels, which the flowing dashes follow.
              const a = positions[e.type === 'citation' ? e.target : e.source]!;
              const b = positions[e.type === 'citation' ? e.source : e.target]!;
              const state = focus?.edges.get(e.id);
              const lit = state != null;
              const peeked = state === 'peek';
              const dim = focus != null && !lit;
              const len = Math.round(Math.hypot(b.x - a.x, b.y - a.y));

              if (e.type === 'citation') {
                const drawing = timed && !settled && !lit;
                return (
                  <path
                    key={e.id}
                    d={`M ${a.x} ${a.y} L ${b.x} ${b.y}`}
                    fill="none"
                    // Lit lines carry the year ramp (grey for old work through blue to navy)
                    // while their dashes flow; resting lines stay faint black.
                    stroke={lit ? (peeked ? INK : `url(#ln-${e.id})`) : INK}
                    strokeLinecap="round"
                    strokeDasharray={lit ? '12 9' : drawing ? len : undefined}
                    className={lit ? 'tm-flow' : drawing ? 'tm-draw' : undefined}
                    style={
                      {
                        ...(lit ? { '--tm-flow-len': 21, '--tm-dur': '0.9s' } : {}),
                        ...(drawing ? { '--tm-draw-len': len, '--tm-delay': `${edgeDelay(e)}s` } : {}),
                        ...(storyOn && !lit ? { strokeDasharray: len, strokeDashoffset: len * (1 - lineT) } : {}),
                        strokeWidth: peeked ? 3.5 : lit ? 2.75 : 1.25,
                        opacity: dim ? 0.05 : lit ? 1 : 0.24,
                        transition: `opacity 400ms ${EASE}, stroke-width 400ms ${EASE}, stroke 400ms ${EASE}`,
                      } as React.CSSProperties
                    }
                  />
                );
              }

              // Similarity and shared authorship exist only for the paper in focus.
              let d = `M ${a.x} ${a.y} L ${b.x} ${b.y}`;
              if (e.type === 'co_author') {
                // An arc, not a line: a different shape from citations, and it
                // bows around the papers a straight line would cut through.
                const bow = Math.min(0.3 * len, 80 * k);
                const cx = (a.x + b.x) / 2 + ((b.y - a.y) / (len || 1)) * bow;
                const cy = (a.y + b.y) / 2 - ((b.x - a.x) / (len || 1)) * bow;
                d = `M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`;
              }
              return (
                <path
                  key={e.id}
                  d={d}
                  fill="none"
                  stroke={peeked ? ACCENT : INK}
                  strokeLinecap="round"
                  strokeDasharray={e.type === 'co_author' ? '0.1 7' : '5 5'}
                  style={{
                    strokeWidth: e.type === 'co_author' ? (peeked ? 3.5 : 2.5) : peeked ? 2.5 : 1.5,
                    opacity: lit ? 0.85 : 0,
                    transition: `opacity 400ms ${EASE}`,
                  }}
                />
              );
            })}
          </g>

          {NODES.map((n) => {
            const p = positions[n.id]!;
            const r = rOf(n.citations);
            const inFocus = focus ? focus.nodes.has(n.id) : false;
            const isFocus = focusId === n.id;
            const label = labelOf(n.id);
            const lw = estimateLabelWidth(label, LABEL_PX);
            const spot = spots.get(n.id);
            return (
              <g
                key={n.id}
                data-node
                tabIndex={interactive ? 0 : -1}
                role="button"
                aria-label={`${label}: ${n.title}`}
                aria-pressed={pinned === n.id}
                className={['outline-none', interactive ? 'cursor-pointer' : ''].join(' ')}
                style={{
                  opacity: (focus && !inFocus ? 0.2 : 1) * nodeT,
                  transition: `opacity 400ms ${EASE}`,
                  ...(interactive ? { touchAction: 'none' as const } : {}),
                }}
                onPointerDown={interactive ? (e) => handlePointerDown(e, n.id) : undefined}
                onPointerMove={interactive ? handlePointerMove : undefined}
                onPointerUp={interactive ? handlePointerUp : undefined}
                onPointerCancel={interactive ? () => (drag.current = null) : undefined}
                onMouseEnter={interactive ? () => { setPeek(null); setHovered(n.id); } : undefined}
                onFocus={interactive ? () => setHovered(n.id) : undefined}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setPinned((prev) => (prev === n.id ? null : n.id));
                  } else if (e.key === 'Escape') {
                    setPinned(null);
                    setHovered(null);
                  }
                }}
              >
                <g
                  className={timed ? 'tm-enter' : undefined}
                  style={timed ? ({ '--tm-delay': `${nodeDelay(n)}s` } as React.CSSProperties) : undefined}
                >
                  {n.seed ? (
                    <circle cx={p.x} cy={p.y} r={r + 11} fill="none" stroke={ACCENT} strokeWidth={1.5} strokeDasharray="4 5" opacity={0.6} />
                  ) : null}
                  {/* Focus lifts the paper with the page's hard offset shadow. */}
                  <circle cx={p.x + 4} cy={p.y + 4} r={r} fill={INK} opacity={isFocus ? 1 : 0} style={{ transition: `opacity 200ms ${EASE}` }} />
                  {peek?.has(n.id) ? <circle cx={p.x} cy={p.y} r={r + 6} fill="none" stroke={ACCENT} strokeWidth={3} /> : null}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={r}
                    fill={yearColor(n.year, YEAR_RANGE)}
                    stroke={INK}
                    strokeWidth={isFocus ? 3 : 2}
                    style={{ transition: `stroke-width 200ms ${EASE}` }}
                  />
                  {spot ? (
                    <g pointerEvents="none">
                      {isFocus ? (
                        <rect
                          x={spot.anchor === 'middle' ? spot.x - lw / 2 : spot.anchor === 'start' ? spot.x - 4 : spot.x - lw + 4}
                          y={spot.y - 1}
                          width={lw}
                          height={LABEL_PX + 8}
                          fill={INK}
                        />
                      ) : null}
                      <text
                        x={spot.anchor === 'middle' ? spot.x : spot.anchor === 'start' ? spot.x + 3 : spot.x - 3}
                        y={spot.y + LABEL_PX + 1}
                        textAnchor={spot.anchor}
                        fill={isFocus ? '#FFFFFF' : INK}
                        stroke={isFocus ? 'none' : '#FFFFFF'}
                        strokeWidth={isFocus ? 0 : 4}
                        paintOrder="stroke"
                        fontSize={LABEL_PX}
                        fontWeight={800}
                        fontFamily="var(--font-dm-sans), system-ui, sans-serif"
                      >
                        {label}
                      </text>
                    </g>
                  ) : null}
                </g>
              </g>
            );
          })}

          {/* Year axis: one black rule, like every other divider on the page. */}
          <g aria-hidden style={{ opacity: axisT }}>
            <line x1={X0 * k} x2={X1 * k} y1={(offY + AXIS_Y * ky)} y2={(offY + AXIS_Y * ky)} stroke={INK} strokeWidth={2} />
            {YEARS.map((y) => {
              const on = focusNode?.year === y;
              return (
                <g key={y}>
                  <line x1={yearX(y) * k} x2={yearX(y) * k} y1={(offY + AXIS_Y * ky)} y2={(offY + AXIS_Y * ky) + 6} stroke={INK} strokeWidth={2} />
                  <text
                    x={yearX(y) * k}
                    y={(offY + AXIS_Y * ky) + 22}
                    textAnchor="middle"
                    fontSize={10}
                    fontWeight={on ? 900 : 700}
                    letterSpacing="0.1em"
                    fill={on ? ACCENT : INK}
                    fillOpacity={on ? 1 : 0.45}
                    fontFamily="var(--font-dm-sans), system-ui, sans-serif"
                    style={{ transition: `fill 300ms ${EASE}, fill-opacity 300ms ${EASE}` }}
                  >
                    {y}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {interactive ? (
          <p style={{ opacity: live ? 1 : 0, transition: 'opacity 300ms' }} className="absolute top-0 left-0 text-[10px] font-sans font-black uppercase tracking-[0.2em] text-black/45 pointer-events-none select-none">
            Hover a paper to trace it · Click to pin
          </p>
        ) : null}
      </div>

      {/* Narration. One sentence at a time, under the map, below one of the
          page's black rules. During the story it tells the chapter; afterwards it
          tells the story of whichever paper you are on. */}
      {interactive ? (
        <div
          // Above the flying cards (z-20), on white, so the story is never covered.
          className="relative z-20 shrink-0 bg-white mt-5 border-t-2 border-black pt-4 grid md:grid-cols-[96px_minmax(0,1fr)_auto] gap-x-8 gap-y-2 items-start min-h-[118px]"
          aria-live="polite"
        >
          <div className="pt-1.5">
            <p className="text-[10px] font-sans font-black uppercase tracking-[0.2em] text-black">
              {String(chapterIdx + 1).padStart(2, '0')}
              <span className="text-black/30"> / {String(CHAPTERS.length).padStart(2, '0')}</span>
            </p>
            {/* Chapter progress: one segment per chapter. */}
            {storyOn ? (
              <div className="mt-2 flex gap-1" aria-hidden>
                {CHAPTERS.map((c, i) => (
                  <span key={c.from} className={`h-[3px] w-2.5 ${i <= chapterIdx ? 'bg-black' : 'bg-black/15'}`} style={{ transition: 'background-color 300ms' }} />
                ))}
              </div>
            ) : null}
          </div>
          <div className="min-w-0">
            {live && focusNode && relations ? (
              <PaperStory key={focusNode.id} node={focusNode} relations={relations} onPeek={setPeek} onPick={pick} pinned={pinned === focusNode.id} />
            ) : (
              <div key={chapterIdx} className="tm-fade-up">
                <p className="font-serif text-[clamp(1.4rem,2.3vw,2rem)] leading-[1.15] tracking-tight text-black max-w-[44ch]">{chapter.text}</p>
                <p className="mt-2 text-[10px] font-sans font-black uppercase tracking-[0.2em] text-black/40">
                  {live ? 'Hover any paper above to read its story' : 'Keep scrolling'}
                </p>
              </div>
            )}
          </div>
          <div className="pt-1">
            {live ? (
              <a
                href="/signup"
                className="inline-flex items-center h-11 px-6 bg-black text-white text-[11px] font-sans font-black uppercase tracking-widest shadow-impact hover:bg-accent transition-colors"
              >
                Start for free
              </a>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
    </div>
    </div>
  );
}

export { GraphPreview };
