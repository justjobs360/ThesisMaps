import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-guard';
import { supabaseAdmin } from '@/lib/supabase-server';
import { handleRouteError } from '@/lib/route-helpers';

type DataPoint = { label: string; value: number };

function dayLabel(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
}

// GET /api/admin/analytics — real chart series aggregated in-process
export async function GET(request: Request) {
  try {
    await requireAdmin(request);

    const now = Date.now();
    const ninetyDaysAgo = new Date(now - 90 * 24 * 60 * 60 * 1000).toISOString();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [usersRes, eventsRes] = await Promise.all([
      supabaseAdmin.from('users').select('created_at').gte('created_at', ninetyDaysAgo).limit(10000),
      supabaseAdmin
        .from('analytics_events')
        .select('event, user_id, created_at, properties')
        .gte('created_at', thirtyDaysAgo)
        .limit(20000),
    ]);

    if (usersRes.error) throw usersRes.error;
    if (eventsRes.error) throw eventsRes.error;

    // Signups per week (90d)
    const weekCounts = new Map<string, number>();
    for (const row of usersRes.data as { created_at: string }[]) {
      const d = new Date(row.created_at);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const key = weekStart.toISOString().slice(0, 10);
      weekCounts.set(key, (weekCounts.get(key) ?? 0) + 1);
    }
    const signups: DataPoint[] = [...weekCounts.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => ({ label: dayLabel(key), value }));

    // DAU per day (30d): distinct users with any event
    type EventRow = { event: string; user_id: string | null; created_at: string; properties: Record<string, unknown> | null };
    const events = eventsRes.data as EventRow[];
    const dayUsers = new Map<string, Set<string>>();
    for (const e of events) {
      if (!e.user_id) continue;
      const key = e.created_at.slice(0, 10);
      const set = dayUsers.get(key) ?? new Set<string>();
      set.add(e.user_id);
      dayUsers.set(key, set);
    }
    const dau: DataPoint[] = [...dayUsers.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, set]) => ({ label: dayLabel(key), value: set.size }));

    // Top search queries (30d)
    const queryCounts = new Map<string, number>();
    for (const e of events) {
      if (e.event !== 'search_run') continue;
      const q = typeof e.properties?.query === 'string' ? (e.properties.query as string).toLowerCase().trim() : null;
      if (!q) continue;
      queryCounts.set(q, (queryCounts.get(q) ?? 0) + 1);
    }
    const topQueries: DataPoint[] = [...queryCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, value]) => ({ label, value }));

    return NextResponse.json({ signups, dau, topQueries });
  } catch (err) {
    return handleRouteError(err, 'admin/analytics/GET');
  }
}
