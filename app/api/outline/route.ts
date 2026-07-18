import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/admin-guard';
import { ensureUser } from '@/lib/repository/users';
import { getProject } from '@/lib/repository/projects';
import {
  listSections,
  createSection,
  updateSection,
  reorderSections,
  deleteSection,
} from '@/lib/repository/outline';
import { handleRouteError } from '@/lib/route-helpers';

async function assertProjectOwner(projectId: string, userId: string) {
  const project = await getProject(projectId, userId);
  if (!project) throw new Error('Forbidden: project not found for user');
}

// GET /api/outline?projectId=...
export async function GET(request: Request) {
  try {
    const decoded = await requireUser(request);
    await ensureUser(decoded);
    const projectId = new URL(request.url).searchParams.get('projectId');
    const parsed = z.string().uuid().safeParse(projectId);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid projectId' }, { status: 400 });

    await assertProjectOwner(parsed.data, decoded.uid);
    const sections = await listSections(parsed.data);
    return NextResponse.json({ sections });
  } catch (err) {
    return handleRouteError(err, 'outline/GET');
  }
}

const createSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().min(1).max(200),
  parentId: z.string().uuid().nullable().optional(),
  orderIndex: z.number().int().nonnegative().optional(),
});

// POST /api/outline — create a section
export async function POST(request: Request) {
  try {
    const decoded = await requireUser(request);
    await ensureUser(decoded);
    const body = createSchema.parse(await request.json());
    await assertProjectOwner(body.projectId, decoded.uid);

    const section = await createSection(body.projectId, {
      title: body.title,
      parentId: body.parentId ?? null,
      orderIndex: body.orderIndex,
    });
    return NextResponse.json({ section }, { status: 201 });
  } catch (err) {
    return handleRouteError(err, 'outline/POST');
  }
}

const patchSchema = z.object({
  projectId: z.string().uuid(),
  // Either update a single section…
  sectionId: z.string().uuid().optional(),
  title: z.string().min(1).max(200).optional(),
  orderIndex: z.number().int().nonnegative().optional(),
  parentId: z.string().uuid().nullable().optional(),
  // …or persist a full reorder.
  order: z.array(z.object({ id: z.string().uuid(), orderIndex: z.number().int().nonnegative() })).optional(),
});

// PATCH /api/outline — rename / move a section, or persist a reorder
export async function PATCH(request: Request) {
  try {
    const decoded = await requireUser(request);
    await ensureUser(decoded);
    const body = patchSchema.parse(await request.json());
    await assertProjectOwner(body.projectId, decoded.uid);

    if (body.order) {
      await reorderSections(body.order);
    } else if (body.sectionId) {
      await updateSection(body.sectionId, {
        title: body.title,
        orderIndex: body.orderIndex,
        parentId: body.parentId,
      });
    } else {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    const sections = await listSections(body.projectId);
    return NextResponse.json({ sections });
  } catch (err) {
    return handleRouteError(err, 'outline/PATCH');
  }
}

const deleteSchema = z.object({ projectId: z.string().uuid(), sectionId: z.string().uuid() });

// DELETE /api/outline — remove a section
export async function DELETE(request: Request) {
  try {
    const decoded = await requireUser(request);
    await ensureUser(decoded);
    const body = deleteSchema.parse(await request.json());
    await assertProjectOwner(body.projectId, decoded.uid);
    await deleteSection(body.sectionId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleRouteError(err, 'outline/DELETE');
  }
}
