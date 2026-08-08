import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase-server';
import { requireUser } from '@/lib/admin-guard';

// Keep in sync with EventName in hooks/useAnalytics.ts. Constrained to an enum
// so the events table (and every admin stat derived from it) can't be seeded
// with arbitrary event names.
const EVENTS = [
  'paper_saved',
  'search_run',
  'graph_expanded',
  'outline_section_added',
  'gap_analysis_run',
  'export_generated',
  'seed_set_created',
] as const;

const bodySchema = z.object({
  event: z.enum(EVENTS),
  properties: z.record(z.unknown()).optional(),
});

// POST /api/analytics — records one product event for the CALLING user.
// The user id is taken from the verified Firebase token, never from the body:
// this endpoint feeds every admin stat/chart, so a client-supplied id would let
// anyone forge activity for arbitrary accounts.
export async function POST(request: Request) {
  let decodedUid: string;
  try {
    const decoded = await requireUser(request);
    decodedUid = decoded.uid;
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = bodySchema.parse(await request.json());

    // Fire-and-forget — never block the client on analytics.
    void supabaseAdmin.from('analytics_events').insert({
      user_id: decodedUid,
      event: body.event,
      properties: body.properties ?? {},
    });

    return NextResponse.json({ ok: true });
  } catch {
    // Swallow malformed/duplicate events — analytics must never surface errors.
    return NextResponse.json({ ok: true });
  }
}
