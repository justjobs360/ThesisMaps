import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/admin-guard';
import { ensureUser } from '@/lib/repository/users';
import { supabaseAdmin } from '@/lib/supabase-server';
import { adminAuth } from '@/lib/firebase-admin';
import { handleRouteError } from '@/lib/route-helpers';

// GET /api/me — the authenticated user's own row (used by AdminGuard for role checks)
export async function GET(request: Request) {
  try {
    const decoded = await requireUser(request);
    await ensureUser(decoded);

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, email, name, avatar_url, role, status, plan')
      .eq('id', decoded.uid)
      .single();

    if (error || !data) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json({
      user: {
        id: data.id,
        email: data.email,
        name: data.name,
        avatarUrl: data.avatar_url,
        role: data.role ?? 'user',
        status: data.status ?? 'active',
        plan: data.plan ?? 'free',
      },
    });
  } catch (err) {
    return handleRouteError(err, 'me/GET');
  }
}

// DELETE /api/me — self-serve account deletion (Firebase auth + all DB rows via cascade)
export async function DELETE(request: Request) {
  try {
    const decoded = await requireUser(request);

    const { error } = await supabaseAdmin.from('users').delete().eq('id', decoded.uid);
    if (error) throw new Error(`account deletion failed: ${error.message}`);
    await adminAuth.deleteUser(decoded.uid);

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleRouteError(err, 'me/DELETE');
  }
}
