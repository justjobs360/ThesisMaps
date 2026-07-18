import { supabaseAdmin } from '@/lib/supabase-server';
import type { Paper, PaperSource } from '@/types/paper';

/**
 * Persistence for the shared `papers` catalogue. External APIs give us papers
 * keyed by string ids (S2 paperId, arXiv id, DOI); `saved_papers.paper_id` is a
 * UUID FK into `papers`. So we upsert into `papers` (dedup on DOI, then arXiv)
 * and return the row UUID that the join tables reference.
 */

type PaperRow = {
  id: string;
  doi: string | null;
  arxiv_id: string | null;
  title: string;
  abstract: string | null;
  authors: unknown;
  year: number | null;
  citation_count: number | null;
  reference_count: number | null;
  open_access: boolean | null;
  fields_of_study: string[] | null;
  source: string | null;
  url: string | null;
};

export function rowToPaper(row: PaperRow): Paper {
  return {
    id: row.id,
    doi: row.doi ?? undefined,
    arxivId: row.arxiv_id ?? undefined,
    title: row.title,
    abstract: row.abstract ?? undefined,
    authors: Array.isArray(row.authors) ? (row.authors as Paper['authors']) : [],
    year: row.year ?? 0,
    citationCount: row.citation_count ?? 0,
    referenceCount: row.reference_count ?? 0,
    openAccess: Boolean(row.open_access),
    fieldsOfStudy: row.fields_of_study ?? [],
    source: (row.source as PaperSource) ?? 'semantic_scholar',
    url: row.url ?? undefined,
  };
}

/**
 * Upserts a normalised Paper into `papers` and returns the row UUID.
 * Dedups on DOI when present, else arXiv id, else falls back to inserting a new
 * row (external-only papers with neither identifier still get saved).
 */
export async function upsertPaper(paper: Paper): Promise<string> {
  const doi = paper.doi?.trim() || null;
  const arxivId = paper.arxivId?.trim() || null;

  // Reuse an existing row when we can match on a stable identifier.
  if (doi) {
    const { data } = await supabaseAdmin.from('papers').select('id').eq('doi', doi).maybeSingle();
    if (data?.id) return data.id as string;
  } else if (arxivId) {
    const { data } = await supabaseAdmin.from('papers').select('id').eq('arxiv_id', arxivId).maybeSingle();
    if (data?.id) return data.id as string;
  }

  const { data, error } = await supabaseAdmin
    .from('papers')
    .insert({
      doi,
      arxiv_id: arxivId,
      title: paper.title,
      abstract: paper.abstract ?? null,
      authors: paper.authors,
      year: paper.year || null,
      citation_count: paper.citationCount ?? 0,
      reference_count: paper.referenceCount ?? 0,
      open_access: paper.openAccess ?? false,
      fields_of_study: paper.fieldsOfStudy ?? [],
      source: paper.source,
      url: paper.url ?? null,
    })
    .select('id')
    .single();

  if (error || !data) throw new Error(`upsertPaper failed: ${error?.message ?? 'no row returned'}`);
  return data.id as string;
}
