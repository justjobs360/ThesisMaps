'use client';

import React, { useState } from 'react';
import { BookmarkPlus, Check, ExternalLink, Quote } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useProject } from '@/hooks/useProject';
import { useAnalytics } from '@/hooks/useAnalytics';
import { apiClient } from '@/lib/apiClient';
import type { Paper } from '@/types/paper';

type ResultCardProps = {
  paper: Paper;
  alreadySaved?: boolean;
  onSaved?: (paper: Paper) => void;
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

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export function ResultCard({ paper, alreadySaved = false, onSaved }: ResultCardProps) {
  const { projectId } = useProject();
  const { track } = useAnalytics();
  const [state, setState] = useState<SaveState>('idle');
  // Already in the library (from a prior session) OR just saved this session.
  const isSaved = state === 'saved' || alreadySaved;

  async function handleSave() {
    if (!projectId || state === 'saving' || isSaved) return;
    setState('saving');
    try {
      await apiClient.post('/api/papers/save', { projectId, paper });
      setState('saved');
      track('paper_saved', { paperId: paper.id, source: paper.source });
      onSaved?.(paper);
    } catch {
      setState('error');
    }
  }

  return (
    <article className="group relative bg-white border-2 border-black p-5 transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-impact">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-sans font-semibold text-black text-sm leading-snug line-clamp-2">
            {paper.url ? (
              <a href={paper.url} target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">
                {paper.title}
              </a>
            ) : (
              paper.title
            )}
          </h3>
          <p className="text-xs text-text-muted font-sans mt-1">
            {paper.authors.slice(0, 3).map((a) => a.name).join(', ')}
            {paper.authors.length > 3 ? ` +${paper.authors.length - 3} more` : ''}
          </p>
        </div>

        <Button
          size="sm"
          variant={isSaved ? 'ghost' : 'secondary'}
          onClick={handleSave}
          disabled={!projectId || state === 'saving' || isSaved}
          aria-label={isSaved ? 'Saved to project' : 'Save to project'}
        >
          {isSaved ? <Check size={14} strokeWidth={2} /> : <BookmarkPlus size={14} strokeWidth={2} />}
          {isSaved ? 'Saved' : state === 'saving' ? 'Saving' : state === 'error' ? 'Retry' : 'Save'}
        </Button>
      </div>

      {paper.abstract ? (
        <p className="mt-2 text-xs text-text-muted font-sans leading-relaxed line-clamp-3">{paper.abstract}</p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-sans font-bold text-black">{paper.year || '—'}</span>

        <span className="flex items-center gap-1 text-[11px] text-text-muted font-sans">
          <Quote size={10} strokeWidth={2} />
          {paper.citationCount.toLocaleString()}
        </span>

        {paper.openAccess ? <Badge variant="success">Open Access</Badge> : null}

        <span className="text-[10px] px-2 py-0.5 border border-black bg-white text-black font-sans font-black uppercase tracking-wider">
          {SOURCE_LABELS[paper.source] ?? paper.source}
        </span>

        {paper.fieldsOfStudy.slice(0, 2).map((field) => (
          <Badge key={field} variant="muted">
            {field}
          </Badge>
        ))}

        {paper.url ? (
          <a
            href={paper.url}
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
  );
}
