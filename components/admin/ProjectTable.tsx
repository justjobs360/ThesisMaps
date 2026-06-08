'use client';
import React from 'react';
import { format } from 'date-fns';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import type { ThesisProject } from '@/types/thesis';

type ProjectRow = ThesisProject & { ownerEmail?: string; paperCount?: number; collaboratorCount?: number };

type ProjectTableProps = {
  projects: ProjectRow[];
  loading?: boolean;
};

const STAGE_LABELS: Record<string, string> = {
  research_proposal: 'Proposal',
  literature_review: 'Lit Review',
  methodology: 'Methodology',
  data_collection: 'Data',
  analysis: 'Analysis',
  writing: 'Writing',
  defence: 'Defence',
};

export function ProjectTable({ projects, loading }: ProjectTableProps) {
  return (
    <DataTable
      data={projects}
      loading={loading}
      rowKey={(p) => p.id}
      emptyMessage="No projects found."
      columns={[
        {
          key: 'title',
          header: 'Title',
          render: (p) => (
            <div>
              <p className="font-medium text-text-primary truncate max-w-[240px]">{p.title}</p>
              <p className="text-xs text-text-muted">{p.field}</p>
            </div>
          ),
        },
        { key: 'ownerEmail', header: 'Owner', render: (p) => <span className="text-text-muted">{p.ownerEmail ?? '—'}</span> },
        {
          key: 'currentStage',
          header: 'Stage',
          render: (p) => <Badge variant="muted">{STAGE_LABELS[p.currentStage] ?? p.currentStage}</Badge>,
        },
        { key: 'paperCount', header: 'Papers', render: (p) => <span className="text-text-muted">{p.paperCount ?? 0}</span> },
        { key: 'collaboratorCount', header: 'Collaborators', render: (p) => <span className="text-text-muted">{p.collaboratorCount ?? 0}</span> },
        {
          key: 'createdAt',
          header: 'Created',
          render: (p) => <span className="text-text-muted">{format(new Date(p.createdAt), 'MMM d, yyyy')}</span>,
        },
      ]}
    />
  );
}
