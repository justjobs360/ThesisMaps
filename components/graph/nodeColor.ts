import type { GraphNode, HeatmapMode } from '@/types/graph';

const ACCENT = '#0066FF';
const ACCENT_DIM = '#60A5FA';
// "Influential" reads as solid black on the white brutalist canvas (was #FFFFFF,
// which is invisible now that nodes sit on white).
const INK = '#000000';
const SLATE = '#94A3B8';
const SLATE_DARK = '#475569';

/**
 * Continuous year ramp: oldest work in warm ochre, through teal, to blue for the
 * most recent.
 *
 * Two hues rather than one because a single-hue ramp cannot separate adjacent
 * years — the previous pale-slate-to-blue scale put 2016 and 2019 within a few
 * RGB steps of each other. It also started at #CBD5E1, which is 1.48:1 against
 * white, so the oldest papers were very nearly invisible. Every stop on this
 * ramp clears 3.7:1 and stays saturated, so no year washes out to grey.
 *
 * `range` comes from the library's own min/max year, so contrast adapts to
 * whatever span the user actually has.
 */
type RGB = [number, number, number];
const YEAR_STOPS: RGB[] = [
  [0xa1, 0x62, 0x07], // oldest — ochre
  [0x0d, 0x94, 0x88], // midpoint — teal, keeps the middle years saturated
  [0x1d, 0x4e, 0xd8], // newest — blue
];

export function yearColor(year: number, range: { min: number; max: number }): string {
  if (!year) return '#94A3B8'; // unknown year — neutral, deliberately not "old"
  const span = Math.max(1, range.max - range.min);
  const t = Math.min(1, Math.max(0, (year - range.min) / span));
  const seg = 1 / (YEAR_STOPS.length - 1);
  const i = Math.min(Math.floor(t / seg), YEAR_STOPS.length - 2);
  const from = YEAR_STOPS[i]!;
  const to = YEAR_STOPS[i + 1]!;
  const local = (t - i * seg) / seg;
  const mix = (a: number, b: number) => Math.round(a + (b - a) * local);
  return `rgb(${mix(from[0], to[0])}, ${mix(from[1], to[1])}, ${mix(from[2], to[2])})`;
}

/**
 * Node colour for the graph canvas, by the active heatmap mode. The 'year' mode
 * uses the two-hue ramp above; the others stay on the brand blue and neutrals.
 */
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
