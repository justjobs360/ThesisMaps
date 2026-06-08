import { NextResponse } from 'next/server';
import { redis, cacheKey, CACHE_TTL } from '@/lib/redis';
import { getPaperById } from '@/lib/api/semanticScholar';
import type { Paper } from '@/types/paper';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  if (!id || id.length > 200) {
    return NextResponse.json({ error: 'Invalid paper ID' }, { status: 400 });
  }

  const ck = cacheKey('paper', id);

  try {
    const cached = await redis.get<Paper>(ck);
    if (cached) return NextResponse.json(cached);
  } catch {}

  try {
    const paper = await getPaperById(id);
    if (!paper) return NextResponse.json({ error: 'Paper not found' }, { status: 404 });

    try {
      await redis.set(ck, paper, { ex: CACHE_TTL.metadata });
    } catch {}

    return NextResponse.json(paper);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch paper' }, { status: 502 });
  }
}
