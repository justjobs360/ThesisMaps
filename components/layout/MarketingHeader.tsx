'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export function MarketingHeader() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b-2 border-black h-16" aria-label="Main navigation">
      <div className="max-w-6xl mx-auto h-full flex items-center px-6 gap-8">
        <Link href="/" className="font-serif text-2xl font-black text-black mr-auto tracking-tighter" aria-label="ThesisMaps home">
          ThesisMaps<span className="text-accent">.</span>
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <Link href="/#features" className="text-xs font-sans font-bold uppercase tracking-widest text-text-muted hover:text-black transition-colors">Features</Link>
          <Link href="/#how-it-works" className="text-xs font-sans font-bold uppercase tracking-widest text-text-muted hover:text-black transition-colors">Process</Link>
          <Link href="/login" className="text-xs font-sans font-bold uppercase tracking-widest text-text-muted hover:text-black transition-colors">Sign in</Link>
          <Link href="/signup">
            <Button size="sm" variant="primary">Get Started</Button>
          </Link>
        </div>
        <div className="md:hidden flex items-center gap-4">
          <Link href="/login" className="text-[10px] font-sans font-bold uppercase tracking-widest text-text-muted">Sign in</Link>
          <Link href="/signup">
            <Button size="sm" variant="primary" className="px-3 py-1.5 text-[10px]">Join</Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
