/**
 * Greedy label placement: decide which papers earn a resting "Surname Year" label.
 *
 * Labels are the main source of clutter in a graph, so rather than flagging them
 * by hand (homepage) or by node size alone (app), go down the list in priority
 * order and keep a label only if its pill clears every label already kept and
 * every other node's circle. Lower-priority papers get their label on hover.
 *
 * All units are the caller's coordinate space; the caller scales `w` and `h` into
 * that space (e.g. divides by zoom) so zooming in genuinely makes room.
 */

export type LabelItem = {
  id: string;
  x: number;
  y: number;
  r: number;
  /** Higher wins a contested spot. */
  priority: number;
  /** Pill width/height in the same units as x/y. */
  w: number;
  h: number;
};

type Rect = { x0: number; y0: number; x1: number; y1: number };

const overlaps = (a: Rect, b: Rect) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;

function hitsCircle(rect: Rect, cx: number, cy: number, r: number): boolean {
  const nx = Math.max(rect.x0, Math.min(cx, rect.x1));
  const ny = Math.max(rect.y0, Math.min(cy, rect.y1));
  return (cx - nx) ** 2 + (cy - ny) ** 2 < r * r;
}

export function pickLabels(
  items: LabelItem[],
  opts: { /** Always labelled, whatever else is on screen (hovered / selected / seed). */ pinned?: ReadonlySet<string>; max?: number; gap?: number } = {}
): Set<string> {
  const gap = opts.gap ?? 4;
  const max = opts.max ?? Infinity;
  const shown = new Set<string>();
  const placed: Rect[] = [];

  const rectFor = (it: LabelItem): Rect => ({
    x0: it.x - it.w / 2,
    x1: it.x + it.w / 2,
    y0: it.y + it.r + gap,
    y1: it.y + it.r + gap + it.h,
  });

  const ordered = [...items].sort((a, b) => {
    const pa = opts.pinned?.has(a.id) ? 1 : 0;
    const pb = opts.pinned?.has(b.id) ? 1 : 0;
    return pb - pa || b.priority - a.priority;
  });

  for (const it of ordered) {
    const pinned = opts.pinned?.has(it.id) ?? false;
    if (!pinned && shown.size >= max) break;
    const rect = rectFor(it);
    if (!pinned) {
      if (placed.some((p) => overlaps(p, rect))) continue;
      if (items.some((o) => o.id !== it.id && hitsCircle(rect, o.x, o.y, o.r + 2))) continue;
    }
    shown.add(it.id);
    placed.push(rect);
  }
  return shown;
}

export type LabelSide = 'below' | 'above' | 'right' | 'left';
export type LabelSpot = { side: LabelSide; x: number; y: number; anchor: 'middle' | 'start' | 'end' };

/**
 * Every item gets a label; collisions are resolved by moving it, not hiding it.
 * Tries below, above, right, left of the circle in that order and keeps the first
 * spot that clears placed labels and other circles (falls back to below). `y` is
 * the top of the label box; `x` is the anchor point for `anchor`.
 */
export function placeLabels(items: LabelItem[], gap = 5): Map<string, LabelSpot> {
  const placed: Rect[] = [];
  const out = new Map<string, LabelSpot>();
  const ordered = [...items].sort((a, b) => b.priority - a.priority);

  const candidates = (it: LabelItem): { spot: LabelSpot; rect: Rect }[] => {
    const below = { x0: it.x - it.w / 2, x1: it.x + it.w / 2, y0: it.y + it.r + gap, y1: it.y + it.r + gap + it.h };
    const above = { x0: below.x0, x1: below.x1, y0: it.y - it.r - gap - it.h, y1: it.y - it.r - gap };
    const right = { x0: it.x + it.r + gap, x1: it.x + it.r + gap + it.w, y0: it.y - it.h / 2, y1: it.y + it.h / 2 };
    const left = { x0: it.x - it.r - gap - it.w, x1: it.x - it.r - gap, y0: right.y0, y1: right.y1 };
    return [
      { spot: { side: 'below', x: it.x, y: below.y0, anchor: 'middle' }, rect: below },
      { spot: { side: 'above', x: it.x, y: above.y0, anchor: 'middle' }, rect: above },
      { spot: { side: 'right', x: right.x0, y: right.y0, anchor: 'start' }, rect: right },
      { spot: { side: 'left', x: left.x1, y: left.y0, anchor: 'end' }, rect: left },
    ];
  };

  for (const it of ordered) {
    const options = candidates(it);
    const free = options.find(
      ({ rect }) =>
        !placed.some((p) => overlaps(p, rect)) &&
        !items.some((o) => o.id !== it.id && hitsCircle(rect, o.x, o.y, o.r + 2))
    );
    const chosen = free ?? options[0]!;
    out.set(it.id, chosen.spot);
    placed.push(chosen.rect);
  }
  return out;
}

/** Approximate pill width for a bold sans label; avoids measuring text in layout code. */
export function estimateLabelWidth(text: string, fontPx: number): number {
  return text.length * fontPx * 0.6 + 14;
}
