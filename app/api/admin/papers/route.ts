import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-guard';
import { supabaseAdmin } from '@/lib/supabase-server';
import { rowToPaper } from '@/lib/repository/papers';
import { handleRouteError } from '@/lib/route-helpers';

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get('page') ?? 1));
    const pageSize = 50;

    const { data, error, count } = await supabaseAdmin
      .from('papers')
      .select('*', { count: 'exact' })
      .order('citation_count', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (error) throw error;
    const papers = (data as Parameters<typeof rowToPaper>[0][]).map(rowToPaper);
    return NextResponse.json({ papers, total: count, page });
  } catch (err) {
    return handleRouteError(err, 'admin/papers/GET');
  }
}
