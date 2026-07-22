# SESSION_12.md — Step 12: Fitness — weekly split table + workout log (two sub-steps)

> **Usage pause first (PRD §8).** The PRD puts a deliberate pause before steps 11–12: live with the app 1–2 weeks and let reality reorder priorities. If you're arriving here straight off Step 11, consider using the app a while first — and let real friction decide whether Fitness is the right next step or whether something from FUTURE.md / daily-use pain should jump ahead. Steps 11–13 were always meant to be re-prioritised by what actually hurts in use.

**Goal:** the Fitness section (PRD §4.6) — two sub-features, each CRUD-complete and persistent before the next:
1. **Weekly workout split** — a table: day-of-week → workout name. (Which muscle group / session you train each day.)
2. **Workout log** — entries: date, workout name, notes, done? Sub-areas tag each as **Gym / Calisthenics / Other**.

**Done when (from PRD §8):** both sub-features persist across a hard refresh, and log entries are tagged Gym/Calisthenics/Other. Verified on the deployed app, then committed and pushed. Two DoDs in sequence — finish and verify the split before starting the log.

## Kickoff prompt (paste as first message)

> New session. Read CLAUDE.md, PRD.md, SECURITY.md, FUTURE.md, SESSION_11.md and SESSION_12.md fully. We are on **Step 12 of the PRD build plan: Fitness — weekly split + workout log.** Step 12 is **not** on the fable-mode list — but the migration + RLS work is security-critical, so invoke `fable-mode` for the schema/RLS increments and any debugging that fails twice.
> Enter plan mode and propose the plan for **two sub-steps, sequenced:**
> - **Confirm the schema first, against the DB.** PRD §6 drafts `workout_split (id, user_id, day_of_week, workout_name)` and `workout_logs (id, user_id, log_date, workout_name, notes, completed)`. Read the live table list via MCP; these two do not exist yet. Decide: is the sub-area (Gym/Calisthenics/Other) a column on `workout_logs` (a CHECK-constrained `area text`) or on both tables? PRD §4.6 says "Sub-areas: Gym, Calisthenics, Other" under Fitness — decide where it lives and say why. `day_of_week` is `smallint 0–6` with a CHECK, exactly like `timetable_slots`. `completed` is boolean. `log_date` is a raw `yyyy-mm-dd` (Law 3).
> - **Both tables born with `user_id` + RLS in the same DDL** (Law 4), 4 per-command policies on `authenticated` with `(select auth.uid()) = user_id`, mirroring the template proven **nine times**. **Neither table has a parent FK** (workout_name is free text, not an FK to the split) — so **no child-table EXISTS rule applies here**; both take the standard 4 policies. If the plan instead makes `workout_logs` reference `workout_split`, then the child-table ownership rule DOES apply — call that out explicitly and don't ship the weak form. Default: no FK between them, they're independent.
> - **One migration for both tables** (they're independent — no FK ordering concern), needing the **MCP lock dance**. Re-lock after (SECURITY.md Step 3); never write-probe the lock.
> - **Adversarial RLS gate.** `workout_split` and `workout_logs` are the **10th and 11th** RLS tables. Extend the git-ignored `scripts/rls-test.mjs` (the harness already covers 9 tables): both directions, R/U/D → 0 rows, cross-owner INSERT with a forced `user_id` rejected (42501). Two throwaway `+alias` accounts (rate-limited email — space signups out); MCP ground truth = 0 attacker rows; cleanup in the dashboard SQL editor.
> - **Reuse the proven slice pattern:** `use{WorkoutSplit,WorkoutLog}` hooks shaped like `useTimetable`/`useTasks` (optimistic writes, `resyncAfterError`, `useSession`, D1 guard — gate controls on `status === "ready"`). A `components/fitness/` folder split by sub-feature, thin `FitnessSection.tsx` composing them — the exact shape `AcademicsSection` used. The split table renders Mon-first from the same weekday constant; the log is a dated list with a done checkbox + area tag, due/overdue not relevant (it's a log of the past). Reuse `lib/dates.ts`, `lib/formatDate.ts`, `GlowCard` soft variant, the shared field/button classes. Keep every file under ~200 lines (Law 1).
> - **Law 3:** `log_date` is raw `yyyy-mm-dd` from the date input (default `getTodayIST()`); `day_of_week` is an int, not a date. No `new Date()` maths.
> Work in two verified sub-steps (split schema+RLS+UI → log), committing after each. End of session: commit, push, and I'll confirm both persist live on Vercel.

## Before starting (2 min)
- [ ] **Did you take the usage pause?** If not, reconsider starting (see top of file).
- [ ] Open VS Code at `C:\dev\Personal Life OS`.
- [ ] **Confirm Step 11 closed clean:** SESSION_11.md records commit `2a39c77`, 100/100 tests, RLS 62/62, and owner-verified Academics live.
- [ ] Have the Supabase dashboard and the Vercel URL handy (https://life-os-lac-tau.vercel.app/).
- [ ] Know the **MCP lock dance** and the **adversarial RLS gate** (both new tables) are coming. Space out the throwaway signups — free-tier email is rate-limited.

## Session rules (unchanged)
- One step only (two sub-steps — finish each before the next). New ideas → FUTURE.md.
- Approve read-only commands quickly; read write/install commands fully.
- Two failed fixes = wrong diagnosis → invoke fable-mode.
- Never end the session without commit + push.

## Explicitly NOT this step (guard against scope creep)
- **No exercise library, no sets/reps/weight tracking, no PRs/progression charts** — PRD §4.6 is split + log + done + area tag, nothing more. Detailed lift tracking is a classic scope-creep trap → FUTURE.md.
- **No rest timer** — Pomodoro already exists; don't duplicate it into Fitness.
- **No gamification / analytics** — post-v1.
- **Don't fix the D1 race in Goals/Tasks**, **don't lift hooks into a provider** (decision F) — FUTURE.md.

## Notes carried over from Step 11
- **Nine migrations / nine RLS tables exist** (`life_areas`, `goals`, `tasks`, `habits`, `habit_checks`, `journal_entries`, `courses`, `assignments`, `timetable_slots`). None to re-apply. This step adds workout_split + workout_logs (10th/11th).
- **The slice pattern is proven nine times.** `useTimetable` is the closest structural match for `workout_split` (day-of-week + free-text, no parent FK, no life_areas); copy its shape. `workout_logs` is a dated list, closest to a simplified `useJournal`/`useTasks`.
- **`lib/` helpers to reuse:** `getTodayIST`/`addDaysISO`/`diffDaysISO`, `formatISODate` — all pure and tested (100 cases). `WEEKDAYS` constant + Mon-first `DISPLAY_ORDER` live in `components/academics/types.ts` / `WeeklyTimetable.tsx` — consider lifting the weekday constant to `lib/` if Fitness reuses it (a third use), rather than a fourth copy.
- **Child-table ownership rule** (SECURITY.md, Step 7): only applies if a table has a parent FK. **Default plan has neither Fitness table referencing the other**, so it does not apply — but if the plan adds an FK, it does; call it out.
- **RLS gate is per-table**; the test scores 23505 as a FAIL only where a unique/parent constraint is involved. Neither Fitness table has one by default, so a forced-`user_id` INSERT should reject with 42501 outright.
- **Law 1 watch-list:** `useHabits.ts` **185**, `AcademicsSection.tsx` **166**. Fitness must build in `components/fitness/` split by sub-feature; keep `FitnessSection` thin.
- **MCP read-only lock is USER-ASSERTED, not observed** — re-verify only via a write you actually intend to make, never a probe.
- **Parked, do not re-chase:** leaked-password WARN (Pro-gated), `npm audit` 2 moderate (never `npm audit fix --force`), custom SMTP before multi-user, `tasks.area_id` still nullable, D1 backfill for Goals/Tasks, decision-F provider lift.
- **Env/deploy unchanged:** anon key client-safe, service-role never ships, push to `main` auto-deploys.
- **Windows gotchas** ([[windows-dev-loop-gotchas]]): kill node via PowerShell, not bash `pkill`; stop the dev server before `npm run build`. The localhost hydration warning is the Grammarly extension ([[grammarly-hydration-warning-not-ours]]) — don't "fix" it.
- **Verification bar:** predict results before looking at the UI; confirm persistence + the area tag against real rows via MCP. "It renders" is not "it persisted."

## Step 12 — COMPLETE (2026-07-22) · commit `c8a1962`

**Decisions locked this session** (asked before building):
- **F1 — the Gym/Calisthenics/Other tag lives on `workout_logs` only** (CHECK-constrained `area`). It describes the session actually done, a property of a log entry, not a recurring split slot.
- **F2 — `workout_logs.completed` defaults to `true`.** You log a workout because it happened; the checkbox records a skipped session.
- **F3 — no FK between the two tables.** So the SECURITY.md child-table `EXISTS` rule does NOT apply — both take the standard 4 policies.

**Migration `create_fitness_split_and_logs`** — `workout_split` (10th RLS table), `workout_logs` (11th). Verified by read-back, not the success flag: 8 standard policies, both `user_id` NOT NULL, `day_of_week` + `area` CHECKs, `completed` default true, RLS on both, indexes present, advisors clean bar the accepted leaked-password WARN.

**RLS gate — PASSED 82/82** (41 per direction, **all 11 RLS tables**). Both Fitness tables rejected forced-`user_id` INSERTs with **42501** — clean policy rejections, as expected since neither has a unique/parent constraint to mask the result. MCP ground truth: **0 attacker rows**, and `log_date` written as the correct IST date (2026-07-22, rolled from the 21st). Throwaways `+rlsG`/`+rlsH` cleaned up; DB back to 1 user.

**Two slices** in `components/fitness/`, mirroring `useTimetable` (split) and `useJournal` (log): `useWorkoutSplit` + `SplitForm` + `WeeklySplit` (Mon-first); `useWorkoutLog` (newest-first) + `LogForm` (date defaults to `getTodayIST()`, area select, done) + `WorkoutLogList` (area pill + done checkbox). `FitnessSection` composes both — 100 lines, under the cap.

**Refactor (third-use lift):** `WEEKDAYS` was duplicated in `academics/types.ts` and `today/TodayDate.tsx`; lifted to **`lib/weekdays.ts`** (`WEEKDAYS` + Mon-first `WEEK_DISPLAY_ORDER`) with vitest coverage. `academics/types.ts` re-exports it so existing imports kept working; `WeeklyTimetable` + `TodayDate` repointed. No behaviour change — confirmed by the build staying green.

**Verification actually performed:**
- **103/103 vitest** (adds 3 `weekdays`); `npm run build` clean; deployed bundle scanned for the Step 12 markers **and** secret-shaped strings (clean); no `new Date()` maths / no `transition-all` in the fitness folder.
- **Owner-verified live**, then **re-confirmed at the data layer via MCP** (area + done are column-value claims): the split row is `day_of_week=1 → "Push"`; the log row is `pushups`, **area `Calisthenics`**, `completed=false` (the toggle wrote through), `log_date=2026-07-22`. The tag and done-state persisted to the real columns, not just the render.

**Live DB state at close:** 1 user · 5 life_areas · 1 habit · 9 habit_checks · 2 journal_entries · 3 tasks · 3 goals · 1 course · 1 assignment · 0 timetable_slots · **1 workout_split · 1 workout_log**.

**v1 is now feature-complete** — all of PRD §4's sections exist and persist behind auth. Only Step 13 (finishing touches) remains.

**Carried into Step 13:** MCP read-only lock is user-asserted (re-verify only via an intended write); D1 race in Goals/Tasks and the decision-F provider lift still parked in FUTURE.md; `tasks.area_id` still nullable.

**After both sub-steps pass: stop. Step 13 (finishing touches — empty/loading states, the JSON data-export button, responsive/mobile pass, polish) is the FINAL v1 step — after it, v1 is done.**
