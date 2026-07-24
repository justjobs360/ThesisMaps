import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin-guard';
import { supabaseAdmin } from '@/lib/supabase-server';
import { handleRouteError } from '@/lib/route-helpers';

// GET /api/admin/settings — platform_settings as one object
export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const { data, error } = await supabaseAdmin.from('platform_settings').select('key, value');
    if (error) throw error;

    const map = new Map((data as { key: string; value: unknown }[]).map((r) => [r.key, r.value]));
    return NextResponse.json({
      featureFlags: map.get('feature_flags') ?? { ml_gap_detection: true, collaboration: true, defence_mode: true },
      announcementBanner: map.get('announcement_banner') ?? { enabled: false, message: '' },
    });
  } catch (err) {
    return handleRouteError(err, 'admin/settings/GET');
  }
}

const patchSchema = z.object({
  featureFlags: z
    .object({
      ml_gap_detection: z.boolean(),
      collaboration: z.boolean(),
      defence_mode: z.boolean(),
    })
    .optional(),
  announcementBanner: z
    .object({
      enabled: z.boolean(),
      message: z.string().max(500),
    })
    .optional(),
});

// PATCH /api/admin/settings — update feature flags / banner
export async function PATCH(request: Request) {
  try {
    const adminId = await requireAdmin(request);
    const body = patchSchema.parse(await request.json());

    const updates: { key: string; value: unknown }[] = [];
    if (body.featureFlags) updates.push({ key: 'feature_flags', value: body.featureFlags });
    if (body.announcementBanner) updates.push({ key: 'announcement_banner', value: body.announcementBanner });
    if (updates.length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });

    for (const { key, value } of updates) {
      const { error } = await supabaseAdmin
        .from('platform_settings')
        .upsert({ key, value, updated_by: adminId, updated_at: new Date().toISOString() }, { onConflict: 'key' });
      if (error) throw error;
    }

    await supabaseAdmin.from('admin_activity_log').insert({
      admin_id: adminId,
      action: `updated platform settings (${updates.map((u) => u.key).join(', ')})`,
      target_type: 'settings',
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleRouteError(err, 'admin/settings/PATCH');
  }
}
