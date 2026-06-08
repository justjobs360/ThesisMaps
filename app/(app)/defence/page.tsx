import type { Metadata } from 'next';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { MOCK_PAPERS } from '@/lib/mockData';

export const metadata: Metadata = { title: 'Defence Readiness', robots: { index: false } };

const CHECKLIST = [
  'I can articulate my core argument in under 2 minutes',
  'I have addressed the most-cited counter-argument',
  'I have justified my methodological choice',
  'I have acknowledged limitations proactively',
  'I have prepared responses to contradicting findings',
  'I have reviewed all papers flagged as critiques',
];

export default function DefencePage() {
  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title="Defence Readiness"
        subtitle="Prepare for the toughest questions by reviewing challenges to your thesis."
      />

      <div className="bg-accent/8 border border-accent/20 rounded-md px-4 py-3">
        <p className="text-sm font-sans text-accent font-medium">Stage: Defence Preparation</p>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        <section aria-labelledby="counter-heading" className="bg-surface border border-border rounded-md p-5 shadow-sm">
          <h2 id="counter-heading" className="text-sm font-sans font-semibold text-text-primary mb-3">Counter-Arguments</h2>
          <ul className="space-y-2">
            {MOCK_PAPERS.slice(0, 2).map((paper) => (
              <li key={paper.id} className="border-b border-border pb-2 last:border-0">
                <p className="text-xs font-sans font-medium text-text-primary line-clamp-2">{paper.title}</p>
                <p className="text-xs text-text-muted font-sans mt-0.5">{paper.year}</p>
                <div className="mt-1">
                  <Badge variant="warning">Challenges claim</Badge>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="contradicting-heading" className="bg-surface border border-border rounded-md p-5 shadow-sm">
          <h2 id="contradicting-heading" className="text-sm font-sans font-semibold text-text-primary mb-3">Contradicting Findings</h2>
          <ul className="space-y-2">
            {MOCK_PAPERS.slice(2, 4).map((paper) => (
              <li key={paper.id} className="border-b border-border pb-2 last:border-0">
                <p className="text-xs font-sans font-medium text-text-primary line-clamp-2">{paper.title}</p>
                <p className="text-xs text-text-muted font-sans mt-0.5">{paper.year}</p>
                <div className="mt-1">
                  <Badge variant="danger">Contradicts</Badge>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="methodology-heading" className="bg-surface border border-border rounded-md p-5 shadow-sm">
          <h2 id="methodology-heading" className="text-sm font-sans font-semibold text-text-primary mb-3">Methodology Critiques</h2>
          <ul className="space-y-2">
            {MOCK_PAPERS.slice(0, 1).map((paper) => (
              <li key={paper.id} className="border-b border-border pb-2 last:border-0">
                <p className="text-xs font-sans font-medium text-text-primary line-clamp-2">{paper.title}</p>
                <p className="text-xs text-text-muted font-sans mt-0.5">{paper.year}</p>
                <div className="mt-1">
                  <Badge variant="warning">Methodology critique</Badge>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section aria-labelledby="checklist-heading" className="bg-surface border border-border rounded-md p-5 shadow-sm">
        <h2 id="checklist-heading" className="text-sm font-sans font-semibold text-text-primary mb-4">Defence Checklist</h2>
        <ul className="space-y-2">
          {CHECKLIST.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <input
                type="checkbox"
                id={`check-${i}`}
                className="mt-0.5 accent-accent"
                aria-label={item}
              />
              <label htmlFor={`check-${i}`} className="text-sm font-sans text-text-primary cursor-pointer">{item}</label>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
