'use client';

import { auth } from '@/lib/firebase';

export type ExportFormat = 'bibtex' | 'csv' | 'json' | 'docx' | 'pdf';

const FILENAMES: Record<ExportFormat, string> = {
  bibtex: 'references.bib',
  csv: 'papers.csv',
  json: 'papers.json',
  docx: 'outline.docx',
  pdf: 'outline.pdf',
};

/**
 * Calls POST /api/export with the Firebase token and streams the response to a
 * browser download. Throws with the server's error message on failure.
 */
export async function downloadExport(format: ExportFormat, projectId: string, paperIds?: string[]): Promise<void> {
  const user = auth.currentUser;
  const token = user ? await user.getIdToken() : null;

  const res = await fetch('/api/export', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ format, projectId, paperIds }),
  });

  if (!res.ok) {
    const payload = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? `Export failed (${res.status})`);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = FILENAMES[format];
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
