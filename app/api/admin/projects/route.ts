import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-guard';
import { supabaseAdmin } from '@/lib/supabase-server';
import { handleRouteError } from '@/lib/route-helpers';

type ProjectRow = {
  id: string;
  user_id: string;
  title: string;
  field: string | null;
  current_stage: string | null;
  created_at: string;
  users: { email: string } | null;
  saved_papers: { count: number }[] | null;
  collaborations: { count: number }[] | null;
};

// GET /api/admin/projects — all projects with owner + counts
export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get('page') ?? 1));
    const pageSize = 50;

    const { data, error, count } = await supabaseAdmin
      .from('thesis_projects')
      .select('*, users(email), saved_papers(count), collaborations(count)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (error) throw error;

    const projects = (data as unknown as ProjectRow[]).map((row) => ({
      id: row.id,
      userId: row.user_id,
      title: row.title,
      field: row.field ?? '',
      currentStage: row.current_stage ?? 'research_proposal',
      createdAt: row.created_at,
      ownerEmail: row.users?.email,
      paperCount: row.saved_papers?.[0]?.count ?? 0,
      collaboratorCount: row.collaborations?.[0]?.count ?? 0,
    }));

    return NextResponse.json({ projects, total: count, page });
  } catch (err) {
    return handleRouteError(err, 'admin/projects/GET');
  }
}
