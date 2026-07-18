import type { Metadata } from 'next';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { MOCK_PAPERS } from '@/lib/mockData';
import type { Paper } from '@/types/paper';

export const metadata: Metadata = { title: 'Defence Readiness', robots: { index: false } };

const CHECKLIST = [
  'I can articulate my core argument in under 2 minutes',
  'I have addressed the most-cited counter-argument',
  'I have justified my methodological choice',
  'I have acknowledged limitations proactively',
  'I have prepared responses to contradicting findings',
  'I have reviewed all papers flagged as critiques',
];

function Panel({
  id,
  heading,
  papers,
  badge,
  variant,
}: {
  id: string;
  heading: string;
  papers: Paper[];
  badge: string;
  variant: 'warning' | 'danger';
}) {
  return (
    <section aria-labelledby={id} className="bg-white border-2 border-black shadow-impact p-5">
      <h2 id={id} className="font-serif text-lg font-black uppercase tracking-tight text-black mb-4 pb-2 border-b-2 border-black">
        {heading}
      </h2>
      <ul className="space-y-3">
        {papers.map((paper) => (
          <li key={paper.id} className="border-b border-black/20 pb-3 last:border-0">
            <p className="text-[11px] font-sans font-black uppercase tracking-tight text-black line-clamp-2">{paper.title}</p>
            <p className="text-[10px] text-black/50 font-sans font-bold mt-0.5">{paper.year}</p>
            <div className="mt-2">
              <Badge variant={variant}>{badge}</Badge>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function DefencePage() {
  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title="Defence Readiness"
        subtitle="Prepare for the toughest questions by reviewing challenges to your thesis."
      />

      <div className="border-2 border-black bg-black px-4 py-3">
        <p className="text-[10px] font-sans font-black uppercase tracking-[0.2em] text-white">Stage // Defence Preparation</p>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        <Panel id="counter-heading" heading="Counter-Arguments" papers={MOCK_PAPERS.slice(0, 2)} badge="Challenges claim" variant="warning" />
        <Panel id="contradicting-heading" heading="Contradicting Findings" papers={MOCK_PAPERS.slice(2, 4)} badge="Contradicts" variant="danger" />
        <Panel id="methodology-heading" heading="Methodology Critiques" papers={MOCK_PAPERS.slice(0, 1)} badge="Methodology critique" variant="warning" />
      </div>

      <section aria-labelledby="checklist-heading" className="bg-white border-2 border-black shadow-impact p-5">
        <h2 id="checklist-heading" className="font-serif text-lg font-black uppercase tracking-tight text-black mb-4 pb-2 border-b-2 border-black">
          Defence Checklist
        </h2>
        <ul className="space-y-3">
          {CHECKLIST.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <input
                type="checkbox"
                id={`check-${i}`}
                className="mt-0.5 h-4 w-4 appearance-none border-2 border-black bg-white checked:bg-accent cursor-pointer flex-shrink-0"
                aria-label={item}
              />
              <label htmlFor={`check-${i}`} className="text-[12px] font-sans font-bold text-black cursor-pointer">{item}</label>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
