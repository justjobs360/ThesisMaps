'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateProfile, updatePassword, deleteUser } from 'firebase/auth';
import { PageHeader } from '@/components/layout/PageHeader';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { THESIS_STAGES, type ThesisStage } from '@/types/thesis';
import { useAuth } from '@/context/AuthContext';
import { useProject } from '@/hooks/useProject';
import { apiClient } from '@/lib/apiClient';

type SaveState = { busy: boolean; message: string | null; isError: boolean };
const idle: SaveState = { busy: false, message: null, isError: false };

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { currentProject, projectId, refresh } = useProject();
  const router = useRouter();

  const [name, setName] = useState(user?.displayName ?? '');
  const [thesisTitle, setThesisTitle] = useState('');
  const [field, setField] = useState('');
  const [stage, setStage] = useState<ThesisStage>('research_proposal');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [profileState, setProfileState] = useState<SaveState>(idle);
  const [projectState, setProjectState] = useState<SaveState>(idle);
  const [passwordState, setPasswordState] = useState<SaveState>(idle);
  const [deleteState, setDeleteState] = useState<SaveState>(idle);

  // Seed the form from the real project once loaded.
  useEffect(() => {
    if (currentProject) {
      setThesisTitle(currentProject.title);
      setField(currentProject.field);
      setStage(currentProject.currentStage);
    }
  }, [currentProject]);

  useEffect(() => {
    setName(user?.displayName ?? '');
  }, [user]);

  async function saveProfile() {
    if (!user) return;
    setProfileState({ busy: true, message: null, isError: false });
    try {
      await updateProfile(user, { displayName: name.trim() });
      setProfileState({ busy: false, message: 'Profile saved.', isError: false });
    } catch (err) {
      setProfileState({ busy: false, message: err instanceof Error ? err.message : 'Save failed', isError: true });
    }
  }

  async function saveProjectMeta() {
    if (!projectId) return;
    setProjectState({ busy: true, message: null, isError: false });
    try {
      await apiClient.patch(`/api/projects/${projectId}`, {
        title: thesisTitle.trim(),
        field: field.trim(),
        currentStage: stage,
      });
      await refresh();
      setProjectState({ busy: false, message: 'Thesis metadata saved.', isError: false });
    } catch (err) {
      setProjectState({ busy: false, message: err instanceof Error ? err.message : 'Save failed', isError: true });
    }
  }

  async function savePassword() {
    if (!user) return;
    if (!newPassword) {
      setPasswordState({ busy: false, message: 'Enter a new password first.', isError: true });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordState({ busy: false, message: 'Passwords do not match.', isError: true });
      return;
    }
    setPasswordState({ busy: true, message: null, isError: false });
    try {
      await updatePassword(user, newPassword);
      setNewPassword('');
      setConfirmPassword('');
      setPasswordState({ busy: false, message: 'Password updated.', isError: false });
    } catch (err) {
      const msg = err instanceof Error && err.message.includes('requires-recent-login')
        ? 'For security, sign out and back in, then retry.'
        : err instanceof Error ? err.message : 'Update failed';
      setPasswordState({ busy: false, message: msg, isError: true });
    }
  }

  async function destroyAccount() {
    if (!user) return;
    if (!window.confirm('This permanently deletes your account, projects, library, and outlines. Continue?')) return;
    setDeleteState({ busy: true, message: null, isError: false });
    try {
      // Server route removes the DB rows and the Firebase user (cascade covers project data).
      await apiClient.del('/api/me');
      await deleteUser(user).catch(() => undefined); // already gone server-side; ignore
      await signOut().catch(() => undefined);
      router.push('/');
    } catch (err) {
      setDeleteState({ busy: false, message: err instanceof Error ? err.message : 'Deletion failed', isError: true });
    }
  }

  function StateLine({ state }: { state: SaveState }) {
    if (!state.message) return null;
    return (
      <p className={['text-[10px] font-sans font-black uppercase tracking-widest', state.isError ? 'text-red-600' : 'text-success'].join(' ')}>
        {state.message}
      </p>
    );
  }

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
            <StateLine state={profileState} />
            <Button size="sm" variant="primary" className="w-full uppercase tracking-widest font-black h-11" onClick={saveProfile} loading={profileState.busy}>
              Save Profile
            </Button>
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
            <StateLine state={projectState} />
            <Button size="sm" variant="primary" className="w-full uppercase tracking-widest font-black h-11" onClick={saveProjectMeta} loading={projectState.busy} disabled={!projectId}>
              Save Metadata
            </Button>
          </section>
        </div>

        <div className="space-y-8">
          {/* Account */}
          <section aria-labelledby="account-heading" className="bg-white border-2 border-black p-8 shadow-impact space-y-6">
            <h2 id="account-heading" className="text-[10px] font-sans font-black uppercase tracking-[0.2em] text-red-600">Access Management</h2>
            <Input label="New password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Leave blank to keep current" />
            <Input label="Confirm new password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" />
            <StateLine state={passwordState} />
            <Button size="sm" variant="primary" className="w-full uppercase tracking-widest font-black h-11" onClick={savePassword} loading={passwordState.busy}>
              Sync New Credentials
            </Button>

            <div className="pt-6 border-t-2 border-black">
              <p className="text-[10px] text-black/40 font-sans font-black uppercase tracking-widest mb-4 leading-relaxed">
                Permanently purge your research repository and all associated mappings.
              </p>
              <StateLine state={deleteState} />
              <Button size="sm" variant="danger" className="w-full uppercase tracking-widest font-black h-11 mt-2" onClick={destroyAccount} loading={deleteState.busy}>
                Destroy Repository
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
