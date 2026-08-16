import type { GraphNode, HeatmapMode } from '@/types/graph';

const ACCENT = '#0066FF';
const ACCENT_DIM = '#60A5FA';
// "Influential" reads as solid black on the white brutalist canvas (was #FFFFFF,
// which is invisible now that nodes sit on white).
const INK = '#000000';
const SLATE = '#94A3B8';
const SLATE_DARK = '#475569';

/**
 * Brand-consistent node colour for the graph canvas. Recolours by the active
 * heatmap mode so the "Color by …" control actually changes the visualisation
 * (previously a no-op). Palette is limited to the brand blue + neutral grays —
 * no gold/pastel.
 */
/**
 * Continuous year ramp: old papers pale, recent papers deep blue, so foundational
 * vs current work is readable at a glance rather than in three coarse buckets.
 * `range` comes from the library's own min/max year, so the contrast adapts to
 * whatever span the user actually has.
 */
export function yearColor(year: number, range: { min: number; max: number }): string {
  if (!year) return '#CBD5E1'; // unknown year — deliberately the palest, not "old"
  const span = Math.max(1, range.max - range.min);
  const t = Math.min(1, Math.max(0, (year - range.min) / span));
  // Pale slate (#CBD5E1) -> brand blue (#0066FF)
  const from = { r: 0xcb, g: 0xd5, b: 0xe1 };
  const to = { r: 0x00, g: 0x66, b: 0xff };
  const mix = (a: number, b: number) => Math.round(a + (b - a) * t);
  return `rgb(${mix(from.r, to.r)}, ${mix(from.g, to.g)}, ${mix(from.b, to.b)})`;
}

export function nodeColor(
  node: GraphNode,
  mode: HeatmapMode,
  maxCitations: number,
  yearRange?: { min: number; max: number }
): string {
  switch (mode) {
    case 'year':
      return yearColor(node.paper.year || 0, yearRange ?? { min: 1990, max: new Date().getFullYear() });
    case 'recency': {
      const year = node.paper.year || 0;
      if (!year) return SLATE_DARK;
      const age = new Date().getFullYear() - year;
      if (age <= 3) return ACCENT;
      if (age <= 8) return ACCENT_DIM;
      return SLATE_DARK;
    }
    case 'citation': {
      const ratio = maxCitations > 0 ? node.paper.citationCount / maxCitations : 0;
      if (ratio > 0.66) return ACCENT;
      if (ratio > 0.33) return ACCENT_DIM;
      return SLATE_DARK;
    }
    case 'relevance':
      return node.type === 'seed' ? ACCENT : node.type === 'influential' ? INK : SLATE;
    case 'type':
    default:
      if (node.isBookmarked || node.type === 'seed') return ACCENT;
      if (node.type === 'influential') return INK;
      if (node.type === 'citing') return ACCENT_DIM;
      return SLATE; // cited
  }
}
