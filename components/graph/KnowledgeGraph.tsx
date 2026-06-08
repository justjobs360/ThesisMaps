'use client';

import React, { useCallback, useState } from 'react';
import ReactFlow, {
  Background, MiniMap, useNodesState, useEdgesState, useReactFlow,
  type Node, type Edge, type NodeMouseHandler,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookmarkPlus, Expand, Search } from 'lucide-react';
import { PaperNode } from './PaperNode';
import { edgeTypes } from './EdgeTypes';
import { GraphControls } from './GraphControls';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { GraphData, HeatmapMode, GraphNode } from '@/types/graph';
import type { Paper } from '@/types/paper';

const nodeTypes = { paper: PaperNode };

function toReactFlowNodes(graphNodes: GraphNode[]): Node[] {
  return graphNodes.map((gn, i) => ({
    id: gn.id,
    type: 'paper',
    data: gn,
    position: { x: (i % 4) * 240 - 360, y: Math.floor(i / 4) * 130 - 200 },
  }));
}

function toReactFlowEdges(graphEdges: { id: string; source: string; target: string; type: string }[]): Edge[] {
  return graphEdges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    type: e.type,
  }));
}

type KnowledgeGraphProps = {
  data: GraphData;
  showMinimap: boolean;
  heatmapMode: HeatmapMode;
};

export function KnowledgeGraph({ data, showMinimap, heatmapMode }: KnowledgeGraphProps) {
  const [nodes, , onNodesChange] = useNodesState(toReactFlowNodes(data.nodes));
  const [edges, , onEdgesChange] = useEdgesState(toReactFlowEdges(data.edges));
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  const onNodeClick: NodeMouseHandler = useCallback((_, node) => {
    const graphNode = node.data as GraphNode;
    setSelectedPaper(graphNode.paper);
  }, []);

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
            style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)' }}
            maskColor="rgba(0,0,0,0.6)"
            nodeColor={() => '#4B5563'}
          />
        ) : null}
      </ReactFlow>

      <GraphControls
        onZoomIn={() => void zoomIn()}
        onZoomOut={() => void zoomOut()}
        onFitView={() => void fitView()}
        showMinimap={showMinimap}
        onToggleMinimap={() => undefined}
        heatmapMode={heatmapMode}
        onHeatmapChange={() => undefined}
        onExport={() => undefined}
      />

      {/* Node detail panel */}
      <AnimatePresence>
        {selectedPaper ? (
          <motion.aside
            key="node-panel"
            initial={{ x: 340, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 340, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="absolute top-0 right-0 h-full w-[340px] bg-surface border-l border-border overflow-y-auto z-20"
            aria-label="Paper details"
          >
            <div className="p-5">
              <div className="flex items-start justify-between gap-2 mb-4">
                <h2 className="font-sans font-semibold text-text-primary text-sm leading-snug flex-1">
                  {selectedPaper.title}
                </h2>
                <button
                  onClick={() => setSelectedPaper(null)}
                  aria-label="Close panel"
                  className="p-1 rounded hover:bg-background text-text-muted transition-colors flex-shrink-0"
                >
                  <X size={16} strokeWidth={1.5} />
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="muted">{selectedPaper.year}</Badge>
                <Badge variant="muted">{selectedPaper.citationCount.toLocaleString()} citations</Badge>
                {selectedPaper.openAccess ? <Badge variant="success">Open Access</Badge> : null}
              </div>

              <p className="text-xs text-text-muted font-sans mb-3">
                {selectedPaper.authors.slice(0, 4).map((a) => a.name).join(', ')}
              </p>

              {selectedPaper.abstract ? (
                <p className="text-xs text-text-primary font-sans leading-relaxed line-clamp-6 mb-4">
                  {selectedPaper.abstract}
                </p>
              ) : null}

              <div className="flex flex-col gap-2">
                <Button size="sm" variant="primary">
                  <BookmarkPlus size={14} strokeWidth={1.5} /> Save to project
                </Button>
                <Button size="sm" variant="secondary">
                  <Expand size={14} strokeWidth={1.5} /> Expand citations
                </Button>
                <Button size="sm" variant="ghost">
                  <Search size={14} strokeWidth={1.5} /> Find similar papers
                </Button>
              </div>
            </div>
          </motion.aside>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
