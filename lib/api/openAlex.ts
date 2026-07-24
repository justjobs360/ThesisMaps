import axios from 'axios';
import { normaliseOpenAlex } from '@/lib/normalise';
import type { Paper } from '@/types/paper';

const BASE = 'https://api.openalex.org';

export async function searchOpenAlex(query: string, limit = 20): Promise<Paper[]> {
  const { data } = await axios.get(`${BASE}/works`, {
    params: {
      search: query,
      'per-page': limit,
      select: 'id,title,abstract_inverted_index,authorships,publication_year,cited_by_count,open_access,concepts,ids,primary_location',
    },
    headers: { 'User-Agent': 'ThesisMaps/1.0 (mailto:contact@thesismaps.com)' },
    timeout: 10_000,
  });

  return (data.results as Record<string, unknown>[]).map(normaliseOpenAlex);
}

export async function getOpenAlexById(id: string): Promise<Paper | null> {
  try {
    const { data } = await axios.get(`${BASE}/works/${id}`, {
      headers: { 'User-Agent': 'ThesisMaps/1.0' },
      timeout: 10_000,
    });
    return normaliseOpenAlex(data as Record<string, unknown>);
  } catch {
    return null;
  }
}
