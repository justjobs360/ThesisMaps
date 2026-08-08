'use client';

import React, { useEffect, useState } from 'react';
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { Plus, FileText, X, Sparkles, Check } from 'lucide-react';
import { ChapterSection } from './ChapterSection';
import { CoverageScore } from './CoverageScore';
import { AiResultModal } from '@/components/ai/AiResultModal';
import { useOutline } from '@/hooks/useOutline';
import { useProject } from '@/hooks/useProject';
import { apiClient, ApiError } from '@/lib/apiClient';
import type { SavedPaper } from '@/types/paper';

type SuggestedSection = { title: string; rationale: string };

export function OutlineBuilder() {
  const { projectId } = useProject();
  const {
    sections, selectedSection, selectedSectionId, setSelectedSectionId,
    loading, addSection, reorderSections, deleteSection,
    sectionPapers, sectionPapersLoading, assignPaper, unassignPaper,
  } = useOutline(projectId);

  const [showTree, setShowTree] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [library, setLibrary] = useState<SavedPaper[]>([]);

  // --- AI outline suggestions ---
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestedSection[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const [suggestAiAvailable, setSuggestAiAvailable] = useState(true);
  const [accepted, setAccepted] = useState<Set<string>>(new Set());

  async function openSuggestions() {
    if (!projectId) return;
    setSuggestOpen(true);
    setSuggestLoading(true);
    setSuggestError(null);
    setSuggestions([]);
    setAccepted(new Set());
    try {
      const res = await apiClient.post<{ aiAvailable: boolean; sections: SuggestedSection[] }>(
        '/api/outline/suggest',
        { projectId }
      );
      setSuggestAiAvailable(res.aiAvailable);
      setSuggestions(res.sections ?? []);
    } catch (err) {
      setSuggestError(err instanceof ApiError ? err.message : 'Could not generate suggestions.');
    } finally {
      setSuggestLoading(false);
    }
  }

  // Accepting creates a REAL persisted section via the existing outline hook.
  async function acceptSuggestion(title: string) {
    if (accepted.has(title)) return;
    setAccepted((prev) => new Set(prev).add(title));
    await addSection(title);
  }

  // Load the project's saved library once — used to assign papers to sections.
  useEffect(() => {
    if (!projectId) return;
    apiClient
      .get<{ papers: SavedPaper[] }>(`/api/papers/save?projectId=${projectId}`)
      .then(({ papers }) => setLibrary(papers))
      .catch(() => setLibrary([]));
  }, [projectId, sectionPapers.length]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = sections.findIndex((s) => s.id === active.id);
      const newIndex = sections.findIndex((s) => s.id === over.id);
      void reorderSections(arrayMove(sections, oldIndex, newIndex));
    }
  }

  const rootSections = sections.filter((s) => !s.parentId);
  const linkedIds = new Set(sectionPapers.map((p) => p.id));
  const assignable = library.filter((s) => s.paper?.id && !linkedIds.has(s.paper.id));

  return (
    <div className="flex flex-col lg:flex-row h-full gap-0 border-2 border-black overflow-hidden bg-white shadow-impact">
      {/* Mobile Toggle */}
      <div className="lg:hidden p-4 border-b-2 border-black flex items-center justify-between">
        <button
          onClick={() => setShowTree(!showTree)}
          className="px-4 py-2 border-2 border-black text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-colors"
        >
          {showTree ? 'Hide Structure' : 'Show Structure'}
        </button>
        {selectedSection && (
          <span className="text-[10px] font-black uppercase truncate ml-4 tracking-tighter">{selectedSection.title}</span>
        )}
      </div>

      {/* Left outline tree */}
      <aside
        className={[
          'w-full lg:w-72 flex-shrink-0 bg-white border-b-2 lg:border-b-0 lg:border-r-2 border-black flex flex-col transition-all',
          showTree ? 'block' : 'hidden lg:flex',
        ].join(' ')}
        aria-label="Outline sections"
      >
        <div className="p-4 border-b-2 border-black bg-black">
          <p className="text-[10px] font-sans font-black uppercase tracking-[0.2em] text-white">Project Blueprint</p>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          {loading ? (
            <div className="space-y-2 px-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-9 border-2 border-black bg-black/5 animate-pulse" />
              ))}
            </div>
          ) : rootSections.length === 0 ? (
            <p className="px-4 text-[10px] font-sans font-bold uppercase tracking-wider text-black/40">
              No sections yet. Add one below.
            </p>
          ) : (
            <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={rootSections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                {rootSections.map((section) => (
                  <React.Fragment key={section.id}>
                    <ChapterSection
                      section={section}
                      isSelected={selectedSectionId === section.id}
                      onClick={() => {
                        setSelectedSectionId(section.id);
                        if (window.innerWidth < 1024) setShowTree(false);
                      }}
                      onDelete={() => void deleteSection(section.id)}
                    />
                    {sections
                      .filter((s) => s.parentId === section.id)
                      .map((child) => (
                        <ChapterSection
                          key={child.id}
                          section={child}
                          isSelected={selectedSectionId === child.id}
                          onClick={() => {
                            setSelectedSectionId(child.id);
                            if (window.innerWidth < 1024) setShowTree(false);
                          }}
                          onDelete={() => void deleteSection(child.id)}
                          depth={1}
                        />
                      ))}
                  </React.Fragment>
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>

        <div className="p-4 border-t-2 border-black bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (newTitle.trim()) {
                void addSection(newTitle.trim());
                setNewTitle('');
              }
            }}
            className="flex gap-2"
          >
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="NEW SECTION..."
              className="flex-1 h-10 px-3 text-[10px] border-2 border-black bg-white font-sans font-bold uppercase tracking-tighter placeholder:text-black/20 focus:outline-none focus:border-accent"
            />
            <button type="submit" aria-label="Add section" className="p-2 border-2 border-black hover:bg-black hover:text-white transition-colors">
              <Plus size={16} strokeWidth={3} />
            </button>
          </form>

          <button
            onClick={() => void openSuggestions()}
            disabled={!projectId}
            className="mt-2 w-full h-10 flex items-center justify-center gap-2 border-2 border-black bg-white text-black text-[10px] font-sans font-black uppercase tracking-widest hover:bg-black hover:text-white transition-colors disabled:opacity-40"
          >
            <Sparkles size={13} strokeWidth={2.5} /> Suggest Structure
          </button>
        </div>
      </aside>

      {/* Main area */}
      <main className="flex-1 flex flex-col bg-white min-h-0">
        {selectedSection ? (
          <>
            <div className="p-6 border-b-2 border-black flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-sans font-black uppercase tracking-widest text-accent mb-1">Active Section</p>
                <h2 className="font-serif text-3xl font-black text-black tracking-tighter uppercase">{selectedSection.title}</h2>
              </div>
              <div className="flex items-center gap-4">
                {selectedSection.coverageScore !== undefined ? <CoverageScore score={selectedSection.coverageScore} /> : null}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <div>
                <p className="text-[10px] font-sans font-black uppercase tracking-widest text-black/40 mb-4">
                  Linked Evidence ({sectionPapers.length})
                </p>
                <div className="space-y-3">
                  {sectionPapersLoading ? (
                    Array.from({ length: 2 }).map((_, i) => (
                      <div key={i} className="h-16 border-2 border-black bg-black/5 animate-pulse" />
                    ))
                  ) : sectionPapers.length === 0 ? (
                    <div className="p-6 border-2 border-dashed border-black/30 text-center">
                      <p className="text-[10px] font-sans font-bold uppercase tracking-wider text-black/40">No evidence linked yet</p>
                    </div>
                  ) : (
                    sectionPapers.map((paper) => (
                      <div key={paper.id} className="flex items-center justify-between gap-4 p-4 border-2 border-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-sans font-black text-black uppercase tracking-tight truncate">{paper.title}</p>
                          <p className="text-[10px] text-black/60 font-sans font-bold uppercase tracking-tighter mt-1">
                            {paper.year} // {paper.authors[0]?.name.toUpperCase() ?? 'UNKNOWN'}
                          </p>
                        </div>
                        <button
                          onClick={() => void unassignPaper(selectedSection.id, paper.id)}
                          aria-label="Remove paper from section"
                          className="text-black/40 hover:text-red-600 transition-colors"
                        >
                          <X size={14} strokeWidth={2.5} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Assign from library */}
              <div>
                <p className="text-[10px] font-sans font-black uppercase tracking-widest text-black/40 mb-3">
                  Assign From Library ({assignable.length})
                </p>
                {assignable.length === 0 ? (
                  <p className="text-[10px] font-sans font-bold uppercase tracking-wider text-black/30">
                    Save papers from Search, then assign them here.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {assignable.slice(0, 8).map((saved) => (
                      <button
                        key={saved.id}
                        onClick={() => void assignPaper(selectedSection.id, saved.paper.id)}
                        className="w-full flex items-center justify-between gap-3 p-3 border-2 border-black bg-white hover:bg-black hover:text-white transition-colors group text-left"
                      >
                        <span className="text-[11px] font-sans font-bold uppercase tracking-tight truncate">{saved.paper.title}</span>
                        <Plus size={14} strokeWidth={3} className="flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-12">
            <div className="text-center max-w-sm">
              <FileText size={48} strokeWidth={1} className="text-black/10 mx-auto mb-6" />
              <p className="text-[10px] font-sans font-black uppercase tracking-[0.2em] text-black mb-2">Structure Station Idle</p>
              <p className="text-xs font-sans font-bold text-black/40">Select a section from the blueprint to begin synthesizing your evidence.</p>
            </div>
          </div>
        )}
      </main>

      {/* AI-suggested chapter structure */}
      <AiResultModal
        open={suggestOpen}
        onClose={() => setSuggestOpen(false)}
        title="Suggested Structure"
        description="Chapters proposed from your saved library. Accept the ones you want."
        loading={suggestLoading}
        error={suggestError}
        aiAvailable={suggestAiAvailable}
        loadingLabel="Reading your library…"
      >
        {suggestions.length === 0 && suggestAiAvailable ? (
          <p className="text-sm font-sans text-black/50">
            No suggestions — save some papers to your library first, then try again.
          </p>
        ) : (
          <ul className="space-y-3">
            {suggestions.map((s) => {
              const isAccepted = accepted.has(s.title);
              return (
                <li key={s.title} className="border-2 border-black p-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[12px] font-sans font-black uppercase tracking-tight text-black">{s.title}</p>
                    <p className="text-xs font-sans text-black/60 mt-1 leading-relaxed">{s.rationale}</p>
                  </div>
                  <button
                    onClick={() => void acceptSuggestion(s.title)}
                    disabled={isAccepted}
                    aria-label={`Add section ${s.title}`}
                    className={[
                      'flex-shrink-0 h-8 px-3 border-2 border-black text-[10px] font-sans font-black uppercase tracking-widest transition-colors',
                      isAccepted
                        ? 'bg-success text-white border-success cursor-default'
                        : 'bg-white text-black hover:bg-black hover:text-white',
                    ].join(' ')}
                  >
                    {isAccepted ? <Check size={13} strokeWidth={3} /> : 'Add'}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </AiResultModal>
    </div>
  );
}
