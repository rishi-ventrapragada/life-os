# FUTURE.md — the landing zone for every post-v1 idea

Per PRD §4/§9: every new idea mid-build lands here immediately, never in the current
step. This file was empty until AUDIT_1 (2026-07-20) backfilled the plans that
existed only in the owner's head or scattered across session files. Items marked
*(recorded: …)* already live durably elsewhere and are listed here as pointers so
this file is the one complete index.

## Why this app exists (the differentiation statement)

Life-tracking apps are a crowded space, and v1 deliberately looks like a plain
tracker. The bet is the combination, not any single feature:

1. **An opinionated daily check-in** — one page, one ritual, under 2 minutes, IST
   as the only clock — instead of a flexible everything-tool you must configure.
2. **Real gamification** — the Solo Leveling "System" arc (below), earned from the
   same data the check-in produces, not a sticker layer bolted on.
3. **An AI agent** that eventually organizes and tracks alongside the owner (v3).

**v1 is the foundation, not the product.** Judging the app by v1's feature list
misses the plan; the moat is the daily habit + the data it accumulates + what the
later arcs do with that data.

## The gamification arc — "The System" (post-v1 arc #1 in spirit)

*(recorded thinly: PRD header note + §11.2; this entry is the durable statement.)*

Once v1's manual tracking is a stable habit:

- **XP** earned from completed habit checks, tasks, and check-in streaks.
- **Ranks** derived from accumulated XP / consistency, displayed on the
  dashboard.
- **Quests**: daily/weekly framing of the existing check-in items ("daily quest:
  all habits checked"), potentially with streak-protection mechanics.
- Design intent: computed from the same `habit_checks`/`tasks` rows v1 writes —
  no parallel bookkeeping, no separate "game state" the owner can desync.

## Roadmap pointers (already durable elsewhere)

- **Post-v1 order** — PRD §11: mobile polish → gamification → charts/analytics
  (Wheel of Life radar) → finance module → calendar + Eisenhower → multi-user →
  AI agent.
- **Pre-v2 security audit + MFA gate** — SECURITY.md "Before v2": full adversarial
  RLS re-audit, **MFA enabled and required**, input-validation review, `npm audit`
  resolution, Vercel deployment-protection review. Multi-user does NOT open before
  this session runs.
- **NOT-in-v1 list** — PRD §4 (the scope fence this file feeds).

## Settings menu — next items to plug in

The account block is now a settings menu (`components/settings/`): a generic
`SettingsMenu` shell plus one component per item. Adding a setting means writing
a component and adding one line to the list in `components/AccountBlock.tsx` —
the shell needs no change. Candidates, in rough priority order:

- **Password reset / change password** — Supabase `resetPasswordForEmail`. The
  bigger gap: sign-in has a reveal toggle now, but no recovery path at all if the
  password is actually forgotten. Note the free-tier auth email rate limit.
- **Password strength meter** on sign-up (deliberately skipped with the reveal
  toggle — Supabase already enforces `minLength={6}`).
- **Account deletion / "delete all my data"** — must delete children before
  parents (`tasks` FK is not `ON DELETE CASCADE`).
- **IST timezone override** — currently hard-coded via `getTodayIST()` (Law 3);
  only worth doing if the owner ever stops living on IST.
- **Notification / reminder preferences** — pairs with any future reminders work.
- **Export scope options** (date range, per-section) — the current export is
  all-or-nothing, which is the right v1 default.

## Backfilled items (were nowhere durable until this audit)

- **Custom SMTP before multi-user.** Supabase's default auth email is rate-limited
  to a few messages/hour (slowed the Step 5/6 RLS tests; see SESSION_7 parked
  notes). Fine for a single owner; a real SMTP provider must be wired before
  friends can register (v2 gate, alongside the SECURITY.md pre-v2 list).
- **Parallel sessions as a skill.** Once the build reaches independent workstreams
  (e.g. two sections with no shared files), codify how to run parallel Claude Code
  sessions/subagents safely — file-ownership boundaries, one-writer-per-file, how
  session logs merge — as a repo skill rather than ad-hoc judgment.
- **Automation graduation plan (/goal on deterministic tests).** The build ritual
  is deliberately supervised (Plan Mode, per-increment approval). Steps whose
  Definition of Done is fully deterministic and machine-checkable (a test suite,
  not "look at the page") are candidates to graduate to goal-driven autonomous
  loops — e.g. a /goal-style run that iterates until the tests pass — starting
  with low-risk, non-schema steps. Prerequisite: the DoD must be encoded as tests
  first; anything touching schema, auth, or deploys stays supervised.

## Parked technical items (accepted for v1, revisit at the marked gate)

- **Leaked Password Protection** — Pro-plan-gated on this free-tier project; its
  security-advisor WARN is accepted. Revisit if the project upgrades to Pro.
- ~~**`npm audit` findings**~~ — **RESOLVED 2026-08-27: `npm audit` is clean
  (0 vulnerabilities).** The Next.js 16.2.10 → 16.3.3 upgrade cleared 9 Next
  advisories plus postcss and sharp; brace-expansion, js-yaml and nanoid were
  patched in-range beforehand. (The earlier "2 moderate findings" count was
  wrong — it was 6 high by the time this was checked. The old warning that
  `npm audit fix --force` would downgrade Next to 9.x was also false: the real
  fix was a minor bump, now done.)
- ~~**3 `tsc --noEmit` errors in `lib/exportData.test.ts`**~~ — **RESOLVED
  2026-08-27.** Long-standing (never recorded here until closure): the fake
  Supabase client returned partial override objects, so `data`/`error` could be
  `undefined` where `SelectableClient` requires `unknown[] | null` /
  `{ message } | null`. Next 16.2.10 tolerated them at build time; 16.3.3
  promoted them to build-blockers, which forced the fix. Test file only —
  the export logic never changed.
- **Supabase free-tier pause** after ~1 week of inactivity — daily use is the
  keep-alive; the Step 13 export button is the backup story.
- ~~**App-wide focus-visible ring may not render**~~ — **NOT A BUG, closed 2026-07-26.**
  Focus rings render correctly on v4.3.2; the `outline-solid` requirement was an
  early-v4-beta issue, N/A here.
- **`tasks` schema tidy-up** (from AUDIT_1): ~~add `NOT NULL` on `tasks.user_id` and
  the missing `tasks_user_id_idx`/`tasks_area_id_idx` indexes~~ — **DONE in Step 7**,
  migration `20260720122759 harden_tasks_user_id_and_indexes`. **Still open:**
  `tasks.area_id` remains **nullable** while `goals.area_id` is NOT NULL. That is
  the exact column the D1 race below writes null into, so the constraint would
  catch the bug at the DB level. Needs a null-row check first (1 task row exists).
  Next migration window.

## Recorded in Step 7, to fix when those files are next open

- **D1 add-before-ready race — ADD PATH FIXED; two narrow gaps remain.**
  The original bug is closed: `addGoal` and `addTask` now resolve the area id and
  hard-bail with `NOT_READY` before inserting, matching `useHabits`
  (`useGoals.ts:95`, `useTasks.ts:121`). No add can produce an orphan row now.
  **Still open, both only in Goals/Tasks — Habits guards both:**
  1. **The UPDATE path is unguarded.** `patchToRow` still does
     `row.area_id = areaIds[patch.area]` (`useGoals.ts:38`, `useTasks.ts:53`),
     which yields `undefined` on a miss — the same orphan-row mechanism
     (`area_id = null` → the `life_areas!inner(name)` join hides the row from
     every future fetch). `useHabits.updateHabit` bails with `NOT_READY` here.
  2. **The "+ Add" button renders during `status === "loading"`** in
     `GoalsSection.tsx` / `TasksSection.tsx`. `HabitsSection.tsx` gates it with
     `disabled={!ready}`.
  Much harder to hit than the original add-race — reaching it means editing an
  item's *area* before the seed resolves, and the list is usually empty that
  early — but still a real gap. Fix when those files are next open.
- **Triplicated hook pattern — STILL OPEN, and distinct from the provider lift below.**
  `useGoals`, `useTasks`, `useHabits` share the same bootstrap-await + optimistic-write
  + `resyncAfterError` shape. This is *code* duplication across the three files, not the
  *state* duplication the provider lift fixed — sharing one instance per dataset does
  nothing to deduplicate the near-identical bodies, so the lift did not close this.
  (The bodies now live in `TasksProvider.tsx` / `HabitsProvider.tsx` / `useGoals.ts`.)
  Triplication was accepted for v1 pedagogy (AUDIT_1 §3), with "revisit if a fourth copy
  appears" as the trigger. **That trigger fired long ago:** `resyncAfterError` now
  appears in ten files — the three above plus `useCoursesState`, `useAssignmentsState`,
  `useTimetable`, `useWorkoutLog`, `useWorkoutSplit`, `useJournal` and `useDashboard`.
  Still deliberately deferred, since a shared factory touches every working slice at
  once, but it is no longer waiting on a trigger — only on a deliberate refactor session.
- ~~**Lift habits/tasks state into a provider (Step 9 decision F).**~~ — **RESOLVED
  2026-08-27: both datasets now live in one shared provider each** — tasks in
  `TasksProvider` (`42d757a`), habits in `HabitsProvider` (`c68e7b1`), both mounted
  inside `AuthGate` in `app/page.tsx`. `TodaySection` used to mount its own
  `useHabits()`/`useTasks()` instances alongside `HabitsSection`/`TasksSection`, so the
  page fetched each dataset twice and the copies held independent state: a check-off or
  an add in one section stayed invisible in the other until a refresh. Each hook body was
  relocated unchanged (git recorded both as renames) and `useTasks()`/`useHabits()` kept
  their names as context reads, so consumers only changed an import; using either outside
  its provider now throws instead of silently rendering an empty list. Streaks, the month
  grid and `WeekProgress` came along for free — they already derived from `checkDates`
  during render. The habits lift also split the four write paths into `habitsWrites.ts`
  to stay under the ~200-line cap (Law 1). **Extended 2026-08-27 (`f592529`):** courses
  and assignments got the same treatment in `AcademicsProvider`, so Today's "What's due"
  and the Academics section now share one instance too — that lift is what let Today
  merge assignments into the due list without a second fetch going stale.
- **Analytics radar still reads its own query — the last cross-section staleness.**
  `useDashboard` → `components/dashboard/dashboardData.ts` is a deliberately independent
  read path (it needs `created_at` for the per-habit denominator and never renders a
  habit name), so it is NOT covered by the provider lift above: checking a habit still
  won't move the radar until a refresh. Fixing it means either subscribing the dashboard
  to habit changes or merging the two fetches — and merging would let one section's needs
  silently widen the other's query, which is exactly why the paths were separated. A real
  design decision, not a mechanical lift; deferred until the radar's staleness actually
  annoys in daily use.
