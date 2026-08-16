'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ReactFlow, {
  Background, MiniMap, useNodesState, useEdgesState, useReactFlow,
  type Node, type Edge, type NodeMouseHandler,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Sparkles } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { PaperNode, type PaperNodeData } from './PaperNode';
import { edgeTypes, type GraphEdgeData } from './EdgeTypes';
import { GraphControls } from './GraphControls';
import { nodeColor } from './nodeColor';
import { radiusMap, nodeBox } from './nodeSize';
import { useForceLayout } from './useForceLayout';
import { Badge } from '@/components/ui/Badge';
import type { GraphData, HeatmapMode, GraphNode, NodeSizeMode, GraphViewMode } from '@/types/graph';
import type { Paper } from '@/types/paper';

const nodeTypes = { paper: PaperNode };

const EDGE_COLORS: Record<string, string> = {
  citation: '#64748B',
  semantic_similarity: '#0066FF',
  co_author: '#94A3B8',
};

/** Below this many nodes, every label stays on; above it, only the larger ones. */
const LABEL_ALL_BELOW = 14;

type SimilarPaper = { id: string; title: string; year: number | null; similarity: number };

type KnowledgeGraphProps = {
  data: GraphData;
  showMinimap: boolean;
  heatmapMode: HeatmapMode;
  onToggleMinimap: () => void;
  onHeatmapChange: (mode: HeatmapMode) => void;
  /** Enables the "Find similar papers" action in the node detail panel. */
  projectId?: string;
};

export function KnowledgeGraph({
  data,
  showMinimap,
  heatmapMode,
  onToggleMinimap,
  onHeatmapChange,
  projectId,
}: KnowledgeGraphProps) {
  const [sizeMode, setSizeMode] = useState<NodeSizeMode>('citations');
  const [viewMode, setViewMode] = useState<GraphViewMode>('cluster');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);

  const maxCitations = useMemo(
    () => data.nodes.reduce((m, n) => Math.max(m, n.paper.citationCount || 0), 0),
    [data.nodes]
  );

  const yearRange = useMemo(() => {
    const years = data.nodes.map((n) => n.paper.year).filter((y) => y > 0);
    return years.length
      ? { min: Math.min(...years), max: Math.max(...years) }
      : { min: 1990, max: new Date().getFullYear() };
  }, [data.nodes]);

  // Radii drive both the visual encoding and the simulation's collision/charge.
  const radii = useMemo(() => radiusMap(data, sizeMode), [data, sizeMode]);

  const positions = useForceLayout(data, radii, viewMode);

  /** The selection plus its direct neighbours — everything else gets dimmed. */
  const neighbours = useMemo(() => {
    if (!selectedId) return null;
    const set = new Set<string>([selectedId]);
    for (const e of data.edges) {
      if (e.source === selectedId) set.add(e.target);
      if (e.target === selectedId) set.add(e.source);
    }
    return set;
  }, [selectedId, data.edges]);

  const [nodes, setNodes, onNodesChange] = useNodesState<PaperNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<GraphEdgeData>([]);

  const labelEverything = data.nodes.length <= LABEL_ALL_BELOW;

  // LAYOUT — runs only when the simulation produces new coordinates (new data,
  // different sizing, or a view-mode switch). Kept separate from the appearance
  // effect below so that selecting or recolouring a node never resets a position
  // the user has dragged.
  useEffect(() => {
    setNodes(
      data.nodes.map((gn) => {
        const radius = radii.get(gn.id) ?? 20;
        return {
          id: gn.id,
          type: 'paper',
          position: positions.get(gn.id) ?? { x: 0, y: 0 },
          data: {
            ...gn,
            heatmapMode,
            maxCitations,
            yearRange,
            radius,
            dimmed: false,
            highlighted: false,
            showLabel: labelEverything || radius > 24,
          },
        };
      })
    );
    // Deliberately keyed on layout inputs only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positions, setNodes]);

  // APPEARANCE — colour, dim/highlight and labels. Rewrites `data` in place and
  // leaves `position` untouched, so dragging survives.
  useEffect(() => {
    setNodes((prev) =>
      prev.map((n) => ({
        ...n,
        data: {
          ...n.data,
          heatmapMode,
          maxCitations,
          yearRange,
          radius: radii.get(n.id) ?? n.data.radius,
          dimmed: neighbours ? !neighbours.has(n.id) : false,
          highlighted: neighbours ? neighbours.has(n.id) : false,
          showLabel: labelEverything || (radii.get(n.id) ?? 20) > 24,
        },
      }))
    );
  }, [heatmapMode, maxCitations, yearRange, neighbours, radii, labelEverything, setNodes]);

  useEffect(() => {
    const next: Edge<GraphEdgeData>[] = data.edges.map((e) => {
      const touchesSelection = selectedId ? e.source === selectedId || e.target === selectedId : false;
      return {
        id: e.id,
        source: e.source,
        target: e.target,
        type: e.type,
        data: { dimmed: selectedId ? !touchesSelection : false, highlighted: touchesSelection },
      };
    });
    setEdges(next);
  }, [data.edges, selectedId, setEdges]);

  const { zoomIn, zoomOut, fitView } = useReactFlow();

  // Fit AFTER the nodes have been measured. ReactFlow's `fitView` prop runs at
  // mount, when nodes are still at their default position and have no measured
  // size, so it zoomed all the way in to a zero-size bounding box — which is why
  // the graph opened far too close to show any papers.
  useEffect(() => {
    if (nodes.length === 0) return;
    const t = setTimeout(() => void fitView({ padding: 0.25, duration: 300 }), 120);
    return () => clearTimeout(t);
  }, [positions, nodes.length, fitView]);

  // --- "Find similar papers" ---
  const [similar, setSimilar] = useState<SimilarPaper[] | null>(null);
  const [similarLoading, setSimilarLoading] = useState(false);
  const [similarNote, setSimilarNote] = useState<string | null>(null);

  const findSimilar = useCallback(async () => {
    if (!selectedPaper || !projectId || similarLoading) return;
    setSimilarLoading(true);
    setSimilarNote(null);
    setSimilar(null);
    try {
      const res = await apiClient.post<{ aiAvailable: boolean; papers: SimilarPaper[] }>(
        '/api/papers/similar',
        { projectId, paperId: selectedPaper.id }
      );
      if (!res.aiAvailable) {
        setSimilarNote('Add OPENAI_API_KEY to .env to enable semantic similarity.');
      } else if (res.papers.length === 0) {
        setSimilarNote('No similar papers yet — save a few more, or run the embedding backfill.');
      }
      setSimilar(res.papers);
    } catch (err) {
      setSimilarNote(err instanceof Error ? err.message : 'Could not find similar papers.');
    } finally {
      setSimilarLoading(false);
    }
  }, [selectedPaper, projectId, similarLoading]);

  const onNodeClick: NodeMouseHandler = useCallback((_, node) => {
    const gn = node.data as GraphNode;
    setSelectedId(gn.id);
    setSelectedPaper(gn.paper);
    setSimilar(null);
    setSimilarNote(null);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedId(null);
    setSelectedPaper(null);
  }, []);

  const handleExport = useCallback(() => {
    if (nodes.length === 0) return;
    const pad = 90;
    // Positions are centres (nodeOrigin 0.5/0.5), so the bounding box has to
    // account for each card's own half-width/half-height.
    const pts = nodes.map((n) => {
      const box = nodeBox(n.data.radius);
      return { x: n.position.x, y: n.position.y, hw: box.w / 2, hh: box.h / 2 };
    });
    const minX = Math.min(...pts.map((p) => p.x - p.hw));
    const minY = Math.min(...pts.map((p) => p.y - p.hh));
    const width = Math.max(...pts.map((p) => p.x + p.hw)) - minX + pad * 2;
    const height = Math.max(...pts.map((p) => p.y + p.hh)) - minY + pad * 2;
    const pos = new Map(nodes.map((n) => [n.id, { x: n.position.x - minX + pad, y: n.position.y - minY + pad }]));

    const edgeSvg = edges
      .map((e) => {
        const s = pos.get(e.source);
        const t = pos.get(e.target);
        if (!s || !t) return '';
        const color = EDGE_COLORS[e.type ?? 'citation'] ?? '#64748B';
        const dash = e.type === 'semantic_similarity' ? '6 3' : e.type === 'co_author' ? '2 2' : 'none';
        return `<line x1="${s.x}" y1="${s.y}" x2="${t.x}" y2="${t.y}" stroke="${color}" stroke-width="1.5" stroke-dasharray="${dash}" opacity="0.4"/>`;
      })
      .join('');

    const nodeSvg = nodes
      .map((n) => {
        const c = pos.get(n.id);
        if (!c) return '';
        const accent = nodeColor(n.data, heatmapMode, maxCitations, yearRange);
        const { w, h } = nodeBox(n.data.radius);
        const x = c.x - w / 2;
        const y = c.y - h / 2;
        const bar = Math.max(6, Math.round(w * 0.045));
        const title = (n.data.paper.title || '').slice(0, 36).replace(/[<&>]/g, '');
        return `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#FFFFFF" stroke="#000000" stroke-width="2"/><rect x="${x}" y="${y}" width="${bar}" height="${h}" fill="${accent}"/><text x="${x + bar + 10}" y="${y + h * 0.42}" fill="#000000" font-family="sans-serif" font-size="${Math.max(10, Math.min(14, Math.round(h * 0.18)))}" font-weight="600">${title}</text><text x="${x + bar + 10}" y="${y + h * 0.72}" fill="#666666" font-family="sans-serif" font-size="${Math.max(9, Math.round(h * 0.14))}">${n.data.paper.year || ''} - ${n.data.paper.citationCount} cit.</text></g>`;
      })
      .join('');

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#FFFFFF"/>${edgeSvg}${nodeSvg}</svg>`;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'thesismaps-graph.svg';
    a.click();
    URL.revokeObjectURL(url);
  }, [nodes, edges, heatmapMode, maxCitations, yearRange]);

  return (
    <div className="relative w-full h-full bg-graph-bg">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onPaneClick={clearSelection}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        // Position refers to the node's centre, which is what the force
        // simulation produces and what makes centre-to-centre edges line up.
        nodeOrigin={[0.5, 0.5]}
        // No `fitView` prop: it fires before nodes are measured. The effect above
        // fits once they exist. minZoom is generous so a wide timeline layout can
        // zoom out far enough to be readable.
        minZoom={0.05}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#D1D5DB" gap={20} size={1} />
        {showMinimap ? (
          <MiniMap
            style={{ background: '#FFFFFF', border: '2px solid #000000' }}
            maskColor="rgba(0,0,0,0.1)"
            nodeColor={(n) =>
              nodeColor((n.data as PaperNodeData) ?? ({} as PaperNodeData), heatmapMode, maxCitations, yearRange)
            }
          />
        ) : null}
      </ReactFlow>

      <GraphControls
        onZoomIn={() => void zoomIn()}
        onZoomOut={() => void zoomOut()}
        onFitView={() => void fitView({ padding: 0.2 })}
        showMinimap={showMinimap}
        onToggleMinimap={onToggleMinimap}
        heatmapMode={heatmapMode}
        onHeatmapChange={onHeatmapChange}
        sizeMode={sizeMode}
        onSizeModeChange={setSizeMode}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onExport={handleExport}
      />

      {/* Legend — reflects what size and colour currently encode. */}
      <div className="absolute bottom-4 left-4 z-10 bg-white border-2 border-black p-3 hidden sm:block max-w-[210px]">
        <p className="text-[9px] font-sans font-black uppercase tracking-[0.2em] text-black mb-2">Legend</p>
        <div className="flex items-end gap-1.5 mb-2">
          <span className="border-2 border-black border-l-4 border-l-accent bg-white" style={{ width: 14, height: 8 }} />
          <span className="border-2 border-black border-l-4 border-l-accent bg-white" style={{ width: 22, height: 11 }} />
          <span className="border-2 border-black border-l-4 border-l-accent bg-white" style={{ width: 30, height: 15 }} />
          <span className="text-[9px] font-sans font-bold uppercase tracking-wider text-black/60 ml-1">
            {sizeMode === 'connections' ? 'Connections' : sizeMode === 'uniform' ? 'Uniform' : 'Citations'}
          </span>
        </div>
        <p className="text-[9px] font-sans font-bold uppercase tracking-wider text-black/50 leading-snug">
          {viewMode === 'timeline' ? 'Left to right = older to newer' : 'Closer together = more related'}
        </p>
        <p className="text-[9px] font-sans text-black/40 mt-1 leading-snug">Click a paper to isolate its links.</p>
      </div>

      {/* Node detail panel */}
      <AnimatePresence>
        {selectedPaper ? (
          <motion.aside
            key="node-panel"
            initial={{ x: 340, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 340, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="absolute top-0 right-0 h-full w-[340px] bg-white border-l-2 border-black overflow-y-auto z-20"
            aria-label="Paper details"
          >
            <div className="p-5">
              <div className="flex items-start justify-between gap-2 mb-4">
                <h2 className="font-serif text-xl font-black text-black leading-snug flex-1 uppercase tracking-tight">
                  {selectedPaper.title}
                </h2>
                <button
                  onClick={clearSelection}
                  aria-label="Close panel"
                  className="p-1 border-2 border-black hover:bg-black hover:text-white text-black transition-colors flex-shrink-0"
                >
                  <X size={16} strokeWidth={2} />
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="muted">{selectedPaper.year || '—'}</Badge>
                <Badge variant="muted">{selectedPaper.citationCount.toLocaleString()} citations</Badge>
                {selectedPaper.openAccess ? <Badge variant="success">Open Access</Badge> : null}
              </div>

              <p className="text-xs text-text-muted font-sans mb-3">
                {selectedPaper.authors.slice(0, 4).map((a) => a.name).join(', ')}
              </p>

              {selectedPaper.abstract ? (
                <p className="text-xs text-black font-sans leading-relaxed line-clamp-6 mb-4">{selectedPaper.abstract}</p>
              ) : null}

              {selectedPaper.url ? (
                <a
                  href={selectedPaper.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full h-10 border-2 border-black bg-black text-white font-sans font-black text-[10px] uppercase tracking-widest hover:bg-accent transition-colors"
                >
                  <ExternalLink size={14} strokeWidth={2} /> Open Source
                </a>
              ) : null}

              {projectId ? (
                <button
                  onClick={() => void findSimilar()}
                  disabled={similarLoading}
                  className="mt-2 flex items-center justify-center gap-2 w-full h-10 border-2 border-black bg-white text-black font-sans font-black text-[10px] uppercase tracking-widest hover:bg-black hover:text-white transition-colors disabled:opacity-50"
                >
                  <Sparkles size={14} strokeWidth={2} />
                  {similarLoading ? 'Searching…' : 'Find Similar Papers'}
                </button>
              ) : null}

              {similarNote ? (
                <p className="mt-3 text-[11px] font-sans text-black/50 leading-relaxed">{similarNote}</p>
              ) : null}

              {similar && similar.length > 0 ? (
                <div className="mt-4">
                  <h3 className="text-[10px] font-sans font-black uppercase tracking-[0.2em] text-black/50 mb-2">
                    Similar in your library
                  </h3>
                  <ul className="space-y-2">
                    {similar.map((s) => (
                      <li key={s.id} className="border-l-2 border-accent pl-2">
                        <p className="text-[11px] font-sans font-bold text-black leading-snug line-clamp-2">{s.title}</p>
                        <p className="text-[10px] font-sans text-black/40 mt-0.5">
                          {s.year || '—'} · {Math.round(s.similarity * 100)}% match
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </motion.aside>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
