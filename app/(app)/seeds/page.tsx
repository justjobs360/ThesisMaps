'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { Plus, Layers, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useProject } from '@/hooks/useProject';
import { useSeeds } from '@/hooks/useSeeds';
import { useAnalytics } from '@/hooks/useAnalytics';
import { apiClient } from '@/lib/apiClient';
import type { SavedPaper } from '@/types/paper';

export default function SeedsPage() {
  const { projectId } = useProject();
  const {
    seedSets,
    selectedSet,
    selectedSetId,
    setSelectedSetId,
    papers,
    loading,
    papersLoading,
    error,
    createSet,
    deleteSet,
  } = useSeeds(projectId);
  const { track } = useAnalytics();

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [library, setLibrary] = useState<SavedPaper[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [pickedIds, setPickedIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!createOpen || !projectId) return;
    setLibraryLoading(true);
    apiClient
      .get<{ papers: SavedPaper[] }>(`/api/papers/save?projectId=${projectId}`)
      .then(({ papers: data }) => setLibrary(data))
      .catch(() => setLibrary([]))
      .finally(() => setLibraryLoading(false));
  }, [createOpen, projectId]);

  function togglePick(paperId: string) {
    setPickedIds((prev) => {
      const next = new Set(prev);
      if (next.has(paperId)) next.delete(paperId);
      else next.add(paperId);
      return next;
    });
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      await createSet(name.trim(), [...pickedIds]);
      track('seed_set_created', { paperCount: pickedIds.size });
      setCreateOpen(false);
      setName('');
      setPickedIds(new Set());
    } catch {
      // error surfaced via hook state
    } finally {
      setSaving(false);
    }
  }

  return (
    // Definite height, not h-full: the shell wrapper only sets min-h-*, so a
    // percentage height had nothing to resolve against and the flex-1 panes
    // inside never got a real box to scroll within.
    <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-72px)] -my-6 md:-my-12 py-6 md:py-12">
      {/* Sidebar */}
      <aside className="w-full lg:w-72 flex-shrink-0 bg-white border-2 border-black flex flex-col shadow-impact" aria-label="Seed sets">
        <div className="p-4 border-b-2 border-black flex items-center justify-between bg-black">
          <p className="text-[10px] font-sans font-black uppercase tracking-[0.2em] text-white">Seed Repositories</p>
          <button
            className="text-white hover:text-accent transition-colors"
            onClick={() => setCreateOpen(true)}
            aria-label="New seed set"
          >
            <Plus size={18} strokeWidth={3} />
          </button>
        </div>
        <ul className="flex-1 overflow-y-auto p-3 space-y-2">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
          ) : seedSets.length === 0 ? (
            <li className="p-4 border-2 border-dashed border-black text-center">
              <p className="text-[10px] text-black/40 font-bold uppercase tracking-widest leading-relaxed">
                No seed sets yet. Create one from your saved library.
              </p>
            </li>
          ) : (
            seedSets.map((set) => (
              <li key={set.id}>
                <button
                  onClick={() => setSelectedSetId(set.id)}
                  className={[
                    'w-full text-left px-4 py-3 border-2 border-black group transition-all duration-200',
                    set.id === selectedSetId ? 'bg-black' : 'bg-white hover:bg-black',
                  ].join(' ')}
                >
                  <p className={[
                    'font-sans font-black text-xs uppercase tracking-tight transition-colors',
                    set.id === selectedSetId ? 'text-white' : 'text-black group-hover:text-white',
                  ].join(' ')}>
                    {set.name}
                  </p>
                  <p className={[
                    'text-[10px] font-bold uppercase tracking-tighter mt-1 transition-colors',
                    set.id === selectedSetId ? 'text-white/60' : 'text-black/40 group-hover:text-white/60',
                  ].join(' ')}>
                    {set.paperIds.length} papers // {format(new Date(set.createdAt), 'MMM d').toUpperCase()}
                  </p>
                </button>
              </li>
            ))
          )}
        </ul>
      </aside>

      {/* Main */}
      <main className="flex-1 bg-white border-2 border-black flex flex-col overflow-hidden shadow-impact">
        {error ? (
          <div className="p-6">
            <p className="text-[10px] text-red-600 font-black uppercase tracking-widest">Failed to load seed sets</p>
            <p className="text-xs text-black/40 font-sans mt-2">{error}</p>
          </div>
        ) : loading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : !selectedSet ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center">
              <p className="text-sm text-black font-sans font-bold uppercase tracking-[0.3em] mb-6">No Seed Set Selected</p>
              <Button size="sm" variant="primary" onClick={() => setCreateOpen(true)}>
                <Plus size={16} strokeWidth={2.5} className="mr-2" /> Create Seed Set
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="p-6 border-b-2 border-black">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-sans font-black uppercase tracking-widest text-accent mb-1">Active Mapping</p>
                  <h2 className="font-serif text-3xl font-black text-black tracking-tighter uppercase leading-none">{selectedSet.name}</h2>
                  <p className="text-[10px] text-black/40 font-bold uppercase tracking-widest mt-2">
                    {selectedSet.paperIds.length} seed papers // INITIALISED {format(new Date(selectedSet.createdAt), 'MMM d, yyyy').toUpperCase()}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="danger"
                  className="h-10 px-6 uppercase tracking-widest font-black text-[10px]"
                  onClick={() => void deleteSet(selectedSet.id)}
                >
                  <Trash2 size={16} strokeWidth={2.5} className="mr-2" /> Delete Set
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {papersLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : papers.length === 0 ? (
                <div className="flex items-center gap-3 p-5 border-2 border-black border-dashed bg-white">
                  <Layers size={18} strokeWidth={2} className="text-black/20" />
                  <p className="text-[10px] text-black/40 font-bold uppercase tracking-widest leading-none">
                    This seed set has no papers yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {papers.map((paper) => (
                    <div key={paper.id} className="flex items-center justify-between gap-4 p-4 border-2 border-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-sans font-black text-black uppercase tracking-tight truncate">{paper.title}</p>
                        <p className="text-[10px] text-black/60 font-sans font-bold uppercase tracking-tighter mt-1">
                          {paper.year || '—'} // {paper.authors[0]?.name.toUpperCase() ?? 'UNKNOWN'}
                        </p>
                      </div>
                      <Badge variant="primary" className="rounded-none border-2 border-black px-3 py-1 font-black text-[9px] uppercase tracking-widest">Seed</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Create modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New Seed Set"
        description="Name the set and pick seed papers from your saved library."
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Set name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Core Transformers"
            required
          />
          <div>
            <p className="text-[10px] font-sans font-black uppercase tracking-widest text-black mb-2">
              Pick papers ({pickedIds.size} selected)
            </p>
            <div className="max-h-64 overflow-y-auto border-2 border-black divide-y-2 divide-black">
              {libraryLoading ? (
                <div className="p-4"><Skeleton className="h-12 w-full" /></div>
              ) : library.length === 0 ? (
                <p className="p-4 text-[10px] text-black/40 font-bold uppercase tracking-widest">
                  Your library is empty — save papers from Search first.
                </p>
              ) : (
                library.map((saved) => (
                  <label key={saved.id} className="flex items-start gap-3 p-3 cursor-pointer hover:bg-black/5 transition-colors">
                    <input
                      type="checkbox"
                      checked={pickedIds.has(saved.paper.id)}
                      onChange={() => togglePick(saved.paper.id)}
                      className="mt-0.5 h-4 w-4 appearance-none border-2 border-black bg-white checked:bg-accent cursor-pointer flex-shrink-0"
                    />
                    <span className="min-w-0">
                      <span className="block text-[11px] font-sans font-black text-black uppercase tracking-tight truncate">{saved.paper.title}</span>
                      <span className="block text-[10px] text-black/50 font-sans font-bold mt-0.5">{saved.paper.year || '—'}</span>
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>
          <Button type="submit" variant="primary" className="w-full" loading={saving} disabled={!name.trim()}>
            Create Seed Set
          </Button>
        </form>
      </Modal>
    </div>
  );
}
