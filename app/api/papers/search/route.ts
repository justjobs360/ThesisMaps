import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { z } from 'zod';
import { requireUser } from '@/lib/admin-guard';
import { redis, cacheKey, CACHE_TTL } from '@/lib/redis';
import { searchSemanticScholar } from '@/lib/api/semanticScholar';
import { searchOpenAlex } from '@/lib/api/openAlex';
import { searchArxiv } from '@/lib/api/arxiv';
import { searchCrossRef } from '@/lib/api/crossref';
import { searchPubMed } from '@/lib/api/pubmed';
import { searchCore } from '@/lib/api/core';
import { searchEuropePmc } from '@/lib/api/europePmc';
import { searchDoaj } from '@/lib/api/doaj';
import { deduplicatePapers } from '@/lib/normalise';
import type { Paper } from '@/types/paper';

const querySchema = z.object({
  q: z.string().min(1).max(500),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

/** Page out of the full deduped result set. */
function paginate(papers: Paper[], page: number, pageSize: number) {
  const start = (page - 1) * pageSize;
  return papers.slice(start, start + pageSize);
}

export async function GET(request: Request) {
  // Authed: this route fans out to eight upstream academic APIs on our keys and
  // writes to Redis, so it must not be open to anonymous callers.
  try {
    await requireUser(request);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);

  const parsed = querySchema.safeParse({
    q: searchParams.get('q') ?? undefined,
    page: searchParams.get('page') ?? undefined,
    pageSize: searchParams.get('pageSize') ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query parameters', details: parsed.error.flatten() }, { status: 400 });
  }

  const { q, page, pageSize } = parsed.data;
  // Cache the FULL result set per query (hashed so a 500-char query doesn't
  // become a 500-char Redis key); pagination is applied on the way out, so
  // paging through results never re-hits the upstream APIs.
  const qHash = createHash('sha256').update(q.toLowerCase().trim()).digest('hex').slice(0, 32);
  const ck = cacheKey('search', qHash);

  try {
    const cached = await redis.get<Paper[]>(ck);
    if (cached) {
      return NextResponse.json({
        papers: paginate(cached, page, pageSize),
        total: cached.length,
        page,
        pageSize,
        query: q,
        cached: true,
      });
    }
  } catch {
    // Redis unavailable — proceed without cache
  }

  try {
    // Query all 8 sources in parallel; a slow/failed source never blocks the others
    // (Promise.allSettled), and results are deduped by DOI/arXiv id below.
    const [s2, oa, arxiv, cr, pubmed, core, europePmc, doaj] = await Promise.allSettled([
      searchSemanticScholar(q, 15),
      searchOpenAlex(q, 10),
      searchArxiv(q, 10),
      searchCrossRef(q, 10),
      searchPubMed(q, 10),
      searchCore(q, 10),
      searchEuropePmc(q, 10),
      searchDoaj(q, 10),
    ]);

    const sourceLabels = ['s2', 'openalex', 'arxiv', 'crossref', 'pubmed', 'core', 'europePmc', 'doaj'];
    [s2, oa, arxiv, cr, pubmed, core, europePmc, doaj].forEach((r, i) => {
      if (r.status === 'rejected') {
        console.warn(`[papers/search] source "${sourceLabels[i]}" failed:`, r.reason?.message ?? r.reason);
      }
    });

    const all: Paper[] = [
      ...(s2.status === 'fulfilled' ? s2.value : []),
      ...(oa.status === 'fulfilled' ? oa.value : []),
      ...(arxiv.status === 'fulfilled' ? arxiv.value : []),
      ...(cr.status === 'fulfilled' ? cr.value : []),
      ...(pubmed.status === 'fulfilled' ? pubmed.value : []),
      ...(core.status === 'fulfilled' ? core.value : []),
      ...(europePmc.status === 'fulfilled' ? europePmc.value : []),
      ...(doaj.status === 'fulfilled' ? doaj.value : []),
    ];

    const papers = deduplicatePapers(all);

    try {
      await redis.set(ck, papers, { ex: CACHE_TTL.search });
    } catch {
      // Ignore cache write failures
    }

    return NextResponse.json({
      papers: paginate(papers, page, pageSize),
      total: papers.length,
      page,
      pageSize,
      query: q,
    });
  } catch (err) {
    console.error('[papers/search]', err);
    return NextResponse.json({ error: 'Search failed' }, { status: 502 });
  }
}
