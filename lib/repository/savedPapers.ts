import { supabaseAdmin } from '@/lib/supabase-server';
import { upsertPaper, rowToPaper } from '@/lib/repository/papers';
import type { Paper, SavedPaper } from '@/types/paper';

type SavedRow = {
  id: string;
  user_id: string;
  project_id: string;
  paper_id: string;
  tags: string[] | null;
  notes: string | null;
  read_status: string | null;
  is_seed: boolean | null;
  created_at: string;
  papers: Parameters<typeof rowToPaper>[0] | null;
};

function rowToSavedPaper(row: SavedRow): SavedPaper {
  return {
    id: row.id,
    userId: row.user_id,
    projectId: row.project_id,
    paperId: row.paper_id,
    paper: row.papers ? rowToPaper(row.papers) : ({} as Paper),
    tags: row.tags ?? [],
    notes: row.notes ?? '',
    readStatus: (row.read_status as SavedPaper['readStatus']) ?? 'unread',
    isSeed: Boolean(row.is_seed),
    createdAt: row.created_at,
  };
}

export async function listSavedPapers(userId: string, projectId: string): Promise<SavedPaper[]> {
  const { data, error } = await supabaseAdmin
    .from('saved_papers')
    .select('*, papers(*)')
    .eq('user_id', userId)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`listSavedPapers failed: ${error.message}`);
  return (data as SavedRow[]).map(rowToSavedPaper);
}

/**
 * Indexed (stemmed, per-word) full-text search over a project's saved library —
 * matches on `papers.search_vector` (title weighted above abstract), backed by
 * the GIN index from supabase/migrations/001_papers_search_index.sql.
 */
export async function searchSavedPapers(
  userId: string,
  projectId: string,
  query: string
): Promise<SavedPaper[]> {
  const { data, error } = await supabaseAdmin
    .from('saved_papers')
    .select('*, papers!inner(*)')
    .eq('user_id', userId)
    .eq('project_id', projectId)
    .textSearch('papers.search_vector', query, { type: 'websearch', config: 'english' });

  if (error) throw new Error(`searchSavedPapers failed: ${error.message}`);
  return (data as SavedRow[]).map(rowToSavedPaper);
}

export async function savePaper(
  userId: string,
  projectId: string,
  paper: Paper,
  opts: { tags?: string[]; notes?: string; isSeed?: boolean } = {}
): Promise<SavedPaper> {
  const paperUuid = await upsertPaper(paper);

  const { data, error } = await supabaseAdmin
    .from('saved_papers')
    .upsert(
      {
        user_id: userId,
        project_id: projectId,
        paper_id: paperUuid,
        tags: opts.tags ?? [],
        notes: opts.notes ?? null,
        is_seed: opts.isSeed ?? false,
      },
      { onConflict: 'user_id,project_id,paper_id', ignoreDuplicates: false }
    )
    .select('*, papers(*)')
    .single();

  if (error || !data) throw new Error(`savePaper failed: ${error?.message ?? 'no row'}`);
  return rowToSavedPaper(data as SavedRow);
}

/** Updates a saved paper's read status / tags / notes, scoped to the owner. */
export async function updateSavedPaper(
  userId: string,
  savedId: string,
  patch: { readStatus?: 'unread' | 'reading' | 'read'; tags?: string[]; notes?: string }
): Promise<void> {
  const update: Record<string, unknown> = {};
  if (patch.readStatus !== undefined) update.read_status = patch.readStatus;
  if (patch.tags !== undefined) update.tags = patch.tags;
  if (patch.notes !== undefined) update.notes = patch.notes;

  const { error } = await supabaseAdmin
    .from('saved_papers')
    .update(update)
    .eq('id', savedId)
    .eq('user_id', userId);

  if (error) throw new Error(`updateSavedPaper failed: ${error.message}`);
}

/** Removes a saved paper by its saved_papers row id, scoped to the owner. */
export async function removeSavedPaper(userId: string, savedId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('saved_papers')
    .delete()
    .eq('id', savedId)
    .eq('user_id', userId);

  if (error) throw new Error(`removeSavedPaper failed: ${error.message}`);
}
