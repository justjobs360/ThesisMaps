import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/admin-guard';
import { MOCK_PAPERS, MOCK_OUTLINE_SECTIONS } from '@/lib/mockData';

const bodySchema = z.object({
  format: z.enum(['bibtex', 'csv', 'json']),
  projectId: z.string().uuid(),
  paperIds: z.array(z.string()).optional(),
});

function toBibtex(papers: typeof MOCK_PAPERS): string {
  return papers
    .map((p) => {
      const key = `${p.authors[0]?.name?.split(' ').pop() ?? 'unknown'}${p.year}`;
      return `@article{${key},\n  title={${p.title}},\n  author={${p.authors.map((a) => a.name).join(' and ')}},\n  year={${p.year}},\n  doi={${p.doi ?? ''}}\n}`;
    })
    .join('\n\n');
}

function toCsv(papers: typeof MOCK_PAPERS): string {
  const headers = 'Title,Authors,Year,DOI,Citation Count,Open Access,Source';
  const rows = papers.map((p) =>
    [
      `"${p.title.replace(/"/g, '""')}"`,
      `"${p.authors.map((a) => a.name).join('; ')}"`,
      p.year,
      p.doi ?? '',
      p.citationCount,
      p.openAccess,
      p.source,
    ].join(',')
  );
  return [headers, ...rows].join('\n');
}

export async function POST(request: Request) {
  try {
    await requireAuth(request);
    const body = bodySchema.parse(await request.json());
    const papers = MOCK_PAPERS;

    switch (body.format) {
      case 'bibtex': {
        const bib = toBibtex(papers);
        return new NextResponse(bib, {
          headers: {
            'Content-Type': 'application/x-bibtex',
            'Content-Disposition': 'attachment; filename="references.bib"',
          },
        });
      }
      case 'csv': {
        const csv = toCsv(papers);
        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="papers.csv"',
          },
        });
      }
      case 'json': {
        return new NextResponse(JSON.stringify(papers, null, 2), {
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': 'attachment; filename="papers.json"',
          },
        });
      }
    }
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
