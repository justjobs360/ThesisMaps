import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/admin-guard';
import { redis, cacheKey, CACHE_TTL } from '@/lib/redis';
import { getPaperById } from '@/lib/api/semanticScholar';
import type { Paper } from '@/types/paper';

const idSchema = z.string().min(1).max(200);

export async function GET(request: Request, { params }: { params: { id: string } }) {
  // Authed: proxies Semantic Scholar on our API key.
  try {
    await requireUser(request);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = idSchema.safeParse(params.id);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid paper ID' }, { status: 400 });
  }
  const id = parsed.data;

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
