'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { MOCK_RESEARCH_GAPS, MOCK_PAPERS } from '@/lib/mockData';
import type { ResearchGap } from '@/types/thesis';

export default function GapsPage() {
  const [gaps, setGaps] = useState<ResearchGap[]>(MOCK_RESEARCH_GAPS);
  const [loading, setLoading] = useState(false);
  const [analyzed, setAnalyzed] = useState(true);

  async function runAnalysis() {
    setLoading(true);
    setAnalyzed(false);
    // Simulate short network latency if needed, or remove for instant results
    setGaps(MOCK_RESEARCH_GAPS);
    setAnalyzed(true);
    setLoading(false);
  }

  const flaggedPapers = MOCK_PAPERS.filter((_, i) => i < 2);

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Research Gaps"
        subtitle="ML-powered analysis of your library to surface under-researched topics."
        action={
          <Button onClick={runAnalysis} loading={loading}>
            {loading ? 'Analyzing…' : 'Analyze my library'}
          </Button>
        }
      />

      {loading ? (
        <div className="space-y-6">
          <p className="text-sm text-black font-sans font-bold uppercase tracking-widest animate-pulse italic">Scanning neural networks for research gaps…</p>
          <div className="grid sm:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} className="border-2 border-black rounded-none shadow-none h-48" />)}
          </div>
        </div>
      ) : analyzed ? (
        <>
          <section aria-labelledby="clusters-heading">
            <h2 id="clusters-heading" className="text-xs font-sans font-black uppercase tracking-[0.2em] text-black mb-4">Topic Clusters</h2>
            <div className="grid sm:grid-cols-2 gap-0 border-l border-t border-black">
              {gaps.map((gap) => (
                <article
                  key={gap.id}
                  className={['border-r border-b border-black p-6 bg-white hover:bg-accent/[0.03] transition-colors', gap.isHighGap ? 'relative' : ''].join(' ')}
                >
                  {gap.isHighGap && (
                    <div className="absolute top-0 right-0 bg-accent text-white px-2 py-0.5 text-[10px] font-black uppercase tracking-tighter">
                      Opportunity Detected
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <h3 className="text-lg font-serif font-black text-black leading-tight">{gap.clusterName.toUpperCase()}</h3>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-center justify-between text-xs font-sans font-bold text-black mb-2 uppercase tracking-wide">
                      <span>GAP DENSITY</span>
                      <span className="text-accent">{Math.round(gap.gapScore * 100)}%</span>
                    </div>
                    <div className="h-4 border-2 border-black bg-white overflow-hidden p-0.5" role="progressbar" aria-valuenow={Math.round(gap.gapScore * 100)} aria-valuemin={0} aria-valuemax={100}>
                      <div
                        className={['h-full transition-all', gap.isHighGap ? 'bg-accent' : 'bg-black'].join(' ')}
                        style={{ width: `${gap.gapScore * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {gap.keywords.map((kw) => (
                      <Badge key={kw} variant="muted" className="rounded-none border-black border font-bold text-[10px] uppercase">{kw}</Badge>
                    ))}
                  </div>

                  <p className="text-xs text-black/60 font-sans font-bold uppercase tracking-tight italic">{gap.paperCount} verified sources</p>
                </article>
              ))}
            </div>
          </section>

          <section aria-labelledby="flagged-heading" className="mt-12">
            <h2 id="flagged-heading" className="text-xs font-sans font-black uppercase tracking-[0.2em] text-black mb-4">Paper Trace Analysis</h2>
            <p className="text-xs text-black/60 font-sans font-bold uppercase tracking-tight mb-6">Automated extraction of future research vectors.</p>
            <ul className="space-y-0 border-t border-black">
              {flaggedPapers.map((paper) => (
                <li key={paper.id} className="border-b border-l border-r border-black p-4 bg-white hover:bg-black hover:text-white group transition-colors cursor-pointer">
                  <p className="text-sm font-sans font-black uppercase tracking-tight">{paper.title}</p>
                  <p className="text-xs text-black/60 font-sans mt-1 group-hover:text-white/60 italic leading-relaxed font-medium">&quot;…future work should explore multilingual settings beyond the current scope of this study…&quot;</p>
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : (
        <div className="text-center py-20 border-2 border-dashed border-black bg-white">
          <p className="text-sm text-black font-sans font-bold uppercase tracking-[0.3em] mb-6 animate-pulse">Analysis Engine Standby</p>
          <Button onClick={runAnalysis} size="lg" variant="primary">Initialise Library Scan</Button>
        </div>
      )}
    </div>
  );
}
