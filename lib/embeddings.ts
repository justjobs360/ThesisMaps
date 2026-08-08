import { supabaseAdmin } from '@/lib/supabase-server';
import { embed, hasOpenAI } from '@/lib/openai';
import type { Paper } from '@/types/paper';

/**
 * Populates and queries `papers.embedding` (vector(768)) so the app has real
 * semantic similarity instead of field-of-study overlap. Every function here is
 * best-effort: with no OpenAI key configured the app must keep working on its
 * existing heuristics, so failures are swallowed rather than propagated.
 */

/** Text we embed for a paper. Abstract is capped to bound token cost. */
function embeddingText(paper: Pick<Paper, 'title' | 'abstract'>): string {
  const abstract = (paper.abstract ?? '').slice(0, 1500);
  return abstract ? `${paper.title}\n\n${abstract}` : paper.title;
}

/**
 * Embeds a single stored paper and writes the vector back.
 * Call fire-and-forget from the save path — never await it on a user action.
 */
export async function embedPaperById(paperUuid: string, paper: Pick<Paper, 'title' | 'abstract'>): Promise<void> {
  if (!hasOpenAI()) return;
  try {
    const [vector] = await embed([embeddingText(paper)]);
    if (!vector) return;
    await supabaseAdmin.from('papers').update({ embedding: vector }).eq('id', paperUuid);
  } catch (err) {
    console.warn('[embeddings] embedPaperById failed:', err instanceof Error ? err.message : err);
  }
}

/**
 * Backfills embeddings for stored papers that don't have one yet.
 * Batched (one API call per batch) and capped so a large library can't run away
 * with tokens in a single request; call repeatedly until `remaining` is 0.
 */
export async function backfillEmbeddings(limit = 50): Promise<{ embedded: number; remaining: number }> {
  if (!hasOpenAI()) return { embedded: 0, remaining: 0 };

  const { data, error } = await supabaseAdmin
    .from('papers')
    .select('id, title, abstract')
    .is('embedding', null)
    .limit(limit);

  if (error || !data || data.length === 0) return { embedded: 0, remaining: 0 };

  const rows = data as { id: string; title: string; abstract: string | null }[];
  const vectors = await embed(rows.map((r) => embeddingText({ title: r.title, abstract: r.abstract ?? undefined })));

  let embedded = 0;
  for (let i = 0; i < rows.length; i++) {
    const vector = vectors[i];
    const row = rows[i];
    if (!vector || !row) continue;
    const { error: updateError } = await supabaseAdmin
      .from('papers')
      .update({ embedding: vector })
      .eq('id', row.id);
    if (!updateError) embedded++;
  }

  const { count } = await supabaseAdmin
    .from('papers')
    .select('id', { count: 'exact', head: true })
    .is('embedding', null);

  return { embedded, remaining: count ?? 0 };
}

export type SimilarPaper = { id: string; title: string; year: number | null; similarity: number };

/**
 * Nearest neighbours of a stored paper by cosine distance.
 * Uses the match_papers() SQL function (supabase-js can't express pgvector's
 * `<=>` operator directly) — see supabase/migrations/003_semantic_search.sql.
 */
export async function findSimilarPapers(paperUuid: string, matchCount = 8): Promise<SimilarPaper[]> {
  const { data, error } = await supabaseAdmin.rpc('match_papers_by_id', {
    source_id: paperUuid,
    match_count: matchCount,
  });

  if (error || !data) return [];
  return (data as { id: string; title: string; year: number | null; similarity: number }[]).map((r) => ({
    id: r.id,
    title: r.title,
    year: r.year,
    similarity: Number(r.similarity),
  }));
}

/**
 * Pairwise cosine similarity among a specific set of stored papers, used to draw
 * semantic edges on the knowledge graph. Returns only pairs above `threshold`.
 */
export async function similarityPairs(
  paperUuids: string[],
  threshold = 0.62
): Promise<{ a: string; b: string; similarity: number }[]> {
  if (paperUuids.length < 2) return [];

  const { data, error } = await supabaseAdmin.rpc('match_papers_pairs', {
    paper_ids: paperUuids,
    min_similarity: threshold,
  });

  if (error || !data) return [];
  return (data as { a: string; b: string; similarity: number }[]).map((r) => ({
    a: r.a,
    b: r.b,
    similarity: Number(r.similarity),
  }));
}
