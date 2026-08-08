import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/admin-guard';
import { ensureUser } from '@/lib/repository/users';
import { getProject } from '@/lib/repository/projects';
import { listSavedPapers } from '@/lib/repository/savedPapers';
import { listSections } from '@/lib/repository/outline';
import { hasOpenAI, chatJSON } from '@/lib/openai';
import { handleRouteError } from '@/lib/route-helpers';

const bodySchema = z.object({
  projectId: z.string().uuid(),
  paperId: z.string().uuid(),
});

export type PaperInsight = {
  summary: string;
  relevance: string;
  limitations: string[];
  suggestedSection: string;
};

// POST /api/papers/insight — explains one saved paper in the context of THIS
// thesis: what it says, why it matters here, what to be careful of, and where it
// belongs in the outline.
export async function POST(request: Request) {
  try {
    const decoded = await requireUser(request);
    await ensureUser(decoded);
    const body = bodySchema.parse(await request.json());

    const project = await getProject(body.projectId, decoded.uid);
    if (!project) throw new Error('Forbidden: project not found for user');

    // The paper must be in the caller's own library before we spend tokens.
    const saved = await listSavedPapers(decoded.uid, body.projectId);
    const target = saved.find((s) => s.paper.id === body.paperId);
    if (!target) {
      return NextResponse.json({ error: 'Paper not found in your library' }, { status: 404 });
    }

    if (!hasOpenAI()) {
      return NextResponse.json({ aiAvailable: false, insight: null });
    }

    const sections = await listSections(body.projectId);
    const sectionTitles = sections.filter((s) => !s.parentId).map((s) => s.title);
    const paper = target.paper;

    const insight = await chatJSON<PaperInsight>(
      [
        {
          role: 'system',
          content:
            'You are a research advisor. Explain ONE paper in the context of a specific thesis. ' +
            'Be concrete and grounded in the paper provided — no generic filler, no repetition. ' +
            'If the paper is only tangentially related to the thesis, say so plainly rather than inventing relevance. ' +
            'Respond ONLY with a JSON object matching: { "summary": string (2-3 sentences on what the paper ' +
            'actually contributes), "relevance": string (2-3 sentences on how it supports, challenges, or ' +
            'contextualises THIS thesis), "limitations": string[] (2-4 specific cautions when citing it), ' +
            '"suggestedSection": string (which chapter it best supports) }.',
        },
        {
          role: 'user',
          content:
            `Thesis title: "${project.title}"\n` +
            `Field: ${project.field || 'unspecified'}\n` +
            (sectionTitles.length > 0
              ? `Existing chapters: ${sectionTitles.join('; ')}\n`
              : 'The outline has no chapters yet.\n') +
            `\nPaper:\nTitle: "${paper.title}"\n` +
            `Year: ${paper.year || 'n.d.'}\n` +
            `Citations: ${paper.citationCount}\n` +
            `Authors: ${paper.authors.slice(0, 6).map((a) => a.name).join(', ') || 'unknown'}\n` +
            `Abstract: ${(paper.abstract ?? '(no abstract available)').slice(0, 2000)}\n\n` +
            'Produce the JSON analysis.',
        },
      ],
      { maxTokens: 2000 }
    );

    return NextResponse.json({ aiAvailable: true, insight });
  } catch (err) {
    return handleRouteError(err, 'papers/insight/POST');
  }
}
