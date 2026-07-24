'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { UserPlus, Clock, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useProject } from '@/hooks/useProject';
import { apiClient, ApiError } from '@/lib/apiClient';
import type { Comment } from '@/types/thesis';
import type { CollaborationMember } from '@/lib/repository/collaborations';

function initialsFor(nameOrEmail: string): string {
  const parts = nameOrEmail.split(/[\s@._-]+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '?';
  const second = parts[1]?.[0] ?? '';
  return (first + second).toUpperCase();
}

export default function CollaboratePage() {
  const { projectId } = useProject();
  const [members, setMembers] = useState<CollaborationMember[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('viewer');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const [{ members: m }, { comments: c }] = await Promise.all([
        apiClient.get<{ members: CollaborationMember[] }>(`/api/collaborations?projectId=${projectId}`),
        apiClient.get<{ comments: Comment[] }>(`/api/comments?projectId=${projectId}`),
      ]);
      setMembers(m);
      setComments(c);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load collaboration data');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !projectId || inviting) return;
    setInviting(true);
    setInviteError(null);
    try {
      const { member } = await apiClient.post<{ member: CollaborationMember }>('/api/collaborations', {
        projectId,
        email: email.trim(),
        role,
      });
      setMembers((prev) => [...prev.filter((m) => m.id !== member.id), member]);
      setEmail('');
      setRole('viewer');
      setOpen(false);
    } catch (err) {
      setInviteError(err instanceof ApiError ? err.message : 'Invite failed. Try again.');
    } finally {
      setInviting(false);
    }
  }

  async function handleRemove(collaborationId: string) {
    if (!projectId) return;
    setMembers((prev) => prev.filter((m) => m.id !== collaborationId));
    try {
      await apiClient.del('/api/collaborations', { projectId, collaborationId });
    } catch {
      void refresh();
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Collaborate"
        subtitle="Invite supervisors and peers to annotate papers and review your outline."
        action={
          <Button size="sm" variant="primary" onClick={() => setOpen(true)}>
            <UserPlus size={14} strokeWidth={2} /> Invite member
          </Button>
        }
      />

      {error ? (
        <div className="border-2 border-black bg-white p-5">
          <p className="text-[10px] text-red-600 font-black uppercase tracking-widest">Failed to load</p>
          <p className="text-xs text-black/40 font-sans mt-1">{error}</p>
        </div>
      ) : null}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Members */}
        <section aria-labelledby="members-heading" className="bg-white border-2 border-black shadow-impact p-5">
          <h2 id="members-heading" className="font-serif text-lg font-black uppercase tracking-tight text-black mb-4 pb-2 border-b-2 border-black">
            Members
          </h2>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : members.length === 0 ? (
            <p className="text-[10px] text-black/40 font-bold uppercase tracking-widest py-6 text-center border-2 border-dashed border-black">
              No collaborators yet — invite one above.
            </p>
          ) : (
            <ul className="space-y-3">
              {members.map((member) => (
                <li key={member.id} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 border-2 border-black bg-white flex items-center justify-center text-[11px] font-black text-black font-sans flex-shrink-0">
                      {initialsFor(member.name || member.email)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12px] font-sans font-black uppercase tracking-tight text-black truncate">{member.name}</p>
                      <p className="text-[10px] text-black/50 font-sans truncate">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant={member.role === 'editor' ? 'accent' : 'muted'}>
                      {member.role === 'editor' ? 'Editor' : 'Viewer'}
                    </Badge>
                    <button
                      onClick={() => void handleRemove(member.id)}
                      aria-label={`Remove ${member.name}`}
                      className="text-black/30 hover:text-red-600 transition-colors"
                    >
                      <X size={14} strokeWidth={3} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Activity — real comment stream */}
        <section aria-labelledby="activity-heading" className="bg-white border-2 border-black shadow-impact p-5">
          <h2 id="activity-heading" className="font-serif text-lg font-black uppercase tracking-tight text-black mb-4 pb-2 border-b-2 border-black">
            Recent Activity
          </h2>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
            </div>
          ) : comments.length === 0 ? (
            <p className="text-[10px] text-black/40 font-bold uppercase tracking-widest py-6 text-center border-2 border-dashed border-black">
              No activity yet — comments on papers will appear here.
            </p>
          ) : (
            <ol className="space-y-3">
              {comments.slice(0, 10).map((item) => (
                <li key={item.id} className="flex items-start gap-3">
                  <Clock size={14} strokeWidth={2} className="text-black mt-0.5 flex-shrink-0" aria-hidden />
                  <div className="min-w-0">
                    <p className="text-[12px] font-sans text-black">
                      <span className="font-black uppercase tracking-tight">{item.user?.name ?? 'Someone'}</span>{' '}
                      <span className="text-black/60">commented: “{item.content.length > 80 ? `${item.content.slice(0, 80)}…` : item.content}”</span>
                    </p>
                    <p className="text-[10px] text-black/40 font-sans mt-0.5">
                      {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Invite Member" description="Add a collaborator by email and assign a role." maxWidth="max-w-md">
        <form onSubmit={handleInvite} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="collaborator@university.edu"
            required
          />
          <Select
            label="Role"
            value={role}
            onValueChange={setRole}
            options={[
              { value: 'viewer', label: 'Viewer' },
              { value: 'editor', label: 'Editor' },
            ]}
          />
          {inviteError ? (
            <p className="text-[10px] text-red-600 font-black uppercase tracking-widest">{inviteError}</p>
          ) : null}
          <Button type="submit" variant="primary" className="w-full" loading={inviting}>
            Send Invite
          </Button>
        </form>
      </Modal>
    </div>
  );
}
