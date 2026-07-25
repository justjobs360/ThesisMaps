import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/admin-guard';
import { ensureUser } from '@/lib/repository/users';
import { getProject, updateProject } from '@/lib/repository/projects';
import { handleRouteError } from '@/lib/route-helpers';

const stageEnum = z.enum([
  'research_proposal',
  'literature_review',
  'methodology',
  'data_collection',
  'analysis',
  'writing',
  'defence',
]);

type Params = { params: { id: string } };

// GET /api/projects/[id]
export async function GET(request: Request, { params }: Params) {
  try {
    const decoded = await requireUser(request);
    await ensureUser(decoded);
    const project = await getProject(params.id, decoded.uid);
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ project });
  } catch (err) {
    return handleRouteError(err, 'projects/[id]/GET');
  }
}

const patchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  field: z.string().max(200).optional(),
  currentStage: stageEnum.optional(),
  // Free-form per-project state (e.g. defence checklist). Sent whole so it
  // replaces the stored object — clients merge existing keys before sending.
  metadata: z
    .object({ defenceChecklist: z.array(z.boolean()).max(50).optional() })
    .passthrough()
    .optional(),
});

// PATCH /api/projects/[id]
export async function PATCH(request: Request, { params }: Params) {
  try {
    const decoded = await requireUser(request);
    await ensureUser(decoded);
    const body = patchSchema.parse(await request.json());
    const project = await updateProject(params.id, decoded.uid, body);
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ project });
  } catch (err) {
    return handleRouteError(err, 'projects/[id]/PATCH');
  }
}
