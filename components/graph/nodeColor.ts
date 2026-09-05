import type { GraphNode, HeatmapMode } from '@/types/graph';

const ACCENT = '#0066FF';
const ACCENT_DIM = '#60A5FA';
// "Influential" reads as solid black on the white brutalist canvas (was #FFFFFF,
// which is invisible now that nodes sit on white).
const INK = '#000000';
const SLATE = '#94A3B8';
const SLATE_DARK = '#475569';

/**
 * Continuous year ramp: oldest work pale, deepening through the brand accent to
 * near-black for the most recent.
 *
 * This replaced an ochre -> teal -> blue ramp. That version separated adjacent
 * years well, but it introduced two hues the product does not otherwise use, so
 * the graph was the only surface in the app painting in orange and green while
 * everything around it was black, white and #0066FF. On the landing page the
 * effect was worse — the hero graph is the largest single element and it read as
 * a foreign widget rather than a picture of this product.
 *
 * A monochrome ramp is also the more honest encoding. Year is an ORDERED
 * quantity, and ordered data wants a scale that varies monotonically in
 * lightness so "further along the ramp" is directly visible. Hue steps do not
 * carry order: nothing about ochre says it precedes teal. Here every step gets
 * darker, so age reads without consulting the legend.
 *
 * Contrast: the mid and newest stops clear 4.5:1 on white. The pale stop is
 * deliberately low-contrast as a FILL — legibility of a node comes from its 2px
 * black stroke, not its fill — and its job is to sit at the bottom of the
 * lightness ramp so recent work visibly dominates.
 *
 * `range` comes from the library's own min/max year, so the ramp always spans
 * whatever period the user actually has.
 */
type RGB = [number, number, number];
const YEAR_STOPS: RGB[] = [
  [0xbf, 0xd3, 0xf2], // oldest — pale blue, recedes
  [0x00, 0x66, 0xff], // midpoint — the brand accent, exactly
  [0x0a, 0x1f, 0x3d], // newest — near-black navy, advances
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
