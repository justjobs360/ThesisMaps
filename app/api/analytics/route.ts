import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase-server';

const bodySchema = z.object({
  event: z.string().min(1).max(100),
  properties: z.record(z.unknown()).optional(),
  userId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = bodySchema.parse(await request.json());

    // Fire-and-forget — do not block the client
    void supabaseAdmin.from('analytics_events').insert({
      user_id: body.userId ?? null,
      event: body.event,
      properties: body.properties ?? {},
    });

    return NextResponse.json({ ok: true });
  } catch {
    // Silently ignore analytics failures — never surface to users
    return NextResponse.json({ ok: true });
  }
}
