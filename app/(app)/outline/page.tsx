import type { Metadata } from 'next';
import { PageHeader } from '@/components/layout/PageHeader';
import { OutlineBuilder } from '@/components/outline/OutlineBuilder';

export const metadata: Metadata = {
  title: 'Outline Builder',
  robots: { index: false },
};

export default function OutlinePage() {
  return (
    <div className="flex flex-col h-[calc(100vh-52px-48px)] -m-6 space-y-0">
      <div className="px-6 py-4 border-b border-border bg-background flex-shrink-0">
        <PageHeader
          title="Outline Builder"
          subtitle="Structure your thesis chapters and track literature coverage per section."
        />
      </div>
      <div className="flex-1 p-6 overflow-hidden">
        <div className="h-full">
          <OutlineBuilder projectId="proj1" />
        </div>
      </div>
    </div>
  );
}
