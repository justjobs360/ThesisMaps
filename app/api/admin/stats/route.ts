import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-guard';
import { supabaseAdmin } from '@/lib/supabase-server';
import { handleRouteError } from '@/lib/route-helpers';

function count(result: PromiseSettledResult<{ count: number | null }>): number {
  return result.status === 'fulfilled' ? result.value.count ?? 0 : 0;
}

export async function GET(request: Request) {
  try {
    await requireAdmin(request);

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [totalUsers, newUsers, activeUsers, projects, papersSaved, searches, openFeedback, pendingFlags, activity] =
      await Promise.allSettled([
        supabaseAdmin.from('users').select('id', { count: 'exact', head: true }),
        supabaseAdmin.from('users').select('id', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo),
        supabaseAdmin.from('users').select('id', { count: 'exact', head: true }).gte('last_active_at', sevenDaysAgo),
        supabaseAdmin.from('thesis_projects').select('id', { count: 'exact', head: true }),
        supabaseAdmin.from('saved_papers').select('id', { count: 'exact', head: true }),
        supabaseAdmin
          .from('analytics_events')
          .select('id', { count: 'exact', head: true })
          .eq('event', 'search_run')
          .gte('created_at', thirtyDaysAgo),
        supabaseAdmin.from('feedback').select('id', { count: 'exact', head: true }).eq('status', 'open'),
        supabaseAdmin.from('flags').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabaseAdmin
          .from('admin_activity_log')
          .select('*, users(name, email)')
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

    type ActivityRow = {
      id: string;
      admin_id: string | null;
      action: string;
      target_type: string | null;
      target_id: string | null;
      created_at: string;
      users: { name: string | null; email: string } | null;
    };
    const recentActivity =
      activity.status === 'fulfilled' && Array.isArray(activity.value.data)
        ? (activity.value.data as unknown as ActivityRow[]).map((row) => ({
            id: row.id,
            adminId: row.admin_id ?? '',
            adminName: row.users?.name ?? row.users?.email ?? 'Unknown admin',
            action: row.action,
            targetType: row.target_type ?? undefined,
            targetId: row.target_id ?? undefined,
            createdAt: row.created_at,
          }))
        : [];

    return NextResponse.json({
      totalUsers: count(totalUsers),
      newUsersLast30d: count(newUsers),
      activeUsersLast7d: count(activeUsers),
      totalProjects: count(projects),
      totalPapersSaved: count(papersSaved),
      totalSearchesLast30d: count(searches),
      openFeedbackTickets: count(openFeedback),
      pendingFlags: count(pendingFlags),
      recentActivity,
    });
  } catch (err) {
    return handleRouteError(err, 'admin/stats/GET');
  }
}
