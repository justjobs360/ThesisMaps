import { NextResponse } from 'next/server';
import { z } from 'zod';
import { redis, cacheKey, CACHE_TTL } from '@/lib/redis';
import { searchSemanticScholar } from '@/lib/api/semanticScholar';
import { searchOpenAlex } from '@/lib/api/openAlex';
import { searchArxiv } from '@/lib/api/arxiv';
import { searchCrossRef } from '@/lib/api/crossref';
import { deduplicatePapers } from '@/lib/normalise';
import type { Paper } from '@/types/paper';

const querySchema = z.object({
  q: z.string().min(1).max(500),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const parsed = querySchema.safeParse({
    q: searchParams.get('q'),
    page: searchParams.get('page'),
    pageSize: searchParams.get('pageSize'),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query parameters', details: parsed.error.flatten() }, { status: 400 });
  }

  const { q, page, pageSize } = parsed.data;
  const ck = cacheKey('search', q, String(page));

  try {
    const cached = await redis.get<Paper[]>(ck);
    if (cached) {
      return NextResponse.json({ papers: cached, total: cached.length, query: q, cached: true });
    }
  } catch {
    // Redis unavailable — proceed without cache
  }

  try {
    const [s2, oa, arxiv, cr] = await Promise.allSettled([
      searchSemanticScholar(q, 15),
      searchOpenAlex(q, 10),
      searchArxiv(q, 10),
      searchCrossRef(q, 10),
    ]);

    const all: Paper[] = [
      ...(s2.status === 'fulfilled' ? s2.value : []),
      ...(oa.status === 'fulfilled' ? oa.value : []),
      ...(arxiv.status === 'fulfilled' ? arxiv.value : []),
      ...(cr.status === 'fulfilled' ? cr.value : []),
    ];

    const papers = deduplicatePapers(all);

    try {
      await redis.set(ck, papers, { ex: CACHE_TTL.search });
    } catch {
      // Ignore cache write failures
    }

    return NextResponse.json({ papers, total: papers.length, query: q });
  } catch (err) {
    console.error('[papers/search]', err);
    return NextResponse.json({ error: 'Search failed' }, { status: 502 });
  }
}
