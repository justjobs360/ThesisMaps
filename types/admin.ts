export type UserRole = 'user' | 'admin';
export type UserStatus = 'active' | 'suspended' | 'banned';
export type UserPlan = 'free' | 'pro' | 'institution';

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: UserRole;
  status: UserStatus;
  plan: UserPlan;
  adminNotes?: string;
  createdAt: string;
  lastActiveAt?: string;
  projectCount?: number;
};

export type AdminStats = {
  totalUsers: number;
  newUsersLast30d: number;
  activeUsersLast7d: number;
  totalProjects: number;
  totalPapersSaved: number;
  totalSearchesLast30d: number;
  openFeedbackTickets: number;
  pendingFlags: number;
};

export type FeedbackType = 'bug' | 'feature' | 'general' | 'content';
export type FeedbackStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export type FeedbackItem = {
  id: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  type: FeedbackType;
  subject: string;
  message: string;
  status: FeedbackStatus;
  adminNotes?: string;
  createdAt: string;
};

export type FlagStatus = 'pending' | 'reviewed' | 'dismissed' | 'actioned';
export type FlagEntityType = 'paper' | 'comment' | 'user';

export type FlagItem = {
  id: string;
  flaggedBy?: string;
  flaggedByEmail?: string;
  entityType: FlagEntityType;
  entityId: string;
  reason: string;
  status: FlagStatus;
  adminNotes?: string;
  createdAt: string;
};

export type AnalyticsEvent = {
  id: string;
  userId?: string;
  event: string;
  properties?: Record<string, unknown>;
  createdAt: string;
};

export type AdminActivityLog = {
  id: string;
  adminId: string;
  adminName?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  notes?: string;
  createdAt: string;
};

export type PlatformSettings = {
  featureFlags: {
    mlGapDetection: boolean;
    collaboration: boolean;
    defenceMode: boolean;
  };
  announcementBanner: {
    enabled: boolean;
    message: string;
  };
};
