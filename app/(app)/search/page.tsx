'use client';

import type { Metadata } from 'next';
import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { SearchBar } from '@/components/search/SearchBar';
import { FilterPanel } from '@/components/search/FilterPanel';
import { ResultCard } from '@/components/search/ResultCard';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { X } from 'lucide-react';
import { MOCK_PAPERS } from '@/lib/mockData';
import type { SearchFilters, Paper } from '@/types/paper';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [results, setResults] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleSearch(q: string) {
    setSubmitted(q);
    setLoading(true);
    try {
      const res = await fetch(`/api/papers/search?q=${encodeURIComponent(q)}`);
      const data = (await res.json()) as { papers: Paper[] };
      setResults(data.papers ?? []);
    } catch {
      setResults(MOCK_PAPERS);
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
          ) : submitted && results.length === 0 ? (
            <div className="text-center py-24 border-2 border-black border-dashed">
              <p className="text-black/40 font-sans font-bold uppercase tracking-[0.2em] text-[10px]">No papers yielded for &quot;{submitted}&quot;</p>
              <p className="text-black/40 font-sans text-xs mt-2">Try rephrasing your research query.</p>
            </div>
          ) : results.length > 0 ? (
            <>
              <p className="text-[10px] font-sans font-black uppercase tracking-widest text-black/40">Repository Results ({results.length})</p>
              <div className="space-y-4">
                {results.map((paper) => (
                  <ResultCard key={paper.id} paper={paper} />
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
