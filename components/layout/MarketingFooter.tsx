'use client';

import Link from 'next/link';

export function MarketingFooter() {
  return (
    <footer className="border-t-2 border-black py-12 px-6 bg-white" role="contentinfo">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-8">
        <span className="font-serif text-2xl font-black text-black tracking-tighter">
          ThesisMaps<span className="text-accent">.</span>
        </span>
        <nav className="flex gap-8" aria-label="Footer navigation">
          <Link href="/login" className="text-xs font-sans font-bold uppercase tracking-widest text-text-muted hover:text-black transition-colors">Sign in</Link>
          <Link href="/signup" className="text-xs font-sans font-bold uppercase tracking-widest text-text-muted hover:text-black transition-colors">Sign up</Link>
        </nav>
        <p className="text-xs font-sans font-bold uppercase tracking-widest text-text-muted">
          © {new Date().getFullYear()} ThesisMaps. Intelligence for researchers.
        </p>
      </div>
    </footer>
  );
}
