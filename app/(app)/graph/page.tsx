'use client';

import { ReactFlowProvider } from 'reactflow';
import { PageHeader } from '@/components/layout/PageHeader';
import { KnowledgeGraph } from '@/components/graph/KnowledgeGraph';
import { useGraph } from '@/hooks/useGraph';
import { useProject } from '@/hooks/useProject';
import { Network } from 'lucide-react';

export default function GraphPage() {
  const { projectId } = useProject();
  const { graphData, loading, error, heatmapMode, setHeatmapMode, showMinimap, setShowMinimap } = useGraph(projectId);

  const isEmpty = !loading && graphData.nodes.length === 0;

  return (
    <div className="flex flex-col h-[calc(100vh-64px-72px)] -m-6 md:-m-12">
      <div className="px-6 md:px-12 py-4 border-b-2 border-black bg-white flex-shrink-0">
        <PageHeader title="Knowledge Graph" subtitle="Explore citation networks and semantic connections across your library." />
      </div>

      <div className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center h-full bg-graph-bg">
            <p className="text-black/50 font-sans font-black uppercase tracking-[0.2em] text-[10px] animate-pulse">
              Constructing graph…
            </p>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full bg-graph-bg">
            <p className="text-black/50 font-sans font-bold uppercase tracking-widest text-[10px]">{error}</p>
          </div>
        ) : isEmpty ? (
          <div className="flex items-center justify-center h-full bg-graph-bg">
            <div className="text-center max-w-sm px-6">
              <Network size={48} strokeWidth={1} className="text-black/20 mx-auto mb-6" />
              <p className="text-[10px] font-sans font-black uppercase tracking-[0.2em] text-black mb-2">Graph Is Empty</p>
              <p className="text-xs font-sans text-black/40">
                Save papers from Search to populate your knowledge graph.
              </p>
            </div>
          </div>
        ) : (
          <ReactFlowProvider>
            <KnowledgeGraph
              data={graphData}
              showMinimap={showMinimap}
              heatmapMode={heatmapMode}
              onToggleMinimap={() => setShowMinimap((v) => !v)}
              onHeatmapChange={setHeatmapMode}
            />
          </ReactFlowProvider>
        )}
      </div>
    </div>
  );
}
