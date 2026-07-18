'use client';

import { useState, useCallback, useEffect } from 'react';
import type { GraphData, HeatmapMode } from '@/types/graph';
import { apiClient } from '@/lib/apiClient';

const EMPTY_GRAPH: GraphData = { nodes: [], edges: [] };

export function useGraph(projectId: string) {
  const [graphData, setGraphData] = useState<GraphData>(EMPTY_GRAPH);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [heatmapMode, setHeatmapMode] = useState<HeatmapMode>('type');
  const [showMinimap, setShowMinimap] = useState(true);

  const fetchGraph = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get<GraphData>(`/api/graph?projectId=${projectId}`);
      setGraphData({ nodes: data.nodes ?? [], edges: data.edges ?? [] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load graph');
      setGraphData(EMPTY_GRAPH);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void fetchGraph();
  }, [fetchGraph]);

  return { graphData, loading, error, heatmapMode, setHeatmapMode, showMinimap, setShowMinimap, fetchGraph };
}
