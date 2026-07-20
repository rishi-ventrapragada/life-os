# SESSION_8.md — Step 8: Habit streaks (current + max) + the GitHub-style monthly grid — computed, not stored

**Goal:** turn the `habit_checks` rows Step 7 creates into the two things PRD §4.3 promises but Step 7 deliberately withheld: **current streak + max streak** per habit, and a **GitHub-style monthly completion grid**. This is a *computation* step, not a schema step — **no new tables, no new columns, no migration, no MCP write access**. Everything renders from rows that already exist. The one piece of new foundation is **date arithmetic in `lib/dates.ts`** (`getTodayIST()` alone can't express "yesterday" or "how many days between"), built test-first exactly like Step 4.
**Done when (from PRD §8):** streak and max-streak are **correct across gaps and month edges**, and the grid **renders the current IST month**. Verified by vitest covering the nasty cases (leap year, month/year boundaries, gap resets, single-day streak, max-streak strictly in the past) **and** by using the deployed app with real checks, then committed, pushed, and confirmed live on Vercel.

## Kickoff prompt (paste as first message)

> New session. Read CLAUDE.md, PRD.md, SECURITY.md, FUTURE.md, SESSION_7.md and SESSION_8.md fully. We are on **Step 8 of the PRD build plan: habit streaks (current + max) + the monthly completion grid.** This step is **on the fable-mode list** — apply the `fable-mode` skill.
> Enter plan mode and propose the plan for:
> - **Date arithmetic in `lib/dates.ts`, built and tested BEFORE any streak code** (AUDIT_1 §6 names this the single likeliest future Law-3 violation — ad-hoc `new Date()` math inside streak logic). Add pure `yyyy-mm-dd` string helpers, e.g. `addDaysISO(date, n)` and `diffDaysISO(a, b)`, implemented via `Date.UTC` on the split parts so they never touch local time. **Test cases to pin (vitest, mirroring `lib/dates.test.ts`'s injected-instant style):** leap year (2028-02-29 exists, 2027-02-29 doesn't), 30/31-day month edges, year boundary, and `diffDaysISO("2026-03-01","2026-02-28")` in both a leap and a non-leap year. `npm test` green before a single line of streak code.
> - **Streak semantics decided and written down BEFORE coding, because the edge case is a judgement call, not a bug:** a current streak whose last check is **yesterday** while **today is still unchecked** should almost certainly still count — today isn't over in IST. Decide it explicitly, record the decision in this file, and test that exact case, plus: single-day streak, gap resets to 0, streak spanning a month boundary, max-streak strictly in the past (max > current), and archived-habit behaviour.
> - **Streak math as a pure function in `lib/`, not inside a component** — `(sortedCheckDates, todayIST) => { current, max }`, with vitest coverage. Components render; they don't compute. **Never** round-trip a `check_date` through `new Date(dateString)` (local-time parsing corrupts it) — compare and step the strings.
> - **The monthly grid renders the current IST month derived from `getTodayIST()`** (its first 7 chars give `yyyy-mm`), never from the browser clock. GitHub-style: one cell per day, filled = checked. Reuse the design system — `GlowCard` soft variant, purple accent, hover + focus-visible + active on anything interactive, animate only `transform`/`opacity`, never `transition-all`.
> - **Data layer: extend, don't duplicate.** Step 7's `useHabits` fetches only *today's* checks (`check_date = getTodayIST()`); streaks and the grid need a **wider window**. Decide the fetch shape deliberately — full history vs. a bounded window (e.g. current month + enough trailing days to resolve the current streak) — and say which, and why, before building. Keep the `components/habits/` files under the ~200-line cap (Law 1); `useHabits.ts` is already 168 lines, so **plan the split up front** rather than growing it (`habitsData.ts` is the natural home for query + mapping logic).
> - **Law 4 / SECURITY.md unchanged but re-checked:** no new tables means no new policies, but confirm the wider `habit_checks` fetch still returns only the owner's rows (RLS already proves this — don't re-run the full adversarial matrix; Step 7 closed that gate at 22/22).
> Work in small increments (date helpers + tests → streak function + tests → wire into the hook → grid UI → verify live). End of session: commit, push, and I'll confirm streaks + grid live on Vercel.

## Before starting (2 min)
- [ ] Open VS Code at `C:\dev\Personal Life OS`.
- [ ] **Confirm Step 7's behavioral DoD actually passed.** If SESSION_7's RESUME-HERE still lists it as the remaining gate, **finish that first** — Step 8 computes from rows Step 7 must be proven to write correctly. Never start step N+1 with step N's Done list unchecked (PRD §8).
- [ ] Have the Supabase dashboard open (table editor) and the Vercel URL handy (https://life-os-lac-tau.vercel.app/).
- [ ] Create a few days of **real** `habit_checks` history before judging the UI — a streak feature tested only against today's single row proves nothing. Backdated rows can be inserted from the dashboard SQL editor for testing (they're your own rows).
- [ ] Step 8 **is on the fable-mode list** — apply `fable-mode`. The date arithmetic and the streak edge cases are where this step goes wrong; slow down there.
- [ ] **No MCP lock dance this step** — there is no migration. MCP stays `read_only=true` throughout, used only for reading ground truth.

## Session rules (unchanged)
- One step only. New ideas → FUTURE.md.
- Approve read-only commands quickly; read write/install commands fully.
- Two failed fixes = wrong diagnosis → invoke fable-mode.
- Never end the session without commit + push.

## Explicitly NOT this step (guard against scope creep)
- **The Today section is Step 9**, not this one. Step 9 assembles habits-due + tasks-due/overdue + journal line + week indicator. Build only streaks and the grid here — but note Step 9's week-progress indicator will reuse the date helpers this step creates, which is another reason to build them properly rather than inline.
- **No gamification.** XP/ranks/quests computed from streaks are the post-v1 arc (FUTURE.md); a streak number on a card is not a licence to start it.
- **No new tables or columns.** If streaks feel like they'd be "easier as a stored column", that's the trap — a stored streak desyncs from the rows the moment anything backdates or archives. Compute from `habit_checks`, which is why Step 7 built it that way.
- **Don't re-run the full adversarial RLS matrix.** Step 7 closed it at 22/22 on both tables. No new table = no new gate.

## Notes carried over from Step 7
- **Step 7 shipped three migrations:** `20260720122754 create_habits_and_habit_checks`, `20260720122759 harden_tasks_user_id_and_indexes`, `20260720125059 harden_habit_checks_insert_and_archive_column`. All applied and verified — **do not re-apply any of them.**
- **Decision A (live, verified):** `habit_checks` INSERT policy verifies **habit ownership** via `EXISTS (habits h WHERE h.id = habit_id AND h.user_id = auth.uid())`, not just `user_id = auth.uid()`. Generalized into SECURITY.md as law for every future child table. The RLS matrix proved it with a **42501** rejection (not 23505 — a unique violation would have meant the row was *accepted* and merely collided).
- **Decision B (live, verified):** habits archive via **`archived_at timestamptz NULL`** (NULL = active), *not* `is_archived`. Every active query filters `archived_at IS NULL`. **Archiving never deletes `habit_checks`** — precisely so this step's streak history survives. Decide and record what an archived habit's streak should display (it still has history; it just isn't in the active list).
- **The `habit_checks` shape streaks read:** `(id, user_id, habit_id, check_date date, created_at)` with `unique (habit_id, check_date)` and `habit_id → habits ON DELETE CASCADE`. `check_date` is the raw `yyyy-mm-dd` from `getTodayIST()` — sorted lexicographically it is chronological, which is what makes string-based streak math correct.
- **`components/habits/` as it stands:** `types.ts` (21), `habitsData.ts` (55, pure query/mapping helpers), `useHabits.ts` (168), `HabitForm.tsx` (74), `HabitCard.tsx` (90) + `components/sections/HabitsSection.tsx` (90). `HabitCard` is where a streak badge and the grid will land — it's at 90 lines, so a `HabitGrid.tsx` sibling is likely cleaner than growing the card.
- **D1 guard pattern (keep it):** `useHabits.addHabit`/`updateHabit` resolve the area id and **hard-bail** with a real message if it's missing, instead of writing an `area_id: null` orphan; the section gates the add control and the checkbox on `status === "ready"`. Any new write path this step adds must keep that discipline. **Goals/Tasks still carry the unguarded version** — recorded in FUTURE.md, still not this step's job.
- **MCP read-only lock is USER-ASSERTED, not observed** (SESSION_7). Read-only status isn't observable from the tool list; the only reliable signal is a write being rejected. This step needs no writes, so leave it locked and don't probe it — a write probe is what left a junk migration row last session.
- **Parked, accepted for v1 (do not re-chase):** Leaked Password Protection (Pro-gated WARN), `npm audit` 2 moderate (never `npm audit fix --force` — it downgrades Next), custom SMTP before multi-user, `tasks.area_id` still nullable (FUTURE.md, next migration window).
- **Date law (Law 3):** `getTodayIST()` in `lib/dates.ts`, 9 vitest edge tests in `lib/dates.test.ts` (`npm test`). This step *extends* that file — same discipline: injected instants, no reliance on "now", no local-time parsing.
- **Env/deploy unchanged:** `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel; anon key client-safe; service-role key never ships. Push to `main` auto-deploys.
- **Windows gotchas** ([[windows-dev-loop-gotchas]]): kill node via PowerShell (`Get-Process node | Stop-Process -Force`), not bash `pkill`; stop the dev server before `npm run build` (shared `.next`). The localhost React hydration warning is the **Grammarly extension**, not app code ([[grammarly-hydration-warning-not-ours]]) — don't "fix" it. The **behavioral** evidence (a real multi-day streak displaying correctly, the grid showing the right filled days) is what counts, not "should work."

## Step 8 — COMPLETE (2026-07-20) · commit `dc474da`

**Decisions locked this session** (asked before building, not discovered after):
- **D1 — current streak counts the unbroken run ending YESTERDAY when today is unchecked.** Checks on 17/18/19 with today unchecked ⇒ **3**, not 4 and not 0. The value is the run's real length: it never optimistically includes an unchecked today (which would force the number to *drop* at IST midnight — a streak that decreases while you do nothing reads as a bug), and never zeroes a live streak just because the day is young.
- **D2 — archived habits render nowhere.** The active list already filters `archived_at IS NULL`; no streak or grid is computed for them. Their `habit_checks` history stays in the DB for a future archived view (out of scope).
- **D3 — test history came from user-run backdated SQL** in the dashboard editor. **MCP stayed `read_only=true` the whole session — no unlock, no lock dance, no write probe.**

**Date arithmetic (`lib/dates.ts`) — built test-first, before any streak code.** AUDIT_1 §6 named ad-hoc `new Date()` math inside streak logic as the likeliest future Law-3 violation, so the 25 tests were written and **observed failing** (functions undefined, the 9 original `getTodayIST` tests still green) *before* implementing. `addDaysISO`/`diffDaysISO` split the `yyyy-mm-dd` string and go through **`Date.UTC`** — never `new Date(dateString)`, whose parsing is inconsistent (bare dates UTC, date-times local) and would shift dates in some timezones. Pinned: leap year (`2028-02-29` exists, 2027 has none), 30/31-day edges, year rollover, negative/zero steps, and the pair that catches leap-year bugs — `diffDaysISO("2026-03-01","2026-02-28")` = **1** vs `("2028-03-01","2028-02-28")` = **2**.

**Streak math (`lib/streaks.ts`)** — `computeStreaks(checkDates, todayIST)`, pure, in `lib/` not a component. Sorts/dedupes (ISO dates sort chronologically), walks with `diffDaysISO`, and ignores future-dated rows so a stray row can't inflate the number. 16 tests: gap resets, month/year/leap boundaries, max strictly in the past, unsorted input, duplicates, caller-array immutability.

**Data layer — widened, not duplicated.** The check fetch went from today-only to a **365-day trailing window** (`HISTORY_WINDOW_DAYS` in `habitsData.ts`): current-month-only would truncate a long streak, unbounded history grows forever. `Habit` gained `checkDates`, and **`checkedToday` is now derived from that same array** so the checkbox and the streak cannot disagree. `toggleToday` moves `checkDates` optimistically, so badge and grid update with the checkbox; `resyncAfterError` still corrects any lie. **No policy change was needed** — the widened query runs under the same JWT, so RLS scopes it to the owner; the Step 7 matrix (22/22) was not re-run, correctly.

**UI** — streak badge on `HabitCard.tsx` (104 lines); **`HabitGrid.tsx` (52) its own file from the start**. The grid derives its month from `getTodayIST().slice(0,7)` — never the browser clock — and month length from `Date.UTC(y, m, 0)`, so February and leap years need no lookup table. Future days are styled distinctly from missed ones (otherwise a fresh month reads as a wall of failure). Cells are presentational: today is the only writable day and the checkbox already owns it.

**Verification actually performed:**
- **53/53 vitest pass** (34 dates + 16 streaks + 3 real-data).
- **The prediction test:** current=3 / max=5 was stated **before** the backdated rows were pasted, then the 8 real rows were read back via MCP and the **shipped** `computeStreaks` produced exactly that. Pinned in `lib/streaks.realdata.test.ts` against real rows, not a fixture — a refactor that breaks the live numbers now fails in the test run, not in the app.
- `npm run build` clean; deployed bundle scanned and confirmed carrying the Step 8 strings.
- **Behavioral DoD confirmed live by the owner:** streaks, the July grid, `best`, and hard-refresh persistence all correct, no errors.

**Live DB state at close:** 9 `habit_checks` rows for the Coding habit — `2026-06-28..07-02` (5) and `2026-07-17..07-20` (4). The owner's check-today test left `2026-07-20` in place, so the app now shows a genuine **current 4 / best 5**. Not test residue to clean: they are real rows and Step 9 can use them.

**Law 1 at close:** `useHabits.ts` 185, `HabitCard.tsx` 104, `habitsData.ts` 81, `HabitForm.tsx` 74, `HabitGrid.tsx` 52, `types.ts` 27; `lib/`: `streaks.ts` 58, `dates.ts` 50. All under the ~200 cap, but **`useHabits.ts` at 185 is the one to watch** — Step 9 should not grow it.

**Carried into Step 9:** the D1 add-before-ready race still unfixed in `GoalsSection`/`TasksSection` (FUTURE.md, recipe recorded); `tasks.area_id` still nullable (next migration window); **MCP read-only lock remains user-asserted, never observed** — re-verify only via a write you actually intend to make.

**After DoD passes: stop. Step 9 (the Today section — the daily check-in that assembles habits due + tasks due/overdue + journal quick-line + week indicator) is the next session's quest.**
