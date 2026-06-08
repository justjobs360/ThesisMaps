'use client';

import type { Metadata } from 'next';
import { ReactFlowProvider } from 'reactflow';
import { PageHeader } from '@/components/layout/PageHeader';
import { KnowledgeGraph } from '@/components/graph/KnowledgeGraph';
import { useGraph } from '@/hooks/useGraph';

export default function GraphPage() {
  const { graphData, loading, heatmapMode, setHeatmapMode, showMinimap, setShowMinimap } = useGraph('proj1');

  return (
    <div className="flex flex-col h-[calc(100vh-52px-48px)] -m-6">
      <div className="px-6 py-4 border-b border-border bg-background flex-shrink-0">
        <PageHeader title="Knowledge Graph" subtitle="Explore citation networks and semantic connections across your library." />
      </div>

      <div className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center h-full bg-graph-bg">
            <p className="text-white/40 font-sans text-sm">Loading graph…</p>
          </div>
        ) : (
          <ReactFlowProvider>
            <KnowledgeGraph
              data={graphData}
              showMinimap={showMinimap}
              heatmapMode={heatmapMode}
            />
          </ReactFlowProvider>
        )}
      </div>
    </div>
  );
}
