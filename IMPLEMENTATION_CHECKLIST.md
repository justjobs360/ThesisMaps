# ThesisMaps — Implementation Checklist & Plan

_Last updated: 2026-07-16_

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

---

## 4. Remaining work — the "other half" (not yet real)

These still render `lib/mockData.ts`. Each item below says **how** to build it and **which existing
pattern/format to follow** so it stays consistent.

### 4.1 Admin panel → wire to the (already real) admin APIs
- **State:** `app/api/admin/*` routes are real Supabase queries; the admin **UI** still imports
  `MOCK_*` and is **not gated**.
- **How:**
  1. Add role gating: create an `AdminGuard` mirroring `components/auth/AuthGuard.tsx` that also
     checks `users.role === 'admin'`; use it in `app/(admin)/layout.tsx`.
  2. Replace `MOCK_*` imports in `app/(admin)/**` with `apiClient.get(...)` calls to the existing
     routes (`/api/admin/stats`, `/api/admin/users`, `/api/admin/feedback`, `/api/admin/flags`,
     `/api/admin/papers`).
  3. Finish `app/api/admin/stats/route.ts`: replace the 3 hardcoded fields
     (`activeUsersLast7d`, `totalPapersSaved`, `totalSearchesLast30d`) with real counts from
     `analytics_events` / `saved_papers`.
- **Format:** admin surface uses `admin-bg` tokens; keep `DataTable` (now branded) for tables.

### 4.2 Seed sets → real persistence
- **How:** new `app/api/seeds/route.ts` (GET/POST/DELETE) + `lib/repository/seeds.ts` over the
  `seed_sets` table (already in schema). Wire `app/(app)/seeds/page.tsx` (currently static) via a
  `useSeeds(projectId)` hook.
- **Format:** copy the route shape from `app/api/outline/route.ts` and the repository shape from
  `lib/repository/outline.ts`. The seeds page is already on-brand — only data wiring is needed.

### 4.3 Collaboration & comments → real persistence
- **How:** `app/api/collaborations/route.ts` (+ invite) and `app/api/comments/route.ts` over the
  `collaborations` / `comments` tables. Replace the local-only invite in
  `app/(app)/collaborate/page.tsx` with `apiClient.post`.
- **Format:** same route/repository pattern; reuse the branded `Modal` already in place.

### 4.4 Research gaps → stand up the ML service
- **State:** `app/api/gaps/route.ts` proxies to `ML_SERVICE_URL` if set, else returns mock.
- **How:** deploy the Python FastAPI microservice (embeddings/clustering) and set `ML_SERVICE_URL`,
  **or** implement in-DB clustering over `papers.embedding` (pgvector). Populate embeddings on
  `upsertPaper` (call the ML embed endpoint). Wire `gaps/page.tsx` `runAnalysis` to POST real work.
- **Format:** the gaps page is already on-brand; only the analysis call is fake.

### 4.5 Export → use real data
- **State:** `app/api/export/route.ts` formatting (BibTeX/CSV/JSON) is real but always exports
  `MOCK_PAPERS`.
- **How:** use the request's `projectId`/`paperIds` to fetch from `listSavedPapers` /
  `listSectionPapers` instead of `MOCK_PAPERS`. Add DOCX (via `docx`) and PDF (via `jspdf`) outputs
  for the outline. Wire the (currently removed) export buttons on outline/timeline.

### 4.6 Timeline / defence → optionally read real data
- **How:** both are on-brand but read `MOCK_PAPERS`. Convert to client components using
  `useProject` + `apiClient.get('/api/papers/save?projectId=…')` to plot the real library. Defence
  panels can filter the library by simple heuristics until the ML service classifies them.

### 4.7 Middleware hardening (optional)
- `middleware.ts` is a presence-only gate (real enforcement is in the route guards). If you want
  edge-level verification, move to a session-cookie approach verified via a lightweight token check.

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
