import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/admin-guard';
import { ensureUser } from '@/lib/repository/users';
import { getProject } from '@/lib/repository/projects';
import { findSimilarPapers, backfillEmbeddings } from '@/lib/embeddings';
import { hasOpenAI } from '@/lib/openai';
import { handleRouteError } from '@/lib/route-helpers';

const bodySchema = z.object({
  projectId: z.string().uuid(),
  paperId: z.string().uuid(),
});

// POST /api/papers/similar — nearest neighbours of a paper by embedding cosine
// similarity. Powers "Find similar papers" in the graph node detail panel.
export async function POST(request: Request) {
  try {
    const decoded = await requireUser(request);
    await ensureUser(decoded);
    const body = bodySchema.parse(await request.json());

    const project = await getProject(body.projectId, decoded.uid);
    if (!project) throw new Error('Forbidden: project not found for user');

    if (!hasOpenAI()) {
      return NextResponse.json({ aiAvailable: false, papers: [] });
    }

    const papers = await findSimilarPapers(body.paperId, 8);
    return NextResponse.json({ aiAvailable: true, papers });
  } catch (err) {
    return handleRouteError(err, 'papers/similar/POST');
  }
}

const backfillSchema = z.object({ limit: z.number().int().min(1).max(100).optional() });

// PUT /api/papers/similar — backfills embeddings for papers saved before the
// feature existed. Batched; call repeatedly until `remaining` reaches 0.
export async function PUT(request: Request) {
  try {
    const decoded = await requireUser(request);
    await ensureUser(decoded);
    const body = backfillSchema.parse(await request.json().catch(() => ({})));

    if (!hasOpenAI()) {
      return NextResponse.json({ aiAvailable: false, embedded: 0, remaining: 0 });
    }

    const result = await backfillEmbeddings(body.limit ?? 50);
    return NextResponse.json({ aiAvailable: true, ...result });
  } catch (err) {
    return handleRouteError(err, 'papers/similar/PUT');
  }
}
