# ThesisMaps — Implementation Checklist & Plan

_Last updated: 2026-07-18_

This document tracks what was built in the "make half the backend real + unify feature-page
design" pass, what you must do to switch it on, and exactly how the remaining half will be built
(so the next pass matches the patterns already established).

---

## 1. What this pass delivered

### A. Backend — the core research workflow is now real (not mock)

Previously `graph`, `outline`, and the project/library flows returned `MOCK_*` data and the frontend
never sent a Firebase token. That is fixed. The following now persist to Supabase behind real
Firebase auth:

| Area | Status | Endpoints / files |
| --- | --- | --- |
| Auth plumbing (send Firebase ID token) | ✅ Done | `lib/apiClient.ts`, `lib/route-helpers.ts`, `requireUser()` in `lib/admin-guard.ts` |
| User auto-provisioning | ✅ Done | `lib/repository/users.ts` (`ensureUser`) — upserts the Firebase user into `users` on first authed call |
| Projects (list/create/get/update, default project) | ✅ Done | `app/api/projects/route.ts`, `app/api/projects/[id]/route.ts`, `lib/repository/projects.ts`, `context/ProjectContext.tsx`, `hooks/useProject.ts` |
| Saved-paper library (save/list/remove) | ✅ Done | `app/api/papers/save/route.ts`, `lib/repository/savedPapers.ts`, `lib/repository/papers.ts` (`upsertPaper`) |
| Outline (CRUD + reorder + section↔paper links + coverage) | ✅ Done | `app/api/outline/route.ts`, `app/api/outline/papers/route.ts`, `lib/repository/outline.ts`, `lib/coverage.ts` |
| Graph built from the saved library | ✅ Done | `app/api/graph/route.ts`, `lib/repository/graph.ts` (S2 citation edges + field-overlap fallback, Redis-cached) |
| Frontend wired to the above (real project UUID, not `'proj1'`) | ✅ Done | `hooks/useGraph.ts`, `hooks/useOutline.ts`, `ResultCard`, `OutlineBuilder`, dashboard, graph page |

**Design/security notes for this backend:**
- Every route: `requireUser()` → `ensureUser()` → Zod-validated body → ownership check
  (`getProject(projectId, uid)`) → repository call → `handleRouteError()`. Follow this shape for all
  new routes.
- Papers are deduped into the shared `papers` table by DOI → arXiv id (`upsertPaper`), because
  `saved_papers.paper_id` is a UUID FK but external ids are strings.
- Graceful degradation: with a placeholder Supabase key the app still renders; protected routes
  return clean `401/500` JSON instead of crashing (verified).

### B. Frontend — every feature page now matches the brutalist brand

Target design (confirmed): **black / white + electric-blue `#0066FF`**, `border-2 border-black`,
`shadow-impact` (`4px 4px 0 #000`), zero radius, Instrument Serif headings, uppercase `font-black`
labels. (The amber `file.txt` spec was intentionally ignored — the live site diverged from it.)

| Item | Status | Notes |
| --- | --- | --- |
| Broken tokens `success`/`warning` (both `#000`) | ✅ Fixed | now `#2D6A4F` / `#B45309` in `tailwind.config.ts` — repairs all traffic-light UI |
| UI primitives `Select`, `Modal`, `DataTable`, `Skeleton`, `Tooltip` | ✅ Converted | soft → `border-2 border-black` + `shadow-impact` |
| `SearchBar`, `ResultCard` | ✅ Converted | pastel `SOURCE_COLORS` purged; `ResultCard` Save button now persists |
| Graph `KnowledgeGraph`, `PaperNode`, `EdgeTypes`, `GraphControls` | ✅ Converted | gold/pastel purged → brand palette; **dead controls wired**: minimap toggle, heatmap recolor, and SVG export all work now; legend added |
| `timeline`, `defence`, `collaborate` | ✅ Converted | brand panels; timeline legend/dot mismatch fixed; collaborate gained a working branded invite `Modal` (local-only) |
| `outline` `ChapterSection`, `CoverageScore` | ✅ Converted | hard-bordered tree rows; coverage uses fixed tokens |
| Client-page `metadata` cleanup | ✅ Done | `noindex` hoisted to `app/(app)/layout.tsx`; stale `Metadata` imports removed |

### C. Verification already run
- `npx tsc --noEmit` → passes (strict, `noUncheckedIndexedAccess`).
- `npm run build` → passes, 40/40 pages, all new routes present & dynamic.
- Smoke test: `/` and `/login` → 200; `/api/projects` and `/api/graph` (no token) → clean `401`.

---

## 2. What YOU must do to turn the backend on (one-time)

**Project:** `gbgsqsecjqtbhyrydtfc` (`https://gbgsqsecjqtbhyrydtfc.supabase.co`).

1. ✅ **Supabase service role (secret) key** — set in `.env` as `SUPABASE_SERVICE_ROLE_KEY`
   (`sb_secret_...`, Supabase's new key format). Verified: `@supabase/supabase-js@2.106.2` accepts it
   fine, no version bump needed.
2. ✅ **Database schema applied** — ran `supabase/schema.sql` via Supabase Dashboard → SQL Editor
   (chose "Run without RLS": all data access goes through the server-side service-role client in
   `lib/supabase-server.ts`, which bypasses RLS anyway, and the anon-key client in `lib/supabase.ts` is
   defined but unused — nothing queries these tables directly from the browser). Verified: all tables
   (`users`, `thesis_projects`, `papers`, `saved_papers`, `outline_sections`, `platform_settings`, …)
   are reachable.

   (Note for the record: a direct `psql`/`pg` connection via `DATABASE_URL` failed from this dev
   machine — `db.gbgsqsecjqtbhyrydtfc.supabase.co` only resolves to an IPv6 address here with no IPv6
   route. Doesn't matter for the running app, which talks to Supabase over HTTPS/PostgREST, resolved
   fine over IPv4. If you ever need direct psql access from this network, use the Transaction Pooler
   connection string instead — Project Settings → Database → Connection string → Transaction pooler,
   port 6543, IPv4-safe.)
3. **Rotate exposed secrets** (not urgent, but do before wider sharing). `.env` is correctly `.gitignore`d and not tracked in this repo (verified),
   so this isn't an urgent leak — but the file still contains a live Firebase Admin private key and the
   real Postgres password (`emmanuelthesismaps`). If this `.env` was ever pasted anywhere, shared, or
   the DB password reused elsewhere, rotate both (Firebase → Service Accounts → generate new key;
   Supabase → Database → Reset password) before shipping.

Everything below is **not required** to turn the backend on — skip unless you specifically want it:
- Redis (`UPSTASH_REDIS_REST_URL`/`_TOKEN`) — caching only, app degrades gracefully without it.
- `SEMANTIC_SCHOLAR_API_KEY` — raises S2 rate limits, not required for it to work.
- Supabase CLI (`supabase login` / `init` / `link`) — only needed if you want CLI-managed migrations
  going forward. The app itself never shells out to the CLI or reads `DATABASE_URL` at runtime (only
  `NEXT_PUBLIC_SUPABASE_URL` + the two keys, via `@supabase/supabase-js`), so this is pure tooling
  preference. `supabase login` also requires an interactive browser OAuth step, so it has to be run by
  you locally, not by an agent. If you want it anyway:
  ```
  npx supabase login
  npx supabase init
  npx supabase link --project-ref gbgsqsecjqtbhyrydtfc
  ```

## 3. End-to-end verification checklist (after step 2 above)

- [ ] Sign in (email/password or Google) → a row appears in `users` with your Firebase UID.
- [ ] Dashboard header shows a real project title (auto-created "My Thesis"), not `proj1`.
- [ ] Search a term → **Save** a result → button flips to "Saved"; row appears in `saved_papers`.
- [ ] Outline: add / rename / drag-reorder / delete sections → persists across reload.
- [ ] Outline: "Assign From Library" adds a saved paper to a section → paper count + coverage badge
      update (green/amber/red).
- [ ] Graph: renders nodes from the saved set; **Color by …** recolors; minimap toggles; **Export**
      downloads an SVG.
- [ ] Dashboard stats show your real counts; Research Debt lists unread saves; **Review** persists.
- [ ] Seeds: create a set from library picks → persists; delete works.
- [ ] Gaps: **Analyze my library** returns clusters from your actual saved papers.
- [ ] Timeline plots your library; **Export** downloads BibTeX/CSV/JSON of your real papers.
- [ ] Outline **Export** downloads a real DOCX/PDF of your outline with citations.
- [ ] Collaborate: inviting an email that has an account adds them; unknown email → clear error.
- [ ] Settings: thesis metadata save persists (title changes on dashboard after save).
- [ ] Admin (after setting your role to admin): /admin loads with real stats; non-admins get
      bounced to /dashboard.

---

## 4. The "other half" — ✅ ALL BUILT (2026-07-18 pass)

Everything below is now real (no `MOCK_*` on any user-facing surface):

### 4.1 Admin panel — ✅ Done
- `AdminGuard` (`components/auth/AdminGuard.tsx`) gates `app/(admin)/layout.tsx` via new
  `GET /api/me` (role check); non-admins → `/dashboard`, signed-out → `/login`.
- All admin pages are client components on real APIs: overview (stats + real
  `admin_activity_log` feed), users (list + suspend/delete), user detail (suspend/promote/
  delete), projects (new `GET /api/admin/projects` with owner + paper/collaborator counts),
  papers, feedback (status updates persist), flags (dismiss/action persist).
- `admin/stats` now returns ALL real counts (active users 7d via `last_active_at`, papers
  saved, searches 30d via `analytics_events`) + `recentActivity`.
- New: `GET/PATCH /api/admin/settings` (feature flags + banner over `platform_settings`),
  `GET /api/admin/health` (live pings of S2/OpenAlex/arXiv/CrossRef/ML/Redis),
  `DELETE /api/admin/cache` (Redis flush). Admin settings page fully wired.
- Snake→camel mapping centralised in `lib/adminMappers.ts`.
- **To make yourself admin:** in Supabase SQL editor run
  `update users set role = 'admin' where email = 'you@example.com';`

### 4.2 Seed sets — ✅ Done
- `lib/repository/seeds.ts` + `app/api/seeds/route.ts` (GET/POST/PATCH/DELETE) + `hooks/useSeeds.ts`.
- Seeds page: create set from saved library (picker modal), select/delete sets, view resolved papers.

### 4.3 Collaboration & comments — ✅ Done
- `lib/repository/collaborations.ts` + `comments.ts`; `app/api/collaborations` +
  `app/api/comments` routes. Invite looks up an existing user by email (404 with clear message
  if they haven't signed up — no email-sending infra yet). Activity feed shows real comments.

### 4.4 Research gaps — ✅ Done (built-in engine)
- `lib/gapAnalysis.ts`: deterministic clustering by field-of-study with gap scores
  (sparsity + staleness), keyword extraction, and future-work phrase detection over abstracts.
- `/api/gaps` is now authed + ownership-checked; still proxies to `ML_SERVICE_URL` when set.
- Gaps page calls the real API, tracks `gap_analysis_run`, and has empty/error states.

### 4.5 Export — ✅ Done
- `/api/export` uses the real library (`bibtex`/`csv`/`json`, optional `paperIds` subset) and
  real outline for `docx` (via `docx`) and `pdf` (via `jspdf`) with citations per section.
- `components/ExportMenu.tsx` + `lib/download.ts` (authed blob download). Wired on
  outline (DOCX/PDF) and timeline (BibTeX/CSV/JSON).

### 4.6 Timeline / defence — ✅ Done
- Both are client components over the real library. Timeline scales its axis to your library's
  year range; "seminal" = top-cited relative to the library. Defence panels classify library
  papers via keyword heuristics (counter-arguments / contradictions / methodology critiques)
  until an ML service exists.

### 4.7 Also wired this pass (frontend↔backend integration)
- **Dashboard:** real stats (papers/chapters/high-gap clusters/seed sets), Research Debt panel
  lists real unread saved papers ("Review" opens the paper and persists `read_status`),
  methodological fingerprint computed from the library.
- **Settings:** profile save (Firebase `updateProfile`), thesis metadata save
  (`PATCH /api/projects/[id]`), password change (Firebase `updatePassword`), account deletion
  (`DELETE /api/me` — removes Firebase user + all rows via cascade). The cosmetic
  notifications section was removed (no backing table in the schema).
- **Saved papers:** `PATCH /api/papers/save` for readStatus/tags/notes.
- **Search:** tracks `search_run` events (feeds the admin "Searches (30d)" stat); "My Library"
  scope uses indexed full-text search (see §6).
- Fixed: admin user PATCH wrote camelCase `adminNotes` to a snake_case column (silently dropped).

### 4.9 Search now queries all 8 sources (file.txt spec compliance)
- **Was:** `/api/papers/search` only called Semantic Scholar, OpenAlex, arXiv, CrossRef —
  `lib/api/pubmed.ts`, `core.ts`, `europePmc.ts`, `doaj.ts` existed but were never imported
  anywhere (dead code), despite the landing page and file.txt spec both promising 8 sources.
- **Now:** all 8 are queried in parallel (`Promise.allSettled`, so one slow/failing source never
  blocks the rest) and deduped by DOI/arXiv id, matching file.txt's "API Sources" section.
- **Bug fixed in the process:** `searchPubMed` requested `retmode=json` from NCBI's `efetch`
  endpoint, which — despite the parameter — always returns XML for full records. The old code
  silently got `[]` back every time (never threw, never logged) — a real "feature that looked
  wired but did nothing." Rewired to fetch XML and parse it (regex-based, same style as the
  existing `arxiv.ts` parser); verified live against NCBI (returns real titles/abstracts/authors).

### 4.8 Still optional / not built (needs infra or product decisions)
- Python ML microservice (SPECTER embeddings, semantic similarity, draft generation) — the
  built-in gap engine covers the feature until then; set `ML_SERVICE_URL` to upgrade.
- Email delivery for collaborator invites (needs an email provider).
- Saved searches (`saved_searches` table exists; no UI/route yet).
- Notification preferences (no table in schema).
- Middleware hardening (edge-level token verification) — route guards remain the enforcement.
- Admin analytics page with date-range charts (overview charts still illustrative mock data —
  real aggregation queries over `analytics_events` are a follow-up).

---

## 5. Conventions to follow for all remaining work

- **New API route:** `requireUser(request)` → `ensureUser(decoded)` → Zod-parse body → ownership
  check → repository fn → `return NextResponse.json(...)`; wrap in `try/catch` with
  `handleRouteError(err, 'context')`.
- **New client data call:** always go through `apiClient` (never raw `fetch`) so the Firebase token
  is attached.
- **New repository:** one file per table in `lib/repository/`, `rowToX` mapper, snake_case DB ↔
  camelCase types (`types/*`). Cast Supabase joined relations via `as unknown as {…}` (the inferred
  relation type is an array).
- **New UI:** `border-2 border-black` + `shadow-impact`, zero radius, Instrument Serif for headings,
  `uppercase tracking-widest font-black` for labels, accent `#0066FF` only for emphasis; use the
  branded primitives in `components/ui/`. Every screen should show empty / loading (skeleton) /
  populated / error states. No gold/pastel; no soft `rounded-md`/`shadow-sm` (they're no-ops anyway).
- **Verify before done:** `npx tsc --noEmit` and `npm run build` must pass.
