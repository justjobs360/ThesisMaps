import { supabaseAdmin } from '@/lib/supabase-server';

export type CollaborationMember = {
  id: string;
  projectId: string;
  userId: string;
  role: 'editor' | 'viewer';
  name: string;
  email: string;
  avatarUrl?: string;
};

type CollabRow = {
  id: string;
  project_id: string;
  user_id: string;
  role: string | null;
  users: { name: string | null; email: string; avatar_url: string | null } | null;
};

function rowToMember(row: CollabRow): CollaborationMember {
  return {
    id: row.id,
    projectId: row.project_id,
    userId: row.user_id,
    role: row.role === 'editor' ? 'editor' : 'viewer',
    name: row.users?.name ?? row.users?.email?.split('@')[0] ?? 'Unknown',
    email: row.users?.email ?? '',
    avatarUrl: row.users?.avatar_url ?? undefined,
  };
}

export async function listCollaborators(projectId: string): Promise<CollaborationMember[]> {
  const { data, error } = await supabaseAdmin
    .from('collaborations')
    .select('*, users(name, email, avatar_url)')
    .eq('project_id', projectId);

  if (error) throw new Error(`listCollaborators failed: ${error.message}`);
  return (data as unknown as CollabRow[]).map(rowToMember);
}

/**
 * Invites an existing ThesisMaps user (looked up by email) to a project.
 * Returns null when no account exists for that email — the route surfaces
 * this as a clear 404 rather than silently creating a phantom user.
 */
export async function inviteCollaborator(
  projectId: string,
  email: string,
  role: 'editor' | 'viewer'
): Promise<CollaborationMember | null> {
  const { data: user, error: userErr } = await supabaseAdmin
    .from('users')
    .select('id')
    .ilike('email', email)
    .maybeSingle();

  if (userErr) throw new Error(`inviteCollaborator lookup failed: ${userErr.message}`);
  if (!user) return null;

  const { data, error } = await supabaseAdmin
    .from('collaborations')
    .upsert(
      { project_id: projectId, user_id: user.id as string, role },
      { onConflict: 'project_id,user_id', ignoreDuplicates: false }
    )
    .select('*, users(name, email, avatar_url)')
    .single();

  if (error || !data) throw new Error(`inviteCollaborator failed: ${error?.message ?? 'no row'}`);
  return rowToMember(data as unknown as CollabRow);
}

export async function removeCollaborator(id: string, projectId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('collaborations')
    .delete()
    .eq('id', id)
    .eq('project_id', projectId);

  if (error) throw new Error(`removeCollaborator failed: ${error.message}`);
}
