import type { GraphNode, HeatmapMode } from '@/types/graph';

const ACCENT = '#0066FF';
const ACCENT_DIM = '#60A5FA';
const WHITE = '#FFFFFF';
const SLATE = '#94A3B8';
const SLATE_DARK = '#475569';

/**
 * Brand-consistent node colour for the graph canvas. Recolours by the active
 * heatmap mode so the "Color by …" control actually changes the visualisation
 * (previously a no-op). Palette is limited to the brand blue + neutral grays —
 * no gold/pastel.
 */
export function nodeColor(node: GraphNode, mode: HeatmapMode, maxCitations: number): string {
  switch (mode) {
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
      return node.type === 'seed' ? ACCENT : node.type === 'influential' ? WHITE : SLATE;
    case 'type':
    default:
      if (node.isBookmarked || node.type === 'seed') return ACCENT;
      if (node.type === 'influential') return WHITE;
      if (node.type === 'citing') return ACCENT_DIM;
      return SLATE; // cited
  }
}
