import axios from 'axios';
import type { Paper } from '@/types/paper';

const BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';

export async function searchPubMed(query: string, limit = 20): Promise<Paper[]> {
  const key = process.env.PUBMED_API_KEY ? `&api_key=${process.env.PUBMED_API_KEY}` : '';

  const searchRes = await axios.get(`${BASE}/esearch.fcgi`, {
    params: { db: 'pubmed', term: query, retmax: limit, retmode: 'json' },
    timeout: 10_000,
  });

  const ids: string[] = searchRes.data.esearchresult?.idlist ?? [];
  if (!ids.length) return [];

  const fetchRes = await axios.get(`${BASE}/efetch.fcgi`, {
    params: { db: 'pubmed', id: ids.join(','), retmode: 'json', rettype: 'abstract' },
    timeout: 15_000,
  });

  const articles = fetchRes.data.PubmedArticleSet?.PubmedArticle ?? [];

  return articles.map((article: Record<string, unknown>): Paper => {
    const medline = (article.MedlineCitation ?? {}) as Record<string, unknown>;
    const art = (medline.Article ?? {}) as Record<string, unknown>;
    const pmid = String(medline.PMID ?? '');
    const title = String((art.ArticleTitle as string) ?? '');
    const abstractText = (art.Abstract as { AbstractText?: string | string[] } | undefined)?.AbstractText;
    const abstract = Array.isArray(abstractText) ? abstractText.join(' ') : String(abstractText ?? '');

    const authorList = (art.AuthorList as { Author?: { ForeName?: string; LastName?: string }[] } | undefined)?.Author ?? [];
    const authors = authorList.map((a) => ({
      name: [a.ForeName, a.LastName].filter(Boolean).join(' ') || 'Unknown',
    }));

    const journal = art.Journal as { JournalIssue?: { PubDate?: { Year?: string } } } | undefined;
    const year = Number(journal?.JournalIssue?.PubDate?.Year ?? 0);

    return {
      id: pmid,
      title,
      abstract: abstract || undefined,
      authors,
      year,
      citationCount: 0,
      referenceCount: 0,
      openAccess: false,
      fieldsOfStudy: [],
      source: 'pubmed',
      url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
    };
  });
}
