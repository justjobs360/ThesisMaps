'use client';

import { useState, useCallback, useEffect } from 'react';
import type { OutlineSection } from '@/types/thesis';
import type { Paper } from '@/types/paper';
import { apiClient } from '@/lib/apiClient';

export function useOutline(projectId: string) {
  const [sections, setSections] = useState<OutlineSection[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sectionPapers, setSectionPapers] = useState<Paper[]>([]);
  const [sectionPapersLoading, setSectionPapersLoading] = useState(false);

  const fetchOutline = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const { sections: data } = await apiClient.get<{ sections: OutlineSection[] }>(
        `/api/outline?projectId=${projectId}`
      );
      setSections(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load outline');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void fetchOutline();
  }, [fetchOutline]);

  const addSection = useCallback(
    async (title: string, parentId?: string) => {
      if (!projectId) return;
      const orderIndex = sections.filter((s) => !s.parentId).length;
      try {
        await apiClient.post('/api/outline', { projectId, title, parentId: parentId ?? null, orderIndex });
        await fetchOutline();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add section');
      }
    },
    [projectId, sections, fetchOutline]
  );

  const reorderSections = useCallback(
    async (reordered: OutlineSection[]) => {
      setSections(reordered); // optimistic
      if (!projectId) return;
      const order = reordered
        .filter((s) => !s.parentId)
        .map((s, index) => ({ id: s.id, orderIndex: index }));
      try {
        await apiClient.patch('/api/outline', { projectId, order });
      } catch {
        void fetchOutline(); // revert to server truth on failure
      }
    },
    [projectId, fetchOutline]
  );

  const deleteSection = useCallback(
    async (sectionId: string) => {
      if (!projectId) return;
      try {
        await apiClient.del('/api/outline', { projectId, sectionId });
        setSelectedSectionId((cur) => (cur === sectionId ? null : cur));
        await fetchOutline();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete section');
      }
    },
    [projectId, fetchOutline]
  );

  const loadSectionPapers = useCallback(
    async (sectionId: string) => {
      if (!projectId) return;
      setSectionPapersLoading(true);
      try {
        const { papers } = await apiClient.get<{ papers: Paper[] }>(
          `/api/outline/papers?projectId=${projectId}&sectionId=${sectionId}`
        );
        setSectionPapers(papers);
      } catch {
        setSectionPapers([]);
      } finally {
        setSectionPapersLoading(false);
      }
    },
    [projectId]
  );

  const assignPaper = useCallback(
    async (sectionId: string, paperId: string) => {
      if (!projectId) return;
      try {
        await apiClient.post('/api/outline/papers', { projectId, sectionId, paperId });
        await loadSectionPapers(sectionId);
        await fetchOutline();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to assign paper');
      }
    },
    [projectId, fetchOutline, loadSectionPapers]
  );

  const unassignPaper = useCallback(
    async (sectionId: string, paperId: string) => {
      if (!projectId) return;
      setSectionPapers((prev) => prev.filter((p) => p.id !== paperId));
      try {
        await apiClient.del('/api/outline/papers', { projectId, sectionId, paperId });
        await fetchOutline();
      } catch {
        void loadSectionPapers(sectionId);
      }
    },
    [projectId, fetchOutline, loadSectionPapers]
  );

  // Reload the selected section's papers whenever the selection changes.
  useEffect(() => {
    if (selectedSectionId) void loadSectionPapers(selectedSectionId);
    else setSectionPapers([]);
  }, [selectedSectionId, loadSectionPapers]);

  const selectedSection = sections.find((s) => s.id === selectedSectionId) ?? null;

  return {
    sections,
    selectedSection,
    selectedSectionId,
    setSelectedSectionId,
    loading,
    error,
    fetchOutline,
    addSection,
    reorderSections,
    deleteSection,
    sectionPapers,
    sectionPapersLoading,
    assignPaper,
    unassignPaper,
  };
}
