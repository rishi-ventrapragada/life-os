# SESSION_13.md — Step 13: Finishing touches — the FINAL v1 step

**Goal:** the finishing-touches pass (PRD §8 Step 13) that turns a feature-complete app into a shippable v1: **consistent empty + loading states** across every section, a **data-export button** (JSON download of all the user's data — also the free-tier backup story, PRD §10), a **responsive/mobile pass** so the app is usable on a phone, and general polish. After this, **v1 is done.**
**Done when (from PRD §8):** the app is usable on a phone (responsive pass complete), and the export button downloads all of the user's data as JSON. Verified on the deployed app — resize/DevTools mobile view works, and the exported file actually contains every table's rows for the signed-in user — then committed and pushed.

> **This step is mostly frontend + one read-only export.** No new tables, no migration, no RLS gate. MCP should stay `read_only=true` all session (used only to confirm the export returns the right rows). If any part tempts a schema change, that's out of scope — v1 ships on the existing 11 tables.

## Kickoff prompt (paste as first message)

> New session. Read CLAUDE.md, PRD.md, SECURITY.md, FUTURE.md, SESSION_12.md and SESSION_13.md fully. We are on **Step 13 of the PRD build plan: finishing touches — empty/loading states, JSON data-export, responsive pass, polish. This is the final v1 step.** Step 13 is **not** on the fable-mode list — but invoke `fable-mode` if any debugging fails twice.
> Enter plan mode and propose the plan for the finishing-touches pass, deciding scope explicitly (it's the widest-surface step, so guard against gold-plating):
> - **Data-export button (the one genuinely new feature).** A button (Today section, or a small header/footer control — decide where) that fetches every table's rows for the signed-in user and downloads them as a single JSON file. **All reads go through the existing anon-key client under RLS** — so the export can ONLY ever contain the user's own rows (no service key, no new endpoint). List the 11 tables explicitly; a `client.from(t).select('*')` per table, assembled into one object, `Blob` + object-URL download. Confirm via MCP that the row counts in the file match the DB for the owner. `log_date`/`entry_date`/etc. stay raw strings — no date reformatting on export (Law 3).
> - **Empty + loading states audit.** Every section already has some; make them consistent and human (not "undefined"/blank flashes). This is a review-and-polish pass, not a rewrite — list what's inconsistent first, then fix only those. Don't touch working data logic.
> - **Responsive/mobile pass (PRD Law 5 + §8).** The app is desktop-first but built responsive-friendly (flex/grid, no fixed px on containers). Audit at a phone width (e.g. 375px): the sidebar (hidden below `md` already), section grids collapsing to one column, forms and tables not overflowing, tap targets big enough. Fix overflow/cramping; do NOT redesign. `AcademicsSection` (three sub-features) and `FitnessSection` are the likeliest to need column-collapse attention.
> - **Polish, bounded.** Consistent spacing/heading rhythm between sections, focus-visible on any element that's missing it, and the design-system laws (only transform/opacity animated, never `transition-all`, GlowCard variants correct). A quick grep pass for `transition-all` / stray `new Date(` / `console.log` left in. NOT a visual redesign — match the established mood.
> - **Law 1 + Law 3 stay in force.** Any new file (the export helper) under ~200 lines; the export helper is pure-ish data assembly, a candidate for `lib/` with a test asserting it lists all 11 tables. No `new Date()` date maths anywhere.
> - **README.** AUDIT_1 noted README.md is still stock create-next-app boilerplate. This is the natural step to replace it with a real project description (what the app is, the stack, how to run it). Small, worth doing as v1 closes.
> Work in small increments (export button → empty/loading audit → responsive pass → polish + README). End of session: commit, push, and I'll confirm the export downloads real data and the app works at phone width live on Vercel. **This is the last v1 step — after it, stop and mark v1 complete.**

## Before starting (2 min)
- [ ] Open VS Code at `C:\dev\Personal Life OS`.
- [ ] **Confirm Step 12 closed clean:** SESSION_12.md records commit `c8a1962`, 103/103 tests, RLS 82/82 across 11 tables, and owner-verified Fitness live.
- [ ] Have the Vercel URL handy and know how to open DevTools device/mobile view (or just narrow the window to ~375px).
- [ ] **MCP stays `read_only=true` all session** — this step needs no migration. The lock is user-asserted; don't write-probe it.
- [ ] Have some **real data in every section** before the export/empty-state work — an export of an empty DB and an all-empty-states screen both prove little. (Current DB: 1 of most things, 0 timetable_slots — add a row or two where empty.)

## Session rules (unchanged)
- One step only. New ideas → FUTURE.md.
- Approve read-only commands quickly; read write/install commands fully.
- Two failed fixes = wrong diagnosis → invoke fable-mode.
- Never end the session without commit + push.

## Explicitly NOT this step (guard against scope creep — this is the widest-surface step)
- **No new features.** Export is the only new thing. No gamification, charts, finance, calendar, filters, search — all post-v1 (PRD §11 / FUTURE.md).
- **No schema changes.** v1 ships on the existing 11 tables. `tasks.area_id` NOT NULL stays parked (it's a nicety, not a v1 blocker) unless a truly free moment and an open write window coincide — and even then only as its own reviewed migration, never bundled into "polish."
- **No visual redesign.** Match the established mood; fix cramping/overflow/inconsistency, don't reinvent the look.
- **No `npm audit fix --force`** (downgrades Next) and don't chase the leaked-password WARN (Pro-gated). The pre-v2 security audit (SECURITY.md "Before v2") is a SEPARATE future session, not this one.
- **Don't fix the D1 race in Goals/Tasks or lift hooks into a provider** (decision F) — FUTURE.md. (Though if the responsive pass has you in those files anyway, the D1 backfill is a candidate — but only if it doesn't balloon the step; default is leave it.)

## Notes carried over from Step 12
- **v1 is feature-complete.** All 11 tables exist with RLS (all passed the adversarial gate); every PRD §4 section is built and persists behind auth. Step 13 is polish + export, not new capability.
- **The 11 tables** (for the export list): `life_areas`, `goals`, `tasks`, `habits`, `habit_checks`, `journal_entries`, `courses`, `assignments`, `timetable_slots`, `workout_split`, `workout_logs`.
- **`lib/` helpers** (all pure, tested — 103 cases): `dates.ts` (`getTodayIST`/`addDaysISO`/`diffDaysISO`), `due.ts`, `formatDate.ts`, `weekdays.ts`, `streaks.ts`, `week.ts`, `academics.ts`, `pomodoro.ts`. The export helper joins them as a peer.
- **The slice pattern** (hooks with `status: loading|ready|error`) means empty/loading states already exist per section — the audit is for consistency, not creation.
- **Law 1 watch-list:** `useHabits.ts` **185**, `useWorkoutLog.ts` 113, `LogForm.tsx` 108. Nothing may cross ~200; the export helper is small.
- **MCP read-only lock is USER-ASSERTED, not observed** — this step needs no writes, so leave it locked; never write-probe.
- **Parked, do not re-chase:** leaked-password WARN (Pro-gated), `npm audit` 2 moderate (never `--force`), custom SMTP before multi-user, `tasks.area_id` nullable, D1 backfill for Goals/Tasks, decision-F provider lift. **README is stock boilerplate** (AUDIT_1) — replace it this step.
- **Env/deploy unchanged:** anon key client-safe (the export uses it under RLS — that's the whole point), service-role never ships, push to `main` auto-deploys.
- **Windows gotchas** ([[windows-dev-loop-gotchas]]): kill node via PowerShell, not bash `pkill`; stop the dev server before `npm run build`. The localhost hydration warning is the Grammarly extension ([[grammarly-hydration-warning-not-ours]]) — don't "fix" it.
- **Verification bar:** the export is the one thing to verify hard — download the file, open it, and confirm (via MCP for the owner) that each table's row count in the JSON matches the DB. "The button downloaded something" is not "it exported everything."

**After DoD passes: STOP — v1 is complete.** The next chapter is the pre-v2 security audit + MFA gate (SECURITY.md "Before v2"), then the post-v1 roadmap (PRD §11 / FUTURE.md: gamification "The System", charts, finance, calendar, multi-user, AI agent). But first: use the finished app, and celebrate — the foundation is built.

## Step 13 — COMPLETE (2026-07-22) · commit `b53e0b7`

The finishing-touches pass — mostly frontend polish over the 11 feature-complete
tables plus one new read-only feature. No schema change, no migration, no RLS gate;
MCP stayed `read_only=true` all session (used only for the export row-count truth).
Scope held tight against gold-plating — where the audit found things already correct,
they were left alone rather than churned.

**Data export (the one new feature).** `lib/exportData.ts` — `EXPORT_TABLES` (all 11,
fixed order) + `collectExport(client)`, which reads every table through the shared
**anon-key client under RLS**, so the file can only ever contain the owner's own rows
(no service key, no server endpoint). Raw date strings pass through verbatim (Law 3);
`exportedAt` is the one legitimate `new Date()` instant (a timestamp, not a calendar
date). A single failing table surfaces an error instead of producing a partial file
that looks complete. `components/today/ExportButton.tsx` (Blob + object-URL download,
filename `life-os-export-<getTodayIST()>.json`) sits in the **Today** section header —
visible on mobile, unlike the `hidden md:block` Sidebar (user-confirmed placement).
`lib/exportData.test.ts` asserts all 11 tables are listed and that `collectExport`
reads each and shapes `{ exportedAt, tables }` (empty table → `[]`, failing table →
recorded + `[]`).

**Empty/loading audit (consistency, not rewrite).** The real inconsistency was
*loading copy* — unified to plain **"Loading <noun>…"** across Today/Goals/Habits/
Tasks/Journal (dropped the possessive "your" and the two bare "Loading…"). Academics/
Fitness were already in that voice; AuthGate's bare "Loading…" is the pre-auth
whole-app state (no noun applies) and stayed. **Empty states were already correctly
matched to their layouts** — the Fitness split renders "Rest" per day (not a blank
grid, as the kickoff feared), inline sub-feature lists (Assignments, WorkoutLog) use a
bare muted `<p>` because a nested GlowCard would be visually heavy — so they were left
as-is. No hook/status/gating logic touched.

**Responsive / 375px.** One real fix: `app/page.tsx` `<main>` padding
`px-8 py-16` → `px-4 py-10 sm:px-8 sm:py-16`, section gap `24`→`16` on phone.
Everything else was already responsive-friendly — grids collapse below `sm`/`md`, all
form fields `w-full`, and a grep confirmed **no fixed-px width containers** anywhere
(the only `w-56` is inside the `hidden md:block` Sidebar). No redesign, no mobile nav
(Sidebar-hidden-below-md is the accepted design; sign-out stays Sidebar-only on
mobile — noted, not fixed → FUTURE.md if it ever bites).

**README.** Stock create-next-app boilerplate replaced with a real description: what
the app is, the stack, the one-page architecture, the scripts, and the env vars **by
name only** (`NEXT_PUBLIC_SUPABASE_URL` / `_ANON_KEY`) with the service-role-never-ships
warning. No values.

**Folded in (user-approved mid-session).** `npm run lint` was red on a **pre-existing**
error in `components/pomodoro/usePomodoro.ts` from Step 10 (`dcb791f`) — `remaining` was
computed by reading a ref **and** calling `Date.now()` during render, which the React 19
`react-hooks/refs` + `react-hooks/purity` rules now reject. Fixed by moving `endAt` to
state and moving the wall-clock read into the interval effect, so **render reads only
state**. Timing semantics are unchanged (`remaining` is still recomputed from `endAt`,
never decremented; an immediate `tick()` avoids a 250ms start lag) and the hook's public
shape is identical, so `PomodoroTimer` is untouched. This was the one debugging detour:
the first fix (endAt→state but `Date.now()` still in render) traded the refs error for a
purity error; the second (read the clock in the effect) cleared both.

**Verification actually performed:**
- **108/108 vitest** (adds 5 `exportData` cases); **`npm run lint` clean** (was red on the
  inherited Pomodoro error, now green); **`npm run build` clean**. Hit one real TS error —
  the Supabase `select()` returns a thenable, not a `Promise`, so the export client type
  used `PromiseLike`; caught by the build, fixed, rebuilt green.
- **Secret-scan** of the staged diff clean (README names env vars only). `rls-test.mjs`
  stayed git-ignored; **`.mcp.json` stayed `read_only=true`** — no write-probe, only a read
  query ran all session.
- **Export row-count truth (MCP, owner):** `life_areas 5 · goals 3 · tasks 4 · habits 7 ·
  habit_checks 12 · journal_entries 2 · courses 1 · assignments 1 · timetable_slots 1 ·
  workout_split 1 · workout_logs 0`. The downloaded JSON must match these table-for-table
  (`workout_logs` present as `[]`).

**Owner-gated live checks (the two things I can't fake from here):**
1. **Export downloads real data** — click ↓ Export my data on the deployed app, open the
   file, confirm each table's row count matches the counts above (and `workout_logs: []`).
2. **App is usable at 375px** — no horizontal page scroll, forms/grids/tables don't
   overflow, sections stack to one column.

**v1 is complete** once those two confirm. All 8 PRD §4 sections exist and persist behind
auth across 11 RLS-protected tables, the app is responsive, and the user can export all
their data. No SESSION_14 kickoff is created — the next chapter (pre-v2 **security audit +
MFA gate**, SECURITY.md "Before v2") is its own decision, not an auto-created step. After
that: the post-v1 roadmap (PRD §11 / FUTURE.md).
