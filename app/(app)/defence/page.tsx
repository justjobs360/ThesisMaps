'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Sparkles } from 'lucide-react';
import { useProject } from '@/hooks/useProject';
import { apiClient } from '@/lib/apiClient';
import type { Paper, SavedPaper } from '@/types/paper';

type QA = { point: string; response: string };
type DefencePrep = {
  overview: string;
  counterArguments: QA[];
  contradictions: QA[];
  methodologyCritiques: QA[];
  likelyQuestions: { question: string; answer: string }[];
  checklist: string[];
};

/**
 * Stable key for a checklist item. Checked state is persisted by this slug
 * rather than by array position, because the AI-generated checklist changes
 * between runs — positional storage would silently mark the wrong items.
 */
function itemKey(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
}

// Used when no AI checklist is available (no key configured, or generation failed).
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

// AI panel: a list of {point, response} pairs (challenge + how to defend it).
function QAPanel({
  id,
  heading,
  items,
  variant,
}: {
  id: string;
  heading: string;
  items: QA[];
  variant: 'warning' | 'danger';
}) {
  return (
    <section aria-labelledby={id} className="bg-white border-2 border-black shadow-impact p-5">
      <h2 id={id} className="font-serif text-lg font-black uppercase tracking-tight text-black mb-4 pb-2 border-b-2 border-black">
        {heading}
      </h2>
      {items.length === 0 ? (
        <p className="text-[10px] text-black/40 font-bold uppercase tracking-widest py-4 text-center">None identified.</p>
      ) : (
        <ul className="space-y-4">
          {items.map((qa, i) => (
            <li key={i} className="border-b border-black/20 pb-4 last:border-0">
              <div className="flex items-start gap-2">
                <Badge variant={variant}>{variant === 'danger' ? 'Challenge' : 'Critique'}</Badge>
              </div>
              <p className="text-[12px] font-sans font-black text-black mt-2 leading-snug">{qa.point}</p>
              <p className="text-[11px] font-sans text-black/70 mt-1.5 leading-relaxed">
                <span className="font-black text-accent uppercase tracking-wider text-[9px]">Defence · </span>
                {qa.response}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function DefencePage() {
  const { currentProject, projectId } = useProject();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [prep, setPrep] = useState<DefencePrep | null>(null);
  const [aiAvailable, setAiAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Keyed by item slug (see itemKey) so state survives checklist regeneration.
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [checklistSaved, setChecklistSaved] = useState(false);

  // The AI-derived checklist when available, else the static fallback.
  const checklistItems = prep?.checklist?.length ? prep.checklist : CHECKLIST;

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    // Library (for the heuristic fallback + empty check) and the AI defence prep
    // load together; the AI call is the slow one (~8s), so we wait for both.
    Promise.allSettled([
      apiClient.get<{ papers: SavedPaper[] }>(`/api/papers/save?projectId=${projectId}`),
      apiClient.get<{ aiAvailable: boolean; prep: DefencePrep | null }>(`/api/defence?projectId=${projectId}`),
    ])
      .then(([libRes, prepRes]) => {
        if (libRes.status === 'fulfilled') setPapers(libRes.value.papers.map((s) => s.paper));
        else setError(libRes.reason instanceof Error ? libRes.reason.message : 'Failed to load library');
        if (prepRes.status === 'fulfilled') {
          setAiAvailable(prepRes.value.aiAvailable);
          setPrep(prepRes.value.prep);
        }
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  // Seed checked state from persisted project metadata once it loads.
  // Accepts both the current keyed shape and the legacy positional boolean[]
  // (which was indexed against the old hard-coded CHECKLIST) so previously
  // saved ticks aren't lost.
  useEffect(() => {
    const stored = currentProject?.metadata?.defenceChecklist;
    if (!stored) return;
    if (Array.isArray(stored)) {
      const migrated: Record<string, boolean> = {};
      CHECKLIST.forEach((item, i) => {
        if (stored[i]) migrated[itemKey(item)] = true;
      });
      setChecked(migrated);
    } else if (typeof stored === 'object') {
      setChecked(stored as Record<string, boolean>);
    }
  }, [currentProject]);

  // Persist a checklist change to the project's metadata. Local state stays
  // authoritative so the UI never blocks on the round-trip.
  async function toggleCheck(item: string) {
    const key = itemKey(item);
    const next = { ...checked, [key]: !checked[key] };
    setChecked(next);
    setChecklistSaved(false);
    if (!projectId) return;
    try {
      await apiClient.patch(`/api/projects/${projectId}`, {
        metadata: { ...(currentProject?.metadata ?? {}), defenceChecklist: next },
      });
      setChecklistSaved(true);
    } catch {
      /* keep local state; the next toggle will retry the save */
    }
  }

  const counters = papers.filter((p) => COUNTER_RE.test(textOf(p))).slice(0, 5);
  const contradicting = papers.filter((p) => CONTRADICT_RE.test(textOf(p))).slice(0, 5);
  const critiques = papers.filter((p) => METHOD_RE.test(textOf(p))).slice(0, 5);

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title="Defence Readiness"
        subtitle="Prepare for the toughest questions by reviewing challenges to your thesis."
      />

      <div className="border-2 border-black bg-black px-4 py-3 flex items-center justify-between">
        <p className="text-[10px] font-sans font-black uppercase tracking-[0.2em] text-white">Stage // Defence Preparation</p>
        {aiAvailable && prep ? (
          <span className="flex items-center gap-1.5 text-[10px] font-sans font-black uppercase tracking-widest text-accent">
            <Sparkles size={11} strokeWidth={2.5} /> AI-Generated
          </span>
        ) : null}
      </div>

      {loading ? (
        <div className="space-y-5">
          <p className="text-[10px] font-sans font-black uppercase tracking-[0.2em] text-black/50 animate-pulse">
            Generating your personalized defence analysis…
          </p>
          <div className="grid md:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-56 w-full" />)}
          </div>
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
      ) : aiAvailable && prep ? (
        <div className="space-y-5">
          <div className="bg-white border-2 border-black shadow-impact p-5">
            <p className="text-sm font-sans text-black leading-relaxed">{prep.overview}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            <QAPanel id="counter-heading" heading="Counter-Arguments" items={prep.counterArguments} variant="warning" />
            <QAPanel id="contradicting-heading" heading="Contradicting Findings" items={prep.contradictions} variant="danger" />
            <QAPanel id="methodology-heading" heading="Methodology Critiques" items={prep.methodologyCritiques} variant="warning" />
          </div>
          {prep.likelyQuestions.length > 0 ? (
            <section aria-labelledby="questions-heading" className="bg-white border-2 border-black shadow-impact p-5">
              <h2 id="questions-heading" className="font-serif text-lg font-black uppercase tracking-tight text-black mb-4 pb-2 border-b-2 border-black">
                Likely Viva Questions
              </h2>
              <ul className="space-y-4">
                {prep.likelyQuestions.map((q, i) => (
                  <li key={i} className="border-b border-black/20 pb-4 last:border-0">
                    <p className="text-[13px] font-sans font-black text-black leading-snug">Q{i + 1}. {q.question}</p>
                    <p className="text-xs font-sans text-black/70 mt-1.5 leading-relaxed">{q.answer}</p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      ) : (
        <div className="space-y-5">
          {!aiAvailable ? (
            <div className="border-2 border-black bg-accent/5 p-3">
              <p className="text-[10px] font-sans font-black uppercase tracking-widest text-black">Heuristic mode</p>
              <p className="text-xs text-black/60 font-sans mt-1">
                Add <code className="font-mono text-accent">OPENAI_API_KEY</code> to <code className="font-mono">.env</code> for a personalized, thesis-specific defence analysis instead of keyword matching.
              </p>
            </div>
          ) : null}
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
        </div>
      )}

      <section aria-labelledby="checklist-heading" className="bg-white border-2 border-black shadow-impact p-5">
        <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-black">
          <h2 id="checklist-heading" className="font-serif text-lg font-black uppercase tracking-tight text-black">
            Defence Checklist
          </h2>
          <div className="flex items-center gap-3">
            {prep?.checklist?.length ? (
              <span className="flex items-center gap-1 text-[10px] font-sans font-black uppercase tracking-widest text-accent">
                <Sparkles size={11} strokeWidth={2.5} /> Tailored
              </span>
            ) : null}
            {checklistSaved ? (
              <span className="text-[10px] font-sans font-black uppercase tracking-widest text-success">Saved</span>
            ) : null}
          </div>
        </div>
        <ul className="space-y-3">
          {checklistItems.map((item) => {
            const key = itemKey(item);
            return (
              <li key={key} className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id={`check-${key}`}
                  checked={checked[key] ?? false}
                  onChange={() => void toggleCheck(item)}
                  className="mt-0.5 h-4 w-4 appearance-none border-2 border-black bg-white checked:bg-accent cursor-pointer flex-shrink-0"
                  aria-label={item}
                />
                <label htmlFor={`check-${key}`} className="text-[12px] font-sans font-bold text-black cursor-pointer">
                  {item}
                </label>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
