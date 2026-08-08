'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { SearchBar } from '@/components/search/SearchBar';
import { FilterPanel } from '@/components/search/FilterPanel';
import { ResultCard } from '@/components/search/ResultCard';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { X } from 'lucide-react';
import { useProject } from '@/hooks/useProject';
import { useAnalytics } from '@/hooks/useAnalytics';
import { apiClient, ApiError } from '@/lib/apiClient';
import type { SearchFilters, Paper, SavedPaper } from '@/types/paper';

type SearchScope = 'external' | 'library';

// Stable identity for matching a result against the saved library — the same
// keys the backend dedupes on (DOI, then arXiv id). Papers with neither can't be
// reliably matched, so they're never pre-marked (and the backend re-inserts them).
function paperKey(p: Paper): string | null {
  if (p.doi?.trim()) return `doi:${p.doi.trim().toLowerCase()}`;
  if (p.arxivId?.trim()) return `arxiv:${p.arxivId.trim().toLowerCase()}`;
  return null;
}

// Applies the FilterPanel selections to a result set, in place. Recency is a
// year cutoff; fields match case-insensitively (source taxonomies vary);
// methodology has no dedicated field, so it matches title/abstract text.
function applyFilters(papers: Paper[], filters: SearchFilters): Paper[] {
  let list = papers;

  if (filters.recency && filters.recency !== 'all') {
    const span = { last_year: 1, last_5_years: 5, last_10_years: 10 }[filters.recency];
    const cutoff = new Date().getFullYear() - span;
    list = list.filter((p) => p.year > 0 && p.year >= cutoff);
  }

  if (filters.openAccessOnly) {
    list = list.filter((p) => p.openAccess);
  }

  if (filters.fieldsOfStudy?.length) {
    const wanted = filters.fieldsOfStudy.map((f) => f.toLowerCase());
    list = list.filter((p) =>
      p.fieldsOfStudy.some((f) => {
        const fl = f.toLowerCase();
        return wanted.some((w) => fl.includes(w) || w.includes(fl));
      })
    );
  }

  if (filters.methodology?.length) {
    const terms = filters.methodology.map((m) => m.toLowerCase());
    list = list.filter((p) => {
      const hay = `${p.title} ${p.abstract ?? ''}`.toLowerCase();
      return terms.some((t) => hay.includes(t));
    });
  }

  return list;
}

export default function SearchPage() {
  const { projectId } = useProject();
  const { track } = useAnalytics();
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [scope, setScope] = useState<SearchScope>('external');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [results, setResults] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set());

  // Load which papers are already in the library so results reflect saved state
  // (and don't invite a pointless re-save). Refreshes when the project changes.
  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    apiClient
      .get<{ papers: SavedPaper[] }>(`/api/papers/save?projectId=${projectId}`)
      .then(({ papers }) => {
        if (cancelled) return;
        const keys = new Set<string>();
        for (const sp of papers) {
          const k = paperKey(sp.paper);
          if (k) keys.add(k);
        }
        setSavedKeys(keys);
      })
      .catch(() => {
        /* library unavailable — results simply won't be pre-marked as saved */
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const markSaved = useCallback((paper: Paper) => {
    const k = paperKey(paper);
    if (!k) return;
    setSavedKeys((prev) => new Set(prev).add(k));
  }, []);

  const isPaperSaved = useCallback(
    (paper: Paper) => {
      const k = paperKey(paper);
      return k ? savedKeys.has(k) : false;
    },
    [savedKeys]
  );

  const displayedResults = useMemo(() => applyFilters(results, filters), [results, filters]);

  async function handleSearch(q: string) {
    setSubmitted(q);
    setLoading(true);
    setError(null);
    track('search_run', { query: q, scope });
    try {
      if (scope === 'library') {
        if (!projectId) {
          setResults([]);
          setError('Your project is still loading — try again in a moment.');
          return;
        }
        const { papers } = await apiClient.get<{ papers: SavedPaper[] }>(
          `/api/papers/save?projectId=${projectId}&q=${encodeURIComponent(q)}`
        );
        setResults(papers.map((p) => p.paper));
        return;
      }

      // Must go through apiClient: /api/papers/search is authed (it spends our
      // upstream API keys), so a raw fetch would 401.
      const data = await apiClient.get<{ papers?: Paper[] }>(
        `/api/papers/search?q=${encodeURIComponent(q)}&pageSize=50`
      );
      setResults(data.papers ?? []);
    } catch (err) {
      setResults([]);
      setError(err instanceof ApiError ? err.message : 'Could not reach the search service. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  const [showFilters, setShowFilters] = useState(false);

  const activeFilterCount = [
    filters.recency,
    filters.openAccessOnly,
    ...(filters.fieldsOfStudy ?? []),
    ...(filters.methodology ?? []),
  ].filter(Boolean).length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader title="Search Papers" subtitle="Search across 8 academic sources simultaneously." />

      <div className="flex gap-0 border-2 border-black w-fit" role="tablist" aria-label="Search scope">
        <button
          role="tab"
          aria-selected={scope === 'external'}
          onClick={() => setScope('external')}
          className={`h-9 px-4 font-sans font-black text-[10px] uppercase tracking-widest transition-colors ${
            scope === 'external' ? 'bg-black text-white' : 'bg-white text-black hover:bg-black/5'
          }`}
        >
          External Sources
        </button>
        <button
          role="tab"
          aria-selected={scope === 'library'}
          onClick={() => setScope('library')}
          className={`h-9 px-4 font-sans font-black text-[10px] uppercase tracking-widest border-l-2 border-black transition-colors ${
            scope === 'library' ? 'bg-black text-white' : 'bg-white text-black hover:bg-black/5'
          }`}
        >
          My Library
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <SearchBar
            value={query}
            onChange={setQuery}
            onSubmit={handleSearch}
            loading={loading}
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="lg:hidden h-11 px-6 border-2 border-black font-sans font-black text-[10px] uppercase tracking-widest hover:bg-black hover:text-white transition-colors"
        >
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
      </div>

      {/* Active filter chips */}
      {activeFilterCount > 0 ? (
        <div className="flex flex-wrap gap-2" role="list" aria-label="Active filters">
          {filters.recency ? (
            <span className="flex items-center gap-2 px-3 py-1.5 border-2 border-black bg-white text-[10px] font-sans font-bold uppercase tracking-wider text-black" role="listitem">
              {filters.recency.replace(/_/g, ' ')}
              <button onClick={() => setFilters((f) => ({ ...f, recency: undefined }))} aria-label="Remove recency filter" className="text-black/40 hover:text-red-600 transition-colors">
                <X size={12} strokeWidth={3} />
              </button>
            </span>
          ) : null}
          {filters.openAccessOnly ? (
            <span className="flex items-center gap-2 px-3 py-1.5 border-2 border-black bg-white text-[10px] font-sans font-bold uppercase tracking-wider text-black" role="listitem">
              Open Access
              <button onClick={() => setFilters((f) => ({ ...f, openAccessOnly: false }))} aria-label="Remove open access filter" className="text-black/40 hover:text-red-600 transition-colors">
                <X size={12} strokeWidth={3} />
              </button>
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className={['w-full lg:w-auto', showFilters ? 'block' : 'hidden lg:block'].join(' ')}>
          <FilterPanel filters={filters} onChange={setFilters} />
        </div>

        <div className="flex-1 w-full space-y-4">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
          ) : error ? (
            <div className="text-center py-24 border-2 border-black border-dashed">
              <p className="text-red-600 font-sans font-bold uppercase tracking-[0.2em] text-[10px]">Search failed</p>
              <p className="text-black/40 font-sans text-xs mt-2">{error}</p>
            </div>
          ) : submitted && results.length === 0 ? (
            <div className="text-center py-24 border-2 border-black border-dashed">
              <p className="text-black/40 font-sans font-bold uppercase tracking-[0.2em] text-[10px]">No papers yielded for &quot;{submitted}&quot;</p>
              <p className="text-black/40 font-sans text-xs mt-2">Try rephrasing your research query.</p>
            </div>
          ) : results.length > 0 && displayedResults.length === 0 ? (
            <div className="text-center py-24 border-2 border-black border-dashed">
              <p className="text-black/40 font-sans font-bold uppercase tracking-[0.2em] text-[10px]">No papers match your filters</p>
              <p className="text-black/40 font-sans text-xs mt-2">{results.length} result{results.length === 1 ? '' : 's'} hidden — loosen the filters on the left.</p>
            </div>
          ) : displayedResults.length > 0 ? (
            <>
              <p className="text-[10px] font-sans font-black uppercase tracking-widest text-black/40">
                Repository Results ({displayedResults.length}{displayedResults.length !== results.length ? ` of ${results.length}` : ''})
              </p>
              <div className="space-y-4">
                {displayedResults.map((paper) => (
                  <ResultCard
                    key={paper.id}
                    paper={paper}
                    alreadySaved={isPaperSaved(paper)}
                    onSaved={markSaved}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-24 border-2 border-black border-dashed">
              <p className="text-black/40 font-sans font-bold uppercase tracking-[0.2em] text-[10px]">Query Input Station Pending</p>
              <p className="text-black/40 font-sans text-xs mt-2">Enter keywords to begin visual mapping.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
