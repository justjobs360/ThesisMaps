import type { Metadata } from 'next';
import { PageHeader } from '@/components/layout/PageHeader';
import { ProjectTable } from '@/components/admin/ProjectTable';
import { MOCK_PROJECT } from '@/lib/mockData';

export const metadata: Metadata = { title: 'Admin — Projects', robots: { index: false } };

const MOCK_PROJECTS = [
  { ...MOCK_PROJECT, ownerEmail: 'alice@cambridge.ac.uk', paperCount: 142, collaboratorCount: 2 },
  { ...MOCK_PROJECT, id: 'proj2', title: 'AI Ethics in Healthcare', ownerEmail: 'bob@mit.edu', paperCount: 67, collaboratorCount: 1, currentStage: 'research_proposal' as const },
];

export default function AdminProjectsPage() {
  return (
    <div className="space-y-5 max-w-6xl">
      <PageHeader title="Project Browser" subtitle={`${MOCK_PROJECTS.length} projects total`} />
      <ProjectTable projects={MOCK_PROJECTS} />
    </div>
  );
}
