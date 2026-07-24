'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { useProject } from '@/hooks/useProject';
import { apiClient } from '@/lib/apiClient';
import type { Paper, SavedPaper } from '@/types/paper';

const CHECKLIST = [
  'I can articulate my core argument in under 2 minutes',
  'I have addressed the most-cited counter-argument',
  'I have justified my methodological choice',
  'I have acknowledged limitations proactively',
  'I have prepared responses to contradicting findings',
  'I have reviewed all papers flagged as critiques',
];

// Keyword heuristics until the ML service classifies papers properly.
const COUNTER_RE = /\b(critique|challenge|rebuttal|counter|dispute|question(s|ing)?)\b/i;
const CONTRADICT_RE = /\b(contradict|conflicting|oppos(ite|ing)|inconsistent|fails? to replicate|no evidence)\b/i;
const METHOD_RE = /\b(methodolog(y|ical)|bias|validity|reproducib|limitations?|flaw(s|ed)?)\b/i;

function textOf(p: Paper): string {
  return `${p.title} ${p.abstract ?? ''}`;
}

function Panel({
  id,
  heading,
  papers,
  badge,
  variant,
  emptyLabel,
}: {
  id: string;
  heading: string;
  papers: Paper[];
  badge: string;
  variant: 'warning' | 'danger';
  emptyLabel: string;
}) {
  return (
    <section aria-labelledby={id} className="bg-white border-2 border-black shadow-impact p-5">
      <h2 id={id} className="font-serif text-lg font-black uppercase tracking-tight text-black mb-4 pb-2 border-b-2 border-black">
        {heading}
      </h2>
      {papers.length === 0 ? (
        <p className="text-[10px] text-black/40 font-bold uppercase tracking-widest py-4 text-center">{emptyLabel}</p>
      ) : (
        <ul className="space-y-3">
          {papers.map((paper) => (
            <li key={paper.id} className="border-b border-black/20 pb-3 last:border-0">
              <p className="text-[11px] font-sans font-black uppercase tracking-tight text-black line-clamp-2">{paper.title}</p>
              <p className="text-[10px] text-black/50 font-sans font-bold mt-0.5">{paper.year || '—'}</p>
              <div className="mt-2">
                <Badge variant={variant}>{badge}</Badge>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function DefencePage() {
  const { projectId } = useProject();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checked, setChecked] = useState<boolean[]>(() => CHECKLIST.map(() => false));

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    apiClient
      .get<{ papers: SavedPaper[] }>(`/api/papers/save?projectId=${projectId}`)
      .then(({ papers: saved }) => setPapers(saved.map((s) => s.paper)))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load library'))
      .finally(() => setLoading(false));
  }, [projectId]);

  const counters = papers.filter((p) => COUNTER_RE.test(textOf(p))).slice(0, 5);
  const contradicting = papers.filter((p) => CONTRADICT_RE.test(textOf(p))).slice(0, 5);
  const critiques = papers.filter((p) => METHOD_RE.test(textOf(p))).slice(0, 5);

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title="Defence Readiness"
        subtitle="Prepare for the toughest questions by reviewing challenges to your thesis."
      />

      <div className="border-2 border-black bg-black px-4 py-3">
        <p className="text-[10px] font-sans font-black uppercase tracking-[0.2em] text-white">Stage // Defence Preparation</p>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-56 w-full" />)}
        </div>
      ) : error ? (
        <div className="bg-white border-2 border-black shadow-impact p-5">
          <p className="text-[10px] text-red-600 font-black uppercase tracking-widest">Failed to load library</p>
          <p className="text-xs text-black/40 font-sans mt-1">{error}</p>
        </div>
      ) : papers.length === 0 ? (
        <div className="text-center py-24 border-2 border-black border-dashed bg-white">
          <p className="text-black/40 font-sans font-bold uppercase tracking-[0.2em] text-[10px]">Your library is empty</p>
          <p className="text-black/40 font-sans text-xs mt-2">Save papers from Search — challenging papers will be surfaced here.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-5">
          <Panel
            id="counter-heading"
            heading="Counter-Arguments"
            papers={counters}
            badge="Challenges claim"
            variant="warning"
            emptyLabel="No counter-arguments detected in your library."
          />
          <Panel
            id="contradicting-heading"
            heading="Contradicting Findings"
            papers={contradicting}
            badge="Contradicts"
            variant="danger"
            emptyLabel="No contradicting findings detected."
          />
          <Panel
            id="methodology-heading"
            heading="Methodology Critiques"
            papers={critiques}
            badge="Methodology critique"
            variant="warning"
            emptyLabel="No methodology critiques detected."
          />
        </div>
      )}

      <section aria-labelledby="checklist-heading" className="bg-white border-2 border-black shadow-impact p-5">
        <h2 id="checklist-heading" className="font-serif text-lg font-black uppercase tracking-tight text-black mb-4 pb-2 border-b-2 border-black">
          Defence Checklist
        </h2>
        <ul className="space-y-3">
          {CHECKLIST.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <input
                type="checkbox"
                id={`check-${i}`}
                checked={checked[i] ?? false}
                onChange={() => setChecked((prev) => prev.map((c, idx) => (idx === i ? !c : c)))}
                className="mt-0.5 h-4 w-4 appearance-none border-2 border-black bg-white checked:bg-accent cursor-pointer flex-shrink-0"
                aria-label={item}
              />
              <label htmlFor={`check-${i}`} className="text-[12px] font-sans font-bold text-black cursor-pointer">{item}</label>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
