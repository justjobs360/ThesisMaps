-- Enable vector extension for embeddings
create extension if not exists vector;

create table if not exists users (
  id text primary key,
  email text unique not null,
  name text,
  avatar_url text,
  role text default 'user',
  status text default 'active',
  plan text default 'free',
  admin_notes text,
  created_at timestamptz default now(),
  last_active_at timestamptz
);

create table if not exists thesis_projects (
  id uuid primary key default gen_random_uuid(),
  user_id text references users(id) on delete cascade,
  title text not null,
  field text,
  current_stage text default 'research_proposal',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists papers (
  id uuid primary key default gen_random_uuid(),
  doi text unique,
  arxiv_id text,
  title text not null,
  abstract text,
  authors jsonb,
  year int,
  citation_count int default 0,
  reference_count int default 0,
  open_access boolean default false,
  fields_of_study text[],
  source text,
  url text,
  embedding vector(768),
  created_at timestamptz default now()
);

-- Per-word (stemmed, indexed) full-text search over the papers catalogue, used
-- for searching a project's saved library. Depended on by
-- lib/repository/savedPapers.ts (searchSavedPapers -> papers.search_vector).
-- Mirrors supabase/migrations/001_papers_search_index.sql for fresh installs.
alter table papers
  add column if not exists search_vector tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(abstract, '')), 'B')
  ) stored;

create table if not exists saved_papers (
  id uuid primary key default gen_random_uuid(),
  user_id text references users(id) on delete cascade,
  project_id uuid references thesis_projects(id) on delete cascade,
  paper_id uuid references papers(id) on delete cascade,
  tags text[],
  notes text,
  read_status text default 'unread',
  is_seed boolean default false,
  created_at timestamptz default now(),
  unique(user_id, project_id, paper_id)
);

create table if not exists outline_sections (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references thesis_projects(id) on delete cascade,
  title text not null,
  order_index int default 0,
  parent_id uuid references outline_sections(id),
  created_at timestamptz default now()
);

create table if not exists section_papers (
  id uuid primary key default gen_random_uuid(),
  section_id uuid references outline_sections(id) on delete cascade,
  paper_id uuid references papers(id) on delete cascade,
  notes text,
  unique(section_id, paper_id)
);

create table if not exists seed_sets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references thesis_projects(id) on delete cascade,
  name text not null,
  paper_ids uuid[],
  created_at timestamptz default now()
);

create table if not exists collaborations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references thesis_projects(id) on delete cascade,
  user_id text references users(id) on delete cascade,
  role text default 'viewer',
  unique(project_id, user_id)
);

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  paper_id uuid references papers(id) on delete cascade,
  user_id text references users(id) on delete cascade,
  project_id uuid references thesis_projects(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

create table if not exists saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id text references users(id) on delete cascade,
  query text not null,
  filters jsonb,
  last_run_at timestamptz default now()
);

create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  user_id text references users(id) on delete set null,
  type text not null,
  subject text not null,
  message text not null,
  status text default 'open',
  admin_notes text,
  created_at timestamptz default now()
);

create table if not exists flags (
  id uuid primary key default gen_random_uuid(),
  flagged_by text references users(id) on delete set null,
  entity_type text not null,
  entity_id uuid not null,
  reason text not null,
  status text default 'pending',
  admin_notes text,
  created_at timestamptz default now()
);

create table if not exists analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id text references users(id) on delete set null,
  event text not null,
  properties jsonb,
  created_at timestamptz default now()
);

create table if not exists admin_activity_log (
  id uuid primary key default gen_random_uuid(),
  admin_id text references users(id) on delete set null,
  action text not null,
  target_type text,
  target_id text,
  notes text,
  created_at timestamptz default now()
);

create table if not exists platform_settings (
  key text primary key,
  value jsonb not null,
  updated_by text references users(id),
  updated_at timestamptz default now()
);

-- Seed default platform settings
insert into platform_settings (key, value) values
  ('feature_flags', '{"ml_gap_detection": true, "collaboration": true, "defence_mode": true}'),
  ('announcement_banner', '{"enabled": false, "message": ""}')
on conflict (key) do nothing;

-- Indexes for common queries
create index if not exists idx_saved_papers_user_project on saved_papers(user_id, project_id);
create index if not exists idx_papers_doi on papers(doi);
create index if not exists idx_papers_search_vector on papers using gin (search_vector);
create index if not exists idx_papers_arxiv on papers(arxiv_id);
create index if not exists idx_outline_sections_project on outline_sections(project_id);
create index if not exists idx_analytics_events_user on analytics_events(user_id, created_at);
create index if not exists idx_flags_status on flags(status);
create index if not exists idx_feedback_status on feedback(status);

-- Vector similarity index (IVFFlat for approximate nearest-neighbour search)
create index if not exists idx_papers_embedding on papers using ivfflat (embedding vector_cosine_ops) with (lists = 100);
