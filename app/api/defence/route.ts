import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/admin-guard';
import { ensureUser } from '@/lib/repository/users';
import { getProject } from '@/lib/repository/projects';
import { listSavedPapers } from '@/lib/repository/savedPapers';
import { hasOpenAI, chatJSON } from '@/lib/openai';
import { handleRouteError } from '@/lib/route-helpers';

const querySchema = z.object({ projectId: z.string().uuid() });

type QA = { point: string; response: string };
export type DefencePrep = {
  overview: string;
  counterArguments: QA[];
  contradictions: QA[];
  methodologyCritiques: QA[];
  likelyQuestions: { question: string; answer: string }[];
};

// GET /api/defence?projectId=... — AI-generated defence preparation grounded in
// the project's thesis metadata + saved library. Returns aiAvailable:false when
// no OpenAI key is set, so the page can fall back to its keyword heuristics.
export async function GET(request: Request) {
  try {
    const decoded = await requireUser(request);
    await ensureUser(decoded);

    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({ projectId: searchParams.get('projectId') });
    if (!parsed.success) return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });

    const project = await getProject(parsed.data.projectId, decoded.uid);
    if (!project) throw new Error('Forbidden: project not found for user');

    if (!hasOpenAI()) {
      return NextResponse.json({ aiAvailable: false, prep: null });
    }

    const saved = await listSavedPapers(decoded.uid, parsed.data.projectId);
    if (saved.length === 0) {
      return NextResponse.json({ aiAvailable: true, prep: null, librarySize: 0 });
    }

    const paperLines = saved.slice(0, 30).map((s, i) => {
      const p = s.paper;
      const abstract = (p.abstract ?? '').slice(0, 400);
      return `${i + 1}. "${p.title}" (${p.year || 'n.d.'})${abstract ? `\n   ${abstract}` : ''}`;
    }).join('\n');

    const prep = await chatJSON<DefencePrep>([
      {
        role: 'system',
        content:
          'You are a seasoned thesis defence examiner and advisor. Anticipate the toughest, most credible ' +
          'challenges a committee would raise against this student\'s thesis, grounded in their actual field and ' +
          'saved literature. Be specific and non-generic; each "response" must be a genuinely useful, defensible ' +
          'answer the student could give. Never repeat a point. Respond ONLY with a JSON object matching: ' +
          '{ "overview": string (2-3 sentences on the defence posture), ' +
          '"counterArguments": [{ "point": string, "response": string }] (3-4 counter-arguments to the thesis + how to rebut), ' +
          '"contradictions": [{ "point": string, "response": string }] (2-3 findings/positions that may contradict the work + how to reconcile), ' +
          '"methodologyCritiques": [{ "point": string, "response": string }] (2-3 likely methodology critiques + defences), ' +
          '"likelyQuestions": [{ "question": string, "answer": string }] (4-5 tough viva questions + strong suggested answers) }.',
      },
      {
        role: 'user',
        content:
          `Thesis title: "${project.title}"\n` +
          `Field: ${project.field || 'unspecified'}\n` +
          `Stage: ${project.currentStage}\n\n` +
          `The student's saved literature (${saved.length} papers):\n${paperLines}\n\n` +
          'Produce the JSON defence preparation, specific to this thesis and literature.',
      },
    ], { maxTokens: 3500 });

    return NextResponse.json({ aiAvailable: true, prep, librarySize: saved.length });
  } catch (err) {
    return handleRouteError(err, 'defence/GET');
  }
}
