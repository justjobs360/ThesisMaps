'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { ExportMenu } from '@/components/ExportMenu';
import { useProject } from '@/hooks/useProject';
import { apiClient } from '@/lib/apiClient';
import type { Paper, SavedPaper } from '@/types/paper';

export default function TimelinePage() {
  const { projectId } = useProject();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    apiClient
      .get<{ papers: SavedPaper[] }>(`/api/papers/save?projectId=${projectId}`)
      .then(({ papers: saved }) => setPapers(saved.map((s) => s.paper).filter((p) => p.year > 0)))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load library'))
      .finally(() => setLoading(false));
  }, [projectId]);

  const years = papers.map((p) => p.year);
  const minYear = years.length ? Math.min(...years) : new Date().getFullYear() - 10;
  const maxYear = years.length ? Math.max(...years) : new Date().getFullYear();
  const range = Math.max(1, maxYear - minYear);
  // A paper is "seminal" relative to this library: top citation count and >= 1000.
  const maxCitations = Math.max(0, ...papers.map((p) => p.citationCount));
  const seminalThreshold = Math.max(1000, maxCitations * 0.5);

  return (
    <div className="space-y-6 max-w-6xl">
      <PageHeader
        title="Literature Timeline"
        subtitle="Visualise how research in your saved library has evolved over time."
        action={<ExportMenu formats={['bibtex', 'csv', 'json']} />}
      />

      {loading ? (
        <div className="bg-white border-2 border-black shadow-impact p-6">
          <Skeleton className="h-40 w-full" />
        </div>
      ) : error ? (
        <div className="bg-white border-2 border-black shadow-impact p-6">
          <p className="text-[10px] text-red-600 font-black uppercase tracking-widest">Failed to load timeline</p>
          <p className="text-xs text-black/40 font-sans mt-1">{error}</p>
        </div>
      ) : papers.length === 0 ? (
        <div className="text-center py-24 border-2 border-black border-dashed bg-white">
          <p className="text-black/40 font-sans font-bold uppercase tracking-[0.2em] text-[10px]">No papers in your library yet</p>
          <p className="text-black/40 font-sans text-xs mt-2">Save papers from Search — they will be plotted here by year.</p>
        </div>
      ) : (
        <div className="bg-white border-2 border-black shadow-impact p-6 overflow-x-auto">
          <div className="relative min-w-[600px]">
            {/* X-axis years */}
            <div className="flex justify-between text-[10px] font-sans font-black uppercase tracking-widest text-black mb-2">
              {Array.from({ length: 8 }, (_, i) => minYear + Math.round((range / 7) * i)).map((y, i) => (
                <span key={`${y}-${i}`}>{y}</span>
              ))}
            </div>

            {/* Axis line */}
            <div className="h-0.5 bg-black w-full mb-6" aria-hidden />

            {/* Paper ticks */}
            <div className="relative h-24">
              {papers.map((paper) => {
                const left = `${((paper.year - minYear) / range) * 100}%`;
                const isSeminal = paper.citationCount >= seminalThreshold;
                return (
                  <div key={paper.id} className="absolute" style={{ left }}>
                    <div
                      className={[
                        'border-2 border-black cursor-pointer transition-transform duration-150 hover:scale-125',
                        isSeminal ? 'w-4 h-4 -translate-x-2 bg-accent' : 'w-2.5 h-2.5 -translate-x-1.5 bg-black',
                      ].join(' ')}
                      title={`${paper.title} (${paper.year}) — ${paper.citationCount.toLocaleString()} citations`}
                      role="button"
                      tabIndex={0}
                      aria-label={`${paper.title}, ${paper.year}, ${paper.citationCount.toLocaleString()} citations`}
                    />
                    {isSeminal ? (
                      <p className="absolute top-5 left-1/2 -translate-x-1/2 text-[10px] font-sans font-black uppercase tracking-tight text-accent whitespace-nowrap max-w-[120px] truncate text-center">
                        {paper.title.split(' ').slice(0, 4).join(' ')}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-[10px] font-sans font-bold uppercase tracking-wider text-black mt-6 pt-4 border-t-2 border-black">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 border-2 border-black bg-accent" aria-hidden />
                <span>Seminal paper</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 border-2 border-black bg-black" aria-hidden />
                <span>Paper</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
