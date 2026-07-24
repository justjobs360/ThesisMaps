import { supabaseAdmin } from '@/lib/supabase-server';
import type { Comment } from '@/types/thesis';

type CommentRow = {
  id: string;
  paper_id: string;
  user_id: string;
  project_id: string;
  content: string;
  created_at: string;
  users: { name: string | null; email: string; avatar_url: string | null } | null;
};

function rowToComment(row: CommentRow): Comment {
  return {
    id: row.id,
    paperId: row.paper_id,
    userId: row.user_id,
    projectId: row.project_id,
    content: row.content,
    createdAt: row.created_at,
    user: {
      name: row.users?.name ?? row.users?.email?.split('@')[0] ?? 'Unknown',
      avatarUrl: row.users?.avatar_url ?? undefined,
    },
  };
}

/** Lists a project's comments, newest first; optionally scoped to one paper. */
export async function listComments(projectId: string, paperId?: string): Promise<Comment[]> {
  let query = supabaseAdmin
    .from('comments')
    .select('*, users(name, email, avatar_url)')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (paperId) query = query.eq('paper_id', paperId);

  const { data, error } = await query;
  if (error) throw new Error(`listComments failed: ${error.message}`);
  return (data as unknown as CommentRow[]).map(rowToComment);
}

export async function createComment(
  projectId: string,
  userId: string,
  paperId: string,
  content: string
): Promise<Comment> {
  const { data, error } = await supabaseAdmin
    .from('comments')
    .insert({ project_id: projectId, user_id: userId, paper_id: paperId, content })
    .select('*, users(name, email, avatar_url)')
    .single();

  if (error || !data) throw new Error(`createComment failed: ${error?.message ?? 'no row'}`);
  return rowToComment(data as unknown as CommentRow);
}

/** Deletes a comment; scoped to its author. */
export async function deleteComment(id: string, userId: string): Promise<void> {
  const { error } = await supabaseAdmin.from('comments').delete().eq('id', id).eq('user_id', userId);
  if (error) throw new Error(`deleteComment failed: ${error.message}`);
}
