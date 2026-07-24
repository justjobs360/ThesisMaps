import axios from 'axios';
import type { Paper } from '@/types/paper';

const BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';

function unescapeXml(s: string): string {
  return s
    .replace(/<[^>]+>/g, '') // strip any inline tags (e.g. <sup>) left in text nodes
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\s+/g, ' ')
    .trim();
}

function parseArticles(xml: string): Record<string, unknown>[] {
  const articles: Record<string, unknown>[] = [];
  const matches = xml.matchAll(/<PubmedArticle>([\s\S]*?)<\/PubmedArticle>/g);

  for (const match of matches) {
    const entry = match[1] ?? '';
    const pmid = entry.match(/<PMID[^>]*>(.*?)<\/PMID>/)?.[1]?.trim() ?? '';
    const title = unescapeXml(entry.match(/<ArticleTitle[^>]*>([\s\S]*?)<\/ArticleTitle>/)?.[1] ?? '');
    const abstractParts = [...entry.matchAll(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/g)].map((m) =>
      unescapeXml(m[1] ?? '')
    );
    const doi = entry.match(/<ELocationID EIdType="doi"[^>]*>(.*?)<\/ELocationID>/)?.[1]?.trim();
    const year = entry.match(/<PubDate>[\s\S]*?<Year>(\d{4})<\/Year>/)?.[1] ?? '';

    const authorMatches = [...entry.matchAll(/<Author[^>]*>([\s\S]*?)<\/Author>/g)];
    const authors = authorMatches.map((m) => {
      const block = m[1] ?? '';
      const last = block.match(/<LastName>(.*?)<\/LastName>/)?.[1] ?? '';
      const fore = block.match(/<ForeName>(.*?)<\/ForeName>/)?.[1] ?? '';
      return { name: [fore, last].filter(Boolean).join(' ') || 'Unknown' };
    });

    articles.push({ pmid, title, abstract: abstractParts.join(' '), doi, year, authors });
  }

  return articles;
}

export async function searchPubMed(query: string, limit = 20): Promise<Paper[]> {
  const key = process.env.PUBMED_API_KEY ? `&api_key=${process.env.PUBMED_API_KEY}` : '';

  const searchRes = await axios.get(`${BASE}/esearch.fcgi${key}`, {
    params: { db: 'pubmed', term: query, retmax: limit, retmode: 'json' },
    timeout: 10_000,
  });

  const ids: string[] = searchRes.data.esearchresult?.idlist ?? [];
  if (!ids.length) return [];

  // efetch does not honour retmode=json for full records — it always returns XML.
  const fetchRes = await axios.get(`${BASE}/efetch.fcgi${key}`, {
    params: { db: 'pubmed', id: ids.join(','), retmode: 'xml', rettype: 'abstract' },
    timeout: 15_000,
    responseType: 'text',
  });

  const articles = parseArticles(String(fetchRes.data));

  return articles.map(
    (article): Paper => ({
      id: String(article.pmid),
      doi: article.doi ? String(article.doi) : undefined,
      title: String(article.title),
      abstract: article.abstract ? String(article.abstract) : undefined,
      authors: article.authors as { name: string }[],
      year: Number(article.year) || 0,
      citationCount: 0,
      referenceCount: 0,
      openAccess: false,
      fieldsOfStudy: [],
      source: 'pubmed',
      url: `https://pubmed.ncbi.nlm.nih.gov/${article.pmid}/`,
    })
  );
}
