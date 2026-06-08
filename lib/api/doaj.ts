import axios from 'axios';
import type { Paper } from '@/types/paper';

const BASE = 'https://doaj.org/api/v2';

export async function searchDoaj(query: string, limit = 10): Promise<Paper[]> {
  const { data } = await axios.get(`${BASE}/search/articles/${encodeURIComponent(query)}`, {
    params: { pageSize: limit },
    timeout: 10_000,
  });

  const results = data.results as Record<string, unknown>[] | undefined;
  return (results ?? []).map((r): Paper => {
    const bibjson = r.bibjson as Record<string, unknown> | undefined;
    const authors = Array.isArray(bibjson?.author)
      ? (bibjson.author as { name?: string }[]).map((a) => ({ name: a.name ?? 'Unknown' }))
      : [];

    const yearStr = bibjson?.year;
    const year = yearStr ? Number(yearStr) : 0;

    const identifiers = bibjson?.identifier as { type?: string; id?: string }[] | undefined;
    const doi = identifiers?.find((i) => i.type === 'doi')?.id;

    return {
      id: String(r.id ?? ''),
      doi,
      title: String(bibjson?.title ?? ''),
      abstract: bibjson?.abstract ? String(bibjson.abstract) : undefined,
      authors,
      year,
      citationCount: 0,
      referenceCount: 0,
      openAccess: true,
      fieldsOfStudy: [],
      source: 'doaj',
      url: bibjson?.link
        ? String((bibjson.link as { url?: string }[])[0]?.url ?? '')
        : undefined,
    };
  });
}
