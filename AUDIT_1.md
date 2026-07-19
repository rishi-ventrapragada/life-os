# AUDIT_1.md — Full project audit through end of Step 6

**Date:** 2026-07-20 · **Mode:** read-only fable-mode audit (no code changes; FUTURE.md was the one file edited)
**State audited:** commit `cf5f11a` (main == origin/main, clean tree). Steps 0–6 complete; SESSION_7.md written, Step 7 not started.
**Evidence basis:** every claim below was observed this session — file reads with line numbers, `git` history scans, `npm audit`, the live Vercel bundle, and the database read back via the read-only Supabase MCP (`list_tables`, `pg_policies`, `pg_indexes`, `pg_constraint`, `list_migrations`, `get_advisors`). Nothing is carried forward on trust from session notes.

---

## 1. Architecture laws compliance — PASS on all five

**Law 1 — component-per-section, ~200-line cap: PASS.**
`app/page.tsx` (35 lines) is pure composition of eight section components under `components/sections/`. Largest files in the repo: `components/auth/LoginForm.tsx` 142, `components/goals/useGoals.ts` 143, `components/tasks/TaskForm.tsx` 137, `components/tasks/useTasks.ts` 130. Nothing is near the cap. Total app source ≈ 2,000 lines across 31 files.

**Law 2 — vertical slices: PASS.**
Goals (Step 3) and Tasks (Step 6) each shipped table + RLS + hook + UI in one step. Step 2's local-state-only Goals was the PRD-sanctioned learning exception, retired in Step 3.

**Law 3 — all date logic through `lib/dates.ts`: PASS (verified by grep, not assumption).**
The only `new Date()` in app code is the injectable default parameter at `lib/dates.ts:13` (plus test instants in `lib/dates.test.ts`). Zero hits for `toISOString` / `toLocaleDateString` / `getUTC*` / `Date.now` in `app/`, `components/`, `lib/`, `scripts/`. Due-today/overdue logic (`components/tasks/TaskCard.tsx:27-32`) compares the stored `yyyy-mm-dd` string against `getTodayIST()` lexicographically — correct, ISO strings sort. `formatDate`/`formatDeadline` are pure string splits, no `Date` objects.
*Nit:* `components/goals/GoalCard.tsx:17` still says date logic "waits for lib/dates.ts in Step 4" — stale comment, the utility has existed since Step 4 (deadline *comparisons* are deliberately deferred to Step 9 per SESSION_4).

**Law 4 — `user_id` + RLS on every table: PASS in the actual database (see §2).**

**Law 5 — fluid layouts: PASS.**
Flex/grid throughout; content column is `max-w-5xl` with `min-w-0 flex-1` (`app/page.tsx:19-20`); sidebar is rem-based `w-56`, hidden below `md` (`components/Sidebar.tsx:21`). The only pixel widths in the project are slider thumbs at `app/globals.css:153,164` — widget internals, not containers.

**Design-system laws: PASS.** Zero hits for `transition-all`, `shadow-md`, `indigo`, `blue-`. GlowCard glows live on `::before`/`::after` and crossfade via opacity (`app/globals.css:54-94`); only `transform`/`opacity` are animated, with `prefers-reduced-motion` fallbacks (`globals.css:195-220`) — beyond what the law requires. Custom purple `#6d28d9`/`#c026d3` accents; interactive elements consistently carry hover + focus-visible + active states.

---

## 2. Security posture — verified stage by stage against SECURITY.md

**Secret scan, full git history:** `git grep` across all 23 commits for `sb_secret_` / `service_role` / private-key blocks / `eyJhbGciOi` — the only hits are SECURITY.md's own checklist text naming those patterns (all 17 commits that contain SECURITY.md, 1 hit each). **Clean.**

**Working tree:** same scan outside SECURITY.md — clean. `git ls-files` confirms no `.env*` file and no `rls-test.mjs` has ever been tracked; `git status` clean.

**`.env*` ignore integrity:** `.gitignore:32-34` (`.env`, `.env.*`, `!.env.example`) intact, plus `/scripts/rls-test.mjs` (line 37) and `.claude/settings.local.json` (line 43). The only tracked `.claude` file is the fable-mode skill.

**RLS policies read back from the database (not from docs):** 3 tables — `life_areas`, `goals`, `tasks` — all `rls_enabled=true`, each with exactly 4 per-command policies on role `authenticated`:
`{table}_select_own` / `_update_own` / `_delete_own` (USING `(select auth.uid()) = user_id`) and `_insert_own` (WITH CHECK same), `_update_own` carrying both USING and WITH CHECK. 12/12 policies match the documented shape. Both migrations present: `20260717121030 create_life_areas_and_goals`, `20260719145548 create_tasks`.

**MCP:** `read_only=true` confirmed in `.mcp.json:5`.

**Auth flow on Supabase defaults only:** verified in code — `SessionProvider.tsx` uses `getSession`/`onAuthStateChange` with default localStorage handling and additionally force-signs-out any stale anonymous session (lines 47-55); `LoginForm.tsx` uses only `signInWithPassword`/`signUp` and surfaces Supabase errors/rate-limit messages verbatim. No custom token storage, no bypass endpoints, no API routes at all (the entire server surface is Supabase itself, behind RLS).

**`get_advisors(security)`:** exactly 1 WARN — "Leaked Password Protection Disabled." Matches the parked item (Pro-plan-gated on free tier). No new findings.

**`npm audit`:** 2 moderate (postcss < 8.5.10 via Next's bundled copy, GHSA-qx2v-qp2m-jg93) — exactly the parked pre-v2 items. ⚠️ Do **not** run the suggested `npm audit fix --force`; it would downgrade Next 16.2.10 → 9.3.3.

**Deployed client bundle (live Vercel site, fetched this session):** downloaded the page + all 8 `/_next/static` chunks and scanned. One chunk matched `sb_secret_` — inspected: it is supabase-js's own key-format check, the literal `e.startsWith("sb_secret_")`. No key-shaped secret (`sb_secret_` + 20 chars) exists anywhere in the bundle. Only the publishable key and project URL ship — both client-safe by design. **Service-role key appears nowhere: history, tree, or bundle.**

**Database ground truth:** 1 user (confirmed, non-anonymous — the owner), 0 anonymous users, 5 `life_areas`, 3 `goals`, 1 `task`, zero rows with null `user_id`/`area_id`. Matches "throwaway accounts cleaned up, only the real account remaining." (SESSION_6's "0 tasks" close-out snapshot is simply pre-usage.)

### Security findings (the two real ones)

- **S1 — Step 6's adversarial RLS re-test was narrower than Step 5's.** The recorded Step 6 run (`SESSION_6.md:45`, matching `scripts/rls-test.mjs:119-151`) is 4 checks in one direction: B SELECT/UPDATE/DELETE on A's task + A-intact re-read. It does **not** exercise the INSERT WITH CHECK path (inserting a row with a forced foreign `user_id`) nor the reverse direction — Step 5's matrix did 8 attacks × 2 directions (that's where "16/16" comes from; it was Step 5, not Step 6). Mitigation: the WITH CHECK policy was read back and is correct, and goals/life_areas proved the identical policy shape blocks forced inserts. Risk low, but **Step 7 should extend `rls-test.mjs` to the full matrix** (cross-owner INSERT with explicit `user_id`, both directions) since `habits`/`habit_checks` reuse it as the template.
- **S2 — `tasks` schema drifted from the `goals` template it was meant to mirror.** `tasks.user_id` is **nullable** (goals/life_areas are NOT NULL) and the `tasks_user_id_idx`/`tasks_area_id_idx` indexes were skipped (performance advisor flags both FKs; goals/life_areas have theirs). Not a live security hole — RLS makes a null-`user_id` row invisible to everyone rather than shared, the column default is `auth.uid()`, and 0 null rows exist — but it weakens the invariant Law 4 rides on. **Fix in Step 7's migration window** (one `ALTER TABLE` + two `CREATE INDEX` while MCP write is on; also now parked in FUTURE.md).

---

## 3. Data layer & correctness

**Pattern consistency: excellent.** `useTasks.ts` is a faithful clone of `useGoals.ts`: same bootstrap-await, same optimistic-write + `resyncAfterError` ("the UI never lies") shape, same row↔model mappers, same error strings. A third copy (`useHabits`) is planned; triplication is acceptable for v1 pedagogy — consider a shared factory only post-v1, not now.

**Seed idempotency: sound, DB-enforced.** `UNIQUE (user_id, name)` confirmed in `pg_constraint`; upsert uses `onConflict: "user_id,name", ignoreDuplicates` (`lib/bootstrap.ts:42-45`); per-user promise cache guards StrictMode double-mount and cross-user leakage, and evicts on failure so a transient error doesn't poison retries (`bootstrap.ts:26-35`). Singleton-per-user handling is correct.

**Debounce: correct.** Slider-only patches (`useGoals.ts:116-126`) debounce 400ms per-goal with timer replacement; mixed patches persist immediately. Un-flushed timer on unmount/sign-out worst-cases to a 0-row update under RLS — harmless.

**D1 — latent add-before-ready orphan (low severity, about to be copied a third time).** The "+ Add goal/task" buttons render while `status === "loading"` (`GoalsSection.tsx:25-33`, `TasksSection.tsx:33-41`). A submit before bootstrap resolves hits `patchToRow` with an empty `areaIds.current` → `area_id` undefined → dropped from the insert → row lands with `area_id = null` → the `life_areas!inner` join (`useGoals.ts:10`, `useTasks.ts:10`) filters it out of every future fetch: an invisible orphan row, while the UI shows "save failed." Window is one network round-trip, so it has plausibly never fired (0 null-area rows in the DB). Cheap fix when next touching these files: gate the add button on `status === "ready"`, or guard in the hook. **Step 7 must not clone this into `useHabits`.**

**`lib/dates.ts` test coverage: solid for what exists.** 9/9 vitest tests pass (run this session): the 18:29/18:30/18:31 UTC boundary triple, mid-day sanity, month + year rollovers, format shape. IST's no-DST property is documented. For `getTodayIST` itself nothing is missing.
**The real gap is what does not exist yet:** Step 8's streaks need date *arithmetic* (previous-day, day-gaps, month grids, leap years) and `lib/dates.ts` currently exports only `getTodayIST`. See Step 8 advice in §6.

---

## 4. Docs-vs-reality drift

1. **FUTURE.md was empty (0 bytes)** despite PRD §4/§9's "every idea goes to FUTURE.md" and at least one item (custom SMTP, `SESSION_7.md:49`) explicitly labeled "belongs in FUTURE.md." **Fixed this audit** — backfilled with the differentiation statement, gamification arc, parked items, and process ideas.
2. **The "16/16" recollection for Step 6 is Step 5's number.** SESSION_6.md's actual record is a 4-check, single-direction matrix on `tasks` ("ALL PASS"). The written record is accurate; the shorthand overstates Step 6's coverage (see S1).
3. **README.md is stock create-next-app boilerplate** — claims the Geist font (app uses Inter + Space Grotesk), describes no project. Cosmetic; rewrite at Step 13 or any idle moment.
4. **`tasks` doesn't fully "mirror the `goals` table exactly"** as the SESSION_6 kickoff specified: nullable `user_id`, missing indexes (S2). SESSION_6's close-out doesn't record the deviation.
5. **SESSION_6.md:45 "0 tasks"** vs 1 task in the DB — post-step owner usage, not an error; noted so a future session isn't surprised.
6. Minor and correctly self-documented: `lib/goals.ts` never existed (data layer is `lib/bootstrap.ts` + hooks — SESSION_3/4 record it); PRD's draft schema omits `created_at` columns that exist; browser-MCP plan superseded by scratchpad playwright-core (memory + session notes cover it).
7. PRD.md, SECURITY.md, and SESSION files are otherwise accurate against observed reality — statuses, parked items, DB state, and commit history all line up. This ritual is working.

---

## 5. Future-plans coverage

Verified durable (PRD/SECURITY): post-v1 roadmap order (§11), mobile pass (§8/§11), data export (§8 Step 13), calendar/charts/finance/multi-user/AI agent (§11), pre-v2 security audit + MFA gate (SECURITY.md "Before v2"), NOT-in-v1 fence (§4).

Was missing from the repo entirely — **now written into FUTURE.md**:
- The **differentiation statement** (opinionated daily check-in + real gamification + AI agent; v1 is the foundation, not the product).
- The **gamification/XP/ranks arc** in more than one line (Solo Leveling "System": XP from checks/tasks/streaks, ranks E→S, quests, owner-defined rewards, computed from the same rows v1 writes).
- **Custom SMTP before multi-user** (was only a SESSION_7 parked note).
- **Parallel-sessions-as-a-skill** note.
- **Automation graduation plan** (/goal-style autonomous loops, only for steps whose DoD is deterministic tests; schema/auth/deploy work stays supervised).
- Consolidated **parked technical items** (leaked-password WARN, npm audit pair, free-tier pause, S2 schema tidy-up) with their revisit gates.

---

## 6. Verdict

**Overall health: A− (strong).** All five architecture laws hold under grep-level scrutiny; security posture is verified clean at every layer that can be checked from here (history, tree, DB policies, advisors, live bundle); the docs-vs-reality gap is small and mostly self-documented. Deductions: the `tasks` schema drift, the narrowed Step 6 RLS matrix, and FUTURE.md having been empty. Nothing found requires stopping Step 7. "Already solid" is the honest overall reading — most audit lines came back clean, and the ones that didn't are listed above rather than manufactured.

### Top 5 risks, in priority order

1. **Step 8 streak logic has no date-arithmetic foundation yet.** The likeliest future Law-3 violation is ad-hoc `new Date()` math inside streak code. Mitigate by building `lib/dates.ts` helpers + tests *first* (see below).
2. **The RLS re-test template under-tests INSERT/WITH CHECK (S1)** just as two new tables arrive. Extend `scripts/rls-test.mjs` to the full both-directions matrix in Step 7.
3. **Free-tier operational cliff:** project pauses after ~1 week idle, auth email limited to a few/hour, no data-export until Step 13 — so today the only backup is Supabase's own storage. Daily use is the keep-alive; consider pulling the export button earlier if usage gaps loom.
4. **D1 orphan-row pattern is about to be copied into `useHabits`.** Guard adds on `status === "ready"` in the new hook (and backfill Goals/Tasks whenever those files are next open).
5. **Session-file sprawl as the doc-of-record.** Seven SESSION files + STEP_0 now carry load-bearing state; the FUTURE.md lapse shows how items fall through. Mitigation pattern that already works: keep promoting durable facts to PRD/SECURITY/FUTURE/memory instead of session notes.

### Advice for Steps 7–9

**Step 7 (Habits — next session):** SESSION_7.md is well-specified; add these audit results to its plan: (a) fold the `tasks` fixes into the same migration window — `ALTER TABLE tasks ALTER COLUMN user_id SET NOT NULL` (0 null rows confirmed) + the two missing indexes — and give `habits`/`habit_checks` NOT NULL `user_id` and FK/user_id indexes from birth; (b) extend `rls-test.mjs` per S1 (forced-`user_id` cross-INSERT, both directions, both tables); (c) don't clone D1 — gate habit-adds on bootstrap-ready; (d) on the open FK question, `habit_checks.habit_id` **ON DELETE CASCADE** is the simpler and safer choice (deleting a habit can't strand checks, and throwaway-account cleanup gets easier — note FKs to `auth.users` stay non-cascade regardless); (e) treat unique-violation (Postgres `23505`) on check-insert as "already checked," per the kickoff.

**Step 8 (streaks + monthly grid) — what that session must know:**
- **Build the date helpers before any streak code**, in `lib/dates.ts`, tested like Step 4: e.g. `addDaysISO(date, n)` / `diffDaysISO(a, b)` operating on `yyyy-mm-dd` strings via `Date.UTC` on the split parts (immune to local timezone because it never leaves UTC). Test cases to pin: leap year (2028-02-29 exists, 2027-02-29 doesn't), 30/31-day month edges, year boundary, and `diffDays("2026-03-01","2026-02-28")` in both a leap and non-leap year.
- **Define streak semantics explicitly before coding:** a current streak whose last check is *yesterday* and today is still unchecked should almost certainly still count (today isn't over in IST) — decide, write it in the session file, and test that exact case plus: single-day streak, gap resets, streak spanning a month boundary, max-streak strictly in the past, archived-habit behavior.
- **Compute from sorted `check_date` strings** fetched per habit; never round-trip a `check_date` through `new Date(dateString)` local-time parsing. The grid renders the current IST month derived from `getTodayIST()` (its first 7 chars give `yyyy-mm`), not from the browser clock.
- Streak math is a pure function of `(sortedDates, todayIST)` — put it in `lib/` with vitest coverage, not inside a component.

**Step 9 (Today section):** compose the existing hooks rather than new queries where possible; due/overdue is the same lexicographic compare TaskCard already proves; the week-progress indicator needs the Step 8 helpers (another reason to land them properly). Watch Law 1 — Today aggregates four features and is the likeliest file to breach 200 lines; plan the split (e.g. `today/` subcomponents) in the session kickoff.

---

*Audit method note: per fable-mode, "already solid" was treated as a legitimate finding — every clean result above was re-checked at the layer of the claim (the suspicious bundle hit was chased to its literal string; the all-clean history scan was validated by its expected SECURITY.md false-positives appearing exactly where they should).*
