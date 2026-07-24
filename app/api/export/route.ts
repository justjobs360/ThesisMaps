import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/admin-guard';
import { ensureUser } from '@/lib/repository/users';
import { getProject } from '@/lib/repository/projects';
import { listSavedPapers } from '@/lib/repository/savedPapers';
import { listSections, listSectionPapers } from '@/lib/repository/outline';
import { handleRouteError } from '@/lib/route-helpers';
import type { Paper } from '@/types/paper';

const bodySchema = z.object({
  format: z.enum(['bibtex', 'csv', 'json', 'docx', 'pdf']),
  projectId: z.string().uuid(),
  paperIds: z.array(z.string().uuid()).optional(),
});

function toBibtex(papers: Paper[]): string {
  return papers
    .map((p) => {
      const key = `${p.authors[0]?.name?.split(' ').pop() ?? 'unknown'}${p.year || ''}`;
      return `@article{${key},\n  title={${p.title}},\n  author={${p.authors.map((a) => a.name).join(' and ')}},\n  year={${p.year || ''}},\n  doi={${p.doi ?? ''}}\n}`;
    })
    .join('\n\n');
}

function toCsv(papers: Paper[]): string {
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

function citeLine(p: Paper): string {
  const authors = p.authors.map((a) => a.name).join(', ') || 'Unknown authors';
  return `${authors} (${p.year || 'n.d.'}). ${p.title}.${p.doi ? ` https://doi.org/${p.doi}` : ''}`;
}

type OutlineExportSection = { title: string; depth: number; papers: Paper[] };

/** Outline sections in display order (top-level by order_index, children under parents). */
async function collectOutline(projectId: string): Promise<OutlineExportSection[]> {
  const sections = await listSections(projectId);
  const byParent = new Map<string | null, typeof sections>();
  for (const s of sections) {
    const arr = byParent.get(s.parentId) ?? [];
    arr.push(s);
    byParent.set(s.parentId, arr);
  }

  const out: OutlineExportSection[] = [];
  async function walk(parentId: string | null, depth: number) {
    const children = (byParent.get(parentId) ?? []).sort((a, b) => a.orderIndex - b.orderIndex);
    for (const child of children) {
      out.push({ title: child.title, depth, papers: await listSectionPapers(child.id) });
      await walk(child.id, depth + 1);
    }
  }
  await walk(null, 0);
  return out;
}

async function buildDocx(projectTitle: string, outline: OutlineExportSection[]): Promise<Buffer> {
  const { Document, Packer, Paragraph, HeadingLevel, TextRun } = await import('docx');

  const children = [
    new Paragraph({ text: projectTitle, heading: HeadingLevel.TITLE }),
    ...outline.flatMap((section) => [
      new Paragraph({
        text: section.title,
        heading: section.depth === 0 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2,
      }),
      ...(section.papers.length === 0
        ? [new Paragraph({ children: [new TextRun({ text: 'No papers assigned.', italics: true })] })]
        : section.papers.map((p) => new Paragraph({ text: citeLine(p), bullet: { level: 0 } }))),
    ]),
  ];

  const doc = new Document({ sections: [{ children }] });
  return Packer.toBuffer(doc);
}

async function buildPdf(projectTitle: string, outline: OutlineExportSection[]): Promise<ArrayBuffer> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const width = doc.internal.pageSize.getWidth() - margin * 2;
  let y = margin;

  function writeLines(text: string, fontSize: number, indent = 0, bold = false) {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    const lines = doc.splitTextToSize(text, width - indent) as string[];
    for (const line of lines) {
      if (y > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin + indent, y);
      y += fontSize * 0.5;
    }
    y += 2;
  }

  writeLines(projectTitle, 18, 0, true);
  y += 4;
  for (const section of outline) {
    writeLines(section.title, section.depth === 0 ? 14 : 12, section.depth * 6, true);
    if (section.papers.length === 0) {
      writeLines('No papers assigned.', 10, section.depth * 6 + 4);
    } else {
      for (const p of section.papers) {
        writeLines(`• ${citeLine(p)}`, 10, section.depth * 6 + 4);
      }
    }
    y += 2;
  }

  return doc.output('arraybuffer');
}

export async function POST(request: Request) {
  try {
    const decoded = await requireUser(request);
    await ensureUser(decoded);
    const body = bodySchema.parse(await request.json());

    const project = await getProject(body.projectId, decoded.uid);
    if (!project) throw new Error('Forbidden: project not found for user');

    // Document formats export the outline with citations.
    if (body.format === 'docx') {
      const outline = await collectOutline(body.projectId);
      const buffer = await buildDocx(project.title, outline);
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': 'attachment; filename="outline.docx"',
        },
      });
    }
    if (body.format === 'pdf') {
      const outline = await collectOutline(body.projectId);
      const buffer = await buildPdf(project.title, outline);
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="outline.pdf"',
        },
      });
    }

    // Data formats export the saved library (optionally a subset).
    const saved = await listSavedPapers(decoded.uid, body.projectId);
    let papers = saved.map((s) => s.paper);
    if (body.paperIds?.length) {
      const wanted = new Set(body.paperIds);
      papers = papers.filter((p) => wanted.has(p.id));
    }

    switch (body.format) {
      case 'bibtex':
        return new NextResponse(toBibtex(papers), {
          headers: {
            'Content-Type': 'application/x-bibtex',
            'Content-Disposition': 'attachment; filename="references.bib"',
          },
        });
      case 'csv':
        return new NextResponse(toCsv(papers), {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="papers.csv"',
          },
        });
      case 'json':
        return new NextResponse(JSON.stringify(papers, null, 2), {
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': 'attachment; filename="papers.json"',
          },
        });
    }
  } catch (err) {
    return handleRouteError(err, 'export/POST');
  }
}
