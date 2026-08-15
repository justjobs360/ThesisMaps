'use client';

import Link from 'next/link';

export function AppFooter() {
  return (
    // Padding moved inside the clamp and matched to the shell's p-6 md:p-12
    // (app/(app)/layout.tsx) so the footer lines up with the content above it.
    <footer className="h-[72px] border-t-2 border-black bg-white overflow-hidden flex items-center" role="contentinfo">
      {/* 3-column grid rather than justify-between — see MarketingFooter for why
          justify-between can't centre a middle child of unequal siblings. */}
      <div className="max-w-6xl w-full mx-auto px-6 md:px-12 flex flex-col items-center gap-6 md:grid md:grid-cols-3 md:items-center">
        <div className="flex flex-col items-center md:items-start gap-1 md:justify-self-start">
          <span className="font-serif text-xl font-black text-black tracking-tighter uppercase">
            ThesisMaps<span className="text-accent">.</span>
          </span>
          <p className="text-[10px] font-sans font-bold uppercase tracking-widest text-black/40">
            Intelligence for researchers
          </p>
        </div>
        
        <nav className="flex gap-8 md:justify-self-center" aria-label="Footer navigation">
          <Link href="/dashboard" className="text-xs font-sans font-bold uppercase tracking-widest text-black/60 hover:text-black transition-colors">Dashboard</Link>
          <Link href="/search" className="text-xs font-sans font-bold uppercase tracking-widest text-black/60 hover:text-black transition-colors">Search</Link>
          <Link href="/settings" className="text-xs font-sans font-bold uppercase tracking-widest text-black/60 hover:text-black transition-colors">Settings</Link>
        </nav>

        <p className="text-[10px] font-sans font-bold uppercase tracking-widest text-black/40 md:text-right md:justify-self-end">
          © {new Date().getFullYear()} ThesisMaps Repo
        </p>
      </div>
    </footer>
  );
}
