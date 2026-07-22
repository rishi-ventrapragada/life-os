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
