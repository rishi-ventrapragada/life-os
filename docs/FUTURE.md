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
- **Mobile-responsive pass** — PRD §8 Step 13 + §11.1 (promoted if phone pain is high).
- **Data export (JSON download of all user data)** — PRD §8 Step 13; doubles as
  the free-tier backup story (PRD §10).
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
- **`npm audit`: 2 moderate findings** (Next's bundled postcss, GHSA-qx2v-qp2m-jg93)
  — parked to the pre-v2 audit. Do NOT run `npm audit fix --force` (it would
  downgrade Next to 9.x).
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

- **D1 backfill-fix for `GoalsSection` / `TasksSection` (the add-before-ready race).**
  Step 7's `useHabits` was built with the guard; Goals and Tasks still have the
  original pattern. In both, the "+ Add" button renders while `status === "loading"`,
  before `ensureAreasSeeded` populates `areaIds.current`. A submit inside that
  one-round-trip window calls `patchToRow` with an empty map → `area_id` undefined →
  the row lands with `area_id = null` → the `life_areas!inner(name)` join hides it
  from every future fetch: an invisible orphan row while the UI says "save failed."
  **The fix, already proven in `components/habits/useHabits.ts`:** resolve the area
  id *before* the insert and hard-bail with a real message if it's missing
  (`NOT_READY`), plus gate the add control on `status === "ready"` in the section.
  Apply the same two changes to `components/goals/useGoals.ts` + `GoalsSection.tsx`
  and `components/tasks/useTasks.ts` + `TasksSection.tsx`. Not done in Step 7 on
  purpose — one step, one scope (AUDIT_1 D1).
- **Triplicated hook pattern.** `useGoals`, `useTasks`, `useHabits` now share the
  same bootstrap-await + optimistic-write + `resyncAfterError` shape. Triplication is
  accepted for v1 pedagogy (AUDIT_1 §3); consider a shared factory only post-v1, and
  only if a fourth copy appears.
- **Lift habits/tasks state into a provider (Step 9 decision F).** `TodaySection` mounts
  its own `useHabits()`/`useTasks()` instances alongside `HabitsSection`/`TasksSection`,
  so the page fetches each dataset twice and — the part that actually shows — **the two
  copies hold independent state: checking a habit in Today does not visibly update the
  Habits section until a refresh** (and vice versa). Accepted for v1: a single user, two
  small extra queries, and the alternative was refactoring three working slices mid-step.
  **The fix when it bites:** wrap the page in `HabitsProvider`/`TasksProvider` (or lift
  the hooks into a shared context in `app/page.tsx`) so every section reads one instance.
  **Trigger to do it:** the stale-until-refresh behaviour becoming annoying in daily use,
  or a fourth consumer of either hook appearing.
