'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { Dropdown } from '@/components/ui/Dropdown';
import { useProject } from '@/hooks/useProject';
import { useAnalytics } from '@/hooks/useAnalytics';
import { downloadExport, type ExportFormat } from '@/lib/download';

type ExportMenuProps = {
  /** Which formats to offer. Library exports: bibtex/csv/json. Outline docs: docx/pdf. */
  formats: ExportFormat[];
};

const LABELS: Record<ExportFormat, string> = {
  bibtex: 'BibTeX (.bib)',
  csv: 'CSV (.csv)',
  json: 'JSON (.json)',
  docx: 'Word (.docx)',
  pdf: 'PDF (.pdf)',
};

export function ExportMenu({ formats }: ExportMenuProps) {
  const { projectId } = useProject();
  const { track } = useAnalytics();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport(format: ExportFormat) {
    if (!projectId || busy) return;
    setBusy(true);
    setError(null);
    try {
      await downloadExport(format, projectId);
      track('export_generated', { format });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {error ? (
        <p className="text-[10px] text-red-600 font-black uppercase tracking-widest">{error}</p>
      ) : null}
      <Dropdown
        trigger={
          <button
            disabled={busy}
            className="inline-flex items-center gap-2 h-10 px-5 border-2 border-black bg-white font-sans font-black text-[10px] uppercase tracking-widest hover:bg-black hover:text-white transition-colors disabled:opacity-50"
          >
            <Download size={14} strokeWidth={2.5} />
            {busy ? 'Exporting…' : 'Export'}
          </button>
        }
        items={formats.map((format) => ({
          label: LABELS[format],
          onClick: () => void handleExport(format),
        }))}
      />
    </div>
  );
}
