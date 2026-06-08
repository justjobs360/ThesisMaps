import type { Metadata } from 'next';
import { PageHeader } from '@/components/layout/PageHeader';
import { StageTracker } from '@/components/dashboard/StageTracker';
import { StatCard } from '@/components/dashboard/StatCard';
import { ResearchDebtPanel } from '@/components/dashboard/ResearchDebtPanel';
import { MOCK_PROJECT } from '@/lib/mockData';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Dashboard',
  robots: { index: false },
};

const SUGGESTED_ACTIONS = [
  { label: 'Run gap analysis on your library', href: '/gaps' },
  { label: 'Expand your knowledge graph', href: '/graph' },
  { label: 'Review unread papers in your debt list', href: '/search' },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title={MOCK_PROJECT.title}
        subtitle={`Current stage: Literature Review · ${MOCK_PROJECT.field}`}
      />

      <StageTracker currentStage={MOCK_PROJECT.currentStage} />

      {/* Stats */}
      <section aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="sr-only">Research statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Papers Saved" value={142} trend={12} trendLabel="this month" />
          <StatCard label="Outline Chapters" value={6} />
          <StatCard label="Research Gaps Found" value={4} trend={2} trendLabel="new" />
          <StatCard label="Seeds Mapped" value={8} />
        </div>
      </section>

      <div className="grid md:grid-cols-2 gap-6">
        <ResearchDebtPanel />

        {/* Suggested actions */}
        <section aria-labelledby="actions-heading" className="bg-surface border border-border rounded-md p-5 shadow-sm">
          <h2 id="actions-heading" className="text-sm font-sans font-semibold text-text-primary mb-4">Suggested Actions</h2>
          <ul className="space-y-2">
            {SUGGESTED_ACTIONS.map((action) => (
              <li key={action.href}>
                <Link
                  href={action.href}
                  className="flex items-center justify-between gap-3 p-3 rounded border border-border hover:border-text-muted hover:bg-background transition-colors group"
                >
                  <span className="text-sm font-sans text-text-primary">{action.label}</span>
                  <ArrowRight size={14} strokeWidth={1.5} className="text-text-muted group-hover:text-accent transition-colors" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Methodological Fingerprint */}
      <section aria-labelledby="fingerprint-heading" className="bg-surface border border-border rounded-md p-5 shadow-sm">
        <h2 id="fingerprint-heading" className="text-sm font-sans font-semibold text-text-primary mb-4">Methodological Fingerprint</h2>
        <div className="flex gap-4 flex-wrap">
          {[
            { label: 'Quantitative', pct: 55 },
            { label: 'Qualitative', pct: 15 },
            { label: 'Experimental', pct: 20 },
            { label: 'Meta-Analysis', pct: 10 },
          ].map(({ label, pct }) => (
            <div key={label} className="flex-1 min-w-[100px]">
              <p className="text-xs font-sans text-text-muted mb-1">{label}</p>
              <div className="h-2 rounded bg-border overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${label}: ${pct}%`}>
                <div className="h-full bg-accent rounded" style={{ width: `${pct}%` }} />
              </div>
              <p className="text-xs text-text-muted font-sans mt-1">{pct}%</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
