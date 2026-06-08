'use client';

import React from 'react';
import { ZoomIn, ZoomOut, Maximize2, Map, Download } from 'lucide-react';
import { Select } from '@/components/ui/Select';
import { Tooltip } from '@/components/ui/Tooltip';
import type { HeatmapMode } from '@/types/graph';

type GraphControlsProps = {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  showMinimap: boolean;
  onToggleMinimap: () => void;
  heatmapMode: HeatmapMode;
  onHeatmapChange: (mode: HeatmapMode) => void;
  onExport: () => void;
};

const HEATMAP_OPTIONS = [
  { value: 'type', label: 'Color by Type' },
  { value: 'recency', label: 'Color by Recency' },
  { value: 'citation', label: 'Color by Citations' },
  { value: 'relevance', label: 'Color by Relevance' },
];

export function GraphControls({
  onZoomIn,
  onZoomOut,
  onFitView,
  showMinimap,
  onToggleMinimap,
  heatmapMode,
  onHeatmapChange,
  onExport,
}: GraphControlsProps) {
  return (
    <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
      <div className="bg-background-dark/90 border border-white/10 rounded-md p-2 flex flex-col gap-1">
        <Tooltip content="Zoom in" side="left">
          <button onClick={onZoomIn} aria-label="Zoom in" className="p-2 rounded hover:bg-white/10 text-white transition-colors">
            <ZoomIn size={16} strokeWidth={1.5} />
          </button>
        </Tooltip>
        <Tooltip content="Zoom out" side="left">
          <button onClick={onZoomOut} aria-label="Zoom out" className="p-2 rounded hover:bg-white/10 text-white transition-colors">
            <ZoomOut size={16} strokeWidth={1.5} />
          </button>
        </Tooltip>
        <Tooltip content="Fit view" side="left">
          <button onClick={onFitView} aria-label="Fit view" className="p-2 rounded hover:bg-white/10 text-white transition-colors">
            <Maximize2 size={16} strokeWidth={1.5} />
          </button>
        </Tooltip>
        <Tooltip content={showMinimap ? 'Hide minimap' : 'Show minimap'} side="left">
          <button
            onClick={onToggleMinimap}
            aria-label="Toggle minimap"
            aria-pressed={showMinimap}
            className={['p-2 rounded transition-colors text-white', showMinimap ? 'bg-white/20' : 'hover:bg-white/10'].join(' ')}
          >
            <Map size={16} strokeWidth={1.5} />
          </button>
        </Tooltip>
        <Tooltip content="Export graph" side="left">
          <button onClick={onExport} aria-label="Export graph" className="p-2 rounded hover:bg-white/10 text-white transition-colors">
            <Download size={16} strokeWidth={1.5} />
          </button>
        </Tooltip>
      </div>

      <div className="bg-background-dark/90 border border-white/10 rounded-md p-2 w-44">
        <Select
          value={heatmapMode}
          onValueChange={(v) => onHeatmapChange(v as HeatmapMode)}
          options={HEATMAP_OPTIONS}
        />
      </div>
    </div>
  );
}
