import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin-guard';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const { data, error } = await supabaseAdmin
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json({ items: data });
  } catch {
    return NextResponse.json({ error: 'Forbidden or failed' }, { status: 403 });
  }
}

export async function PATCH(request: Request) {
  try {
    const adminId = await requireAdmin(request);
    const body = z.object({
      id: z.string().uuid(),
      status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
      adminNotes: z.string().max(2000).optional(),
    }).parse(await request.json());

    const { error } = await supabaseAdmin
      .from('feedback')
      .update({ status: body.status, admin_notes: body.adminNotes })
      .eq('id', body.id);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
