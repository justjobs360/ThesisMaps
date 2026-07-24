import { supabaseAdmin } from '@/lib/supabase-server';
import { rowToPaper } from '@/lib/repository/papers';
import type { SeedSet } from '@/types/thesis';
import type { Paper } from '@/types/paper';

type SeedSetRow = {
  id: string;
  project_id: string;
  name: string;
  paper_ids: string[] | null;
  created_at: string;
};

function rowToSeedSet(row: SeedSetRow): SeedSet {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    paperIds: row.paper_ids ?? [],
    createdAt: row.created_at,
  };
}

export async function listSeedSets(projectId: string): Promise<SeedSet[]> {
  const { data, error } = await supabaseAdmin
    .from('seed_sets')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`listSeedSets failed: ${error.message}`);
  return (data as SeedSetRow[]).map(rowToSeedSet);
}

export async function createSeedSet(
  projectId: string,
  input: { name: string; paperIds: string[] }
): Promise<SeedSet> {
  const { data, error } = await supabaseAdmin
    .from('seed_sets')
    .insert({ project_id: projectId, name: input.name, paper_ids: input.paperIds })
    .select('*')
    .single();

  if (error || !data) throw new Error(`createSeedSet failed: ${error?.message ?? 'no row'}`);
  return rowToSeedSet(data as SeedSetRow);
}

export async function updateSeedSet(
  id: string,
  projectId: string,
  patch: { name?: string; paperIds?: string[] }
): Promise<SeedSet | null> {
  const update: Record<string, unknown> = {};
  if (patch.name !== undefined) update.name = patch.name;
  if (patch.paperIds !== undefined) update.paper_ids = patch.paperIds;

  const { data, error } = await supabaseAdmin
    .from('seed_sets')
    .update(update)
    .eq('id', id)
    .eq('project_id', projectId)
    .select('*')
    .maybeSingle();

  if (error) throw new Error(`updateSeedSet failed: ${error.message}`);
  return data ? rowToSeedSet(data as SeedSetRow) : null;
}

export async function deleteSeedSet(id: string, projectId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('seed_sets')
    .delete()
    .eq('id', id)
    .eq('project_id', projectId);

  if (error) throw new Error(`deleteSeedSet failed: ${error.message}`);
}

/** Resolves a seed set's paper_ids to full Paper rows (order not guaranteed). */
export async function listSeedSetPapers(paperIds: string[]): Promise<Paper[]> {
  if (paperIds.length === 0) return [];
  const { data, error } = await supabaseAdmin.from('papers').select('*').in('id', paperIds);

  if (error) throw new Error(`listSeedSetPapers failed: ${error.message}`);
  return (data as Parameters<typeof rowToPaper>[0][]).map(rowToPaper);
}
