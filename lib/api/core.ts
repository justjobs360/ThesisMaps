import axios from 'axios';
import type { Paper } from '@/types/paper';

const BASE = 'https://api.core.ac.uk/v3';

export async function searchCore(query: string, limit = 10): Promise<Paper[]> {
  const key = process.env.CORE_API_KEY;
  if (!key) return [];

  const { data } = await axios.post(
    `${BASE}/search/works`,
    { q: query, limit },
    { headers: { Authorization: `Bearer ${key}` }, timeout: 10_000 }
  );

  const results = data.results as Record<string, unknown>[] | undefined;
  return (results ?? []).map((r): Paper => ({
    id: String(r.id ?? ''),
    doi: r.doi ? String(r.doi) : undefined,
    title: String(r.title ?? ''),
    abstract: r.abstract ? String(r.abstract) : undefined,
    authors: Array.isArray(r.authors)
      ? (r.authors as { name?: string }[]).map((a) => ({ name: a.name ?? 'Unknown' }))
      : [],
    year: Number(r.yearPublished ?? 0),
    citationCount: Number(r.citationCount ?? 0),
    referenceCount: 0,
    openAccess: Boolean(r.downloadUrl),
    fieldsOfStudy: [],
    source: 'core',
    url: r.downloadUrl ? String(r.downloadUrl) : undefined,
  }));
}
