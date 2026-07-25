import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/admin-guard';
import { ensureUser } from '@/lib/repository/users';
import { getProject } from '@/lib/repository/projects';
import { listSavedPapers } from '@/lib/repository/savedPapers';
import { hasOpenAI, chatJSON } from '@/lib/openai';
import { handleRouteError } from '@/lib/route-helpers';
import type { Paper } from '@/types/paper';

const bodySchema = z.object({
  projectId: z.string().uuid(),
  clusterName: z.string().min(1).max(200),
});

type ClusterDetail = {
  summary: string;
  gaps: string[];
  directions: string[];
  keyQuestions: string[];
};

// Re-derive a cluster's papers the same way analyseGaps() clusters them:
// by field of study, with an 'Uncategorised' bucket for papers that have none.
function papersInCluster(papers: Paper[], clusterName: string): Paper[] {
  return papers.filter((p) => {
    const fields = p.fieldsOfStudy.length > 0 ? p.fieldsOfStudy : ['Uncategorised'];
    return fields.includes(clusterName);
  });
}

// POST /api/gaps/cluster — deep-dive analysis for one gap cluster. Uses OpenAI
// (grounded in the cluster's actual papers) when a key is configured; otherwise
// returns a heuristic summary so the UI still shows something useful.
export async function POST(request: Request) {
  try {
    const decoded = await requireUser(request);
    await ensureUser(decoded);
    const body = bodySchema.parse(await request.json());

    const project = await getProject(body.projectId, decoded.uid);
    if (!project) throw new Error('Forbidden: project not found for user');

    const saved = await listSavedPapers(decoded.uid, body.projectId);
    const clusterPapers = papersInCluster(saved.map((s) => s.paper), body.clusterName);

    const papersOut = clusterPapers.map((p) => ({ title: p.title, year: p.year }));

    if (!hasOpenAI()) {
      // Heuristic fallback: honest, non-fabricated placeholder detail.
      const detail: ClusterDetail = {
        summary: `Your library has ${clusterPapers.length} paper${clusterPapers.length === 1 ? '' : 's'} in "${body.clusterName}". Add an OpenAI key in .env to generate a specific, paper-grounded gap analysis here.`,
        gaps: [],
        directions: [],
        keyQuestions: [],
      };
      return NextResponse.json({ aiAvailable: false, detail, papers: papersOut });
    }

    // Keep the prompt bounded: cap papers and abstract length to control tokens.
    const promptPapers = clusterPapers.slice(0, 20).map((p, i) => {
      const abstract = (p.abstract ?? '').slice(0, 600);
      return `${i + 1}. "${p.title}" (${p.year || 'n.d.'})${abstract ? `\n   Abstract: ${abstract}` : ''}`;
    }).join('\n');

    const detail = await chatJSON<ClusterDetail>([
      {
        role: 'system',
        content:
          'You are a rigorous research advisor helping a graduate student find genuine gaps in their thesis literature. ' +
          'Ground every point in the specific papers provided — reference their topics/methods, do not produce generic filler, ' +
          'and never repeat the same point in different words. Respond ONLY with a JSON object matching: ' +
          '{ "summary": string (2-3 sentences on what this cluster covers and where it is thin), ' +
          '"gaps": string[] (3-5 specific under-researched angles evident from these papers), ' +
          '"directions": string[] (3-5 concrete, actionable research directions the student could pursue), ' +
          '"keyQuestions": string[] (3-4 sharp open questions) }.',
      },
      {
        role: 'user',
        content:
          `Topic cluster: "${body.clusterName}"\n` +
          `The student has saved these ${clusterPapers.length} papers in this cluster:\n\n${promptPapers || '(no papers)'}\n\n` +
          'Produce the JSON analysis. Be specific to these papers and this topic.',
      },
    ]);

    return NextResponse.json({ aiAvailable: true, detail, papers: papersOut });
  } catch (err) {
    return handleRouteError(err, 'gaps/cluster/POST');
  }
}
