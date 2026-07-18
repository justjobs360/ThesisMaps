import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/admin-guard';
import { ensureUser } from '@/lib/repository/users';
import { ensureProjects, createProject } from '@/lib/repository/projects';
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

// GET /api/projects — the user's projects (creates a default one on first use)
export async function GET(request: Request) {
  try {
    const decoded = await requireUser(request);
    await ensureUser(decoded);
    const projects = await ensureProjects(decoded.uid);
    return NextResponse.json({ projects });
  } catch (err) {
    return handleRouteError(err, 'projects/GET');
  }
}

const createSchema = z.object({
  title: z.string().min(1).max(200),
  field: z.string().max(200).optional(),
  currentStage: stageEnum.optional(),
});

// POST /api/projects — create a new project
export async function POST(request: Request) {
  try {
    const decoded = await requireUser(request);
    await ensureUser(decoded);
    const body = createSchema.parse(await request.json());
    const project = await createProject(decoded.uid, body);
    return NextResponse.json({ project }, { status: 201 });
  } catch (err) {
    return handleRouteError(err, 'projects/POST');
  }
}
