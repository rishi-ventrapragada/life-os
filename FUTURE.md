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

Solo Leveling theme: the owner is a low-rank hunter grinding daily quests until
S-rank. Once v1's manual tracking is a stable habit:

- **XP** earned from completed habit checks, tasks, and check-in streaks.
- **Ranks E→S** derived from accumulated XP / consistency, displayed on the
  dashboard like a hunter license.
- **Quests**: daily/weekly framing of the existing check-in items ("daily quest:
  all habits checked"), potentially with streak-protection mechanics.
- **Rewards**: owner-defined, unlocked by rank/XP thresholds.
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
- **`tasks` schema tidy-up** (from AUDIT_1): add `NOT NULL` on `tasks.user_id` and
  the missing `tasks_user_id_idx`/`tasks_area_id_idx` indexes during the next
  migration window that has MCP write access (Step 7 is the natural slot).
