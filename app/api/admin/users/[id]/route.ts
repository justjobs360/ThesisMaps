import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin-guard';
import { supabaseAdmin } from '@/lib/supabase-server';
import { adminAuth } from '@/lib/firebase-admin';

const patchSchema = z.object({
  status: z.enum(['active', 'suspended', 'banned']).optional(),
  role: z.enum(['user', 'admin']).optional(),
  adminNotes: z.string().max(2000).optional(),
});

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const adminId = await requireAdmin(request);
    const { data, error } = await supabaseAdmin.from('users').select('*').eq('id', params.id).single();
    if (error) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const adminId = await requireAdmin(request);
    const body = patchSchema.parse(await request.json());

    const { error } = await supabaseAdmin.from('users').update(body).eq('id', params.id);
    if (error) throw error;

    await supabaseAdmin.from('admin_activity_log').insert({
      admin_id: adminId,
      action: `updated user: ${JSON.stringify(body)}`,
      target_type: 'user',
      target_id: params.id,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const adminId = await requireAdmin(request);

    // Delete from Firebase Auth
    await adminAuth.deleteUser(params.id);

    // Cascade via DB (ON DELETE CASCADE)
    const { error } = await supabaseAdmin.from('users').delete().eq('id', params.id);
    if (error) throw error;

    await supabaseAdmin.from('admin_activity_log').insert({
      admin_id: adminId,
      action: 'deleted user',
      target_type: 'user',
      target_id: params.id,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
