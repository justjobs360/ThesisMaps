export type PaperSource =
  | 'semantic_scholar'
  | 'openalex'
  | 'arxiv'
  | 'crossref'
  | 'pubmed'
  | 'core'
  | 'europe_pmc'
  | 'doaj';

export type PaperAuthor = {
  name: string;
  affiliation?: string;
  hIndex?: number;
};

export type Paper = {
  id: string;
  doi?: string;
  arxivId?: string;
  title: string;
  abstract?: string;
  authors: PaperAuthor[];
  year: number;
  citationCount: number;
  referenceCount: number;
  openAccess: boolean;
  fieldsOfStudy: string[];
  source: PaperSource;
  url?: string;
  embedding?: number[];
};

export type SavedPaper = {
  id: string;
  userId: string;
  projectId: string;
  paperId: string;
  paper: Paper;
  tags: string[];
  notes: string;
  readStatus: 'unread' | 'reading' | 'read';
  isSeed: boolean;
  createdAt: string;
};

export type SearchFilters = {
  recency?: 'last_year' | 'last_5_years' | 'last_10_years' | 'all';
  minCitationCount?: number;
  openAccessOnly?: boolean;
  fieldsOfStudy?: string[];
  methodology?: string[];
  publicationType?: string[];
  sources?: PaperSource[];
};

export type SearchResult = {
  papers: Paper[];
  total: number;
  page: number;
  pageSize: number;
  query: string;
  filters: SearchFilters;
};
