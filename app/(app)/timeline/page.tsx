import type { Metadata } from 'next';
import { PageHeader } from '@/components/layout/PageHeader';
import { MOCK_PAPERS } from '@/lib/mockData';
import { Button } from '@/components/ui/Button';
import { Download } from 'lucide-react';

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
        action={
          <Button variant="secondary" size="sm">
            <Download size={14} strokeWidth={1.5} /> Export PDF
          </Button>
        }
      />

      <div className="bg-surface border border-border rounded-md p-6 shadow-sm overflow-x-auto">
        <div className="relative min-w-[600px]">
          {/* X-axis years */}
          <div className="flex justify-between text-xs font-sans text-text-muted mb-2">
            {Array.from({ length: 8 }, (_, i) => MIN_YEAR + Math.round((RANGE / 7) * i)).map((y) => (
              <span key={y}>{y}</span>
            ))}
          </div>

          {/* Axis line */}
          <div className="h-px bg-border w-full mb-6" aria-hidden />

          {/* Paper ticks */}
          <div className="relative h-24">
            {papers.map((paper) => {
              const left = `${((paper.year - MIN_YEAR) / RANGE) * 100}%`;
              const isSeminal = paper.citationCount > 50000;
              return (
                <div key={paper.id} className="absolute" style={{ left }}>
                  <div
                    className={[
                      'rounded-full cursor-pointer transition-all duration-150 hover:scale-125',
                      isSeminal ? 'w-4 h-4 -translate-x-2' : 'w-2.5 h-2.5 -translate-x-1.5',
                    ].join(' ')}
                    style={{ backgroundColor: isSeminal ? '#C4973A' : '#9CA3AF' }}
                    title={`${paper.title} (${paper.year})`}
                    role="button"
                    tabIndex={0}
                    aria-label={`${paper.title}, ${paper.year}, ${paper.citationCount.toLocaleString()} citations`}
                  />
                  {isSeminal ? (
                    <p className="absolute top-5 left-1/2 -translate-x-1/2 text-xs font-sans text-accent whitespace-nowrap max-w-[120px] truncate text-center">
                      {paper.title.split(' ').slice(0, 4).join(' ')}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs font-sans text-text-muted mt-6 pt-4 border-t border-border">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-accent" aria-hidden />
              <span>Seminal paper</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-text-muted" aria-hidden />
              <span>Paper</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
