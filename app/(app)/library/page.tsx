'use client';

import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ExternalLink, Quote, Trash2, Sparkles } from 'lucide-react';
import { AiResultModal, AiList } from '@/components/ai/AiResultModal';
import { useProject } from '@/hooks/useProject';
import { apiClient, ApiError } from '@/lib/apiClient';
import type { SavedPaper } from '@/types/paper';

type PaperInsight = {
  summary: string;
  relevance: string;
  limitations: string[];
  suggestedSection: string;
};

const SOURCE_LABELS: Record<string, string> = {
  semantic_scholar: 'Semantic Scholar',
  openalex: 'OpenAlex',
  arxiv: 'arXiv',
  crossref: 'CrossRef',
  pubmed: 'PubMed',
  core: 'CORE',
  europe_pmc: 'Europe PMC',
  doaj: 'DOAJ',
};

const READ_CYCLE: Record<SavedPaper['readStatus'], SavedPaper['readStatus']> = {
  unread: 'reading',
  reading: 'read',
  read: 'unread',
};

const READ_VARIANT: Record<SavedPaper['readStatus'], 'muted' | 'warning' | 'success'> = {
  unread: 'muted',
  reading: 'warning',
  read: 'success',
};

export default function LibraryPage() {
  const { projectId } = useProject();
  const [saved, setSaved] = useState<SavedPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    apiClient
      .get<{ papers: SavedPaper[] }>(`/api/papers/save?projectId=${projectId}`)
      .then(({ papers }) => setSaved(papers))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load library'))
      .finally(() => setLoading(false));
  }, [projectId]);

  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return saved;
    return saved.filter(
      (s) =>
        s.paper.title.toLowerCase().includes(q) ||
        s.paper.authors.some((a) => a.name.toLowerCase().includes(q))
    );
  }, [saved, filter]);

  async function cycleRead(sp: SavedPaper) {
    const next = READ_CYCLE[sp.readStatus];
    setSaved((prev) => prev.map((p) => (p.id === sp.id ? { ...p, readStatus: next } : p)));
    try {
      await apiClient.patch('/api/papers/save', { savedId: sp.id, readStatus: next });
    } catch {
      setSaved((prev) => prev.map((p) => (p.id === sp.id ? { ...p, readStatus: sp.readStatus } : p)));
    }
  }

  async function remove(sp: SavedPaper) {
    const prev = saved;
    setSaved((cur) => cur.filter((p) => p.id !== sp.id));
    try {
      await apiClient.del('/api/papers/save', { savedId: sp.id });
    } catch {
      setSaved(prev); // restore on failure
    }
  }

  // --- AI paper insight ---
  const [insightFor, setInsightFor] = useState<SavedPaper | null>(null);
  const [insight, setInsight] = useState<PaperInsight | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightError, setInsightError] = useState<string | null>(null);
  const [insightAiAvailable, setInsightAiAvailable] = useState(true);

  async function analyse(sp: SavedPaper) {
    if (!projectId) return;
    setInsightFor(sp);
    setInsight(null);
    setInsightError(null);
    setInsightLoading(true);
    try {
      const res = await apiClient.post<{ aiAvailable: boolean; insight: PaperInsight | null }>(
        '/api/papers/insight',
        { projectId, paperId: sp.paper.id }
      );
      setInsightAiAvailable(res.aiAvailable);
      setInsight(res.insight);
    } catch (err) {
      setInsightError(err instanceof ApiError ? err.message : 'Could not analyse this paper.');
    } finally {
      setInsightLoading(false);
    }
  }

  const counts = useMemo(() => {
    const c = { unread: 0, reading: 0, read: 0 };
    for (const s of saved) c[s.readStatus]++;
    return c;
  }, [saved]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="My Library"
        subtitle="Every paper you've saved. Track reading progress, open sources, or remove papers."
      />

      {!loading && !error && saved.length > 0 ? (
        <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <div className="flex gap-3 text-[10px] font-sans font-black uppercase tracking-widest">
            <span className="px-3 py-1.5 border-2 border-black bg-black text-white">{saved.length} Saved</span>
            <span className="px-3 py-1.5 border-2 border-black text-black">{counts.unread} Unread</span>
            <span className="px-3 py-1.5 border-2 border-black text-black">{counts.reading} Reading</span>
            <span className="px-3 py-1.5 border-2 border-black text-black">{counts.read} Read</span>
          </div>
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by title or author…"
            className="h-10 px-4 border-2 border-black font-sans text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent md:w-72"
            aria-label="Filter library"
          />
        </div>
      ) : null}

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : error ? (
        <div className="bg-white border-2 border-black shadow-impact p-6">
          <p className="text-[10px] text-red-600 font-black uppercase tracking-widest">Failed to load library</p>
          <p className="text-xs text-black/40 font-sans mt-1">{error}</p>
        </div>
      ) : saved.length === 0 ? (
        <div className="text-center py-24 border-2 border-black border-dashed bg-white">
          <p className="text-black/40 font-sans font-bold uppercase tracking-[0.2em] text-[10px]">Your library is empty</p>
          <p className="text-black/40 font-sans text-xs mt-2">
            Go to <a href="/search" className="text-accent font-bold underline">Search</a> and hit “Save” on any result — it will appear here.
          </p>
        </div>
      ) : visible.length === 0 ? (
        <div className="text-center py-24 border-2 border-black border-dashed bg-white">
          <p className="text-black/40 font-sans font-bold uppercase tracking-[0.2em] text-[10px]">No papers match “{filter}”</p>
        </div>
      ) : (
        <div className="space-y-4">
          {visible.map((sp) => (
            <article key={sp.id} className="group bg-white border-2 border-black p-5 transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-impact">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-sans font-semibold text-black text-sm leading-snug">
                    {sp.paper.url ? (
                      <a href={sp.paper.url} target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">
                        {sp.paper.title}
                      </a>
                    ) : (
                      sp.paper.title
                    )}
                  </h3>
                  <p className="text-xs text-text-muted font-sans mt-1">
                    {sp.paper.authors.slice(0, 3).map((a) => a.name).join(', ')}
                    {sp.paper.authors.length > 3 ? ` +${sp.paper.authors.length - 3} more` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => void cycleRead(sp)}
                    aria-label={`Mark as ${READ_CYCLE[sp.readStatus]}`}
                    title="Click to change reading status"
                  >
                    <Badge variant={READ_VARIANT[sp.readStatus]}>{sp.readStatus}</Badge>
                  </button>
                  <button
                    onClick={() => void analyse(sp)}
                    aria-label="Analyse how this paper fits your thesis"
                    title="How does this fit my thesis?"
                    className="flex items-center gap-1 h-7 px-2 border-2 border-black text-black text-[10px] font-sans font-black uppercase tracking-widest hover:bg-accent hover:text-white hover:border-accent transition-colors"
                  >
                    <Sparkles size={12} strokeWidth={2.5} /> Analyse
                  </button>
                  <button
                    onClick={() => void remove(sp)}
                    aria-label="Remove from library"
                    className="p-1.5 border-2 border-black text-black hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors"
                  >
                    <Trash2 size={14} strokeWidth={2} />
                  </button>
                </div>
              </div>

              {sp.paper.abstract ? (
                <p className="mt-2 text-xs text-text-muted font-sans leading-relaxed line-clamp-2">{sp.paper.abstract}</p>
              ) : null}

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-sans font-bold text-black">{sp.paper.year || '—'}</span>
                <span className="flex items-center gap-1 text-[11px] text-text-muted font-sans">
                  <Quote size={10} strokeWidth={2} />
                  {sp.paper.citationCount.toLocaleString()}
                </span>
                {sp.paper.openAccess ? <Badge variant="success">Open Access</Badge> : null}
                <span className="text-[10px] px-2 py-0.5 border border-black bg-white text-black font-sans font-black uppercase tracking-wider">
                  {SOURCE_LABELS[sp.paper.source] ?? sp.paper.source}
                </span>
                {sp.paper.url ? (
                  <a
                    href={sp.paper.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto text-text-muted hover:text-accent transition-colors"
                    aria-label="Open paper in new tab"
                  >
                    <ExternalLink size={14} strokeWidth={2} />
                  </a>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}

      {/* AI insight for a single paper */}
      <AiResultModal
        open={insightFor !== null}
        onClose={() => setInsightFor(null)}
        title="Paper Insight"
        description={insightFor?.paper.title}
        loading={insightLoading}
        error={insightError}
        aiAvailable={insightAiAvailable}
        loadingLabel="Analysing against your thesis…"
      >
        {insight ? (
          <>
            <div>
              <h4 className="text-[10px] font-sans font-black uppercase tracking-[0.2em] text-black/50 mb-2">Summary</h4>
              <p className="text-sm font-sans text-black leading-relaxed">{insight.summary}</p>
            </div>
            <div>
              <h4 className="text-[10px] font-sans font-black uppercase tracking-[0.2em] text-black/50 mb-2">
                Relevance To Your Thesis
              </h4>
              <p className="text-sm font-sans text-black leading-relaxed">{insight.relevance}</p>
            </div>
            <AiList heading="Cite With Caution" items={insight.limitations} />
            {insight.suggestedSection ? (
              <div className="border-2 border-black bg-accent/5 p-3">
                <p className="text-[10px] font-sans font-black uppercase tracking-widest text-black/50">
                  Suggested placement
                </p>
                <p className="text-sm font-sans font-bold text-black mt-1">{insight.suggestedSection}</p>
              </div>
            ) : null}
          </>
        ) : null}
      </AiResultModal>
    </div>
  );
}
