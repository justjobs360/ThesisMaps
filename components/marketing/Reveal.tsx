'use client';

import React, { useRef } from 'react';
import { motion, useScroll, useTransform, type MotionStyle } from 'framer-motion';

/**
 * The marketing page's motion vocabulary. Three primitives, used everywhere, so
 * that every element on the page moves according to the same rules.
 *
 * `Reveal` is the important one. It is deliberately a single component applied
 * broadly rather than a set of bespoke per-section animations — the coherence
 * comes from the repetition. Anything hand-tuned per section is what makes a
 * page read as a pile of separate effects.
 *
 * REDUCED MOTION IS HANDLED IN CSS, NOT HERE — see the `[data-tm-motion]` rule
 * in app/globals.css. These components must render identically on the server and
 * on the client's first paint, so they cannot consult a media query during
 * render: `prefers-reduced-motion` is unknowable on the server, so branching on
 * it produces one tree in the HTML and a different one at hydration, and React
 * throws a hydration mismatch. (It did. That is why this is a comment and not a
 * `useReducedMotion()` call.) A CSS media query is evaluated only by the
 * browser, never serialised into the HTML, so it can never desync — and an
 * `!important` rule in the stylesheet outranks the inline styles framer-motion
 * writes, which is what lets it win against a running animation.
 */

/** The signature curve from globals.css, in the tuple form framer-motion takes. */
const EASE = [0, 0, 0.3642, 1] as const;

/** The house stagger step. Small enough to read as one gesture, not a queue. */
export const STAGGER = 0.08;

type RevealProps = {
  children: React.ReactNode;
  /** Seconds. Use to stagger siblings; STAGGER above is the house step. */
  delay?: number;
  /** Distance travelled, px. Larger for bigger blocks, smaller for text lines. */
  y?: number;
  className?: string;
  as?: 'div' | 'section' | 'li' | 'article' | 'span' | 'p';
};

/**
 * Content arrives from slightly below and slightly behind.
 *
 * The `scale: 0.98` is the part that does the work and the part most often left
 * out. A pure y-translation slides — it reads as an element being pushed into
 * position by something offstage. Pairing the translation with a sub-1 scale
 * makes the same movement read as approaching the viewer, because together those
 * are the two cues perspective actually produces. It is 2% of size and it
 * changes everything about how expensive the page feels.
 */
export function Reveal({ children, delay = 0, y = 40, className, as = 'div' }: RevealProps) {
  const Tag = motion[as];
  return (
    <Tag
      data-tm-motion
      className={className}
      initial={{ opacity: 0, y, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      // `once`: replaying on every pass turns a reveal into a gimmick, and
      // re-hiding content the reader has already seen is actively annoying when
      // they scroll back up to re-read something.
      //
      // The bottom margin fires the reveal once the element is ~15% up from the
      // viewport's bottom edge, so it animates while entering rather than after
      // it has already been sitting in full view.
      viewport={{ once: true, margin: '0px 0px -15% 0px' }}
      transition={{ duration: 0.8, ease: EASE, delay }}
    >
      {children}
    </Tag>
  );
}

/**
 * The same gesture, but keyed to page load instead of scroll position.
 *
 * The hero is already in view on arrival, so a scroll-triggered reveal would
 * either fire everything at once and lose the stagger, or never fire at all.
 * Used to choreograph the hero from the top down.
 */
export function Entrance({ children, delay = 0, y = 28, className, as = 'div' }: RevealProps) {
  const Tag = motion[as];
  return (
    <Tag
      data-tm-motion
      className={className}
      initial={{ opacity: 0, y, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.9, ease: EASE, delay }}
    >
      {children}
    </Tag>
  );
}

type ParallaxProps = {
  children: React.ReactNode;
  /** px offset at the moment the element enters the viewport from below. */
  from?: number;
  /** px offset at the moment it leaves through the top. */
  to?: number;
  className?: string;
  style?: MotionStyle;
};

/**
 * Depth via differential scroll rate.
 *
 * Tied to scroll POSITION, not to a duration — the layer's offset is a pure
 * function of how far through the viewport the element has travelled, so it
 * tracks the reader's own hand rather than playing back at it. That is what
 * makes it read as depth instead of as an animation that happens to be running.
 *
 * Because Lenis drives window scroll, `useScroll` reads an already-smoothed
 * value here and needs no additional spring on top.
 *
 * The target must not be `position: static`, or framer-motion cannot resolve its
 * offset against the scroll container and warns; callers pass `relative`.
 */
export function Parallax({ children, from = 40, to = -40, className, style }: ParallaxProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    // 'start end' = element top meets viewport bottom; 'end start' = element
    // bottom meets viewport top. Together they span the element's full transit.
    offset: ['start end', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], [from, to]);

  return (
    <motion.div data-tm-motion ref={ref} className={className} style={{ ...style, y }}>
      {children}
    </motion.div>
  );
}
