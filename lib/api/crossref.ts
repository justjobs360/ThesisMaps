import axios from 'axios';
import { normaliseCrossRef } from '@/lib/normalise';
import type { Paper } from '@/types/paper';

const BASE = 'https://api.crossref.org/works';

export async function searchCrossRef(query: string, limit = 20): Promise<Paper[]> {
  const { data } = await axios.get(BASE, {
    params: { query, rows: limit, select: 'DOI,title,abstract,author,published-print,is-referenced-by-count,references-count' },
    headers: { 'User-Agent': 'ThesisMaps/1.0 (mailto:contact@thesismaps.com)' },
    timeout: 10_000,
  });

  const items = data.message?.items as Record<string, unknown>[] | undefined;
  return (items ?? []).map(normaliseCrossRef);
}

export async function getCrossRefByDoi(doi: string): Promise<Paper | null> {
  try {
    const { data } = await axios.get(`${BASE}/${encodeURIComponent(doi)}`, {
      headers: { 'User-Agent': 'ThesisMaps/1.0' },
      timeout: 10_000,
    });
    return normaliseCrossRef(data.message as Record<string, unknown>);
  } catch {
    return null;
  }
}
