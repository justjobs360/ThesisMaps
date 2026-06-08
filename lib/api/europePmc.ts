import axios from 'axios';
import type { Paper } from '@/types/paper';

const BASE = 'https://www.ebi.ac.uk/europepmc/webservices/rest';

export async function searchEuropePmc(query: string, limit = 10): Promise<Paper[]> {
  const { data } = await axios.get(`${BASE}/search`, {
    params: { query, format: 'json', pageSize: limit },
    timeout: 10_000,
  });

  const results = data.resultList?.result as Record<string, unknown>[] | undefined;
  return (results ?? []).map((r): Paper => ({
    id: String(r.id ?? ''),
    doi: r.doi ? String(r.doi) : undefined,
    title: String(r.title ?? ''),
    abstract: r.abstractText ? String(r.abstractText) : undefined,
    authors: r.authorString
      ? String(r.authorString).split(', ').map((name) => ({ name }))
      : [],
    year: Number(r.pubYear ?? 0),
    citationCount: Number(r.citedByCount ?? 0),
    referenceCount: 0,
    openAccess: r.isOpenAccess === 'Y',
    fieldsOfStudy: [],
    source: 'europe_pmc',
    url: `https://europepmc.org/article/${r.source}/${r.id}`,
  }));
}
