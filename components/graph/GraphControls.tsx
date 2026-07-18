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

const iconBtn = 'p-2 border-2 border-black bg-white text-black hover:bg-black hover:text-white transition-colors';

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
