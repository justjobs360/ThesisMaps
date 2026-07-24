import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-guard';
import { supabaseAdmin } from '@/lib/supabase-server';
import { handleRouteError } from '@/lib/route-helpers';
import { rowToAdminUser, type AdminUserRow } from '@/lib/adminMappers';

export async function GET(request: Request) {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get('page') ?? 1));
    const pageSize = Math.min(50, Math.max(1, Number(searchParams.get('pageSize') ?? 50)));
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    let query = supabaseAdmin
      .from('users')
      .select('*, thesis_projects(count)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (status) query = query.eq('status', status);
    if (search) query = query.ilike('email', `%${search}%`);

    const { data, error, count } = await query;
    if (error) throw error;

    const users = (data as unknown as AdminUserRow[]).map(rowToAdminUser);
    return NextResponse.json({ users, total: count, page, pageSize });
  } catch (err) {
    return handleRouteError(err, 'admin/users/GET');
  }
}
