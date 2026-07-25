'use client';

import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { ExportMenu } from '@/components/ExportMenu';
import { useProject } from '@/hooks/useProject';
import { apiClient } from '@/lib/apiClient';
import type { Paper, SavedPaper } from '@/types/paper';

// Layout geometry (px). Each year gets a fixed slot so the timeline is
// spacious and horizontally scrollable rather than squashing everything into
// the viewport width.
const PX_PER_YEAR = 92;
const LEFT_PAD = 32;
const RIGHT_PAD = 172;
const LABEL_W = 176; // horizontal room a label reserves in its lane
const AXIS_Y = 34;
const LANE_TOP = 54; // y of the first lane's dot row
const ROW_H = 48; // vertical gap between stacked lanes

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
  // "Seminal" relative to this library: top-cited and at least 1000 citations.
  const maxCitations = Math.max(0, ...papers.map((p) => p.citationCount));
  const seminalThreshold = Math.max(1000, maxCitations * 0.5);

  const xForYear = (year: number) => LEFT_PAD + (year - minYear) * PX_PER_YEAR;

  // Assign each paper to the first vertical lane where its label won't overlap
  // the previous label in that lane — so nearby/same-year papers stack instead
  // of colliding.
  const layout = useMemo(() => {
    const sorted = [...papers].sort((a, b) => a.year - b.year || b.citationCount - a.citationCount);
    const laneEnds: number[] = []; // right edge (px) of the last label placed in each lane
    const items = sorted.map((p) => {
      const x = xForYear(p.year);
      let lane = 0;
      while (lane < laneEnds.length && x < laneEnds[lane]! + 8) lane++;
      laneEnds[lane] = x + LABEL_W;
      return { paper: p, x, lane, isSeminal: p.citationCount >= seminalThreshold };
    });
    return { items, laneCount: Math.max(1, laneEnds.length) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [papers, minYear, seminalThreshold]);

  const plotWidth = Math.max(LEFT_PAD + range * PX_PER_YEAR + RIGHT_PAD, 640);
  const plotHeight = LANE_TOP + layout.laneCount * ROW_H + 8;
  const yearTicks = Array.from({ length: range + 1 }, (_, i) => minYear + i);

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
        <div className="bg-white border-2 border-black shadow-impact">
          <div className="flex items-center justify-between px-6 py-3 border-b-2 border-black">
            <p className="text-[10px] font-sans font-black uppercase tracking-widest text-black/50">
              {papers.length} paper{papers.length === 1 ? '' : 's'} · {minYear}–{maxYear}
            </p>
            <p className="text-[10px] font-sans font-bold uppercase tracking-widest text-black/30">Scroll horizontally →</p>
          </div>

          <div className="overflow-x-auto p-6">
            <div className="relative" style={{ width: plotWidth, height: plotHeight }}>
              {/* Per-year gridlines + labels (every year in range) */}
              {yearTicks.map((y) => {
                const x = xForYear(y);
                return (
                  <div key={y}>
                    <span
                      className="absolute text-[10px] font-sans font-black uppercase tracking-wide text-black -translate-x-1/2"
                      style={{ left: x, top: 0 }}
                    >
                      {y}
                    </span>
                    <div
                      className="absolute w-px bg-black/10"
                      style={{ left: x, top: AXIS_Y, height: plotHeight - AXIS_Y }}
                      aria-hidden
                    />
                  </div>
                );
              })}

              {/* Axis line */}
              <div className="absolute h-0.5 bg-black" style={{ left: 0, right: 0, top: AXIS_Y }} aria-hidden />

              {/* Papers — connector from axis to a stacked, labelled dot */}
              {layout.items.map(({ paper, x, lane, isSeminal }) => {
                const dotY = LANE_TOP + lane * ROW_H;
                const size = isSeminal ? 16 : 11;
                return (
                  <div key={paper.id}>
                    {/* connector */}
                    <div
                      className={isSeminal ? 'absolute w-px bg-accent/40' : 'absolute w-px bg-black/25'}
                      style={{ left: x, top: AXIS_Y, height: dotY - AXIS_Y }}
                      aria-hidden
                    />
                    {/* dot */}
                    <div
                      className={[
                        'absolute border-2 border-black cursor-pointer transition-transform duration-150 hover:scale-125',
                        isSeminal ? 'bg-accent' : 'bg-black',
                      ].join(' ')}
                      style={{ left: x - size / 2, top: dotY - size / 2, width: size, height: size }}
                      title={`${paper.title} (${paper.year}) — ${paper.citationCount.toLocaleString()} citations`}
                      role="button"
                      tabIndex={0}
                      aria-label={`${paper.title}, ${paper.year}, ${paper.citationCount.toLocaleString()} citations`}
                    />
                    {/* label */}
                    <div
                      className="absolute leading-tight"
                      style={{ left: x + size / 2 + 8, top: dotY - 12, width: LABEL_W - 24 }}
                    >
                      <p className={['text-[11px] font-sans font-black uppercase tracking-tight line-clamp-2', isSeminal ? 'text-accent' : 'text-black'].join(' ')}>
                        {paper.title}
                      </p>
                      <p className="text-[9px] font-sans font-bold text-black/40 mt-0.5">
                        {paper.year} · {paper.citationCount.toLocaleString()} cit.
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6 px-6 py-4 border-t-2 border-black text-[10px] font-sans font-bold uppercase tracking-wider text-black">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-black bg-accent" aria-hidden />
              <span>Seminal paper</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-black bg-black" aria-hidden />
              <span>Paper</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
