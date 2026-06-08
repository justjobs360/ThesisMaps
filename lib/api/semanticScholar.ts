import axios from 'axios';
import { normaliseSemanticScholar } from '@/lib/normalise';
import type { Paper } from '@/types/paper';

const BASE = 'https://api.semanticscholar.org/graph/v1';
const FIELDS = 'paperId,title,abstract,authors,year,citationCount,referenceCount,isOpenAccess,fieldsOfStudy,externalIds,url';

function headers() {
  const key = process.env.SEMANTIC_SCHOLAR_API_KEY;
  return key ? { 'x-api-key': key } : {};
}

export async function searchSemanticScholar(query: string, limit = 20): Promise<Paper[]> {
  const { data } = await axios.get(`${BASE}/paper/search`, {
    headers: headers(),
    params: { query, limit, fields: FIELDS },
    timeout: 10_000,
  });

  return (data.data as Record<string, unknown>[]).map(normaliseSemanticScholar);
}

export async function getPaperById(paperId: string): Promise<Paper | null> {
  try {
    const { data } = await axios.get(`${BASE}/paper/${paperId}`, {
      headers: headers(),
      params: { fields: FIELDS },
      timeout: 10_000,
    });
    return normaliseSemanticScholar(data as Record<string, unknown>);
  } catch {
    return null;
  }
}

export async function getPaperCitations(paperId: string, limit = 50): Promise<Paper[]> {
  const { data } = await axios.get(`${BASE}/paper/${paperId}/citations`, {
    headers: headers(),
    params: { fields: FIELDS, limit },
    timeout: 10_000,
  });

  return (data.data as { citingPaper: Record<string, unknown> }[]).map((d) =>
    normaliseSemanticScholar(d.citingPaper)
  );
}

export async function getPaperReferences(paperId: string, limit = 50): Promise<Paper[]> {
  const { data } = await axios.get(`${BASE}/paper/${paperId}/references`, {
    headers: headers(),
    params: { fields: FIELDS, limit },
    timeout: 10_000,
  });

  return (data.data as { citedPaper: Record<string, unknown> }[]).map((d) =>
    normaliseSemanticScholar(d.citedPaper)
  );
}
