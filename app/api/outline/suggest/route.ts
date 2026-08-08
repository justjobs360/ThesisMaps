import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/admin-guard';
import { ensureUser } from '@/lib/repository/users';
import { getProject } from '@/lib/repository/projects';
import { listSavedPapers } from '@/lib/repository/savedPapers';
import { listSections } from '@/lib/repository/outline';
import { hasOpenAI, chatJSON } from '@/lib/openai';
import { handleRouteError } from '@/lib/route-helpers';

const bodySchema = z.object({ projectId: z.string().uuid() });

export type SuggestedSection = { title: string; rationale: string };
type SuggestResponse = { sections: SuggestedSection[] };

// POST /api/outline/suggest — proposes a thesis chapter structure grounded in the
// project's saved library. Returns suggestions only; the client creates real
// sections through the existing POST /api/outline path when the user accepts.
export async function POST(request: Request) {
  try {
    const decoded = await requireUser(request);
    await ensureUser(decoded);
    const body = bodySchema.parse(await request.json());

    const project = await getProject(body.projectId, decoded.uid);
    if (!project) throw new Error('Forbidden: project not found for user');

    if (!hasOpenAI()) {
      return NextResponse.json({ aiAvailable: false, sections: [] });
    }

    const [saved, existing] = await Promise.all([
      listSavedPapers(decoded.uid, body.projectId),
      listSections(body.projectId),
    ]);

    if (saved.length === 0) {
      return NextResponse.json({ aiAvailable: true, sections: [], librarySize: 0 });
    }

    const paperLines = saved
      .slice(0, 40)
      .map((s, i) => `${i + 1}. "${s.paper.title}" (${s.paper.year || 'n.d.'})`)
      .join('\n');

    const existingTitles = existing.filter((s) => !s.parentId).map((s) => s.title);

    const result = await chatJSON<SuggestResponse>(
      [
        {
          role: 'system',
          content:
            'You are a thesis supervisor helping a graduate student structure their thesis. ' +
            'Propose a chapter/section outline grounded in the literature they have actually collected — ' +
            'reference the themes present in their papers rather than emitting a generic template. ' +
            'Do not repeat sections the student already has. Respond ONLY with a JSON object matching: ' +
            '{ "sections": [{ "title": string (concise chapter title), "rationale": string (one sentence ' +
            'on why this chapter belongs, referencing their literature) }] } with 5-8 sections in reading order.',
        },
        {
          role: 'user',
          content:
            `Thesis title: "${project.title}"\n` +
            `Field: ${project.field || 'unspecified'}\n` +
            `Stage: ${project.currentStage}\n` +
            (existingTitles.length > 0
              ? `Existing chapters (do NOT duplicate these): ${existingTitles.join('; ')}\n`
              : '') +
            `\nSaved literature (${saved.length} papers):\n${paperLines}\n\n` +
            'Produce the JSON outline.',
        },
      ],
      { maxTokens: 2500 }
    );

    return NextResponse.json({
      aiAvailable: true,
      sections: result.sections ?? [],
      librarySize: saved.length,
    });
  } catch (err) {
    return handleRouteError(err, 'outline/suggest/POST');
  }
}
