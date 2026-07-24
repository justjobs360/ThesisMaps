import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/admin-guard';
import { ensureUser } from '@/lib/repository/users';
import { getProject } from '@/lib/repository/projects';
import {
  listSeedSets,
  createSeedSet,
  updateSeedSet,
  deleteSeedSet,
  listSeedSetPapers,
} from '@/lib/repository/seeds';
import { handleRouteError } from '@/lib/route-helpers';

async function assertProjectOwner(projectId: string, userId: string) {
  const project = await getProject(projectId, userId);
  if (!project) throw new Error('Forbidden: project not found for user');
}

// GET /api/seeds?projectId=...[&seedSetId=...]
// Without seedSetId: the project's seed sets. With: that set's resolved papers.
export async function GET(request: Request) {
  try {
    const decoded = await requireUser(request);
    await ensureUser(decoded);
    const searchParams = new URL(request.url).searchParams;
    const parsed = z.string().uuid().safeParse(searchParams.get('projectId'));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid projectId' }, { status: 400 });

    await assertProjectOwner(parsed.data, decoded.uid);
    const seedSets = await listSeedSets(parsed.data);

    const seedSetId = searchParams.get('seedSetId');
    if (seedSetId) {
      const set = seedSets.find((s) => s.id === seedSetId);
      if (!set) return NextResponse.json({ error: 'Seed set not found' }, { status: 404 });
      const papers = await listSeedSetPapers(set.paperIds);
      return NextResponse.json({ seedSet: set, papers });
    }

    return NextResponse.json({ seedSets });
  } catch (err) {
    return handleRouteError(err, 'seeds/GET');
  }
}

const createSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(1).max(200),
  paperIds: z.array(z.string().uuid()).max(100).default([]),
});

// POST /api/seeds — create a seed set
export async function POST(request: Request) {
  try {
    const decoded = await requireUser(request);
    await ensureUser(decoded);
    const body = createSchema.parse(await request.json());
    await assertProjectOwner(body.projectId, decoded.uid);

    const seedSet = await createSeedSet(body.projectId, {
      name: body.name,
      paperIds: body.paperIds,
    });
    return NextResponse.json({ seedSet }, { status: 201 });
  } catch (err) {
    return handleRouteError(err, 'seeds/POST');
  }
}

const patchSchema = z.object({
  projectId: z.string().uuid(),
  seedSetId: z.string().uuid(),
  name: z.string().min(1).max(200).optional(),
  paperIds: z.array(z.string().uuid()).max(100).optional(),
});

// PATCH /api/seeds — rename a set or replace its paper list
export async function PATCH(request: Request) {
  try {
    const decoded = await requireUser(request);
    await ensureUser(decoded);
    const body = patchSchema.parse(await request.json());
    await assertProjectOwner(body.projectId, decoded.uid);

    const seedSet = await updateSeedSet(body.seedSetId, body.projectId, {
      name: body.name,
      paperIds: body.paperIds,
    });
    if (!seedSet) return NextResponse.json({ error: 'Seed set not found' }, { status: 404 });
    return NextResponse.json({ seedSet });
  } catch (err) {
    return handleRouteError(err, 'seeds/PATCH');
  }
}

const deleteSchema = z.object({ projectId: z.string().uuid(), seedSetId: z.string().uuid() });

// DELETE /api/seeds — remove a seed set
export async function DELETE(request: Request) {
  try {
    const decoded = await requireUser(request);
    await ensureUser(decoded);
    const body = deleteSchema.parse(await request.json());
    await assertProjectOwner(body.projectId, decoded.uid);
    await deleteSeedSet(body.seedSetId, body.projectId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleRouteError(err, 'seeds/DELETE');
  }
}
