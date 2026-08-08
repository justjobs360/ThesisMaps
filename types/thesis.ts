export type ThesisStage =
  | 'research_proposal'
  | 'literature_review'
  | 'methodology'
  | 'data_collection'
  | 'analysis'
  | 'writing'
  | 'defence';

export const THESIS_STAGES: { id: ThesisStage; label: string }[] = [
  { id: 'research_proposal', label: 'Proposal' },
  { id: 'literature_review', label: 'Lit Review' },
  { id: 'methodology', label: 'Methodology' },
  { id: 'data_collection', label: 'Data' },
  { id: 'analysis', label: 'Analysis' },
  { id: 'writing', label: 'Writing' },
  { id: 'defence', label: 'Defence' },
];

// Free-form per-project state that doesn't warrant its own table (e.g. the
// defence checklist). Persisted as a JSONB column on thesis_projects.
export type ProjectMetadata = {
  /**
   * Defence checklist ticks keyed by a slug of the item text. The legacy
   * `boolean[]` shape (positional, from when the checklist was hard-coded) is
   * still read for backwards compatibility — see app/(app)/defence/page.tsx.
   */
  defenceChecklist?: Record<string, boolean> | boolean[];
  [key: string]: unknown;
};

export type ThesisProject = {
  id: string;
  userId: string;
  title: string;
  field: string;
  currentStage: ThesisStage;
  metadata: ProjectMetadata;
  createdAt: string;
};

export type OutlineSection = {
  id: string;
  projectId: string;
  title: string;
  orderIndex: number;
  parentId: string | null;
  paperCount?: number;
  coverageScore?: number;
  createdAt: string;
};

export type SectionPaper = {
  id: string;
  sectionId: string;
  paperId: string;
  notes?: string;
};

export type SeedSet = {
  id: string;
  projectId: string;
  name: string;
  paperIds: string[];
  createdAt: string;
};

export type Collaboration = {
  id: string;
  projectId: string;
  userId: string;
  role: 'editor' | 'viewer';
};

export type Comment = {
  id: string;
  paperId: string;
  userId: string;
  projectId: string;
  content: string;
  createdAt: string;
  user?: {
    name: string;
    avatarUrl?: string;
  };
};

export type ResearchGap = {
  id: string;
  clusterName: string;
  keywords: string[];
  gapScore: number;
  paperCount: number;
  isHighGap: boolean;
};

export type FlaggedPaper = {
  paperId: string;
  title: string;
  year: number;
  snippet: string;
};
