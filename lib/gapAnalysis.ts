import type { Paper } from '@/types/paper';
import type { ResearchGap, FlaggedPaper } from '@/types/thesis';

/**
 * Heuristic research-gap analysis over a saved library. Used when no external
 * ML service (ML_SERVICE_URL) is configured: clusters papers by field of study
 * and scores how under-covered each cluster is, then flags papers whose
 * abstracts explicitly call for future work. Deterministic and dependency-free
 * so it runs inside the API route.
 */

const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'in', 'into', 'is', 'it',
  'its', 'of', 'on', 'or', 'that', 'the', 'their', 'this', 'to', 'via', 'with', 'we', 'our',
  'using', 'based', 'towards', 'toward', 'new', 'novel', 'study', 'analysis', 'approach',
]);

const FUTURE_WORK_PATTERNS: RegExp[] = [
  /future (work|research|studies|directions)/i,
  /further (research|investigation|studies|work)/i,
  /remains? (unclear|unexplored|an open question|unknown|to be (seen|explored))/i,
  /(is|are) (not (yet|well) understood|under-?explored|understudied)/i,
  /limited (research|studies|work|evidence)/i,
  /few (studies|works?) (have|has)/i,
  /open (question|challenge|problem)s?/i,
  /more (research|work|studies) (is|are) (needed|required)/i,
];

function topKeywords(papers: Paper[], max = 4): string[] {
  const counts = new Map<string, number>();
  for (const p of papers) {
    const words = p.title.toLowerCase().split(/[^a-z0-9-]+/).filter(
      (w) => w.length > 3 && !STOPWORDS.has(w)
    );
    for (const w of new Set(words)) counts.set(w, (counts.get(w) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([w]) => w);
}

export function analyseGaps(papers: Paper[]): { gaps: ResearchGap[]; flaggedPapers: FlaggedPaper[] } {
  // --- Cluster by field of study ---
  const clusters = new Map<string, Paper[]>();
  for (const p of papers) {
    const fields = p.fieldsOfStudy.length > 0 ? p.fieldsOfStudy : ['Uncategorised'];
    for (const field of fields) {
      const arr = clusters.get(field) ?? [];
      arr.push(p);
      clusters.set(field, arr);
    }
  }

  const currentYear = new Date().getFullYear();
  const maxClusterSize = Math.max(1, ...[...clusters.values()].map((c) => c.length));

  const gaps: ResearchGap[] = [...clusters.entries()]
    .map(([field, clusterPapers], i) => {
      // Sparse clusters and stale clusters score higher (bigger gap).
      const sizeScore = 1 - clusterPapers.length / maxClusterSize; // 0 (dense) → 1 (sparse)
      const years = clusterPapers.map((p) => p.year).filter((y) => y > 0);
      const newestYear = years.length ? Math.max(...years) : currentYear;
      const staleness = Math.min(1, Math.max(0, (currentYear - newestYear) / 10)); // 10+ yrs = fully stale
      const gapScore = Math.round((0.65 * sizeScore + 0.35 * staleness) * 100) / 100;

      return {
        id: `gap-${i}`,
        clusterName: field,
        keywords: topKeywords(clusterPapers),
        gapScore,
        paperCount: clusterPapers.length,
        isHighGap: gapScore >= 0.6,
      };
    })
    .sort((a, b) => b.gapScore - a.gapScore)
    .slice(0, 8);

  // --- Flag papers whose abstracts call for future work ---
  const flaggedPapers: FlaggedPaper[] = [];
  for (const p of papers) {
    if (!p.abstract) continue;
    for (const pattern of FUTURE_WORK_PATTERNS) {
      const match = pattern.exec(p.abstract);
      if (match) {
        const start = Math.max(0, match.index - 60);
        const end = Math.min(p.abstract.length, match.index + match[0].length + 60);
        flaggedPapers.push({
          paperId: p.id,
          title: p.title,
          year: p.year,
          snippet: `${start > 0 ? '…' : ''}${p.abstract.slice(start, end).trim()}${end < p.abstract.length ? '…' : ''}`,
        });
        break;
      }
    }
  }

  return { gaps, flaggedPapers: flaggedPapers.slice(0, 10) };
}
