'use client';

import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

/**
 * Hero headline motion.
 *
 * The line reads "The visual way to …" and then a phrase beneath it. Previously
 * the ellipsis was static — which made the headline look unfinished — and the
 * phrase flew in from below. Both now type, so the sentence appears to be
 * written rather than assembled: the dots tick in one at a time, then the phrase
 * types out beneath them.
 *
 * Both components render their settled state immediately under
 * prefers-reduced-motion. There was no reduced-motion guard here before.
 */

const DOT_INTERVAL = 165;

/** Types an ellipsis in, one dot at a time, then holds. */
export function TypingDots({ total = 3, className = '' }: { total?: number; className?: string }) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (reduce) {
      setShown(total);
      return;
    }
    if (shown >= total) return;
    const t = setTimeout(() => setShown((n) => n + 1), DOT_INTERVAL);
    return () => clearTimeout(t);
  }, [shown, total, reduce]);

  // Reserve the full width so the headline doesn't reflow as dots appear.
  return (
    <span className={`inline-grid ${className}`} aria-hidden>
      <span className="col-start-1 row-start-1 invisible">{'.'.repeat(total)}</span>
      <span className="col-start-1 row-start-1 text-left">{'.'.repeat(shown)}</span>
    </span>
  );
}

type WordCyclerProps = {
  words: string[];
  className?: string;
  /** Wait for the dots to finish before the first phrase types. */
  startDelay?: number;
  typeSpeed?: number;
  deleteSpeed?: number;
  hold?: number;
};

type Phase = 'waiting' | 'typing' | 'deleting';

export function WordCycler({
  words,
  className = '',
  startDelay = 620,
  typeSpeed = 55,
  deleteSpeed = 26,
  hold = 1900,
}: WordCyclerProps) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [text, setText] = useState('');
  const [phase, setPhase] = useState<Phase>('waiting');

  useEffect(() => {
    // Settled state: first phrase, no typing, no caret motion.
    if (reduce) {
      setText(words[0] ?? '');
      return;
    }

    const word = words[index] ?? '';
    let timer: ReturnType<typeof setTimeout>;

    if (phase === 'waiting') {
      timer = setTimeout(() => setPhase('typing'), startDelay);
    } else if (phase === 'typing') {
      if (text.length < word.length) {
        timer = setTimeout(() => setText(word.slice(0, text.length + 1)), typeSpeed);
      } else {
        timer = setTimeout(() => setPhase('deleting'), hold);
      }
    } else {
      if (text.length > 0) {
        timer = setTimeout(() => setText(word.slice(0, text.length - 1)), deleteSpeed);
      } else {
        timer = setTimeout(() => {
          setIndex((i) => (i + 1) % words.length);
          setPhase('typing');
        }, 180);
      }
    }

    return () => clearTimeout(timer);
  }, [text, phase, index, words, reduce, startDelay, typeSpeed, deleteSpeed, hold]);

  return (
    <span className={`inline-block ${className}`}>
      {/* Screen readers get the whole set, not a half-typed word. */}
      <span className="sr-only">{words.join(', ')}</span>
      <span aria-hidden>
        {text}
        {reduce ? null : <span className="tm-caret" />}
      </span>
    </span>
  );
}
