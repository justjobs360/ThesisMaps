import React from 'react';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import type { Paper } from '@/types/paper';

type PaperTableProps = {
  papers: Paper[];
  loading?: boolean;
};

const SOURCE_LABELS: Record<string, string> = {
  semantic_scholar: 'S2',
  openalex: 'OA',
  arxiv: 'arXiv',
  crossref: 'CR',
  pubmed: 'PM',
  core: 'CORE',
  europe_pmc: 'EPMC',
  doaj: 'DOAJ',
};

export function PaperTable({ papers, loading }: PaperTableProps) {
  return (
    <DataTable
      data={papers}
      loading={loading}
      rowKey={(p) => p.id}
      emptyMessage="No papers found."
      columns={[
        {
          key: 'title',
          header: 'Title',
          render: (p) => (
            <p className="text-text-primary font-medium text-sm max-w-[280px] truncate" title={p.title}>{p.title}</p>
          ),
        },
        {
          key: 'authors',
          header: 'Authors',
          render: (p) => (
            <span className="text-text-muted text-xs">{p.authors.slice(0, 2).map((a) => a.name).join(', ')}</span>
          ),
        },
        { key: 'year', header: 'Year', render: (p) => <span className="text-text-muted">{p.year}</span> },
        {
          key: 'source',
          header: 'Source',
          render: (p) => <Badge variant="muted">{SOURCE_LABELS[p.source] ?? p.source}</Badge>,
        },
        {
          key: 'citationCount',
          header: 'Citations',
          render: (p) => <span className="text-text-muted">{p.citationCount.toLocaleString()}</span>,
        },
        {
          key: 'openAccess',
          header: 'OA',
          render: (p) => p.openAccess ? <Badge variant="success">Yes</Badge> : <span className="text-text-muted">—</span>,
        },
      ]}
    />
  );
}
