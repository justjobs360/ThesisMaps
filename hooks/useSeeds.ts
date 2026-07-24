'use client';

import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';
import type { SeedSet } from '@/types/thesis';
import type { Paper } from '@/types/paper';

export function useSeeds(projectId: string) {
  const [seedSets, setSeedSets] = useState<SeedSet[]>([]);
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [papersLoading, setPapersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSets = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const { seedSets: data } = await apiClient.get<{ seedSets: SeedSet[] }>(
        `/api/seeds?projectId=${projectId}`
      );
      setSeedSets(data);
      setSelectedSetId((cur) => cur ?? data[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load seed sets');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void fetchSets();
  }, [fetchSets]);

  const loadPapers = useCallback(
    async (seedSetId: string) => {
      if (!projectId) return;
      setPapersLoading(true);
      try {
        const { papers: data } = await apiClient.get<{ papers: Paper[] }>(
          `/api/seeds?projectId=${projectId}&seedSetId=${seedSetId}`
        );
        setPapers(data);
      } catch {
        setPapers([]);
      } finally {
        setPapersLoading(false);
      }
    },
    [projectId]
  );

  useEffect(() => {
    if (selectedSetId) void loadPapers(selectedSetId);
    else setPapers([]);
  }, [selectedSetId, loadPapers]);

  const createSet = useCallback(
    async (name: string, paperIds: string[]) => {
      if (!projectId) return;
      try {
        const { seedSet } = await apiClient.post<{ seedSet: SeedSet }>('/api/seeds', {
          projectId,
          name,
          paperIds,
        });
        setSeedSets((prev) => [seedSet, ...prev]);
        setSelectedSetId(seedSet.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create seed set');
        throw err;
      }
    },
    [projectId]
  );

  const deleteSet = useCallback(
    async (seedSetId: string) => {
      if (!projectId) return;
      try {
        await apiClient.del('/api/seeds', { projectId, seedSetId });
        setSeedSets((prev) => prev.filter((s) => s.id !== seedSetId));
        setSelectedSetId((cur) => (cur === seedSetId ? null : cur));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete seed set');
      }
    },
    [projectId]
  );

  const selectedSet = seedSets.find((s) => s.id === selectedSetId) ?? null;

  return {
    seedSets,
    selectedSet,
    selectedSetId,
    setSelectedSetId,
    papers,
    loading,
    papersLoading,
    error,
    createSet,
    deleteSet,
    refresh: fetchSets,
  };
}
