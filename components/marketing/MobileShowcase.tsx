'use client';

import React, { useEffect, useRef } from 'react';
import { Search, Check } from 'lucide-react';
import { GraphStoryMobile } from './GraphStoryMobile';

/**
 * The homepage's phone section: three steps — Find, Map, Defend — each a small
 * product scene that plays by itself, with a dark status panel ticking through
 * what ThesisMaps found, a short title and one line of copy.
 *
 * Performance is the point. Every movement is a CSS keyframe on transform or
 * opacity (the .ms-* rules in globals.css), so the phone's compositor runs it
 * and React never re-renders. A card only animates while it is on screen
 * (`ms-run`, toggled by an IntersectionObserver), and reduced motion shows every
 * scene in its finished state.
 */

function useRunWhenVisible<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => el.classList.toggle('ms-run', !!e?.isIntersecting), { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

/** The dark panel that reports progress, Mendit-style, in the site's black and blue. */
function StatusPanel({ title, lines, inline = false }: { title: string; lines: string[]; /** Sit in the flow (above the content) instead of floating over it. */ inline?: boolean }) {
  const at = ['ms-at-20', 'ms-at-35', 'ms-at-50'];
  return (
    <div className={`${inline ? 'relative mb-2 ml-auto' : 'absolute top-3 right-3'} z-20 w-[188px] bg-black text-white p-3 shadow-[4px_4px_0_#0066FF]`}>
      <p className="flex items-center gap-2 text-[11px] font-sans font-bold">
        <span className="ms-blink inline-block w-1.5 h-1.5 bg-accent" aria-hidden />
        {title}
      </p>
      <ul className="mt-2 ml-[3px] pl-3 border-l border-white/20 space-y-1.5">
        {lines.map((l, i) => (
          <li key={l} className={`ms-anim ${at[i] ?? 'ms-at-50'} flex items-center gap-1.5 text-[10.5px] font-sans text-white/80`}>
            <Check size={11} strokeWidth={3} className="text-accent shrink-0" />
            {l}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** App-window chrome around each scene. */
function Frame({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="relative bg-white border-2 border-black shadow-impact overflow-hidden">
      <div className="h-8 px-3 flex items-center border-b-2 border-black">
        <span className="font-serif text-[13px] text-black tracking-tight">
          ThesisMaps<span className="text-accent">.</span>
        </span>
        <span className="ml-2 text-[9px] font-sans font-black uppercase tracking-[0.2em] text-black/40">/ {label}</span>
      </div>
      {children}
    </div>
  );
}

function Cursor() {
  return (
    <svg aria-hidden width="22" height="22" viewBox="0 0 24 24" className="ms-anim ms-cursor absolute z-10 -right-1 top-2 drop-shadow-[2px_2px_0_rgba(0,0,0,0.25)]">
      <path d="M4 2 L4 19 L8.5 14.5 L11.5 21 L14.5 19.6 L11.6 13.3 L18 13.3 Z" fill="#000" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

const RESULTS = [
  { title: 'Attention Is All You Need', meta: 'Vaswani · 2017', src: 'arXiv', at: 'ms-at-35' },
  { title: 'BERT: Pre-training of Deep Bidirectional Transformers', meta: 'Devlin · 2019', src: 'Semantic Scholar', at: 'ms-at-40', save: true },
  { title: 'Language Models are Few-Shot Learners', meta: 'Brown · 2020', src: 'OpenAlex', at: 'ms-at-45' },
  { title: 'Neural Machine Translation by Jointly Learning to Align', meta: 'Bahdanau · 2015', src: 'CrossRef', at: 'ms-at-50' },
];

function FindScene() {
  return (
    <Frame label="Search">
      <div className="relative p-3 pb-4 aspect-[4/5]">
        <StatusPanel title="Searching 8 databases" lines={['214 results', '31 duplicates merged', '12 open-access PDFs']} />
        <div className="mt-[124px] h-10 border-2 border-black flex items-center gap-2 px-3">
          <Search size={14} strokeWidth={2.5} aria-hidden />
          <span className="ms-anim ms-type text-[13px] font-sans text-black whitespace-nowrap">attention in NLP</span>
          <span className="ms-blink w-[1.5px] h-4 bg-black" aria-hidden />
        </div>
        <ul className="mt-2">
          {RESULTS.map((r) => (
            <li key={r.title} className={`ms-anim ${r.at} flex items-center gap-2 py-2 border-b border-black/10`}>
              <div className="min-w-0 flex-1">
                <p className="font-serif text-[13px] leading-tight text-black truncate">{r.title}</p>
                <p className="mt-0.5 text-[9.5px] font-sans text-black/50">
                  {r.meta} · <span className="font-bold text-black/70">{r.src}</span>
                </p>
              </div>
              <span className="relative shrink-0">
                <span className="block h-6 px-2 border-2 border-black text-[9px] font-sans font-black uppercase tracking-widest leading-[20px]">Save</span>
                {r.save ? (
                  <>
                    <span className="ms-anim ms-at-60 absolute inset-0 bg-accent border-2 border-accent text-white text-[9px] font-sans font-black uppercase tracking-widest leading-[20px] text-center">
                      Saved
                    </span>
                    <Cursor />
                  </>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Frame>
  );
}

function MapScene() {
  // Brown 2020's spot in GraphStoryMobile's 360x540 drawing, as percentages.
  const brown = { left: '50.6%', top: '49.4%' };
  return (
    <Frame label="Knowledge graph">
      <div className="relative px-2 pt-3">
        <StatusPanel inline title="Mapping your library" lines={['12 papers placed by year', '15 builds-on links', '3 shared authors']} />
        <div className="relative">
          <GraphStoryMobile bare />
          <span aria-hidden className="ms-ping absolute w-12 h-12 -ml-6 -mt-6 border-2 border-accent rounded-full" style={brown} />
          <span
            className="ms-anim ms-at-60 absolute ml-6 -mt-3 bg-black text-white text-[9.5px] font-sans font-bold px-2 py-1 whitespace-nowrap"
            style={brown}
          >
            Brown 2020 · built on by 3
          </span>
        </div>
      </div>
    </Frame>
  );
}

const QUESTIONS = [
  { tag: 'Likely', tone: 'bg-black', q: 'Why Transformers over recurrent models for long documents?', at: 'ms-at-35' },
  { tag: 'Challenge', tone: 'bg-danger', q: 'How does your evaluation avoid the few-shot bias Brown 2020 reports?', at: 'ms-at-45' },
  { tag: 'Contradicts', tone: 'bg-accent', q: 'Ouyang 2022 finds the opposite on instruction data. Why trust yours?', at: 'ms-at-55' },
];

function DefendScene() {
  return (
    <Frame label="Defence ready">
      <div className="relative p-3 pb-4 aspect-[4/5]">
        <StatusPanel title="Reading your library" lines={['4 research gaps', '6 likely viva questions', '2 contradicting results']} />
        <p className="mt-[124px] text-[9px] font-sans font-black uppercase tracking-[0.2em] text-black/45">Likely viva questions</p>
        <ul className="mt-2 space-y-2">
          {QUESTIONS.map((x) => (
            <li key={x.q} className={`ms-anim ${x.at} border-2 border-black p-2.5`}>
              <span className={`inline-block px-1.5 py-0.5 text-[8.5px] font-sans font-black uppercase tracking-widest text-white ${x.tone}`}>{x.tag}</span>
              <p className="mt-1.5 text-[12px] font-sans font-bold leading-snug text-black">{x.q}</p>
            </li>
          ))}
        </ul>
        <div className="ms-anim ms-at-70 mt-3 bg-black text-white p-2.5 shadow-[4px_4px_0_#0066FF]">
          <p className="text-[8.5px] font-sans font-black uppercase tracking-widest text-accent">Research gap</p>
          <p className="mt-1 text-[12px] font-serif leading-snug">Few papers here test reasoning in low-resource languages.</p>
        </div>
      </div>
    </Frame>
  );
}

const STEPS = [
  { title: 'Find.', body: 'Search eight academic databases at once. Duplicates merged, the good papers one tap from your library.', Scene: FindScene },
  { title: 'Map.', body: 'See what every paper builds on, who wrote what, and which ideas sit close together.', Scene: MapScene },
  { title: 'Defend.', body: 'Spot the gaps worth writing about, and rehearse the questions your examiners will ask.', Scene: DefendScene },
];

function Step({ title, body, Scene }: (typeof STEPS)[number]) {
  const ref = useRunWhenVisible<HTMLDivElement>();
  return (
    <div ref={ref}>
      <Scene />
      <h3 className="mt-7 font-serif text-[44px] leading-none tracking-tight text-black">{title}</h3>
      <p className="mt-3 text-[17px] font-sans leading-relaxed text-black/60">{body}</p>
    </div>
  );
}

export function MobileShowcase() {
  return (
    <section aria-labelledby="mobile-showcase-heading" className="text-left">
      <h2 id="mobile-showcase-heading" className="font-serif text-[34px] leading-[1.08] tracking-tight text-black text-center">
        Your literature, <span className="text-accent">found, mapped and defended.</span>
      </h2>
      <div className="mt-10 space-y-16">
        {STEPS.map((s) => (
          <Step key={s.title} {...s} />
        ))}
      </div>
    </section>
  );
}
