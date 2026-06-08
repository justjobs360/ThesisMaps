'use client';

import Link from 'next/link';

export function AppFooter() {
  return (
    <footer className="h-[72px] border-t-2 border-black px-6 bg-white overflow-hidden flex items-center" role="contentinfo">
      <div className="max-w-6xl w-full mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col items-center md:items-start gap-1">
          <span className="font-serif text-xl font-black text-black tracking-tighter uppercase">
            ThesisMaps<span className="text-accent">.</span>
          </span>
          <p className="text-[10px] font-sans font-bold uppercase tracking-widest text-black/40">
            Intelligence for researchers
          </p>
        </div>
        
        <nav className="flex gap-8" aria-label="Footer navigation">
          <Link href="/dashboard" className="text-xs font-sans font-bold uppercase tracking-widest text-black/60 hover:text-black transition-colors">Dashboard</Link>
          <Link href="/search" className="text-xs font-sans font-bold uppercase tracking-widest text-black/60 hover:text-black transition-colors">Search</Link>
          <Link href="/settings" className="text-xs font-sans font-bold uppercase tracking-widest text-black/60 hover:text-black transition-colors">Settings</Link>
        </nav>

        <p className="text-[10px] font-sans font-bold uppercase tracking-widest text-black/40">
          © {new Date().getFullYear()} ThesisMaps Repo
        </p>
      </div>
    </footer>
  );
}
