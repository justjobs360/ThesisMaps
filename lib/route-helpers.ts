import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

/**
 * Maps thrown errors from API routes to consistent JSON responses.
 * Recognises Zod validation errors and the auth guard's Unauthorized/Forbidden
 * messages (see lib/admin-guard.ts). Everything else becomes a 500 — but the
 * message is logged, not leaked, so a mis-configured Supabase key surfaces as a
 * clean 500 rather than crashing the route.
 */
export function handleRouteError(err: unknown, context: string): NextResponse {
  if (err instanceof ZodError) {
    return NextResponse.json({ error: 'Invalid request', details: err.flatten() }, { status: 400 });
  }

  const message = err instanceof Error ? err.message : 'Unknown error';

  if (message.includes('Unauthorized')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (message.includes('Forbidden')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  console.error(`[${context}]`, message);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}
