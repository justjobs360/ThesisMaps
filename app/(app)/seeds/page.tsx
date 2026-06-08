import type { Metadata } from 'next';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Plus, Layers } from 'lucide-react';
import { MOCK_PAPERS } from '@/lib/mockData';
import { format } from 'date-fns';

export const metadata: Metadata = { title: 'Seed Maps', robots: { index: false } };

const MOCK_SEED_SETS = [
  { id: 's1', name: 'Core Transformers', paperCount: 4, createdAt: '2024-01-20T10:00:00Z' },
  { id: 's2', name: 'LSTM Predecessors', paperCount: 3, createdAt: '2024-02-01T10:00:00Z' },
];

export default function SeedsPage() {
  return (
    <div className="flex flex-col lg:flex-row gap-8 h-full max-w-6xl mx-auto">
      {/* Sidebar */}
      <aside className="w-full lg:w-72 flex-shrink-0 bg-white border-2 border-black flex flex-col shadow-impact" aria-label="Seed sets">
        <div className="p-4 border-b-2 border-black flex items-center justify-between bg-black">
          <p className="text-[10px] font-sans font-black uppercase tracking-[0.2em] text-white">Seed Repositories</p>
          <button className="text-white hover:text-accent transition-colors">
            <Plus size={18} strokeWidth={3} />
          </button>
        </div>
        <ul className="flex-1 overflow-y-auto p-3 space-y-2">
          {MOCK_SEED_SETS.map((set) => (
            <li key={set.id}>
              <button className="w-full text-left px-4 py-3 border-2 border-black bg-white hover:bg-black group transition-all duration-200">
                <p className="font-sans font-black text-xs text-black uppercase tracking-tight group-hover:text-white transition-colors">{set.name}</p>
                <p className="text-[10px] text-black/40 font-bold uppercase tracking-tighter mt-1 group-hover:text-white/60 transition-colors">
                  {set.paperCount} papers // {format(new Date(set.createdAt), 'MMM d').toUpperCase()}
                </p>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Main */}
      <main className="flex-1 bg-white border-2 border-black flex flex-col overflow-hidden shadow-impact">
        <div className="p-6 border-b-2 border-black">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-sans font-black uppercase tracking-widest text-accent mb-1">Active Mapping</p>
              <h2 className="font-serif text-3xl font-black text-black tracking-tighter uppercase leading-none">Core Transformers</h2>
              <p className="text-[10px] text-black/40 font-bold uppercase tracking-widest mt-2">
                4 seed papers // INITIALISED {format(new Date('2024-01-20T10:00:00Z'), 'MMM d, yyyy').toUpperCase()}
              </p>
            </div>
            <Button size="sm" variant="primary" className="h-10 px-6 uppercase tracking-widest font-black text-[10px]">
              <Plus size={16} strokeWidth={2.5} className="mr-2" /> Add Papers
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {MOCK_PAPERS.slice(0, 4).map((paper) => (
              <div key={paper.id} className="flex items-center justify-between gap-4 p-4 border-2 border-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-sans font-black text-black uppercase tracking-tight truncate">{paper.title}</p>
                  <p className="text-[10px] text-black/60 font-sans font-bold uppercase tracking-tighter mt-1">{paper.year} // {paper.authors[0]?.name.toUpperCase()}</p>
                </div>
                <Badge variant="primary" className="rounded-none border-2 border-black px-3 py-1 font-black text-[9px] uppercase tracking-widest">Seed</Badge>
              </div>
            ))}
          </div>

          <div className="mt-10">
            <p className="text-[10px] font-sans font-black uppercase tracking-widest text-black/40 mb-4">Post-Seed Synchronization</p>
            <div className="flex items-center gap-3 p-5 border-2 border-black border-dashed bg-white">
              <Layers size={18} strokeWidth={2} className="text-black/20" />
              <p className="text-[10px] text-black/40 font-bold uppercase tracking-widest leading-none">No fresh literature detected since last map state.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
