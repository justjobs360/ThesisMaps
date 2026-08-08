'use client';

import { useCallback } from 'react';
import { apiClient } from '@/lib/apiClient';

type EventName =
  | 'paper_saved'
  | 'search_run'
  | 'graph_expanded'
  | 'outline_section_added'
  | 'gap_analysis_run'
  | 'export_generated'
  | 'seed_set_created';

export function useAnalytics() {
  // Goes through apiClient so the Firebase token is attached — the route derives
  // the user id from that token rather than trusting a client-supplied one.
  const track = useCallback((event: EventName, properties?: Record<string, unknown>) => {
    // Fire-and-forget — analytics must never block or surface errors.
    void apiClient.post('/api/analytics', { event, properties }).catch(() => undefined);
  }, []);

  return { track };
}
