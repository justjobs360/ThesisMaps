import type { Metadata } from 'next';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { UserPlus, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const metadata: Metadata = { title: 'Collaborate', robots: { index: false } };

const MEMBERS = [
  { id: 'm1', name: 'Dr. Sarah Khan', email: 'skhan@oxford.ac.uk', role: 'Editor', initials: 'SK' },
  { id: 'm2', name: 'Prof. James Wright', email: 'j.wright@cam.ac.uk', role: 'Viewer', initials: 'JW' },
];

const ACTIVITY = [
  { id: 'a1', user: 'Sarah Khan', action: 'added 3 papers to Literature Review', time: '2024-07-20T14:00:00Z' },
  { id: 'a2', user: 'Prof. Wright', action: 'commented on Attention Is All You Need', time: '2024-07-19T11:30:00Z' },
  { id: 'a3', user: 'You', action: 'created a new outline section: Methodology', time: '2024-07-18T09:00:00Z' },
];

export default function CollaboratePage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Collaborate"
        subtitle="Invite supervisors and peers to annotate papers and review your outline."
        action={
          <Button size="sm" variant="primary">
            <UserPlus size={14} strokeWidth={1.5} /> Invite member
          </Button>
        }
      />

      <div className="grid md:grid-cols-2 gap-6">
        {/* Members */}
        <section aria-labelledby="members-heading" className="bg-surface border border-border rounded-md p-5 shadow-sm">
          <h2 id="members-heading" className="text-sm font-sans font-semibold text-text-primary mb-4">Members</h2>
          <ul className="space-y-3">
            {MEMBERS.map((member) => (
              <li key={member.id} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center text-xs font-medium text-accent font-sans">
                    {member.initials}
                  </div>
                  <div>
                    <p className="text-sm font-sans font-medium text-text-primary">{member.name}</p>
                    <p className="text-xs text-text-muted font-sans">{member.email}</p>
                  </div>
                </div>
                <Badge variant={member.role === 'Editor' ? 'accent' : 'muted'}>{member.role}</Badge>
              </li>
            ))}
          </ul>
        </section>

        {/* Activity */}
        <section aria-labelledby="activity-heading" className="bg-surface border border-border rounded-md p-5 shadow-sm">
          <h2 id="activity-heading" className="text-sm font-sans font-semibold text-text-primary mb-4">Recent Activity</h2>
          <ol className="space-y-3">
            {ACTIVITY.map((item) => (
              <li key={item.id} className="flex items-start gap-3">
                <Clock size={14} strokeWidth={1.5} className="text-text-muted mt-0.5 flex-shrink-0" aria-hidden />
                <div>
                  <p className="text-sm font-sans text-text-primary">
                    <span className="font-medium">{item.user}</span>{' '}
                    <span className="text-text-muted">{item.action}</span>
                  </p>
                  <p className="text-xs text-text-muted font-sans mt-0.5">
                    {formatDistanceToNow(new Date(item.time), { addSuffix: true })}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
