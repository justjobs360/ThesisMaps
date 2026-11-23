'use client';

import React, { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useProject } from '@/hooks/useProject';
import { useSidebar } from '@/context/SidebarContext';
import { TOUR_STEPS } from './steps';

/**
 * Product tour: a welcome card on a user's first visit, then a spotlight walk
 * through the real app (components/tour/steps.ts). Replayable from the topbar's
 * "?" button, the user menu and Settings via `useTour().start()`.
 *
 * Whether a user has seen it is kept per user in localStorage — a convenience
 * flag, so a cleared browser just offers the tour again, which is harmless.
 */

type TourContextValue = {
  start: () => void;
  active: boolean;
};

const TourContext = createContext<TourContextValue | null>(null);

export function useTour(): TourContextValue {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error('useTour must be used within TourProvider');
  return ctx;
}

const seenKey = (uid: string) => `thesismaps:tour:v1:${uid}`;

function readSeen(uid: string): boolean {
  try {
    return window.localStorage.getItem(seenKey(uid)) !== null;
  } catch {
    return false;
  }
}

function markSeen(uid: string, how: 'done' | 'skipped') {
  try {
    window.localStorage.setItem(seenKey(uid), how);
  } catch {
    // Storage unavailable (private mode): the welcome card may show again. Fine.
  }
}

export function TourProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { loading: projectLoading } = useProject();
  const [welcome, setWelcome] = useState(false);
  const [step, setStep] = useState<number | null>(null);
  /** Shown briefly after a skip, so people know where the replay lives. */
  const [skipHint, setSkipHint] = useState(false);

  // First visit: offer the tour once the workspace has loaded behind it.
  useEffect(() => {
    if (!user || projectLoading) return;
    if (!readSeen(user.uid)) setWelcome(true);
  }, [user, projectLoading]);

  const start = useCallback(() => {
    setWelcome(false);
    setSkipHint(false);
    setStep(0);
  }, []);

  const finish = useCallback(
    (how: 'done' | 'skipped') => {
      if (user) markSeen(user.uid, how);
      setWelcome(false);
      setStep(null);
      setSkipHint(how === 'skipped');
    },
    [user]
  );

  return (
    <TourContext.Provider value={{ start, active: step !== null }}>
      {children}
      {welcome ? <WelcomeCard onStart={start} onSkip={() => finish('skipped')} /> : null}
      {step !== null ? (
        <TourOverlay
          index={step}
          onNext={() => (step + 1 < TOUR_STEPS.length ? setStep(step + 1) : finish('done'))}
          onBack={() => setStep(Math.max(0, step - 1))}
          onSkip={() => finish('skipped')}
          onRestart={() => setStep(0)}
        />
      ) : null}
      {skipHint ? <SkipHint onClose={() => setSkipHint(false)} onReplay={start} /> : null}
    </TourContext.Provider>
  );
}

/** Points at the top bar's "?" button after a skip, then goes away on its own. */
function SkipHint({ onClose, onReplay }: { onClose: () => void; onReplay: () => void }) {
  useEffect(() => {
    const t = window.setTimeout(onClose, 9000);
    return () => window.clearTimeout(t);
  }, [onClose]);

  return createPortal(
    <div role="status" className="tm-fade-up fixed z-[60] top-[76px] right-3 md:right-6 w-[calc(100vw-24px)] max-w-[300px] bg-white border-2 border-black shadow-impact p-4">
      {/* Arrow toward the ? button above. */}
      <span aria-hidden className="absolute -top-[9px] right-[62px] md:right-[70px] w-4 h-4 rotate-45 bg-white border-l-2 border-t-2 border-black" />
      <p className="text-[13px] font-sans text-black/70 leading-snug">
        No problem. You can take the tour any time from the <strong className="text-black">?</strong> button up here.
      </p>
      <div className="mt-3 flex items-center gap-3">
        <button type="button" onClick={onReplay} className="h-9 px-4 bg-black text-white text-[10px] font-sans font-black uppercase tracking-widest hover:bg-accent transition-colors">
          Take it now
        </button>
        <button type="button" onClick={onClose} className="text-[10px] font-sans font-black uppercase tracking-widest text-black/45 hover:text-black">
          Got it
        </button>
      </div>
    </div>,
    document.body
  );
}

/** First-visit offer. Plain fixed layer rather than the Radix modal so the tour can take over without a dialog closing animation in between. */
function WelcomeCard({ onStart, onSkip }: { onStart: () => void; onSkip: () => void }) {
  const startRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => startRef.current?.focus(), []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onSkip();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onSkip]);

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/55" role="dialog" aria-modal="true" aria-labelledby="tour-welcome-title">
      <div className="tm-fade-up w-full max-w-md bg-white border-2 border-black shadow-impact p-7">
        <p className="text-[10px] font-sans font-black uppercase tracking-[0.22em] text-accent">Welcome to ThesisMaps</p>
        <h2 id="tour-welcome-title" className="mt-3 font-serif text-[32px] leading-[1.05] tracking-tight text-black">
          Two minutes to find your way around.
        </h2>
        <p className="mt-3 text-sm font-sans text-black/60 leading-relaxed">
          A short walk through the workspace: where to find papers, where they go, and how your library turns into a
          map, an outline and a defence. You can leave at any point.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            ref={startRef}
            type="button"
            onClick={onStart}
            className="h-12 px-6 bg-black text-white text-[11px] font-sans font-black uppercase tracking-widest shadow-impact hover:bg-accent transition-colors"
          >
            Take the tour
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="h-12 px-6 border-2 border-black text-black text-[11px] font-sans font-black uppercase tracking-widest hover:bg-black hover:text-white transition-colors"
          >
            Skip for now
          </button>
        </div>
        <p className="mt-4 text-[11px] font-sans text-black/40">You can replay it any time from the ? button at the top of the page.</p>
      </div>
    </div>,
    document.body
  );
}

const PAD = 8;
const CARD_W = 340;
const GAP = 16;
/** How long to wait for a step's element to appear (after navigating) before showing the card centred. */
const FIND_TIMEOUT_MS = 4000;

type Box = { top: number; left: number; width: number; height: number };

function TourOverlay({
  index,
  onNext,
  onBack,
  onSkip,
  onRestart,
}: {
  index: number;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  onRestart: () => void;
}) {
  const step = TOUR_STEPS[index]!;
  const router = useRouter();
  const pathname = usePathname();
  const { open: openSidebar, close: closeSidebar } = useSidebar();
  const [box, setBox] = useState<Box | null>(null);
  const [missing, setMissing] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const nextRef = useRef<HTMLButtonElement | null>(null);
  const [cardPos, setCardPos] = useState<{ top: number; left: number } | null>(null);

  // Go to the step's page, and open or close the mobile drawer for it.
  useEffect(() => {
    if (step.route && pathname !== step.route) router.push(step.route);
    if (window.innerWidth < 1024) {
      if (step.inSidebar) openSidebar();
      else closeSidebar();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  // Find the target (it may not exist until navigation finishes), then keep its
  // rectangle current through scrolling, resizing and layout shifts.
  useEffect(() => {
    setBox(null);
    setMissing(false);
    let raf = 0;
    let el: Element | null = null;
    const startedAt = performance.now();
    const measure = () => {
      if (!el || !el.isConnected) el = document.querySelector(`[data-tour="${step.target}"]`);
      if (el) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          setBox((prev) =>
            prev && prev.top === r.top && prev.left === r.left && prev.width === r.width && prev.height === r.height
              ? prev
              : { top: r.top, left: r.left, width: r.width, height: r.height }
          );
          setMissing(false);
        }
      } else if (performance.now() - startedAt > FIND_TIMEOUT_MS) {
        setMissing(true);
      }
      raf = requestAnimationFrame(measure);
    };
    raf = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(raf);
  }, [step.target, index]);

  // Bring the target on screen once found.
  useEffect(() => {
    const el = document.querySelector(`[data-tour="${step.target}"]`);
    if (!el || !box) return;
    if (box.top < 64 || box.top + box.height > window.innerHeight) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    // Only on arrival at the step, not on every re-measure.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, !!box]);

  // Clicking the highlighted element moves the tour on (the click itself still happens).
  useEffect(() => {
    if (!step.advanceOnClick || !box) return;
    const el = document.querySelector(`[data-tour="${step.target}"]`);
    if (!el) return;
    const onClick = () => window.setTimeout(onNext, 0);
    el.addEventListener('click', onClick);
    return () => el.removeEventListener('click', onClick);
  }, [step, box, onNext]);

  // Place the card beside the target: right of sidebar items, else below, else above.
  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const h = card.getBoundingClientRect().height;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const w = Math.min(CARD_W, vw - 32);
    if (!box || missing) {
      setCardPos({ top: Math.max(16, (vh - h) / 2), left: (vw - w) / 2 });
      return;
    }
    let top: number;
    let left: number;
    const hole = { top: box.top - PAD, left: box.left - PAD, bottom: box.top + box.height + PAD, right: box.left + box.width + PAD };
    if (step.inSidebar && hole.right + GAP + w < vw) {
      left = hole.right + GAP;
      top = box.top + box.height / 2 - h / 2;
    } else if (hole.bottom + GAP + h < vh) {
      top = hole.bottom + GAP;
      left = box.left + box.width / 2 - w / 2;
    } else {
      top = hole.top - GAP - h;
      left = box.left + box.width / 2 - w / 2;
    }
    setCardPos({ top: Math.min(Math.max(16, top), vh - h - 16), left: Math.min(Math.max(16, left), vw - w - 16) });
  }, [box, missing, step.inSidebar, index]);

  useEffect(() => {
    nextRef.current?.focus({ preventScroll: true });
  }, [index]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onSkip();
      else if (e.key === 'ArrowRight') onNext();
      else if (e.key === 'ArrowLeft') onBack();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onNext, onBack, onSkip]);

  const last = index === TOUR_STEPS.length - 1;
  const hole = box && !missing ? { top: box.top - PAD, left: box.left - PAD, width: box.width + PAD * 2, height: box.height + PAD * 2 } : null;
  // Dim everything except the hole with four panels, so clicks inside the hole
  // still reach the real element underneath.
  const dim = 'fixed bg-black/55 z-[70]';

  return createPortal(
    <>
      {hole ? (
        <>
          <div className={dim} style={{ top: 0, left: 0, right: 0, height: Math.max(0, hole.top) }} />
          <div className={dim} style={{ top: hole.top + hole.height, left: 0, right: 0, bottom: 0 }} />
          <div className={dim} style={{ top: hole.top, left: 0, width: Math.max(0, hole.left), height: hole.height }} />
          <div className={dim} style={{ top: hole.top, left: hole.left + hole.width, right: 0, height: hole.height }} />
          <div
            aria-hidden
            className="fixed z-[71] pointer-events-none border-2 border-accent"
            style={{ ...hole, boxShadow: '0 0 0 4px rgba(0,102,255,0.25)', transition: 'all 250ms cubic-bezier(0.16,1,0.3,1)' }}
          />
        </>
      ) : (
        <div className={`${dim} inset-0`} />
      )}

      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-step-title"
        className="fixed z-[72] bg-white border-2 border-black shadow-impact p-5"
        style={{
          width: `min(${CARD_W}px, calc(100vw - 32px))`,
          top: cardPos?.top ?? -9999,
          left: cardPos?.left ?? -9999,
          transition: 'top 250ms cubic-bezier(0.16,1,0.3,1), left 250ms cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        <div key={index} className="tm-fade-up">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-sans font-black uppercase tracking-[0.2em] text-black">
              {String(index + 1).padStart(2, '0')}
              <span className="text-black/30"> / {String(TOUR_STEPS.length).padStart(2, '0')}</span>
            </p>
            <div className="flex gap-1" aria-hidden>
              {TOUR_STEPS.map((s, i) => (
                <span key={s.id} className={`h-[3px] w-2.5 ${i <= index ? 'bg-black' : 'bg-black/15'}`} />
              ))}
            </div>
          </div>
          <h2 id="tour-step-title" className="mt-3 font-serif text-[24px] leading-[1.1] tracking-tight text-black">
            {step.title}
          </h2>
          <p className="mt-2 text-[13px] font-sans text-black/65 leading-relaxed">{step.body}</p>
          {missing ? (
            <p className="mt-2 text-[11px] font-sans text-black/40">This part of the page isn&apos;t showing right now. Press Next to carry on.</p>
          ) : null}
        </div>

        <div className="mt-5 flex items-center gap-2">
          <button
            type="button"
            onClick={onSkip}
            className="mr-auto text-[10px] font-sans font-black uppercase tracking-widest text-black/45 hover:text-black underline-offset-4 hover:underline"
          >
            {last ? '' : 'Skip tour'}
          </button>
          {index > 0 ? (
            <button
              type="button"
              onClick={onBack}
              className="h-10 px-4 border-2 border-black text-black text-[10px] font-sans font-black uppercase tracking-widest hover:bg-black hover:text-white transition-colors"
            >
              Back
            </button>
          ) : null}
          {last ? (
            <button
              type="button"
              onClick={onRestart}
              className="h-10 px-4 border-2 border-black text-black text-[10px] font-sans font-black uppercase tracking-widest hover:bg-black hover:text-white transition-colors"
            >
              Replay
            </button>
          ) : null}
          <button
            ref={nextRef}
            type="button"
            onClick={onNext}
            className="h-10 px-5 bg-black text-white text-[10px] font-sans font-black uppercase tracking-widest hover:bg-accent transition-colors"
          >
            {last ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}
