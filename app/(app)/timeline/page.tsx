import type { Metadata } from 'next';
import { PageHeader } from '@/components/layout/PageHeader';
import { MOCK_PAPERS } from '@/lib/mockData';

export const metadata: Metadata = { title: 'Literature Timeline', robots: { index: false } };

const MIN_YEAR = 1990;
const MAX_YEAR = 2024;
const RANGE = MAX_YEAR - MIN_YEAR;

export default function TimelinePage() {
  const papers = MOCK_PAPERS;

  return (
    <div className="space-y-6 max-w-6xl">
      <PageHeader
        title="Literature Timeline"
        subtitle="Visualise how research in your field has evolved over time."
      />

      <div className="bg-white border-2 border-black shadow-impact p-6 overflow-x-auto">
        <div className="relative min-w-[600px]">
          {/* X-axis years */}
          <div className="flex justify-between text-[10px] font-sans font-black uppercase tracking-widest text-black mb-2">
            {Array.from({ length: 8 }, (_, i) => MIN_YEAR + Math.round((RANGE / 7) * i)).map((y) => (
              <span key={y}>{y}</span>
            ))}
          </div>

          {/* Axis line */}
          <div className="h-0.5 bg-black w-full mb-6" aria-hidden />

          {/* Paper ticks */}
          <div className="relative h-24">
            {papers.map((paper) => {
              const left = `${((paper.year - MIN_YEAR) / RANGE) * 100}%`;
              const isSeminal = paper.citationCount > 50000;
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
    </div>
  );
}
