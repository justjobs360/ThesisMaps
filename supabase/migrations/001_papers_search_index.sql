-- Per-word (stemmed, indexed) full-text search over the papers catalogue,
-- used for searching a project's saved library (title + abstract).
alter table papers
  add column if not exists search_vector tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(abstract, '')), 'B')
  ) stored;

create index if not exists idx_papers_search_vector on papers using gin (search_vector);
