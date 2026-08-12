'use client';

import React, { useState } from 'react';
import { ChevronDown, Check, Plus } from 'lucide-react';
import { Dropdown, type DropdownItem } from '@/components/ui/Dropdown';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useProject } from '@/hooks/useProject';
import { ApiError } from '@/lib/apiClient';

/**
 * Lets a user run more than one thesis. The backend always supported this
 * (POST /api/projects, no per-user cap) and ProjectContext already exposed
 * `projects` + `setCurrentProjectId` — but nothing ever called them, so users
 * were stuck on the single auto-created "My Thesis".
 *
 * Every page scopes its queries by `projectId` from the same context, so
 * switching here repoints the whole app.
 */
export function ProjectSwitcher() {
  const { projects, currentProject, setCurrentProjectId, createProject, loading } = useProject();

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [field, setField] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      await createProject({ title: title.trim(), field: field.trim() || undefined });
      setTitle('');
      setField('');
      setOpen(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create the project.');
    } finally {
      setBusy(false);
    }
  }

  const items: DropdownItem[] = [
    ...projects.map((p) => ({
      label: p.title,
      icon:
        p.id === currentProject?.id ? (
          <Check size={14} strokeWidth={3} className="text-accent" />
        ) : (
          <span className="w-[14px]" aria-hidden />
        ),
      onClick: () => setCurrentProjectId(p.id),
    })),
    {
      label: 'New project',
      icon: <Plus size={14} strokeWidth={3} />,
      onClick: () => setOpen(true),
    },
  ];

  // Nothing useful to show until the first project resolves.
  if (loading && projects.length === 0) {
    return <span className="h-8 w-32 bg-black/10 animate-pulse hidden md:block" aria-hidden />;
  }
  if (projects.length === 0) return null;

  return (
    <>
      <Dropdown
        align="start"
        items={items}
        trigger={
          <button
            aria-label={`Active project: ${currentProject?.title ?? 'none'}. Switch project`}
            className="flex items-center gap-2 h-8 max-w-[10rem] md:max-w-[16rem] px-2 md:px-3 border-2 border-black bg-white text-black hover:bg-black hover:text-white transition-colors"
          >
            <span className="truncate text-[10px] md:text-xs font-sans font-black uppercase tracking-tight">
              {currentProject?.title ?? 'Select project'}
            </span>
            <ChevronDown size={14} strokeWidth={2.5} className="flex-shrink-0" />
          </button>
        }
      />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New Project"
        description="Start a separate thesis with its own library, outline and graph."
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreate} className="space-y-5">
          <Input
            label="Thesis title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Transformer Architectures for Low-Resource MT"
            required
          />
          <Input
            label="Research field"
            value={field}
            onChange={(e) => setField(e.target.value)}
            placeholder="e.g. Computer Science / NLP"
            hint="Optional — used to tailor gap and defence analysis."
          />
          {error ? (
            <p className="text-[10px] font-sans font-black uppercase tracking-widest text-red-600">{error}</p>
          ) : null}
          <Button
            type="submit"
            variant="primary"
            className="w-full h-11 uppercase tracking-widest font-black"
            loading={busy}
            disabled={!title.trim()}
          >
            Create Project
          </Button>
        </form>
      </Modal>
    </>
  );
}
