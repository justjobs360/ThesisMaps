'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { THESIS_STAGES, type ThesisStage } from '@/types/thesis';
import { useAuth } from '@/context/AuthContext';

export default function SettingsPage() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.displayName ?? '');
  const [thesisTitle, setThesisTitle] = useState('The Role of Transformer Architectures in Modern NLP Systems');
  const [field, setField] = useState('Computer Science');
  const [stage, setStage] = useState<ThesisStage>('literature_review');
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <PageHeader title="Settings" subtitle="Manage your research profile and repository configurations." />

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-8">
          {/* Profile */}
          <section aria-labelledby="profile-heading" className="bg-white border-2 border-black p-8 shadow-impact space-y-6">
            <h2 id="profile-heading" className="text-[10px] font-sans font-black uppercase tracking-[0.2em] text-accent">Profile Engine</h2>
            <Input label="Display name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input label="Primary Email" value={user?.email ?? ''} disabled hint="System-linked email cannot be modified." />
            <Button size="sm" variant="primary" className="w-full uppercase tracking-widest font-black h-11">Save Profile</Button>
          </section>

          {/* Thesis Project */}
          <section aria-labelledby="project-heading" className="bg-white border-2 border-black p-8 shadow-impact space-y-6">
            <h2 id="project-heading" className="text-[10px] font-sans font-black uppercase tracking-[0.2em] text-accent">Active Thesis Metadata</h2>
            <Input label="Thesis title" value={thesisTitle} onChange={(e) => setThesisTitle(e.target.value)} />
            <Input label="Research Field" value={field} onChange={(e) => setField(e.target.value)} />
            <Select
              label="Development stage"
              value={stage}
              onValueChange={(v) => setStage(v as ThesisStage)}
              options={THESIS_STAGES.map((s) => ({ value: s.id, label: s.label }))}
            />
            <Button size="sm" variant="primary" className="w-full uppercase tracking-widest font-black h-11">Save Metadata</Button>
          </section>
        </div>

        <div className="space-y-8">
          {/* Notifications */}
          <section aria-labelledby="notif-heading" className="bg-white border-2 border-black p-8 shadow-impact space-y-6">
            <h2 id="notif-heading" className="text-[10px] font-sans font-black uppercase tracking-[0.2em] text-accent">Notification Channels</h2>
            <div className="space-y-4">
              {['New papers in your field', 'Collaborator activity', 'Weekly research summary'].map((label) => (
                <label key={label} className="flex items-center justify-between gap-3 py-2 cursor-pointer group">
                  <span className="text-[10px] font-sans font-bold uppercase tracking-tight text-black group-hover:text-accent transition-colors">{label}</span>
                  <input type="checkbox" defaultChecked className="w-5 h-5 accent-black border-2 border-black rounded-none appearance-none checked:bg-black transition-all cursor-pointer" />
                </label>
              ))}
            </div>
            <Button size="sm" variant="primary" className="w-full uppercase tracking-widest font-black h-11">Apply Preferences</Button>
          </section>

          {/* Account */}
          <section aria-labelledby="account-heading" className="bg-white border-2 border-black p-8 shadow-impact space-y-6">
            <h2 id="account-heading" className="text-[10px] font-sans font-black uppercase tracking-[0.2em] text-red-600">Access Management</h2>
            <Input label="New password" type="password" placeholder="Leave blank to keep current" />
            <Input label="Confirm new password" type="password" placeholder="Confirm new password" />
            <Button size="sm" variant="primary" className="w-full uppercase tracking-widest font-black h-11">Sync New Credentials</Button>
            
            <div className="pt-6 border-t-2 border-black">
              <p className="text-[10px] text-black/40 font-sans font-black uppercase tracking-widest mb-4 leading-relaxed">
                Permanently purge your research repository and all associated mappings.
              </p>
              <Button size="sm" variant="danger" className="w-full uppercase tracking-widest font-black h-11">Destroy Repository</Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
