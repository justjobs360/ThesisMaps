'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactFlow, {
  Background, MiniMap, useNodesState, useEdgesState, useReactFlow, useViewport,
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
import { radiusMap } from './nodeSize';
import { useForceLayout } from './useForceLayout';
import { HoverCard } from './shared/HoverCard';
import { byline, shortLabel } from './shared/labels';
import { estimateLabelWidth, pickLabels } from './shared/labelLayout';
import {
  RELATION_KINDS, RELATION_LABEL, ROLE_HINT, ROLE_LABEL, computeFocus, getRelations,
  type Related, type RelationKind,
} from './shared/relations';
import { Badge } from '@/components/ui/Badge';
import type { GraphData, HeatmapMode, NodeSizeMode, GraphViewMode } from '@/types/graph';

const nodeTypes = { paper: PaperNode };

const EDGE_COLORS: Record<string, string> = {
  citation: '#000000',
  semantic_similarity: '#0066FF',
  co_author: '#000000',
};

const LABEL_FONT_PX = 11;
const PANEL_W = 340;
/** Grace period so the cursor can cross from a node into its card. */
const HOVER_CLOSE_MS = 160;

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

const ALL_KINDS = new Set<RelationKind>(RELATION_KINDS);

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
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  /** Related papers under the pointer inside the hover card or panel. */
  const [peek, setPeek] = useState<ReadonlySet<string> | null>(null);
  /** Relation types the pinned selection is filtered to. */
  const [kinds, setKinds] = useState<ReadonlySet<RelationKind>>(ALL_KINDS);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [bounds, setBounds] = useState({ w: 0, h: 0 });
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => setBounds({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

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

  const labelOf = useMemo(() => {
    const m = new Map(data.nodes.map((n) => [n.id, shortLabel(n.paper.authors, n.paper.year, n.paper.title)]));
    return (id: string) => m.get(id) ?? '';
  }, [data.nodes]);

  const selectedNode = useMemo(() => data.nodes.find((n) => n.id === selectedId) ?? null, [data.nodes, selectedId]);
  const selectedPaper = selectedNode?.paper ?? null;

  /** Hover wins over the pinned selection while the pointer is on a paper. */
  const focusId = hoveredId ?? selectedId;

  const focus = useMemo(() => {
    if (!focusId) return null;
    // The relation chips filter the pinned selection only; hovering shows everything.
    const filter = hoveredId || kinds.size === ALL_KINDS.size ? null : kinds;
    return computeFocus(focusId, data.edges, filter, peek);
  }, [focusId, hoveredId, kinds, peek, data.edges]);

  const [nodes, setNodes, onNodesChange] = useNodesState<PaperNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<GraphEdgeData>([]);

  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const viewport = useViewport();
  // Bucketed so the label pass re-runs per zoom step, not per wheel tick.
  const zoomBucket = Math.max(0.1, Math.round(viewport.zoom * 4) / 4);

  /**
   * Which papers earn a resting label. Zooming in frees space (the pill is a fixed
   * screen size, so it covers fewer flow units), so more labels appear as you get
   * closer; zoomed out, only the most-cited papers that clear each other keep one.
   */
  const labelled = useMemo(() => {
    const items = data.nodes.map((n) => {
      const p = positions.get(n.id) ?? { x: 0, y: 0 };
      const text = labelOf(n.id);
      return {
        id: n.id,
        x: p.x,
        y: p.y,
        r: radii.get(n.id) ?? 20,
        priority: (n.paper.citationCount || 0) + (n.type === 'seed' ? 1e9 : 0),
        w: estimateLabelWidth(text, LABEL_FONT_PX) / zoomBucket,
        h: (LABEL_FONT_PX + 8) / zoomBucket,
      };
    });
    const pinned = new Set(data.nodes.filter((n) => n.type === 'seed').map((n) => n.id));
    return pickLabels(items, { pinned, max: data.nodes.length > 40 ? 30 : Infinity, gap: 4 / zoomBucket });
  }, [data.nodes, positions, radii, labelOf, zoomBucket]);

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
            focused: false,
            label: labelOf(gn.id),
            showLabel: labelled.has(gn.id),
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
          dimmed: focus ? !focus.nodes.has(n.id) : false,
          highlighted: focus ? focus.nodes.has(n.id) : false,
          focused: focusId === n.id,
          label: labelOf(n.id),
          showLabel: labelled.has(n.id),
        },
      }))
    );
  }, [heatmapMode, maxCitations, yearRange, focus, focusId, radii, labelled, labelOf, setNodes]);

  useEffect(() => {
    const next: Edge<GraphEdgeData>[] = data.edges.map((e) => {
      const state = focus?.edges.get(e.id);
      const visual = !focus ? 'idle' : state === 'peek' ? 'peek' : state === 'on' ? 'on' : 'dim';
      return {
        id: e.id,
        source: e.source,
        target: e.target,
        type: e.type,
        zIndex: visual === 'on' || visual === 'peek' ? 10 : 0,
        data: { visual, weight: e.weight },
      };
    });
    setEdges(next);
  }, [data.edges, focus, setEdges]);

  // Fit AFTER the nodes have been measured. ReactFlow's `fitView` prop runs at
  // mount, when nodes are still at their default position and have no measured
  // size, so it zoomed all the way in to a zero-size bounding box — which is why
  // the graph opened far too close to show any papers.
  useEffect(() => {
    if (nodes.length === 0) return;
    const t = setTimeout(() => void fitView({ padding: 0.25, duration: 300 }), 120);
    return () => clearTimeout(t);
  }, [positions, nodes.length, fitView]);

  // --- hover with a grace period ---
  const cancelClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  }, []);
  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimer.current = setTimeout(() => {
      setHoveredId(null);
      setPeek(null);
    }, HOVER_CLOSE_MS);
  }, [cancelClose]);
  const closeNow = useCallback(() => {
    cancelClose();
    setHoveredId(null);
    setPeek(null);
  }, [cancelClose]);
  useEffect(() => cancelClose, [cancelClose]);

  const onNodeMouseEnter: NodeMouseHandler = useCallback(
    (_, node) => {
      cancelClose();
      setHoveredId(node.id);
    },
    [cancelClose]
  );

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

  const select = useCallback(
    (id: string) => {
      closeNow();
      setSelectedId(id);
      setKinds(ALL_KINDS);
      setSimilar(null);
      setSimilarNote(null);
    },
    [closeNow]
  );

  const onNodeClick: NodeMouseHandler = useCallback((_, node) => select(node.id), [select]);

  const clearSelection = useCallback(() => {
    closeNow();
    setSelectedId(null);
    setKinds(ALL_KINDS);
  }, [closeNow]);

  const toggleKind = useCallback((k: RelationKind) => {
    setKinds((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  }, []);

  // --- hover card ---
  const hoverNode = hoveredId ? nodes.find((n) => n.id === hoveredId) : undefined;
  const hoverData = hoverNode ? data.nodes.find((n) => n.id === hoverNode.id) : undefined;
  const hoverRelations = useMemo(
    () => (hoveredId ? getRelations(hoveredId, data.edges) : null),
    [hoveredId, data.edges]
  );
  const cardBounds = { w: Math.max(0, bounds.w - (selectedPaper ? PANEL_W : 0)), h: bounds.h };

  const selectedRelations = useMemo(
    () => (selectedId ? getRelations(selectedId, data.edges) : null),
    [selectedId, data.edges]
  );

  const handleExport = useCallback(() => {
    if (nodes.length === 0) return;
    const pad = 90;
    // Positions are centres (nodeOrigin 0.5/0.5). The +40 on the vertical
    // extent leaves room for the label block beneath each node.
    const pts = nodes.map((n) => ({ x: n.position.x, y: n.position.y, r: n.data.radius }));
    const minX = Math.min(...pts.map((p) => p.x - p.r));
    const minY = Math.min(...pts.map((p) => p.y - p.r));
    const width = Math.max(...pts.map((p) => p.x + p.r)) - minX + pad * 2;
    const height = Math.max(...pts.map((p) => p.y + p.r + 40)) - minY + pad * 2;
    const pos = new Map(nodes.map((n) => [n.id, { x: n.position.x - minX + pad, y: n.position.y - minY + pad }]));

    const edgeSvg = data.edges
      // Shared authorship is a focus-only overlay on screen; keep the export clean.
      .filter((e) => e.type !== 'co_author')
      .map((e) => {
        const s = pos.get(e.source);
        const t = pos.get(e.target);
        if (!s || !t) return '';
        const color = EDGE_COLORS[e.type] ?? '#000000';
        const dash = e.type === 'semantic_similarity' ? '6 4' : 'none';
        return `<line x1="${s.x}" y1="${s.y}" x2="${t.x}" y2="${t.y}" stroke="${color}" stroke-width="1.5" stroke-dasharray="${dash}" opacity="0.45"/>`;
      })
      .join('');

    const nodeSvg = nodes
      .map((n) => {
        const c = pos.get(n.id);
        if (!c) return '';
        const fill = nodeColor(n.data, heatmapMode, maxCitations, yearRange);
        const r = n.data.radius;
        const label = n.data.label.replace(/[<&>]/g, '');
        // Offset shadow first, then the node, matching the on-screen treatment.
        return `<g><circle cx="${c.x + 5}" cy="${c.y + 5}" r="${r}" fill="#000000"/><circle cx="${c.x}" cy="${c.y}" r="${r}" fill="${fill}" stroke="#000000" stroke-width="3"/><text x="${c.x}" y="${c.y + r + 18}" text-anchor="middle" fill="#000000" font-family="sans-serif" font-size="11" font-weight="700">${label}</text></g>`;
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
  }, [nodes, data.edges, heatmapMode, maxCitations, yearRange]);

  const rowsOf = (kind: RelationKind, rel: NonNullable<typeof selectedRelations>): Related[] =>
    kind === 'buildsOn' ? rel.buildsOn : kind === 'builtOnBy' ? rel.builtOnBy : kind === 'similar' ? rel.similar : rel.coAuthors;

  return (
    <div ref={containerRef} className="relative w-full h-full bg-graph-bg overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onNodeMouseEnter={onNodeMouseEnter}
        onNodeMouseLeave={scheduleClose}
        onNodeDragStart={closeNow}
        onMoveStart={closeNow}
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

      {/* Hover card — an HTML overlay so the pointer can move into it. */}
      {hoverNode && hoverData && hoverRelations && !(selectedPaper && hoveredId === selectedId) ? (
        <HoverCard
          anchor={{
            x: hoverNode.position.x * viewport.zoom + viewport.x,
            y: hoverNode.position.y * viewport.zoom + viewport.y,
            r: (radii.get(hoverNode.id) ?? 20) * viewport.zoom + 6,
          }}
          bounds={cardBounds}
          topInset={56}
          paper={{
            label: labelOf(hoverNode.id),
            title: hoverData.paper.title,
            byline: byline(hoverData.paper.authors),
            year: hoverData.paper.year || null,
            citations: hoverData.paper.citationCount || 0,
            url: hoverData.paper.url,
          }}
          role={hoverRelations.role}
          relations={hoverRelations}
          labelOf={labelOf}
          onEnter={cancelClose}
          onLeave={scheduleClose}
          onPeek={setPeek}
          onPick={select}
          footer={<p className="text-[10px] font-sans font-black uppercase tracking-widest text-black/45">Click the paper to pin this view</p>}
        />
      ) : null}

      {/* Legend — reflects what size, colour and line style currently encode. */}
      <div className="absolute bottom-4 left-4 z-10 bg-white border-2 border-black p-3 hidden sm:block max-w-[230px]">
        <p className="text-[9px] font-sans font-black uppercase tracking-[0.2em] text-black mb-2">Legend</p>
        <div className="flex items-end gap-1.5 mb-2">
          <span className="rounded-full border-2 border-black bg-accent" style={{ width: 10, height: 10 }} />
          <span className="rounded-full border-2 border-black bg-accent" style={{ width: 17, height: 17 }} />
          <span className="rounded-full border-2 border-black bg-accent" style={{ width: 25, height: 25 }} />
          <span className="text-[9px] font-sans font-bold uppercase tracking-wider text-black/60 ml-1">
            {sizeMode === 'connections' ? 'Connections' : sizeMode === 'uniform' ? 'Uniform' : 'Citations'}
          </span>
        </div>
        <ul className="space-y-1 mb-2 text-[9px] font-sans font-bold uppercase tracking-wider text-black/60">
          <li className="flex items-center gap-2">
            <span className="inline-block w-6" style={{ borderTop: '2px solid #000' }} aria-hidden /> Cites (flows to citer)
          </li>
          <li className="flex items-center gap-2">
            <span className="inline-block w-6" style={{ borderTop: '2px dashed #0066FF' }} aria-hidden /> Close in meaning
          </li>
          <li className="flex items-center gap-2">
            <span className="inline-block w-6" style={{ borderTop: '2px dotted #000' }} aria-hidden /> Shared authors
          </li>
        </ul>
        <p className="text-[9px] font-sans font-bold uppercase tracking-wider text-black/50 leading-snug">
          {viewMode === 'timeline' ? 'Left to right = older to newer' : 'Closer together = more related'}
        </p>
        <p className="text-[9px] font-sans text-black/40 mt-1 leading-snug">Hover a paper to trace its links. Click to pin.</p>
      </div>

      {/* Node detail panel */}
      <AnimatePresence>
        {selectedPaper && selectedRelations ? (
          <motion.aside
            key="node-panel"
            initial={{ x: PANEL_W, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: PANEL_W, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="absolute top-0 right-0 h-full bg-white border-l-2 border-black overflow-y-auto z-20"
            style={{ width: PANEL_W }}
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

              {/* Role in this map: derived from the citation links, so it says
                  something about the library rather than the paper in general. */}
              <div className="mb-4 border-2 border-black p-2.5">
                <p className="text-[10px] font-sans font-black uppercase tracking-[0.18em] text-black">
                  {ROLE_LABEL[selectedRelations.role]}
                  <span className="text-black/40"> · in this map</span>
                </p>
                <p className="mt-1 text-[11px] font-sans text-black/60 leading-snug">{ROLE_HINT[selectedRelations.role]}</p>
              </div>

              {/* Relation filter: read lineage, meaning and authorship one at a time. */}
              <div className="mb-3" role="group" aria-label="Show relationships">
                <div className="flex flex-wrap gap-1.5">
                  {RELATION_KINDS.map((k) => {
                    const count = rowsOf(k, selectedRelations).length;
                    const on = kinds.has(k);
                    return (
                      <button
                        key={k}
                        type="button"
                        aria-pressed={on}
                        disabled={count === 0}
                        onClick={() => toggleKind(k)}
                        className={[
                          'h-7 px-2 border-2 border-black text-[9px] font-sans font-black uppercase tracking-widest transition-colors duration-150 disabled:opacity-30 disabled:cursor-not-allowed',
                          on ? 'bg-black text-white' : 'bg-white text-black hover:bg-black/5',
                        ].join(' ')}
                      >
                        {RELATION_LABEL[k]} {count}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3 mb-4">
                {RELATION_KINDS.filter((k) => kinds.has(k)).map((k) => {
                  const rows = rowsOf(k, selectedRelations);
                  if (rows.length === 0) return null;
                  return (
                    <section key={k} aria-label={RELATION_LABEL[k]}>
                      <h3 className="text-[10px] font-sans font-black uppercase tracking-[0.18em] text-black/50 mb-1">
                        {RELATION_LABEL[k]}
                      </h3>
                      <ul>
                        {rows.map((r) => (
                          <li key={r.edgeId}>
                            <button
                              type="button"
                              onMouseEnter={() => setPeek(new Set([r.id]))}
                              onMouseLeave={() => setPeek(null)}
                              onFocus={() => setPeek(new Set([r.id]))}
                              onBlur={() => setPeek(null)}
                              onClick={() => select(r.id)}
                              className="w-full flex items-baseline justify-between gap-3 px-1.5 -mx-1.5 py-0.5 text-left text-[12px] font-sans font-bold text-black hover:bg-black hover:text-white focus-visible:bg-black focus-visible:text-white outline-none transition-colors duration-150"
                            >
                              <span className="truncate">{labelOf(r.id)}</span>
                              <span className="shrink-0 text-[10px] font-semibold opacity-60">
                                {k === 'similar' && r.score != null
                                  ? `${Math.round(r.score * 100)}%`
                                  : k === 'coAuthor' && r.names?.length
                                    ? r.names.length > 1
                                      ? `${r.names[0]} +${r.names.length - 1}`
                                      : r.names[0]
                                    : ''}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </section>
                  );
                })}
                {RELATION_KINDS.every((k) => rowsOf(k, selectedRelations).length === 0) ? (
                  <p className="text-[11px] font-sans text-black/50 leading-snug">
                    No links to the other papers in this map yet. Save related work to connect it.
                  </p>
                ) : null}
              </div>

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
