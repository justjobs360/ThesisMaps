import axios from 'axios';
import { normaliseArxiv } from '@/lib/normalise';
import type { Paper } from '@/types/paper';

const BASE = 'https://export.arxiv.org/api/query';

function parseAtomEntries(xml: string): Record<string, unknown>[] {
  const entries: Record<string, unknown>[] = [];
  const entryMatches = xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g);

  for (const match of entryMatches) {
    const entry = match[1] ?? '';
    const id = entry.match(/<id>(.*?)<\/id>/)?.[1]?.trim() ?? '';
    const title = entry.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.trim().replace(/\s+/g, ' ') ?? '';
    const summary = entry.match(/<summary>([\s\S]*?)<\/summary>/)?.[1]?.trim() ?? '';
    const published = entry.match(/<published>(.*?)<\/published>/)?.[1] ?? '';
    const authorMatches = [...entry.matchAll(/<author>[\s\S]*?<name>(.*?)<\/name>[\s\S]*?<\/author>/g)];
    const author = authorMatches.map((m) => ({ name: m[1] ?? '' }));

    entries.push({ id, title, summary, published, author });
  }

  return entries;
}

export async function searchArxiv(query: string, limit = 20): Promise<Paper[]> {
  const { data } = await axios.get(BASE, {
    params: { search_query: `all:${query}`, max_results: limit, sortBy: 'relevance' },
    timeout: 15_000,
  });

  const entries = parseAtomEntries(String(data));
  return entries.map(normaliseArxiv);
}
