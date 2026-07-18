import type { Paper } from '@/types/paper';

/**
 * Heuristic 0–100 "coverage" score for an outline section, from the papers
 * assigned to it. Blends three signals:
 *   - volume:   how many papers back the section (saturates around 8)
 *   - recency:  share of papers from the last ~5 years
 *   - impact:   average citation count (saturates around 150)
 * Used by the outline UI's traffic-light badge (green ≥75, amber ≥40, red <40).
 */
export function computeCoverage(papers: Pick<Paper, 'year' | 'citationCount'>[]): number {
  if (papers.length === 0) return 0;

  const currentYear = new Date().getFullYear();

  const volume = Math.min(papers.length / 8, 1);

  const recentCount = papers.filter((p) => p.year && currentYear - p.year <= 5).length;
  const recency = recentCount / papers.length;

  const avgCitations = papers.reduce((sum, p) => sum + (p.citationCount || 0), 0) / papers.length;
  const impact = Math.min(avgCitations / 150, 1);

  const score = volume * 0.5 + recency * 0.3 + impact * 0.2;
  return Math.round(score * 100);
}
