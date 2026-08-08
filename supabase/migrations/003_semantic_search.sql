-- Semantic similarity over papers.embedding (vector(768)).
--
-- supabase-js cannot express pgvector's `<=>` cosine-distance operator through
-- PostgREST, so similarity queries go through these SQL functions and are called
-- with supabaseAdmin.rpc(...) from lib/embeddings.ts.
--
-- Embeddings are produced by OpenAI text-embedding-3-small with
-- `dimensions: 768`, which matches the existing column and ivfflat index — no
-- column migration required.
--
-- Apply via Supabase Dashboard -> SQL Editor (idempotent).

-- Nearest neighbours of one paper, excluding itself and rows without a vector.
create or replace function match_papers_by_id(
  source_id uuid,
  match_count int default 8
)
returns table (id uuid, title text, year int, similarity float)
language sql
stable
as $$
  select
    p.id,
    p.title,
    p.year,
    1 - (p.embedding <=> src.embedding) as similarity
  from papers p
  cross join (select embedding from papers where id = source_id) src
  where p.id <> source_id
    and p.embedding is not null
    and src.embedding is not null
  order by p.embedding <=> src.embedding
  limit match_count;
$$;

-- Pairwise similarity within an explicit set of papers (the saved library), used
-- to draw semantic edges on the knowledge graph. a < b keeps each pair once.
create or replace function match_papers_pairs(
  paper_ids uuid[],
  min_similarity float default 0.62
)
returns table (a uuid, b uuid, similarity float)
language sql
stable
as $$
  select
    p1.id as a,
    p2.id as b,
    1 - (p1.embedding <=> p2.embedding) as similarity
  from papers p1
  join papers p2
    on p1.id < p2.id
  where p1.id = any(paper_ids)
    and p2.id = any(paper_ids)
    and p1.embedding is not null
    and p2.embedding is not null
    and 1 - (p1.embedding <=> p2.embedding) >= min_similarity
  order by similarity desc
  limit 300;
$$;
