'use client';

import React, { useState } from 'react';
import { BookmarkPlus, ExternalLink, Quote } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { Paper } from '@/types/paper';
import { motion } from 'framer-motion';

type ResultCardProps = {
  paper: Paper;
  onSave?: (paper: Paper) => void;
};

const SOURCE_COLORS: Record<string, string> = {
  semantic_scholar: 'bg-blue-50 text-blue-700 border-blue-100',
  openalex: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  arxiv: 'bg-orange-50 text-orange-700 border-orange-100',
  crossref: 'bg-teal-50 text-teal-700 border-teal-100',
  pubmed: 'bg-green-50 text-green-700 border-green-100',
  core: 'bg-purple-50 text-purple-700 border-purple-100',
  europe_pmc: 'bg-yellow-50 text-yellow-700 border-yellow-100',
  doaj: 'bg-pink-50 text-pink-700 border-pink-100',
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

export function ResultCard({ paper, onSave }: ResultCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <article
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative bg-surface border border-border rounded-md p-5 shadow-sm hover:border-text-muted transition-colors duration-150"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-sans font-medium text-text-primary text-sm leading-snug line-clamp-2">
            {paper.url ? (
              <a
                href={paper.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-accent transition-colors"
              >
                {paper.title}
              </a>
            ) : paper.title}
          </h3>

          <p className="text-xs text-text-muted font-sans mt-1">
            {paper.authors.slice(0, 3).map((a) => a.name).join(', ')}
            {paper.authors.length > 3 ? ` +${paper.authors.length - 3} more` : ''}
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: hovered ? 1 : 0, x: hovered ? 0 : 8 }}
          transition={{ duration: 0.15 }}
        >
          <Button size="sm" variant="secondary" onClick={() => onSave?.(paper)}>
            <BookmarkPlus size={14} strokeWidth={1.5} />
            Save
          </Button>
        </motion.div>
      </div>

      {paper.abstract ? (
        <p className="mt-2 text-xs text-text-muted font-sans leading-relaxed line-clamp-3">
          {paper.abstract}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-sans text-text-muted">{paper.year}</span>

        <div className="flex items-center gap-1 text-xs text-text-muted font-sans">
          <Quote size={10} strokeWidth={1.5} />
          {paper.citationCount.toLocaleString()}
        </div>

        {paper.openAccess ? (
          <Badge variant="success">Open Access</Badge>
        ) : null}

        <span className={['text-xs px-2 py-0.5 rounded border font-sans font-medium', SOURCE_COLORS[paper.source] ?? ''].join(' ')}>
          {SOURCE_LABELS[paper.source] ?? paper.source}
        </span>

        {paper.fieldsOfStudy.slice(0, 2).map((field) => (
          <Badge key={field} variant="muted">{field}</Badge>
        ))}

        {paper.url ? (
          <a
            href={paper.url}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-text-muted hover:text-accent transition-colors"
            aria-label="Open paper in new tab"
          >
            <ExternalLink size={14} strokeWidth={1.5} />
          </a>
        ) : null}
      </div>
    </article>
  );
}
