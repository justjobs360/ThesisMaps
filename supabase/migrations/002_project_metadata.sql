-- Free-form per-project state that doesn't warrant its own table (currently the
-- defence-readiness checklist). Stored as JSONB on thesis_projects and read back
-- through the existing GET/PATCH /api/projects/[id] route.
--
-- Apply via Supabase Dashboard → SQL Editor (idempotent).

alter table thesis_projects
  add column if not exists metadata jsonb not null default '{}'::jsonb;
