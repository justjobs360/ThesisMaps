import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/admin-guard';
import { ensureUser } from '@/lib/repository/users';
import { getProject } from '@/lib/repository/projects';
import { listComments, createComment, deleteComment } from '@/lib/repository/comments';
import { handleRouteError } from '@/lib/route-helpers';

async function assertProjectOwner(projectId: string, userId: string) {
  const project = await getProject(projectId, userId);
  if (!project) throw new Error('Forbidden: project not found for user');
}

// GET /api/comments?projectId=...[&paperId=...] — project (or paper) comment thread
export async function GET(request: Request) {
  try {
    const decoded = await requireUser(request);
    await ensureUser(decoded);
    const searchParams = new URL(request.url).searchParams;
    const parsed = z.string().uuid().safeParse(searchParams.get('projectId'));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid projectId' }, { status: 400 });

    await assertProjectOwner(parsed.data, decoded.uid);
    const paperId = searchParams.get('paperId') ?? undefined;
    const comments = await listComments(parsed.data, paperId);
    return NextResponse.json({ comments });
  } catch (err) {
    return handleRouteError(err, 'comments/GET');
  }
}

const createSchema = z.object({
  projectId: z.string().uuid(),
  paperId: z.string().uuid(),
  content: z.string().min(1).max(4000),
});

// POST /api/comments — comment on a paper within a project
export async function POST(request: Request) {
  try {
    const decoded = await requireUser(request);
    await ensureUser(decoded);
    const body = createSchema.parse(await request.json());
    await assertProjectOwner(body.projectId, decoded.uid);

    const comment = await createComment(body.projectId, decoded.uid, body.paperId, body.content);
    return NextResponse.json({ comment }, { status: 201 });
  } catch (err) {
    return handleRouteError(err, 'comments/POST');
  }
}

const deleteSchema = z.object({ commentId: z.string().uuid() });

// DELETE /api/comments — remove own comment
export async function DELETE(request: Request) {
  try {
    const decoded = await requireUser(request);
    await ensureUser(decoded);
    const body = deleteSchema.parse(await request.json());
    await deleteComment(body.commentId, decoded.uid);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleRouteError(err, 'comments/DELETE');
  }
}
