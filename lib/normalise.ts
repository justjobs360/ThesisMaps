import type { Paper, PaperSource } from '@/types/paper';

// Semantic Scholar raw response
export function normaliseSemanticScholar(raw: Record<string, unknown>): Paper {
  const authors = Array.isArray(raw.authors)
    ? (raw.authors as { name?: string; hIndex?: number }[]).map((a) => ({
        name: a.name ?? 'Unknown',
        hIndex: a.hIndex,
      }))
    : [];

  return {
    id: String(raw.paperId ?? ''),
    doi: raw.externalIds && typeof raw.externalIds === 'object'
      ? String((raw.externalIds as Record<string, unknown>).DOI ?? '')
      : undefined,
    arxivId: raw.externalIds && typeof raw.externalIds === 'object'
      ? String((raw.externalIds as Record<string, unknown>).ArXiv ?? '')
      : undefined,
    title: String(raw.title ?? ''),
    abstract: raw.abstract ? String(raw.abstract) : undefined,
    authors,
    year: Number(raw.year ?? 0),
    citationCount: Number(raw.citationCount ?? 0),
    referenceCount: Number(raw.referenceCount ?? 0),
    openAccess: Boolean(raw.isOpenAccess),
    fieldsOfStudy: Array.isArray(raw.fieldsOfStudy)
      ? (raw.fieldsOfStudy as string[]).filter(Boolean)
      : [],
    source: 'semantic_scholar',
    url: raw.url ? String(raw.url) : undefined,
  };
}

// OpenAlex raw response
export function normaliseOpenAlex(raw: Record<string, unknown>): Paper {
  const authorships = Array.isArray(raw.authorships)
    ? (raw.authorships as { author?: { display_name?: string }; institutions?: { display_name?: string }[] }[])
    : [];

  const authors = authorships.map((a) => ({
    name: a.author?.display_name ?? 'Unknown',
    affiliation: a.institutions?.[0]?.display_name,
  }));

  const oa = raw.open_access as { is_oa?: boolean } | undefined;
  const ids = raw.ids as Record<string, string> | undefined;
  const concepts = Array.isArray(raw.concepts)
    ? (raw.concepts as { display_name?: string; level?: number }[])
        .filter((c) => (c.level ?? 99) <= 1)
        .map((c) => c.display_name ?? '')
        .filter(Boolean)
    : [];

  return {
    id: String(raw.id ?? '').replace('https://openalex.org/', ''),
    doi: ids?.doi?.replace('https://doi.org/', ''),
    title: String(raw.title ?? ''),
    abstract: raw.abstract_inverted_index ? reconstructAbstract(raw.abstract_inverted_index as Record<string, number[]>) : undefined,
    authors,
    year: Number(raw.publication_year ?? 0),
    citationCount: Number(raw.cited_by_count ?? 0),
    referenceCount: 0,
    openAccess: Boolean(oa?.is_oa),
    fieldsOfStudy: concepts,
    source: 'openalex',
    url: (raw.primary_location as { landing_page_url?: string } | undefined)?.landing_page_url,
  };
}

function reconstructAbstract(invertedIndex: Record<string, number[]>): string {
  const positions: { word: string; pos: number }[] = [];
  for (const [word, posList] of Object.entries(invertedIndex)) {
    for (const pos of posList) {
      positions.push({ word, pos });
    }
  }
  return positions
    .sort((a, b) => a.pos - b.pos)
    .map((p) => p.word)
    .join(' ');
}

// arXiv raw response
export function normaliseArxiv(raw: Record<string, unknown>): Paper {
  const authorList = Array.isArray(raw.author)
    ? (raw.author as { name?: string }[])
    : raw.author && typeof raw.author === 'object'
    ? [raw.author as { name?: string }]
    : [];

  const published = String(raw.published ?? '');
  const year = published ? new Date(published).getFullYear() : 0;

  const arxivId = String(raw.id ?? '')
    .split('/')
    .pop()
    ?.replace('v1', '') ?? '';

  return {
    id: String(raw.id ?? ''),
    arxivId,
    title: String(raw.title ?? '').replace(/\s+/g, ' ').trim(),
    abstract: raw.summary ? String(raw.summary).replace(/\s+/g, ' ').trim() : undefined,
    authors: authorList.map((a) => ({ name: a.name ?? 'Unknown' })),
    year,
    citationCount: 0,
    referenceCount: 0,
    openAccess: true,
    fieldsOfStudy: [],
    source: 'arxiv',
    url: `https://arxiv.org/abs/${arxivId}`,
  };
}

// CrossRef raw response
export function normaliseCrossRef(raw: Record<string, unknown>): Paper {
  const authorList = Array.isArray(raw.author)
    ? (raw.author as { given?: string; family?: string; affiliation?: { name?: string }[] }[])
    : [];

  const authors = authorList.map((a) => ({
    name: [a.given, a.family].filter(Boolean).join(' ') || 'Unknown',
    affiliation: a.affiliation?.[0]?.name,
  }));

  const publishedDate = raw['published-print'] as { 'date-parts'?: number[][] } | undefined;
  const year = publishedDate?.['date-parts']?.[0]?.[0] ?? 0;

  const doi = String(raw.DOI ?? '');

  return {
    id: doi,
    doi,
    title: Array.isArray(raw.title) ? String(raw.title[0] ?? '') : String(raw.title ?? ''),
    abstract: raw.abstract ? String(raw.abstract).replace(/<[^>]+>/g, '').trim() : undefined,
    authors,
    year,
    citationCount: Number(raw['is-referenced-by-count'] ?? 0),
    referenceCount: Number(raw['references-count'] ?? 0),
    openAccess: false,
    fieldsOfStudy: [],
    source: 'crossref',
    url: `https://doi.org/${doi}`,
  };
}

// Dedup papers by DOI (keeps first occurrence)
export function deduplicatePapers(papers: Paper[]): Paper[] {
  const seen = new Set<string>();
  return papers.filter((p) => {
    const key = p.doi ?? p.arxivId ?? p.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function normalisePaper(raw: Record<string, unknown>, source: PaperSource): Paper {
  switch (source) {
    case 'semantic_scholar': return normaliseSemanticScholar(raw);
    case 'openalex': return normaliseOpenAlex(raw);
    case 'arxiv': return normaliseArxiv(raw);
    case 'crossref': return normaliseCrossRef(raw);
    default: return normaliseSemanticScholar(raw);
  }
}
