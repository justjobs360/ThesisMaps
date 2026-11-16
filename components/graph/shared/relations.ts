import type { EdgeType } from '@/types/graph';
import { authorKey, splitName } from './labels';

/** First given name, folded: "Kenton" -> "kenton", "K." -> "k". */
function givenFirst(name: string): string {
  const first = splitName(name).given.split(/[\s.]+/).find(Boolean) ?? '';
  return first.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/**
 * Relationship logic shared by the homepage preview and the real graph.
 *
 * Direction convention, everywhere: a `citation` edge has `source` = the paper
 * that cites and `target` = the paper being cited. "Builds on" therefore follows
 * source -> target, and influence *flows* the other way, cited -> citing. Semantic
 * and co-author edges are undirected; source/target order carries no meaning.
 */

export type RelEdge = {
  id: string;
  source: string;
  target: string;
  type: EdgeType;
  /** Cosine similarity 0..1 for semantic edges. */
  weight?: number;
  /** Author names two papers share, for co_author edges. */
  names?: string[];
};

export type RelationKind = 'buildsOn' | 'builtOnBy' | 'similar' | 'coAuthor';

export const RELATION_KINDS: RelationKind[] = ['buildsOn', 'builtOnBy', 'similar', 'coAuthor'];

export const RELATION_LABEL: Record<RelationKind, string> = {
  buildsOn: 'Builds on',
  builtOnBy: 'Built on by',
  similar: 'Close in meaning',
  coAuthor: 'Shared authors',
};

/** Which side of `edge` is `id` on, as a relation: what the *other* paper is to `id`. */
export function relationOf(e: RelEdge, id: string): RelationKind | null {
  if (e.source !== id && e.target !== id) return null;
  if (e.type === 'citation') return e.source === id ? 'buildsOn' : 'builtOnBy';
  if (e.type === 'semantic_similarity') return 'similar';
  return 'coAuthor';
}

export const otherEnd = (e: RelEdge, id: string) => (e.source === id ? e.target : e.source);

export type Related = { id: string; edgeId: string; score?: number; names?: string[] };

export type NodeRole = 'foundation' | 'bridge' | 'frontier' | 'unlinked';

export const ROLE_LABEL: Record<NodeRole, string> = {
  foundation: 'Foundation',
  bridge: 'Link in the chain',
  frontier: 'Frontier',
  unlinked: 'Unlinked',
};

export const ROLE_HINT: Record<NodeRole, string> = {
  foundation: 'Other papers in this map build on it; it cites none of them.',
  bridge: 'Cites papers here and is cited by papers here.',
  frontier: 'Builds on papers here; nothing here builds on it yet.',
  unlinked: 'No citation links to the other papers in this map.',
};

export type Relations = {
  buildsOn: Related[];
  builtOnBy: Related[];
  similar: Related[];
  coAuthors: Related[];
  role: NodeRole;
};

export function getRelations(id: string, edges: RelEdge[]): Relations {
  const out: Relations = { buildsOn: [], builtOnBy: [], similar: [], coAuthors: [], role: 'unlinked' };
  for (const e of edges) {
    const kind = relationOf(e, id);
    if (!kind) continue;
    const item: Related = { id: otherEnd(e, id), edgeId: e.id, score: e.weight, names: e.names };
    if (kind === 'buildsOn') out.buildsOn.push(item);
    else if (kind === 'builtOnBy') out.builtOnBy.push(item);
    else if (kind === 'similar') out.similar.push(item);
    else out.coAuthors.push(item);
  }
  out.similar.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  const up = out.buildsOn.length;
  const down = out.builtOnBy.length;
  out.role = down > 0 && up === 0 ? 'foundation' : down > 0 && up > 0 ? 'bridge' : up > 0 ? 'frontier' : 'unlinked';
  return out;
}

/**
 * Pairs of papers that share at least one author, with the shared names.
 *
 * Sources only give names, so people are matched on surname + first initial — a
 * heuristic (two different "J. Smith"s will link), which is why co-author edges
 * are only ever drawn for the paper in focus. A bare surname with no initial is
 * too ambiguous to link on and is skipped.
 */
export function coAuthorPairs(papers: { id: string; authors: string[] }[]): { a: string; b: string; names: string[] }[] {
  // Bucket by surname + initial, then require the given names to agree: when both
  // sides spell out a first name it must match ("Kenton Lee" is not "Katherine
  // Lee"); an initial-only form ("K. Lee") is compatible with either.
  const buckets = new Map<string, { id: string; name: string; first: string }[]>();
  for (const p of papers) {
    const seen = new Set<string>();
    for (const name of p.authors) {
      const key = authorKey(name);
      if (!key.includes('|') || seen.has(key)) continue;
      seen.add(key);
      const first = givenFirst(name);
      buckets.set(key, [...(buckets.get(key) ?? []), { id: p.id, name, first }]);
    }
  }
  const pairs = new Map<string, string[]>();
  for (const entries of Array.from(buckets.values())) {
    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        const x = entries[i]!;
        const y = entries[j]!;
        if (x.first.length > 1 && y.first.length > 1 && x.first !== y.first) continue;
        const k = `${x.id}|${y.id}`;
        pairs.set(k, [...(pairs.get(k) ?? []), x.first.length >= y.first.length ? x.name : y.name]);
      }
    }
  }
  return Array.from(pairs.entries()).map(([k, names]) => {
    const [a, b] = k.split('|') as [string, string];
    return { a, b, names };
  });
}

export type EdgeState = 'on' | 'peek';

export type Focus = {
  /** The focused paper plus the papers its visible relations reach. */
  nodes: Set<string>;
  /** Edge id -> how to draw it. Edges absent from the map are dimmed. */
  edges: Map<string, EdgeState>;
};

/**
 * What to light up for a focused paper.
 *   kinds — restrict to some relation types (null = all), driven by the filter chips
 *   peek  — related papers currently under the pointer inside the hover card; the
 *           edges to them are emphasised so a list row maps to a line on the canvas
 */
export function computeFocus(
  id: string,
  edges: RelEdge[],
  kinds: ReadonlySet<RelationKind> | null,
  peek: ReadonlySet<string> | null
): Focus {
  const nodes = new Set<string>([id]);
  const lit = new Map<string, EdgeState>();
  for (const e of edges) {
    const kind = relationOf(e, id);
    if (!kind || (kinds && !kinds.has(kind))) continue;
    const other = otherEnd(e, id);
    nodes.add(other);
    lit.set(e.id, peek && peek.has(other) ? 'peek' : 'on');
  }
  return { nodes, edges: lit };
}
