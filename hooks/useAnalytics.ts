'use client';

import { useCallback } from 'react';
import { useAuth } from './useAuth';

type EventName =
  | 'paper_saved'
  | 'search_run'
  | 'graph_expanded'
  | 'outline_section_added'
  | 'gap_analysis_run'
  | 'export_generated'
  | 'seed_set_created';

export function useAnalytics() {
  const { user } = useAuth();

  const track = useCallback(
    (event: EventName, properties?: Record<string, unknown>) => {
      // Fire-and-forget — non-blocking
      void fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, properties, userId: user?.uid }),
      }).catch(() => undefined);
    },
    [user]
  );

  return { track };
}
