'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ReactFlow, {
  Background, MiniMap, useNodesState, useEdgesState, useReactFlow,
  type Node, type Edge, type NodeMouseHandler,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink } from 'lucide-react';
import { PaperNode, type PaperNodeData } from './PaperNode';
import { edgeTypes } from './EdgeTypes';
import { GraphControls } from './GraphControls';
import { nodeColor } from './nodeColor';
import { Badge } from '@/components/ui/Badge';
import type { GraphData, HeatmapMode, GraphNode } from '@/types/graph';
import type { Paper } from '@/types/paper';

const nodeTypes = { paper: PaperNode };

function buildNodes(graphNodes: GraphNode[], heatmapMode: HeatmapMode, maxCitations: number): Node<PaperNodeData>[] {
  return graphNodes.map((gn, i) => ({
    id: gn.id,
    type: 'paper',
    data: { ...gn, heatmapMode, maxCitations },
    position: { x: (i % 4) * 240 - 360, y: Math.floor(i / 4) * 130 - 200 },
  }));
}

function buildEdges(graphEdges: GraphData['edges']): Edge[] {
  return graphEdges.map((e) => ({ id: e.id, source: e.source, target: e.target, type: e.type }));
}

const EDGE_COLORS: Record<string, string> = {
  citation: '#CBD5E1',
  semantic_similarity: '#0066FF',
  co_author: '#64748B',
};

type KnowledgeGraphProps = {
  data: GraphData;
  showMinimap: boolean;
  heatmapMode: HeatmapMode;
  onToggleMinimap: () => void;
  onHeatmapChange: (mode: HeatmapMode) => void;
};

export function KnowledgeGraph({ data, showMinimap, heatmapMode, onToggleMinimap, onHeatmapChange }: KnowledgeGraphProps) {
  const maxCitations = useMemo(
    () => data.nodes.reduce((m, n) => Math.max(m, n.paper.citationCount || 0), 0),
    [data.nodes]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState<PaperNodeData>(buildNodes(data.nodes, heatmapMode, maxCitations));
  const [edges, setEdges, onEdgesChange] = useEdgesState(buildEdges(data.edges));
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  // Rebuild fully when the underlying graph data changes.
  useEffect(() => {
    setNodes(buildNodes(data.nodes, heatmapMode, maxCitations));
    setEdges(buildEdges(data.edges));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // Recolour in place (preserving dragged positions) when the heatmap changes.
  useEffect(() => {
    setNodes((prev) => prev.map((n) => ({ ...n, data: { ...n.data, heatmapMode, maxCitations } })));
  }, [heatmapMode, maxCitations, setNodes]);

  const onNodeClick: NodeMouseHandler = useCallback((_, node) => {
    setSelectedPaper((node.data as GraphNode).paper);
  }, []);

  const handleExport = useCallback(() => {
    if (nodes.length === 0) return;
    const W = 180;
    const H = 70;
    const pad = 60;
    const xs = nodes.map((n) => n.position.x);
    const ys = nodes.map((n) => n.position.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const width = Math.max(...xs) - minX + W + pad * 2;
    const height = Math.max(...ys) - minY + H + pad * 2;
    const pos = new Map(nodes.map((n) => [n.id, n.position]));

    const edgeSvg = edges
      .map((e) => {
        const s = pos.get(e.source);
        const t = pos.get(e.target);
        if (!s || !t) return '';
        const x1 = s.x - minX + pad + W;
        const y1 = s.y - minY + pad + H / 2;
        const x2 = t.x - minX + pad;
        const y2 = t.y - minY + pad + H / 2;
        const color = EDGE_COLORS[e.type ?? 'citation'] ?? '#CBD5E1';
        const dash = e.type === 'semantic_similarity' ? '6 3' : e.type === 'co_author' ? '2 2' : 'none';
        return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1.5" stroke-dasharray="${dash}" opacity="0.5"/>`;
      })
      .join('');

    const nodeSvg = nodes
      .map((n) => {
        const x = n.position.x - minX + pad;
        const y = n.position.y - minY + pad;
        const color = nodeColor(n.data, heatmapMode, maxCitations);
        const title = (n.data.paper.title || '').slice(0, 40).replace(/[<&>]/g, '');
        return `<g><rect x="${x}" y="${y}" width="${W}" height="${H}" fill="#111111" stroke="#333333"/><rect x="${x}" y="${y}" width="4" height="${H}" fill="${color}"/><text x="${x + 12}" y="${y + 26}" fill="#ffffff" font-family="sans-serif" font-size="11">${title}</text><text x="${x + 12}" y="${y + 46}" fill="#888888" font-family="sans-serif" font-size="10">${n.data.paper.year || ''} · ${n.data.paper.citationCount} cit.</text></g>`;
      })
      .join('');

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#000000"/>${edgeSvg}${nodeSvg}</svg>`;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'thesismaps-graph.svg';
    a.click();
    URL.revokeObjectURL(url);
  }, [nodes, edges, heatmapMode, maxCitations]);

  return (
    <div className="relative w-full h-full bg-graph-bg">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onPaneClick={() => setSelectedPaper(null)}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        minZoom={0.1}
        maxZoom={3}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#1F2937" gap={20} size={1} />
        {showMinimap ? (
          <MiniMap
            style={{ background: '#0A0A0A', border: '2px solid #000000' }}
            maskColor="rgba(0,0,0,0.6)"
            nodeColor={(n) => nodeColor((n.data as PaperNodeData) ?? ({} as PaperNodeData), heatmapMode, maxCitations)}
          />
        ) : null}
      </ReactFlow>

      <GraphControls
        onZoomIn={() => void zoomIn()}
        onZoomOut={() => void zoomOut()}
        onFitView={() => void fitView()}
        showMinimap={showMinimap}
        onToggleMinimap={onToggleMinimap}
        heatmapMode={heatmapMode}
        onHeatmapChange={onHeatmapChange}
        onExport={handleExport}
      />

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-white border-2 border-black p-3 hidden sm:block">
        <p className="text-[9px] font-sans font-black uppercase tracking-[0.2em] text-black mb-2">Legend</p>
        <ul className="space-y-1">
          {[
            { c: '#0066FF', l: 'Seed / Recent' },
            { c: '#FFFFFF', l: 'Influential' },
            { c: '#94A3B8', l: 'Cited' },
          ].map((item) => (
            <li key={item.l} className="flex items-center gap-2">
              <span className="w-3 h-3 border border-black" style={{ backgroundColor: item.c }} />
              <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-black">{item.l}</span>
            </li>
          ))}
        </ul>
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
                  onClick={() => setSelectedPaper(null)}
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
            </div>
          </motion.aside>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
