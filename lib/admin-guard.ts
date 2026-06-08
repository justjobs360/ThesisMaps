import { adminAuth } from './firebase-admin';
import { supabaseAdmin } from './supabase-server';

export async function requireAdmin(request: Request): Promise<string> {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    throw new Error('Unauthorized: missing token');
  }

  const decoded = await adminAuth.verifyIdToken(token);

  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', decoded.uid)
    .single();

  if (error || user?.role !== 'admin') {
    throw new Error('Forbidden: admin role required');
  }

  return decoded.uid;
}

export async function requireAuth(request: Request): Promise<string> {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    throw new Error('Unauthorized: missing token');
  }

  const decoded = await adminAuth.verifyIdToken(token);
  return decoded.uid;
}
