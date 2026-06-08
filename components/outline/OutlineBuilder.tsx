'use client';

import React, { useState } from 'react';
import {
  DndContext, closestCenter, type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { Plus, FileText, Download, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ChapterSection } from './ChapterSection';
import { CoverageScore } from './CoverageScore';
import { useOutline } from '@/hooks/useOutline';
import { MOCK_PAPERS } from '@/lib/mockData';

export function OutlineBuilder({ projectId }: { projectId: string }) {
  const {
    sections, selectedSection, selectedSectionId,
    setSelectedSectionId, addSection, reorderSections,
  } = useOutline(projectId);

  const [showTree, setShowTree] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = sections.findIndex((s) => s.id === active.id);
      const newIndex = sections.findIndex((s) => s.id === over.id);
      reorderSections(arrayMove(sections, oldIndex, newIndex));
    }
  }

  const rootSections = sections.filter((s) => !s.parentId);

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
          showTree ? 'block' : 'hidden lg:flex'
        ].join(' ')} 
        aria-label="Outline sections"
      >
        <div className="p-4 border-b-2 border-black bg-black">
          <p className="text-[10px] font-sans font-black uppercase tracking-[0.2em] text-white">Project Blueprint</p>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
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
                        depth={1}
                      />
                    ))}
                </React.Fragment>
              ))}
            </SortableContext>
          </DndContext>
        </div>

        <div className="p-4 border-t-2 border-black bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (newTitle.trim()) {
                addSection(newTitle.trim());
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
                {selectedSection.coverageScore !== undefined ? (
                  <CoverageScore score={selectedSection.coverageScore} />
                ) : null}
                <Button size="sm" variant="primary" className="h-10 px-6 uppercase tracking-widest font-black text-[10px]">
                  <Download size={16} strokeWidth={2.5} className="mr-2" /> Export
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <div>
                <p className="text-[10px] font-sans font-black uppercase tracking-widest text-black/40 mb-4">Linked Evidence (PPR REPO)</p>
                <div className="space-y-3">
                  {MOCK_PAPERS.slice(0, 3).map((paper) => (
                    <div key={paper.id} className="flex items-center justify-between gap-4 p-4 border-2 border-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-sans font-black text-black uppercase tracking-tight truncate">{paper.title}</p>
                        <p className="text-[10px] text-black/60 font-sans font-bold uppercase tracking-tighter mt-1">{paper.year} // {paper.authors[0]?.name.toUpperCase()}</p>
                      </div>
                      <button className="text-black/40 hover:text-red-600 transition-colors">
                         <X size={14} strokeWidth={2.5} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-sans font-black uppercase tracking-widest text-black/40 mb-3">Contextual Synthesis</p>
                <textarea
                  placeholder="ENTER RESEARCH NOTES AND SYNTHESIS HERE..."
                  rows={8}
                  className="w-full border-2 border-black bg-white p-4 text-xs font-sans font-bold text-black placeholder:text-black/20 focus:outline-none focus:border-accent resize-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                />
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
    </div>
  );
}
