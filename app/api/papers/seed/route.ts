import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/admin-guard';
import { supabaseAdmin } from '@/lib/supabase-server';
import { getPaperCitations, getPaperReferences } from '@/lib/api/semanticScholar';

const bodySchema = z.object({
  paperId: z.string().min(1),
  projectId: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    const userId = await requireAuth(request);
    const raw: unknown = await request.json();
    const body = bodySchema.parse(raw);

    const [citations, references] = await Promise.allSettled([
      getPaperCitations(body.paperId, 30),
      getPaperReferences(body.paperId, 30),
    ]);

    const related = [
      ...(citations.status === 'fulfilled' ? citations.value : []),
      ...(references.status === 'fulfilled' ? references.value : []),
    ];

    return NextResponse.json({ papers: related, count: related.length });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: err.flatten() }, { status: 400 });
    }
    if (err instanceof Error && err.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to expand seed' }, { status: 502 });
  }
}
