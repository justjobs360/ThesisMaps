-- Enables RLS on every public table (Supabase linter: rls_disabled_in_public).
-- All application access goes through the service-role client
-- (lib/supabase-server.ts) which always bypasses RLS, so no policies are
-- added here: enabling RLS with zero policies denies anon/authenticated
-- access via PostgREST while leaving the app's server-side access untouched.
--
-- Apply via Supabase Dashboard -> SQL Editor (idempotent).

alter table users enable row level security;
alter table thesis_projects enable row level security;
alter table papers enable row level security;
alter table saved_papers enable row level security;
alter table outline_sections enable row level security;
alter table section_papers enable row level security;
alter table seed_sets enable row level security;
alter table collaborations enable row level security;
alter table comments enable row level security;
alter table saved_searches enable row level security;
alter table feedback enable row level security;
alter table flags enable row level security;
alter table analytics_events enable row level security;
alter table admin_activity_log enable row level security;
alter table platform_settings enable row level security;
