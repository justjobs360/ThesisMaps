'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';

/**
 * Inertial scrolling for the marketing surface.
 *
 * This is the least visible and most load-bearing part of the page's feel. A
 * native wheel event jumps the document a fixed number of pixels and stops dead;
 * every reveal downstream of it therefore fires against a hard, steppy baseline
 * and reads as abrupt no matter how well it is eased. Lenis intercepts the wheel
 * and integrates it into a rAF loop, so input builds velocity and the page
 * glides to rest — which is the "smoothness" people attribute to the animations
 * themselves.
 *
 * Mounted per-route rather than in the root layout: the app shell has its own
 * scroll containers (the graph canvas, sidebars, dialogs) and hijacking the
 * document there would fight them.
 */

// ~1.1s to bleed off velocity. Lower reads twitchy; higher and the page feels
// like it is resisting the user, which is the failure mode of every overdone
// smooth-scroll implementation.
const LERP = 0.09;

export function SmoothScroll() {
  useEffect(() => {
    // Honour the OS setting by simply never constructing Lenis — native
    // scrolling is the correct behaviour, and there is nothing to animate.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const lenis = new Lenis({
      lerp: LERP,
      // Touch devices already have inertial scrolling in hardware, and layering
      // a JS loop on top of it is what makes smooth-scroll libraries feel broken
      // on phones.
      smoothWheel: true,
      syncTouch: false,
      // Below 1 the page scrolls slower than the user's input asks for, which
      // reads as lag rather than weight.
      wheelMultiplier: 1,
    });

    let frame = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);

    /**
     * Same-page anchors. Lenis owns scrollTop, so the browser's native jump to
     * `#features` would be immediately overwritten by the loop above and the
     * page would snap back. Routing anchor clicks through `lenis.scrollTo` also
     * lets the jump share the page's easing instead of teleporting.
     *
     * `offset` clears the 64px fixed header (h-16 in MarketingHeader).
     */
    const onClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement | null)?.closest('a');
      const href = anchor?.getAttribute('href');
      if (!href) return;
      // Matches both "#features" and the "/#features" form the header uses.
      const hash = href.startsWith('#') ? href : href.startsWith('/#') ? href.slice(1) : null;
      if (!hash || hash.length < 2) return;
      const target = document.querySelector(hash);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target as HTMLElement, { offset: -80, duration: 1.1 });
    };

    document.addEventListener('click', onClick);

    return () => {
      document.removeEventListener('click', onClick);
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, []);

  return null;
}
