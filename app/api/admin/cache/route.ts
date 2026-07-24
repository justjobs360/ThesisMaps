import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-guard';
import { supabaseAdmin } from '@/lib/supabase-server';
import { redis } from '@/lib/redis';
import { handleRouteError } from '@/lib/route-helpers';

// DELETE /api/admin/cache — flush the Redis cache
export async function DELETE(request: Request) {
  try {
    const adminId = await requireAdmin(request);

    if (!process.env.UPSTASH_REDIS_REST_URL) {
      return NextResponse.json({ error: 'Redis is not configured' }, { status: 400 });
    }

    await redis.flushall();

    await supabaseAdmin.from('admin_activity_log').insert({
      admin_id: adminId,
      action: 'flushed Redis cache',
      target_type: 'cache',
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleRouteError(err, 'admin/cache/DELETE');
  }
}
