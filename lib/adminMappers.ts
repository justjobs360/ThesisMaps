import type { AdminUser, FeedbackItem, FlagItem } from '@/types/admin';

/** snake_case DB rows → camelCase admin types shared by /api/admin/* routes. */

export type AdminUserRow = {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  role: string | null;
  status: string | null;
  plan: string | null;
  admin_notes: string | null;
  created_at: string;
  last_active_at: string | null;
  thesis_projects?: { count: number }[] | null;
};

export function rowToAdminUser(row: AdminUserRow): AdminUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name ?? '',
    avatarUrl: row.avatar_url ?? undefined,
    role: row.role === 'admin' ? 'admin' : 'user',
    status: (row.status as AdminUser['status']) ?? 'active',
    plan: (row.plan as AdminUser['plan']) ?? 'free',
    adminNotes: row.admin_notes ?? undefined,
    createdAt: row.created_at,
    lastActiveAt: row.last_active_at ?? undefined,
    projectCount: row.thesis_projects?.[0]?.count ?? 0,
  };
}

export type FeedbackRow = {
  id: string;
  user_id: string | null;
  type: string;
  subject: string;
  message: string;
  status: string | null;
  admin_notes: string | null;
  created_at: string;
  users: { name: string | null; email: string } | null;
};

export function rowToFeedbackItem(row: FeedbackRow): FeedbackItem {
  return {
    id: row.id,
    userId: row.user_id ?? undefined,
    userEmail: row.users?.email,
    userName: row.users?.name ?? undefined,
    type: (row.type as FeedbackItem['type']) ?? 'general',
    subject: row.subject,
    message: row.message,
    status: (row.status as FeedbackItem['status']) ?? 'open',
    adminNotes: row.admin_notes ?? undefined,
    createdAt: row.created_at,
  };
}

export type FlagRow = {
  id: string;
  flagged_by: string | null;
  entity_type: string;
  entity_id: string;
  reason: string;
  status: string | null;
  admin_notes: string | null;
  created_at: string;
  users: { email: string } | null;
};

export function rowToFlagItem(row: FlagRow): FlagItem {
  return {
    id: row.id,
    flaggedBy: row.flagged_by ?? undefined,
    flaggedByEmail: row.users?.email,
    entityType: (row.entity_type as FlagItem['entityType']) ?? 'paper',
    entityId: row.entity_id,
    reason: row.reason,
    status: (row.status as FlagItem['status']) ?? 'pending',
    adminNotes: row.admin_notes ?? undefined,
    createdAt: row.created_at,
  };
}
