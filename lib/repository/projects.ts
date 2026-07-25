import { supabaseAdmin } from '@/lib/supabase-server';
import type { ThesisProject, ThesisStage, ProjectMetadata } from '@/types/thesis';

type ProjectRow = {
  id: string;
  user_id: string;
  title: string;
  field: string | null;
  current_stage: string | null;
  metadata: ProjectMetadata | null;
  created_at: string;
};

function rowToProject(row: ProjectRow): ThesisProject {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    field: row.field ?? '',
    currentStage: (row.current_stage as ThesisStage) ?? 'research_proposal',
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
  };
}

export async function listProjects(userId: string): Promise<ThesisProject[]> {
  const { data, error } = await supabaseAdmin
    .from('thesis_projects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(`listProjects failed: ${error.message}`);
  return (data as ProjectRow[]).map(rowToProject);
}

export async function createProject(
  userId: string,
  input: { title: string; field?: string; currentStage?: ThesisStage }
): Promise<ThesisProject> {
  const { data, error } = await supabaseAdmin
    .from('thesis_projects')
    .insert({
      user_id: userId,
      title: input.title,
      field: input.field ?? null,
      current_stage: input.currentStage ?? 'research_proposal',
    })
    .select('*')
    .single();

  if (error || !data) throw new Error(`createProject failed: ${error?.message ?? 'no row'}`);
  return rowToProject(data as ProjectRow);
}

/**
 * Returns the user's projects, creating a default one on first use so the app
 * always has a real project UUID to work against (replacing the old 'proj1').
 */
export async function ensureProjects(userId: string): Promise<ThesisProject[]> {
  const existing = await listProjects(userId);
  if (existing.length > 0) return existing;
  const created = await createProject(userId, {
    title: 'My Thesis',
    field: '',
    currentStage: 'research_proposal',
  });
  return [created];
}

export async function getProject(id: string, userId: string): Promise<ThesisProject | null> {
  const { data, error } = await supabaseAdmin
    .from('thesis_projects')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw new Error(`getProject failed: ${error.message}`);
  return data ? rowToProject(data as ProjectRow) : null;
}

export async function updateProject(
  id: string,
  userId: string,
  patch: { title?: string; field?: string; currentStage?: ThesisStage; metadata?: ProjectMetadata }
): Promise<ThesisProject | null> {
  const update: Record<string, unknown> = {};
  if (patch.title !== undefined) update.title = patch.title;
  if (patch.field !== undefined) update.field = patch.field;
  if (patch.currentStage !== undefined) update.current_stage = patch.currentStage;
  if (patch.metadata !== undefined) update.metadata = patch.metadata;

  const { data, error } = await supabaseAdmin
    .from('thesis_projects')
    .update(update)
    .eq('id', id)
    .eq('user_id', userId)
    .select('*')
    .maybeSingle();

  if (error) throw new Error(`updateProject failed: ${error.message}`);
  return data ? rowToProject(data as ProjectRow) : null;
}
