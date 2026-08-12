'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { StageTracker } from '@/components/dashboard/StageTracker';
import { StatCard } from '@/components/dashboard/StatCard';
import { ResearchDebtPanel } from '@/components/dashboard/ResearchDebtPanel';
import { useProject } from '@/hooks/useProject';
import { THESIS_STAGES, type OutlineSection, type SeedSet, type ThesisStage } from '@/types/thesis';
import { analyseGaps } from '@/lib/gapAnalysis';
import { apiClient } from '@/lib/apiClient';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import type { SavedPaper } from '@/types/paper';

const SUGGESTED_ACTIONS = [
  { label: 'Run gap analysis on your library', href: '/gaps' },
  { label: 'Expand your knowledge graph', href: '/graph' },
  { label: 'Review unread papers in your debt list', href: '/search' },
];

// Methodology heuristics over title+abstract until the ML service classifies papers.
const METHOD_BUCKETS: { label: string; re: RegExp }[] = [
  { label: 'Quantitative', re: /\b(quantitative|statistical|regression|survey|measurement)\b/i },
  { label: 'Qualitative', re: /\b(qualitative|interview|ethnograph|case stud)\b/i },
  { label: 'Experimental', re: /\b(experiment|trial|benchmark|evaluation)\b/i },
  { label: 'Meta-Analysis', re: /\b(meta-analysis|systematic review|survey of|literature review)\b/i },
];

export default function DashboardPage() {
  const { currentProject, projectId, loading, refresh } = useProject();
  const [saved, setSaved] = useState<SavedPaper[]>([]);
  const [sections, setSections] = useState<OutlineSection[]>([]);
  const [seedSets, setSeedSets] = useState<SeedSet[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [stageSaving, setStageSaving] = useState(false);
  const [stageError, setStageError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    setDataLoading(true);
    Promise.allSettled([
      apiClient.get<{ papers: SavedPaper[] }>(`/api/papers/save?projectId=${projectId}`),
      apiClient.get<{ sections: OutlineSection[] }>(`/api/outline?projectId=${projectId}`),
      apiClient.get<{ seedSets: SeedSet[] }>(`/api/seeds?projectId=${projectId}`),
    ]).then(([papersRes, outlineRes, seedsRes]) => {
      if (cancelled) return;
      if (papersRes.status === 'fulfilled') setSaved(papersRes.value.papers);
      if (outlineRes.status === 'fulfilled') setSections(outlineRes.value.sections);
      if (seedsRes.status === 'fulfilled') setSeedSets(seedsRes.value.seedSets);
      setDataLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  // Move the project to another research stage. Persists to thesis_projects via
  // PATCH /api/projects/[id], then refreshes the shared project context so the
  // dashboard header and Settings both reflect the new stage.
  async function handleStageChange(next: ThesisStage) {
    if (!projectId || stageSaving || next === currentProject?.currentStage) return;
    setStageSaving(true);
    setStageError(null);
    try {
      await apiClient.patch(`/api/projects/${projectId}`, { currentStage: next });
      await refresh();
    } catch (err) {
      setStageError(err instanceof Error ? err.message : 'Could not change stage.');
    } finally {
      setStageSaving(false);
    }
  }

  const title = currentProject?.title ?? 'My Thesis';
  const stage = currentProject?.currentStage ?? 'research_proposal';
  const stageLabel = THESIS_STAGES.find((s) => s.id === stage)?.label ?? 'Proposal';
  const field = currentProject?.field?.trim() ? currentProject.field : 'Field not set';

  const papers = saved.map((s) => s.paper);
  const unread = saved.filter((s) => s.readStatus === 'unread');
  const chapterCount = sections.filter((s) => !s.parentId).length;
  const highGaps = papers.length > 0 ? analyseGaps(papers).gaps.filter((g) => g.isHighGap).length : 0;

  const methodCounts = METHOD_BUCKETS.map(({ label, re }) => ({
    label,
    count: papers.filter((p) => re.test(`${p.title} ${p.abstract ?? ''}`)).length,
  }));
  const methodTotal = methodCounts.reduce((sum, m) => sum + m.count, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={loading ? 'Loading project…' : title}
        subtitle={`Current stage: ${stageLabel} · ${field}`}
      />

      <StageTracker currentStage={stage} onStageClick={handleStageChange} saving={stageSaving} />
      {stageError ? (
        <p className="text-[10px] font-sans font-black uppercase tracking-widest text-red-600">{stageError}</p>
      ) : null}

      {/* Stats */}
      <section aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="sr-only">Research statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Papers Saved" value={dataLoading ? '…' : saved.length} />
          <StatCard label="Outline Chapters" value={dataLoading ? '…' : chapterCount} />
          <StatCard label="Research Gaps Found" value={dataLoading ? '…' : highGaps} />
          <StatCard label="Seeds Mapped" value={dataLoading ? '…' : seedSets.length} />
        </div>
      </section>

      <div className="grid md:grid-cols-2 gap-6">
        <ResearchDebtPanel savedPapers={unread} loading={dataLoading} />

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

      {/* Methodological Fingerprint — computed from the saved library */}
      <section aria-labelledby="fingerprint-heading" className="bg-surface border border-border rounded-md p-5 shadow-sm">
        <h2 id="fingerprint-heading" className="text-sm font-sans font-semibold text-text-primary mb-4">Methodological Fingerprint</h2>
        {methodTotal === 0 ? (
          <p className="text-sm font-sans text-text-muted">
            {dataLoading ? 'Analysing your library…' : 'Save papers to see the methodology distribution of your library.'}
          </p>
        ) : (
          <div className="flex gap-4 flex-wrap">
            {methodCounts.map(({ label, count }) => {
              const pct = Math.round((count / methodTotal) * 100);
              return (
                <div key={label} className="flex-1 min-w-[100px]">
                  <p className="text-xs font-sans text-text-muted mb-1">{label}</p>
                  <div className="h-2 rounded bg-border overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${label}: ${pct}%`}>
                    <div className="h-full bg-accent rounded" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-text-muted font-sans mt-1">{pct}%</p>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
