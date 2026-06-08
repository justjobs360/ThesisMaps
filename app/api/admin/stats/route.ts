import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-guard';
import { supabaseAdmin } from '@/lib/supabase-server';
import { MOCK_ADMIN_STATS } from '@/lib/mockData';

export async function GET(request: Request) {
  try {
    await requireAdmin(request);

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [totalUsers, newUsers, projects, openFeedback, pendingFlags] = await Promise.allSettled([
      supabaseAdmin.from('users').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('users').select('id', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo),
      supabaseAdmin.from('thesis_projects').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('feedback').select('id', { count: 'exact', head: true }).eq('status', 'open'),
      supabaseAdmin.from('flags').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    ]);

    return NextResponse.json({
      totalUsers: totalUsers.status === 'fulfilled' ? totalUsers.value.count ?? 0 : MOCK_ADMIN_STATS.totalUsers,
      newUsersLast30d: newUsers.status === 'fulfilled' ? newUsers.value.count ?? 0 : MOCK_ADMIN_STATS.newUsersLast30d,
      activeUsersLast7d: MOCK_ADMIN_STATS.activeUsersLast7d,
      totalProjects: projects.status === 'fulfilled' ? projects.value.count ?? 0 : MOCK_ADMIN_STATS.totalProjects,
      totalPapersSaved: MOCK_ADMIN_STATS.totalPapersSaved,
      totalSearchesLast30d: MOCK_ADMIN_STATS.totalSearchesLast30d,
      openFeedbackTickets: openFeedback.status === 'fulfilled' ? openFeedback.value.count ?? 0 : MOCK_ADMIN_STATS.openFeedbackTickets,
      pendingFlags: pendingFlags.status === 'fulfilled' ? pendingFlags.value.count ?? 0 : MOCK_ADMIN_STATS.pendingFlags,
    });
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
}
