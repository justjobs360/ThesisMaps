import { supabaseAdmin } from '@/lib/supabase-server';
import type { DecodedIdToken } from 'firebase-admin/auth';

/**
 * Ensures a row exists in `users` for the authenticated Firebase user and
 * refreshes `last_active_at`. Called on the first authenticated request of a
 * flow so every downstream FK (thesis_projects.user_id, saved_papers.user_id …)
 * resolves. Uses the Firebase UID as the primary key (users.id is text).
 */
export async function ensureUser(decoded: DecodedIdToken): Promise<string> {
  const now = new Date().toISOString();

  const { error } = await supabaseAdmin.from('users').upsert(
    {
      id: decoded.uid,
      email: decoded.email ?? `${decoded.uid}@no-email.thesismaps`,
      name: decoded.name ?? (decoded.email ? decoded.email.split('@')[0] : null),
      avatar_url: decoded.picture ?? null,
      last_active_at: now,
    },
    { onConflict: 'id', ignoreDuplicates: false }
  );

  if (error) throw new Error(`ensureUser failed: ${error.message}`);
  return decoded.uid;
}
