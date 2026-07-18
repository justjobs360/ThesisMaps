import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/admin-guard';
import { ensureUser } from '@/lib/repository/users';
import { getProject } from '@/lib/repository/projects';
import {
  sectionBelongsToProject,
  listSectionPapers,
  addSectionPaper,
  removeSectionPaper,
} from '@/lib/repository/outline';
import { handleRouteError } from '@/lib/route-helpers';

async function assertSectionOwner(projectId: string, sectionId: string, userId: string) {
  const project = await getProject(projectId, userId);
  if (!project) throw new Error('Forbidden: project not found for user');
  const ok = await sectionBelongsToProject(sectionId, projectId);
  if (!ok) throw new Error('Forbidden: section not in project');
}

// GET /api/outline/papers?projectId=...&sectionId=... — papers linked to a section
export async function GET(request: Request) {
  try {
    const decoded = await requireUser(request);
    await ensureUser(decoded);
    const { searchParams } = new URL(request.url);
    const projectId = z.string().uuid().parse(searchParams.get('projectId'));
    const sectionId = z.string().uuid().parse(searchParams.get('sectionId'));
    await assertSectionOwner(projectId, sectionId, decoded.uid);

    const papers = await listSectionPapers(sectionId);
    return NextResponse.json({ papers });
  } catch (err) {
    return handleRouteError(err, 'outline/papers/GET');
  }
}

const linkSchema = z.object({
  projectId: z.string().uuid(),
  sectionId: z.string().uuid(),
  paperId: z.string().uuid(),
});

// POST /api/outline/papers — assign a saved paper to a section
export async function POST(request: Request) {
  try {
    const decoded = await requireUser(request);
    await ensureUser(decoded);
    const body = linkSchema.parse(await request.json());
    await assertSectionOwner(body.projectId, body.sectionId, decoded.uid);
    await addSectionPaper(body.sectionId, body.paperId);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    return handleRouteError(err, 'outline/papers/POST');
  }
}

// DELETE /api/outline/papers — unassign a paper from a section
export async function DELETE(request: Request) {
  try {
    const decoded = await requireUser(request);
    await ensureUser(decoded);
    const body = linkSchema.parse(await request.json());
    await assertSectionOwner(body.projectId, body.sectionId, decoded.uid);
    await removeSectionPaper(body.sectionId, body.paperId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleRouteError(err, 'outline/papers/DELETE');
  }
}
