'use client';

import Link from 'next/link';

export function MarketingFooter() {
  return (
    // px-6 lives on the inner clamp (not the outer footer) so the content edge
    // matches the header and every landing section, which all pad inside their
    // max-w-6xl box. With it outside, the footer sat 24px wider on each side.
    <footer className="border-t-2 border-black py-12 bg-white" role="contentinfo">
      {/* 3-column grid, not justify-between: with three unequal children,
          justify-between splits the leftover space evenly, so the nav's centre
          drifted ~110px left of the container's — the copyright line is far
          wider than the wordmark. A grid ties the middle column to the true
          midpoint whatever the outer two weigh. */}
      <div className="max-w-6xl mx-auto px-6 flex flex-col items-center gap-8 sm:grid sm:grid-cols-3 sm:items-center">
        <span className="font-serif text-2xl font-black text-black tracking-tighter sm:justify-self-start">
          ThesisMaps<span className="text-accent">.</span>
        </span>
        <nav className="flex gap-8 sm:justify-self-center" aria-label="Footer navigation">
          <Link href="/login" className="text-xs font-sans font-bold uppercase tracking-widest text-text-muted hover:text-black transition-colors">Sign in</Link>
          <Link href="/signup" className="text-xs font-sans font-bold uppercase tracking-widest text-text-muted hover:text-black transition-colors">Sign up</Link>
        </nav>
        <p className="text-xs font-sans font-bold uppercase tracking-widest text-text-muted text-center sm:text-right sm:justify-self-end">
          © {new Date().getFullYear()} ThesisMaps. Intelligence for researchers.
        </p>
      </div>
    </footer>
  );
}
