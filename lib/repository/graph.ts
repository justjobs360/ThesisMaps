import { listSavedPapers } from '@/lib/repository/savedPapers';
import { similarityPairs } from '@/lib/embeddings';
import { getPaperReferences } from '@/lib/api/semanticScholar';
import type { SavedPaper, Paper } from '@/types/paper';
import type { GraphData, GraphNode, GraphEdge, NodeType } from '@/types/graph';
import { coAuthorPairs } from '@/components/graph/shared/relations';

const MAX_EXTERNAL_LOOKUPS = 12; // cap S2 calls per graph build (keyless rate limits)

function nodeType(saved: SavedPaper): NodeType {
  if (saved.isSeed) return 'seed';
  if (saved.paper.citationCount >= 10000) return 'influential';
  return 'cited';
}

function normDoi(doi?: string): string | null {
  return doi ? doi.trim().toLowerCase() : null;
}

/**
 * Builds a knowledge graph for a project's saved library.
 *   nodes = saved papers (typed seed / influential / cited)
 *   edges = citation links discovered via Semantic Scholar references
 *           (both endpoints must be in the saved set), plus a field-of-study
 *           overlap fallback tagged as semantic_similarity so the graph is
 *           still meaningful when external lookups are unavailable.
 */
export async function buildProjectGraph(userId: string, projectId: string): Promise<GraphData> {
  const saved = await listSavedPapers(userId, projectId);

  const nodes: GraphNode[] = saved.map((s) => ({
    id: s.paper.id,
    paper: s.paper,
    type: nodeType(s),
    isBookmarked: s.isSeed,
  }));

  // Lookup: identifier -> our node id (the papers-row UUID).
  const byDoi = new Map<string, string>();
  const byArxiv = new Map<string, string>();
  for (const s of saved) {
    const doi = normDoi(s.paper.doi);
    if (doi) byDoi.set(doi, s.paper.id);
    if (s.paper.arxivId) byArxiv.set(s.paper.arxivId.trim(), s.paper.id);
  }

  const edges: GraphEdge[] = [];
  const edgeKeys = new Set<string>();

  function addEdge(
    source: string,
    target: string,
    type: GraphEdge['type'],
    weight?: number,
    names?: string[]
  ) {
    if (source === target) return;
    // Citations are directed, so A->B and B->A are different facts and must both
    // survive; the undirected types collapse to one edge per pair.
    const key =
      type === 'citation' ? `${source}>${target}|citation` : [source, target].sort().join('|') + `|${type}`;
    if (edgeKeys.has(key)) return;
    edgeKeys.add(key);
    edges.push({ id: `e${edges.length}`, source, target, type, weight, names });
  }

  // Citation edges via Semantic Scholar references (best-effort, capped).
  const lookupTargets = saved
    .filter((s) => s.paper.doi || s.paper.arxivId)
    .slice(0, MAX_EXTERNAL_LOOKUPS);

  await Promise.allSettled(
    lookupTargets.map(async (s) => {
      const identifier = s.paper.doi ? `DOI:${s.paper.doi}` : `arXiv:${s.paper.arxivId}`;
      let refs: Paper[] = [];
      try {
        refs = await getPaperReferences(identifier, 50);
      } catch {
        return;
      }
      for (const ref of refs) {
        const targetId = normDoi(ref.doi) ? byDoi.get(normDoi(ref.doi)!) : ref.arxivId ? byArxiv.get(ref.arxivId.trim()) : undefined;
        if (targetId) addEdge(s.paper.id, targetId, 'citation');
      }
    })
  );

  // Real semantic edges from embedding cosine similarity. Additive to citation
  // edges — two papers can be both cited and topically close.
  let semanticEdgeCount = 0;
  if (nodes.length > 1) {
    try {
      const pairs = await similarityPairs(nodes.map((n) => n.id));
      for (const pair of pairs) {
        const before = edges.length;
        addEdge(pair.a, pair.b, 'semantic_similarity', pair.similarity);
        if (edges.length > before) semanticEdgeCount++;
      }
    } catch {
      // Embeddings unavailable (no key, migration not applied) — fall through.
    }
  }

  // Fallback: field-of-study overlap, so a library with no embeddings and no
  // resolvable citations still shows structure rather than a scatter of dots.
  if (edges.length === 0 && semanticEdgeCount === 0 && nodes.length > 1) {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = new Set(nodes[i]!.paper.fieldsOfStudy);
        const shared = nodes[j]!.paper.fieldsOfStudy.filter((f) => a.has(f)).length;
        // Overlap as a 0..1 share of the smaller field list, so `weight` means the
        // same kind of thing here as the cosine similarity it stands in for.
        const smaller = Math.min(a.size, nodes[j]!.paper.fieldsOfStudy.length) || 1;
        if (shared >= 2) addEdge(nodes[i]!.id, nodes[j]!.id, 'semantic_similarity', shared / smaller);
      }
    }
  }

  // Shared authors (name-matched heuristic, see coAuthorPairs). Added last so it
  // never counts as "structure" for the fallback above.
  const pairs = coAuthorPairs(nodes.map((n) => ({ id: n.id, authors: n.paper.authors.map((a) => a.name) })));
  for (const { a, b, names } of pairs) addEdge(a, b, 'co_author', undefined, names);

  return { nodes, edges };
}
