import type { Metadata } from 'next';
import { PageHeader } from '@/components/layout/PageHeader';
import { OutlineBuilder } from '@/components/outline/OutlineBuilder';
import { ExportMenu } from '@/components/ExportMenu';

export const metadata: Metadata = {
  title: 'Outline Builder',
  robots: { index: false },
};

export default function OutlinePage() {
  return (
    <div className="flex flex-col h-[calc(100vh-64px-72px)] -m-6 md:-m-12 space-y-0">
      <div className="px-6 md:px-12 py-4 border-b-2 border-black bg-white flex-shrink-0">
        <PageHeader
          title="Outline Builder"
          subtitle="Structure your thesis chapters and track literature coverage per section."
          action={<ExportMenu formats={['docx', 'pdf']} />}
        />
      </div>
      <div className="flex-1 p-6 md:p-12 overflow-hidden">
        <div className="h-full">
          <OutlineBuilder />
        </div>
      </div>
    </div>
  );
}
