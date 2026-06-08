import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin-guard';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const { data, error } = await supabaseAdmin
      .from('flags')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json({ items: data });
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
}

export async function PATCH(request: Request) {
  try {
    const adminId = await requireAdmin(request);
    const body = z.object({
      id: z.string().uuid(),
      status: z.enum(['pending', 'reviewed', 'dismissed', 'actioned']),
      adminNotes: z.string().max(2000).optional(),
    }).parse(await request.json());

    const { error } = await supabaseAdmin
      .from('flags')
      .update({ status: body.status, admin_notes: body.adminNotes })
      .eq('id', body.id);

    if (error) throw error;

    await supabaseAdmin.from('admin_activity_log').insert({
      admin_id: adminId,
      action: `${body.status} flag`,
      target_type: 'flag',
      target_id: body.id,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
