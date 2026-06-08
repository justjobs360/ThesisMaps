'use client';

import { useState, useCallback } from 'react';
import type { OutlineSection } from '@/types/thesis';
import { MOCK_OUTLINE_SECTIONS } from '@/lib/mockData';

export function useOutline(projectId: string) {
  const [sections, setSections] = useState<OutlineSection[]>(MOCK_OUTLINE_SECTIONS);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchOutline = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/outline?projectId=${projectId}`);
      if (!res.ok) throw new Error('Failed to load outline');
      const data = (await res.json()) as OutlineSection[];
      setSections(data);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const addSection = useCallback((title: string, parentId?: string) => {
    const newSection: OutlineSection = {
      id: `s${Date.now()}`,
      projectId,
      title,
      orderIndex: sections.length,
      parentId: parentId ?? null,
      paperCount: 0,
      coverageScore: 0,
      createdAt: new Date().toISOString(),
    };
    setSections((prev) => [...prev, newSection]);
  }, [sections.length, projectId]);

  const reorderSections = useCallback((reordered: OutlineSection[]) => {
    setSections(reordered);
  }, []);

  const selectedSection = sections.find((s) => s.id === selectedSectionId) ?? null;

  return {
    sections,
    selectedSection,
    selectedSectionId,
    setSelectedSectionId,
    loading,
    fetchOutline,
    addSection,
    reorderSections,
  };
}
