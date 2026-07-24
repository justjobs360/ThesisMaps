import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/admin-guard';
import { ensureUser } from '@/lib/repository/users';
import { getProject } from '@/lib/repository/projects';
import { listSavedPapers } from '@/lib/repository/savedPapers';
import { analyseGaps } from '@/lib/gapAnalysis';
import { handleRouteError } from '@/lib/route-helpers';

const querySchema = z.object({
  projectId: z.string().uuid(),
});

// GET /api/gaps?projectId=... — gap analysis over the project's saved library.
// Proxies to the ML service when ML_SERVICE_URL is set; otherwise runs the
// built-in heuristic clustering (lib/gapAnalysis.ts) over real library data.
export async function GET(request: Request) {
  try {
    const decoded = await requireUser(request);
    await ensureUser(decoded);

    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({ projectId: searchParams.get('projectId') });
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    const project = await getProject(parsed.data.projectId, decoded.uid);
    if (!project) throw new Error('Forbidden: project not found for user');

    const mlUrl = process.env.ML_SERVICE_URL;
    if (mlUrl) {
      try {
        const res = await fetch(`${mlUrl}/gaps?projectId=${parsed.data.projectId}`, {
          signal: AbortSignal.timeout(30_000),
        });
        if (res.ok) {
          const data = await res.json();
          return NextResponse.json(data);
        }
      } catch {
        // fall through to the built-in analysis
      }
    }

    const saved = await listSavedPapers(decoded.uid, parsed.data.projectId);
    const { gaps, flaggedPapers } = analyseGaps(saved.map((s) => s.paper));
    return NextResponse.json({ gaps, flaggedPapers, librarySize: saved.length });
  } catch (err) {
    return handleRouteError(err, 'gaps/GET');
  }
}
