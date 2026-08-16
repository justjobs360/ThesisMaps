'use client';

import React from 'react';
import { ZoomIn, ZoomOut, Maximize2, Map, Download, Network, CalendarRange } from 'lucide-react';
import { Select } from '@/components/ui/Select';
import { Tooltip } from '@/components/ui/Tooltip';
import type { HeatmapMode, NodeSizeMode, GraphViewMode } from '@/types/graph';

type GraphControlsProps = {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  showMinimap: boolean;
  onToggleMinimap: () => void;
  heatmapMode: HeatmapMode;
  onHeatmapChange: (mode: HeatmapMode) => void;
  sizeMode: NodeSizeMode;
  onSizeModeChange: (mode: NodeSizeMode) => void;
  viewMode: GraphViewMode;
  onViewModeChange: (mode: GraphViewMode) => void;
  onExport: () => void;
};

// Typed against the unions so a typo is a compile error, not a silent no-op.
const HEATMAP_OPTIONS: { value: HeatmapMode; label: string }[] = [
  { value: 'type', label: 'Color by Type' },
  { value: 'year', label: 'Color by Year' },
  { value: 'recency', label: 'Color by Recency' },
  { value: 'citation', label: 'Color by Citations' },
  { value: 'relevance', label: 'Color by Relevance' },
];

const SIZE_OPTIONS: { value: NodeSizeMode; label: string }[] = [
  { value: 'citations', label: 'Size by Citations' },
  { value: 'connections', label: 'Size by Connections' },
  { value: 'uniform', label: 'Uniform Size' },
];

const iconBtn = 'p-2 border-2 border-black bg-white text-black hover:bg-black hover:text-white transition-colors';

export function GraphControls({
  onZoomIn,
  onZoomOut,
  onFitView,
  showMinimap,
  onToggleMinimap,
  heatmapMode,
  onHeatmapChange,
  sizeMode,
  onSizeModeChange,
  viewMode,
  onViewModeChange,
  onExport,
}: GraphControlsProps) {
  return (
    <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 items-end">
      <div className="flex flex-col gap-1">
        <Tooltip content="Zoom in" side="left">
          <button onClick={onZoomIn} aria-label="Zoom in" className={iconBtn}>
            <ZoomIn size={16} strokeWidth={2} />
          </button>
        </Tooltip>
        <Tooltip content="Zoom out" side="left">
          <button onClick={onZoomOut} aria-label="Zoom out" className={iconBtn}>
            <ZoomOut size={16} strokeWidth={2} />
          </button>
        </Tooltip>
        <Tooltip content="Fit view" side="left">
          <button onClick={onFitView} aria-label="Fit view" className={iconBtn}>
            <Maximize2 size={16} strokeWidth={2} />
          </button>
        </Tooltip>
        <Tooltip content={showMinimap ? 'Hide minimap' : 'Show minimap'} side="left">
          <button
            onClick={onToggleMinimap}
            aria-label="Toggle minimap"
            aria-pressed={showMinimap}
            className={[
              'p-2 border-2 border-black transition-colors',
              showMinimap ? 'bg-black text-white' : 'bg-white text-black hover:bg-black hover:text-white',
            ].join(' ')}
          >
            <Map size={16} strokeWidth={2} />
          </button>
        </Tooltip>
        <Tooltip content="Export as SVG" side="left">
          <button onClick={onExport} aria-label="Export graph as SVG" className={iconBtn}>
            <Download size={16} strokeWidth={2} />
          </button>
        </Tooltip>
      </div>

      {/* Cluster vs timeline: in cluster mode position means relatedness, in
          timeline mode the x-axis is publication year. */}
      <div className="flex border-2 border-black bg-white" role="group" aria-label="Graph layout">
        <Tooltip content="Cluster by relatedness" side="left">
          <button
            onClick={() => onViewModeChange('cluster')}
            aria-pressed={viewMode === 'cluster'}
            aria-label="Cluster view"
            className={[
              'flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-sans font-black uppercase tracking-widest transition-colors',
              viewMode === 'cluster' ? 'bg-black text-white' : 'bg-white text-black hover:bg-black/5',
            ].join(' ')}
          >
            <Network size={13} strokeWidth={2.5} /> Cluster
          </button>
        </Tooltip>
        <Tooltip content="Arrange by publication year" side="left">
          <button
            onClick={() => onViewModeChange('timeline')}
            aria-pressed={viewMode === 'timeline'}
            aria-label="Timeline view"
            className={[
              'flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-sans font-black uppercase tracking-widest border-l-2 border-black transition-colors',
              viewMode === 'timeline' ? 'bg-black text-white' : 'bg-white text-black hover:bg-black/5',
            ].join(' ')}
          >
            <CalendarRange size={13} strokeWidth={2.5} /> Timeline
          </button>
        </Tooltip>
      </div>

      <div className="w-44">
        <Select
          value={sizeMode}
          onValueChange={(v) => onSizeModeChange(v as NodeSizeMode)}
          options={SIZE_OPTIONS}
        />
      </div>

      <div className="w-44">
        <Select
          value={heatmapMode}
          onValueChange={(v) => onHeatmapChange(v as HeatmapMode)}
          options={HEATMAP_OPTIONS}
        />
      </div>
    </div>
  );
}
