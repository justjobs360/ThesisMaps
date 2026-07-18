import { supabaseAdmin } from '@/lib/supabase-server';
import { rowToPaper } from '@/lib/repository/papers';
import { computeCoverage } from '@/lib/coverage';
import type { OutlineSection } from '@/types/thesis';
import type { Paper } from '@/types/paper';

type SectionRow = {
  id: string;
  project_id: string;
  title: string;
  order_index: number | null;
  parent_id: string | null;
  created_at: string;
};

function rowToSection(row: SectionRow, extras: { paperCount: number; coverageScore: number }): OutlineSection {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    orderIndex: row.order_index ?? 0,
    parentId: row.parent_id,
    paperCount: extras.paperCount,
    coverageScore: extras.coverageScore,
    createdAt: row.created_at,
  };
}

/**
 * Lists a project's outline sections with live paper counts and coverage
 * scores. Fetches all section↔paper links for the project in one round-trip,
 * groups them, and derives coverage per section via computeCoverage.
 */
export async function listSections(projectId: string): Promise<OutlineSection[]> {
  const { data: sectionData, error: sectionErr } = await supabaseAdmin
    .from('outline_sections')
    .select('*')
    .eq('project_id', projectId)
    .order('order_index', { ascending: true });

  if (sectionErr) throw new Error(`listSections failed: ${sectionErr.message}`);
  const sections = sectionData as SectionRow[];
  if (sections.length === 0) return [];

  const sectionIds = sections.map((s) => s.id);
  const { data: linkData, error: linkErr } = await supabaseAdmin
    .from('section_papers')
    .select('section_id, papers(year, citation_count)')
    .in('section_id', sectionIds);

  if (linkErr) throw new Error(`listSections links failed: ${linkErr.message}`);

  const bySection = new Map<string, { year: number; citationCount: number }[]>();
  for (const link of (linkData as unknown as { section_id: string; papers: { year: number | null; citation_count: number | null } | null }[])) {
    if (!link.papers) continue;
    const arr = bySection.get(link.section_id) ?? [];
    arr.push({ year: link.papers.year ?? 0, citationCount: link.papers.citation_count ?? 0 });
    bySection.set(link.section_id, arr);
  }

  return sections.map((s) => {
    const papers = bySection.get(s.id) ?? [];
    return rowToSection(s, { paperCount: papers.length, coverageScore: computeCoverage(papers) });
  });
}

export async function createSection(
  projectId: string,
  input: { title: string; parentId?: string | null; orderIndex?: number }
): Promise<OutlineSection> {
  const { data, error } = await supabaseAdmin
    .from('outline_sections')
    .insert({
      project_id: projectId,
      title: input.title,
      parent_id: input.parentId ?? null,
      order_index: input.orderIndex ?? 0,
    })
    .select('*')
    .single();

  if (error || !data) throw new Error(`createSection failed: ${error?.message ?? 'no row'}`);
  return rowToSection(data as SectionRow, { paperCount: 0, coverageScore: 0 });
}

export async function updateSection(
  id: string,
  patch: { title?: string; orderIndex?: number; parentId?: string | null }
): Promise<void> {
  const update: Record<string, unknown> = {};
  if (patch.title !== undefined) update.title = patch.title;
  if (patch.orderIndex !== undefined) update.order_index = patch.orderIndex;
  if (patch.parentId !== undefined) update.parent_id = patch.parentId;

  const { error } = await supabaseAdmin.from('outline_sections').update(update).eq('id', id);
  if (error) throw new Error(`updateSection failed: ${error.message}`);
}

/** Persists a new ordering in one pass (id → order_index). */
export async function reorderSections(order: { id: string; orderIndex: number }[]): Promise<void> {
  await Promise.all(
    order.map(({ id, orderIndex }) =>
      supabaseAdmin.from('outline_sections').update({ order_index: orderIndex }).eq('id', id)
    )
  );
}

export async function deleteSection(id: string): Promise<void> {
  const { error } = await supabaseAdmin.from('outline_sections').delete().eq('id', id);
  if (error) throw new Error(`deleteSection failed: ${error.message}`);
}

export async function sectionBelongsToProject(sectionId: string, projectId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('outline_sections')
    .select('id')
    .eq('id', sectionId)
    .eq('project_id', projectId)
    .maybeSingle();
  if (error) throw new Error(`sectionBelongsToProject failed: ${error.message}`);
  return Boolean(data);
}

export async function listSectionPapers(sectionId: string): Promise<Paper[]> {
  const { data, error } = await supabaseAdmin
    .from('section_papers')
    .select('papers(*)')
    .eq('section_id', sectionId);

  if (error) throw new Error(`listSectionPapers failed: ${error.message}`);
  return (data as unknown as { papers: Parameters<typeof rowToPaper>[0] | null }[])
    .filter((r) => r.papers)
    .map((r) => rowToPaper(r.papers!));
}

export async function addSectionPaper(sectionId: string, paperId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('section_papers')
    .upsert({ section_id: sectionId, paper_id: paperId }, { onConflict: 'section_id,paper_id', ignoreDuplicates: true });
  if (error) throw new Error(`addSectionPaper failed: ${error.message}`);
}

export async function removeSectionPaper(sectionId: string, paperId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('section_papers')
    .delete()
    .eq('section_id', sectionId)
    .eq('paper_id', paperId);
  if (error) throw new Error(`removeSectionPaper failed: ${error.message}`);
}
