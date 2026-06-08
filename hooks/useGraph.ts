'use client';

import { useState, useCallback } from 'react';
import type { GraphData, HeatmapMode } from '@/types/graph';
import { MOCK_GRAPH_DATA } from '@/lib/mockData';

export function useGraph(projectId: string) {
  const [graphData, setGraphData] = useState<GraphData>(MOCK_GRAPH_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [heatmapMode, setHeatmapMode] = useState<HeatmapMode>('type');
  const [showMinimap, setShowMinimap] = useState(true);

  const fetchGraph = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/graph?projectId=${projectId}`);
      if (!res.ok) throw new Error('Failed to load graph');
      const data = (await res.json()) as GraphData;
      setGraphData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  return { graphData, loading, error, heatmapMode, setHeatmapMode, showMinimap, setShowMinimap, fetchGraph };
}
