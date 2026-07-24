import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/admin-guard';
import { ensureUser } from '@/lib/repository/users';
import { getProject } from '@/lib/repository/projects';
import {
  listCollaborators,
  inviteCollaborator,
  removeCollaborator,
} from '@/lib/repository/collaborations';
import { handleRouteError } from '@/lib/route-helpers';

async function assertProjectOwner(projectId: string, userId: string) {
  const project = await getProject(projectId, userId);
  if (!project) throw new Error('Forbidden: project not found for user');
}

// GET /api/collaborations?projectId=... — project members
export async function GET(request: Request) {
  try {
    const decoded = await requireUser(request);
    await ensureUser(decoded);
    const parsed = z.string().uuid().safeParse(new URL(request.url).searchParams.get('projectId'));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid projectId' }, { status: 400 });

    await assertProjectOwner(parsed.data, decoded.uid);
    const members = await listCollaborators(parsed.data);
    return NextResponse.json({ members });
  } catch (err) {
    return handleRouteError(err, 'collaborations/GET');
  }
}

const inviteSchema = z.object({
  projectId: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(['editor', 'viewer']),
});

// POST /api/collaborations — invite an existing user by email
export async function POST(request: Request) {
  try {
    const decoded = await requireUser(request);
    await ensureUser(decoded);
    const body = inviteSchema.parse(await request.json());
    await assertProjectOwner(body.projectId, decoded.uid);

    const member = await inviteCollaborator(body.projectId, body.email, body.role);
    if (!member) {
      return NextResponse.json(
        { error: 'No ThesisMaps account exists for that email. Ask them to sign up first.' },
        { status: 404 }
      );
    }
    return NextResponse.json({ member }, { status: 201 });
  } catch (err) {
    return handleRouteError(err, 'collaborations/POST');
  }
}

const deleteSchema = z.object({ projectId: z.string().uuid(), collaborationId: z.string().uuid() });

// DELETE /api/collaborations — remove a member
export async function DELETE(request: Request) {
  try {
    const decoded = await requireUser(request);
    await ensureUser(decoded);
    const body = deleteSchema.parse(await request.json());
    await assertProjectOwner(body.projectId, decoded.uid);
    await removeCollaborator(body.collaborationId, body.projectId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleRouteError(err, 'collaborations/DELETE');
  }
}
