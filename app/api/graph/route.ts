import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/admin-guard';
import { ensureUser } from '@/lib/repository/users';
import { getProject } from '@/lib/repository/projects';
import { buildProjectGraph } from '@/lib/repository/graph';
import { redis, cacheKey, CACHE_TTL } from '@/lib/redis';
import { handleRouteError } from '@/lib/route-helpers';
import type { GraphData } from '@/types/graph';

// GET /api/graph?projectId=... — knowledge graph built from the saved library
export async function GET(request: Request) {
  try {
    const decoded = await requireUser(request);
    await ensureUser(decoded);

    const projectId = new URL(request.url).searchParams.get('projectId');
    const parsed = z.string().uuid().safeParse(projectId);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid projectId' }, { status: 400 });

    const project = await getProject(parsed.data, decoded.uid);
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const ck = cacheKey('graph', decoded.uid, parsed.data);
    try {
      const cached = await redis.get<GraphData>(ck);
      if (cached) return NextResponse.json({ ...cached, cached: true });
    } catch {
      // Redis unavailable — proceed without cache
    }

    const graph = await buildProjectGraph(decoded.uid, parsed.data);

    try {
      await redis.set(ck, graph, { ex: CACHE_TTL.graph });
    } catch {
      // Ignore cache write failures
    }

    return NextResponse.json(graph);
  } catch (err) {
    return handleRouteError(err, 'graph/GET');
  }
}
