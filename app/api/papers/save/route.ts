import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/admin-guard';
import { ensureUser } from '@/lib/repository/users';
import { getProject } from '@/lib/repository/projects';
import { listSavedPapers, searchSavedPapers, savePaper, updateSavedPaper, removeSavedPaper } from '@/lib/repository/savedPapers';
import { handleRouteError } from '@/lib/route-helpers';

const paperSchema = z.object({
  id: z.string(),
  doi: z.string().optional(),
  arxivId: z.string().optional(),
  title: z.string().min(1),
  abstract: z.string().optional(),
  authors: z.array(z.object({ name: z.string(), affiliation: z.string().optional(), hIndex: z.number().optional() })),
  year: z.number(),
  citationCount: z.number(),
  referenceCount: z.number(),
  openAccess: z.boolean(),
  fieldsOfStudy: z.array(z.string()),
  source: z.enum(['semantic_scholar', 'openalex', 'arxiv', 'crossref', 'pubmed', 'core', 'europe_pmc', 'doaj']),
  url: z.string().optional(),
});

async function assertProjectOwner(projectId: string, userId: string) {
  const project = await getProject(projectId, userId);
  if (!project) throw new Error('Forbidden: project not found for user');
}

// GET /api/papers/save?projectId=...[&q=...] — list (or search) the project's saved library
export async function GET(request: Request) {
  try {
    const decoded = await requireUser(request);
    await ensureUser(decoded);
    const searchParams = new URL(request.url).searchParams;
    const projectId = searchParams.get('projectId');
    const q = searchParams.get('q')?.trim();
    const parsed = z.string().uuid().safeParse(projectId);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid projectId' }, { status: 400 });

    await assertProjectOwner(parsed.data, decoded.uid);
    const papers = q
      ? await searchSavedPapers(decoded.uid, parsed.data, q)
      : await listSavedPapers(decoded.uid, parsed.data);
    return NextResponse.json({ papers });
  } catch (err) {
    return handleRouteError(err, 'papers/save/GET');
  }
}

const saveSchema = z.object({
  projectId: z.string().uuid(),
  paper: paperSchema,
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  isSeed: z.boolean().optional(),
});

// POST /api/papers/save — save a paper to the project library
export async function POST(request: Request) {
  try {
    const decoded = await requireUser(request);
    await ensureUser(decoded);
    const body = saveSchema.parse(await request.json());
    await assertProjectOwner(body.projectId, decoded.uid);

    const saved = await savePaper(decoded.uid, body.projectId, body.paper, {
      tags: body.tags,
      notes: body.notes,
      isSeed: body.isSeed,
    });
    return NextResponse.json({ saved }, { status: 201 });
  } catch (err) {
    return handleRouteError(err, 'papers/save/POST');
  }
}

const updateSchema = z.object({
  savedId: z.string().uuid(),
  readStatus: z.enum(['unread', 'reading', 'read']).optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().max(4000).optional(),
});

// PATCH /api/papers/save — update read status / tags / notes on a saved paper
export async function PATCH(request: Request) {
  try {
    const decoded = await requireUser(request);
    await ensureUser(decoded);
    const body = updateSchema.parse(await request.json());
    await updateSavedPaper(decoded.uid, body.savedId, {
      readStatus: body.readStatus,
      tags: body.tags,
      notes: body.notes,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleRouteError(err, 'papers/save/PATCH');
  }
}

const deleteSchema = z.object({ savedId: z.string().uuid() });

// DELETE /api/papers/save — remove a saved paper by its saved_papers id
export async function DELETE(request: Request) {
  try {
    const decoded = await requireUser(request);
    await ensureUser(decoded);
    const body = deleteSchema.parse(await request.json());
    await removeSavedPaper(decoded.uid, body.savedId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleRouteError(err, 'papers/save/DELETE');
  }
}
