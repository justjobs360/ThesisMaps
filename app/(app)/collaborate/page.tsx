'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { UserPlus, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type Member = { id: string; name: string; email: string; role: 'Editor' | 'Viewer'; initials: string };

const INITIAL_MEMBERS: Member[] = [
  { id: 'm1', name: 'Dr. Sarah Khan', email: 'skhan@oxford.ac.uk', role: 'Editor', initials: 'SK' },
  { id: 'm2', name: 'Prof. James Wright', email: 'j.wright@cam.ac.uk', role: 'Viewer', initials: 'JW' },
];

const ACTIVITY = [
  { id: 'a1', user: 'Sarah Khan', action: 'added 3 papers to Literature Review', time: '2024-07-20T14:00:00Z' },
  { id: 'a2', user: 'Prof. Wright', action: 'commented on Attention Is All You Need', time: '2024-07-19T11:30:00Z' },
  { id: 'a3', user: 'You', action: 'created a new outline section: Methodology', time: '2024-07-18T09:00:00Z' },
];

function initialsFor(email: string): string {
  const name = email.split('@')[0] ?? '';
  return name.slice(0, 2).toUpperCase() || '??';
}

export default function CollaboratePage() {
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Viewer');

  function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    // Local-only for now — collaboration persistence is not yet wired to the backend.
    setMembers((prev) => [
      ...prev,
      { id: `m${Date.now()}`, name: email.split('@')[0] ?? email, email: email.trim(), role: role as Member['role'], initials: initialsFor(email) },
    ]);
    setEmail('');
    setRole('Viewer');
    setOpen(false);
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

      <div className="grid md:grid-cols-2 gap-6">
        {/* Members */}
        <section aria-labelledby="members-heading" className="bg-white border-2 border-black shadow-impact p-5">
          <h2 id="members-heading" className="font-serif text-lg font-black uppercase tracking-tight text-black mb-4 pb-2 border-b-2 border-black">
            Members
          </h2>
          <ul className="space-y-3">
            {members.map((member) => (
              <li key={member.id} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 border-2 border-black bg-white flex items-center justify-center text-[11px] font-black text-black font-sans">
                    {member.initials}
                  </div>
                  <div>
                    <p className="text-[12px] font-sans font-black uppercase tracking-tight text-black">{member.name}</p>
                    <p className="text-[10px] text-black/50 font-sans">{member.email}</p>
                  </div>
                </div>
                <Badge variant={member.role === 'Editor' ? 'accent' : 'muted'}>{member.role}</Badge>
              </li>
            ))}
          </ul>
        </section>

        {/* Activity */}
        <section aria-labelledby="activity-heading" className="bg-white border-2 border-black shadow-impact p-5">
          <h2 id="activity-heading" className="font-serif text-lg font-black uppercase tracking-tight text-black mb-4 pb-2 border-b-2 border-black">
            Recent Activity
          </h2>
          <ol className="space-y-3">
            {ACTIVITY.map((item) => (
              <li key={item.id} className="flex items-start gap-3">
                <Clock size={14} strokeWidth={2} className="text-black mt-0.5 flex-shrink-0" aria-hidden />
                <div>
                  <p className="text-[12px] font-sans text-black">
                    <span className="font-black uppercase tracking-tight">{item.user}</span>{' '}
                    <span className="text-black/60">{item.action}</span>
                  </p>
                  <p className="text-[10px] text-black/40 font-sans mt-0.5">
                    {formatDistanceToNow(new Date(item.time), { addSuffix: true })}
                  </p>
                </div>
              </li>
            ))}
          </ol>
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
              { value: 'Viewer', label: 'Viewer' },
              { value: 'Editor', label: 'Editor' },
            ]}
          />
          <Button type="submit" variant="primary" className="w-full">
            Send Invite
          </Button>
        </form>
      </Modal>
    </div>
  );
}
