# SESSION_9.md — Step 9: the Today section — the daily check-in, assembled from what already exists

**Goal:** build the **Today** section (PRD §4.1) — the landing section and the reason the app exists: a complete daily check-in in under 2 minutes without scrolling anywhere else. It contains, and *only* contains: (a) today's IST date; (b) **all active habits with today's checkbox**; (c) **tasks due today or overdue**; (d) a **one-line journal quick-entry**; (e) a **small week-progress indicator**. This is primarily a *composition* step — Habits (Step 7/8) and Tasks (Step 6) already own their data layers, and Today should reuse them rather than open new queries.
**Done when (from PRD §8):** a full daily check-in is possible **without leaving the section** — check off habits, see and complete what's due, write the day's journal line — verified by actually doing a real check-in on the deployed app, then committed, pushed, and confirmed live on Vercel.

## Kickoff prompt (paste as first message)

> New session. Read CLAUDE.md, PRD.md, SECURITY.md, FUTURE.md, SESSION_8.md and SESSION_9.md fully. We are on **Step 9 of the PRD build plan: the Today section — the daily check-in.** This step is **on the fable-mode list** — apply the `fable-mode` skill.
> Enter plan mode and propose the plan for:
> - **Decide the journal question FIRST, because it decides whether this step needs a migration.** PRD §4.1 puts a one-line journal quick-entry in Today, but `journal_entries` is **Step 10's table and does not exist yet** (verify via MCP, don't assume). Three honest options: (a) create `journal_entries` here — it's the table Step 10 needs anyway, born with `user_id` + RLS + `unique(user_id, entry_date)` in the same DDL, which pulls a migration and the **MCP lock dance** into this step; (b) ship Today without the journal line and add it in Step 10 when the table lands; (c) shrink Step 10 to just Pomodoro. **Recommend one and say why** — do not quietly skip a PRD §4.1 element, and do not quietly expand scope either.
> - **Compose the existing hooks; do not write parallel queries.** `useHabits()` already returns active habits with `checkedToday` + `checkDates` + `toggleToday`; `useTasks()` already returns tasks with due dates and status. Today should reuse them so a habit checked in Today updates Habits and vice versa. **Watch for double-fetching** — if both sections mount their own hook instance the app fetches everything twice; decide deliberately whether that's acceptable for v1 or whether the hook needs lifting/sharing, and say which.
> - **Due/overdue is the comparison TaskCard already proves** — a lexicographic string compare of the stored `yyyy-mm-dd` against `getTodayIST()` ([components/tasks/TaskCard.tsx](components/tasks/TaskCard.tsx) `dueLabel`). Reuse that logic rather than re-deriving it; if it needs to be shared, lift it to `lib/` with tests rather than copy-pasting a second copy.
> - **The week-progress indicator needs the Step 8 date helpers** — `addDaysISO`/`diffDaysISO` in [lib/dates.ts](lib/dates.ts) already exist and are tested (53/53 green). **Define precisely what "week progress" means before building it** (which 7 days: trailing 7 from today, or Mon–Sun of the current IST week? what fraction: habits checked / habits × days?) and put any non-trivial maths in `lib/` with vitest coverage, not inside the component — same discipline as `lib/streaks.ts`.
> - **Law 1 is the real risk this step.** Today aggregates four features and is the likeliest file in the project to breach ~200 lines. **Plan the split up front** — a `components/today/` folder with small pieces (e.g. `TodayHabits.tsx`, `TodayTasks.tsx`, `TodayJournalLine.tsx`, `WeekProgress.tsx`) composed by a thin `TodaySection.tsx` — rather than growing one file and splitting later. Note `useHabits.ts` is already **185 lines**: do not grow it.
> - **Design:** `TodaySection` currently uses the `GlowCard` **`strong`** glow variant (it's the hero/standalone card — grid cards use `soft`). Keep that distinction. Hover + focus-visible + active on every interactive element; animate only `transform`/`opacity`; **never** `transition-all`.
> - **D1 guard applies to any new write path** — gate controls on `status === "ready"` and resolve ids before inserting, exactly as `useHabits` does. Do not clone the unguarded Goals/Tasks add-path.
> Work in small increments (decide journal → compose habits+tasks into Today → due/overdue → week indicator → journal line → verify live). End of session: commit, push, and I'll confirm a real daily check-in works live on Vercel.

## Before starting (2 min)
- [ ] Open VS Code at `C:\dev\Personal Life OS`.
- [ ] **Confirm Step 8 closed clean:** SESSION_8.md's close-out records commit `dc474da`, 53/53 tests, and owner-verified streaks/grid/refresh live. Never start step N+1 with step N unchecked (PRD §8).
- [ ] Have the Supabase dashboard and the Vercel URL handy (https://life-os-lac-tau.vercel.app/).
- [ ] **Real data already exists** for a meaningful Today section: 1 habit ("Coding") with 9 `habit_checks` rows (Jun 28–Jul 2, Jul 17–20), 3 goals, 1 task. Add a task due **today** and one **overdue** before judging the due/overdue list — an empty list proves nothing.
- [ ] Step 9 **is on the fable-mode list** — apply `fable-mode`. The composition/double-fetch decision and the Law 1 split are where this step goes wrong.
- [ ] **Whether the MCP lock dance is needed depends entirely on the journal decision** — if `journal_entries` is created here, plan for it; if not, MCP stays `read_only=true` all session.

## Session rules (unchanged)
- One step only. New ideas → FUTURE.md.
- Approve read-only commands quickly; read write/install commands fully.
- Two failed fixes = wrong diagnosis → invoke fable-mode.
- Never end the session without commit + push.

## Explicitly NOT this step (guard against scope creep)
- **Academics (Step 11), Fitness (Step 12), Pomodoro (Step 10).** Today surfaces habits, tasks, a journal line and a week indicator — nothing else. PRD §4.1 is an exhaustive list, not a starting point.
- **No charts or analytics.** A week-progress *indicator* is a small bar/dots, not a graph — charts are post-v1 (PRD §11).
- **No gamification** (XP for completing the day) — FUTURE.md.
- **No re-running the adversarial RLS matrix** unless a new table is created. If `journal_entries` is born this step, it re-runs the matrix as the 6th RLS table (per-table gate, SECURITY.md) — including the **child-table ownership rule** if it gains any child.
- **Don't fix the D1 race in Goals/Tasks** — recorded in FUTURE.md with a working recipe; still not this step's job.

## Notes carried over from Step 8
- **Step 8 shipped no migrations.** MCP stayed `read_only=true` the entire session. The DB is unchanged since Step 7's three migrations (`20260720122754`, `20260720122759`, `20260720125059`) — **do not re-apply any of them.**
- **`lib/dates.ts` now exports `getTodayIST`, `addDaysISO`, `diffDaysISO`** — all tested (34 cases). Any new date logic uses these; **never** `new Date(dateString)` (local-time parsing) and never a custom clock (Law 3).
- **`lib/streaks.ts` — `computeStreaks(checkDates, todayIST)`** is pure and tested (16 cases). If Today shows a streak anywhere, call this; don't recompute.
- **Decision D1 (Step 8): a run ending yesterday still counts as the current streak** — today isn't over in IST. Any Today-section streak display must agree with `HabitCard`, which it will if it calls the same function.
- **`lib/streaks.realdata.test.ts` pins the ACTUAL DB rows** (current/max for the Coding habit). If a future change alters the fetch window or the mapping, that test is the tripwire — read it before "fixing" it.
- **`Habit` carries `checkDates: string[]`** (a 365-day trailing window, `HISTORY_WINDOW_DAYS` in `habitsData.ts`) and **`checkedToday` is derived from it**, so they can never disagree. Preserve that invariant.
- **Law 1 watch-list:** `useHabits.ts` **185**, `HabitCard.tsx` 104, `habitsData.ts` 81. Today must not push any of these over ~200 — build in `components/today/` instead.
- **MCP read-only lock is USER-ASSERTED, not observed** — read-only status isn't visible in the tool list, and the only reliable signal is a write being rejected. **Never write-probe it** (that left a junk migration row in Step 7). If this step needs a write, the intended migration itself is the test.
- **Parked, do not re-chase:** leaked-password WARN (Pro-gated), `npm audit` 2 moderate (never `npm audit fix --force` — it downgrades Next), custom SMTP before multi-user, `tasks.area_id` still nullable (next migration window), D1 backfill for Goals/Tasks.
- **Env/deploy unchanged:** `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel; anon key client-safe; service-role key never ships. Push to `main` auto-deploys.
- **Windows gotchas** ([[windows-dev-loop-gotchas]]): kill node via PowerShell (`Get-Process node | Stop-Process -Force`), not bash `pkill`; stop the dev server before `npm run build` (shared `.next`). The localhost React hydration warning is the **Grammarly extension**, not app code ([[grammarly-hydration-warning-not-ours]]) — don't "fix" it.
- **Verification bar (what Step 8 proved works):** predict the expected result *before* looking at the UI, then check the real rows via MCP and compare. "It renders" is not evidence that the numbers are right.

## Step 9 — COMPLETE (2026-07-20) · commits `d0cec73`, `5fdd83e`, `a4c79e8`

**Decisions locked this session** (asked before building, not discovered after):
- **J — `journal_entries` created here, as a full vertical slice.** Verified via MCP first that it genuinely didn't exist (5 tables, no journal). It's Step 10's table anyway, and building it now is what let Today's DoD — *a full check-in without leaving the section* — be honestly met instead of shipping PRD §4.1 minus one element. **Step 10 therefore shrinks to the journal LIST view + Pomodoro.**
- **F — accept the double-fetch for v1.** Today mounts its own `useHabits()`/`useTasks()` instances. Known consequence, stated not hidden: the sections hold independent state, so a habit checked in Today doesn't visibly update the Habits section until refresh. Recorded in FUTURE.md with the concrete fix (lift into a provider) and the trigger for doing it.
- **W — week progress = trailing 7 days**, `checks ÷ (habits × 7)`. A trailing window is always full, so it never looks artificially bad on a Monday the way a Mon–Sun calendar week would.

**Migration `20260720180647 create_journal_entries`** — the **6th RLS table**, born correct per Law 4 with RLS in the same DDL. Verified by read-back, not by the success flag: 4/4 policies on `authenticated` matching the template, `user_id` NOT NULL, `unique (user_id, entry_date)`, 3 indexes, `relrowsecurity = true`, advisors clean apart from the accepted Pro-gated leaked-password WARN.

**S1 RLS gate — PASSED 32/32** on `habits` + `habit_checks` + `journal_entries`, both directions. The journal cross-owner INSERT was rejected with **42501 in both directions**. That distinction was the point: because `journal_entries` carries `unique(user_id, entry_date)` and both throwaways had written today's entry, a **23505 was coded as a FAIL** — a duplicate error would have meant RLS *accepted* the forced row and only the constraint caught it. Same trap Decision A exposed in Step 7. MCP ground truth confirmed **0 attacker rows** landed. Throwaways `+rlsC`/`+rlsD` cleaned up afterwards; DB back to 1 user / 5 areas / 1 habit / 9 checks.

**Shared, not copied:** `dueLabel` was lifted out of `TaskCard` (where it was module-private) into **`lib/due.ts`**, now taking `today` as a parameter so it's pure and testable. Today and Tasks share one implementation and cannot disagree about what "overdue" means. **`lib/week.ts`** holds the week maths — pure, in `lib/`, never in a component.

**Law 1 handled by splitting up front, not refactoring after:** `components/today/` = `TodayDate` 21, `WeekProgress` 48, `TodayHabits` 70, `TodayTasks` 79, `useJournalToday` 95, composed by a 92-line `TodaySection` keeping the `strong` GlowCard hero variant. `useHabits.ts` was not touched (still 185).

**Verification actually performed:**
- **77/77 vitest** (34 dates + 16 streaks + 3 streak-realdata + 11 due + 10 week + 3 week-realdata); `npm run build` clean; deployed bundle scanned for all six Step 9 markers **and** for service-role/secret-shaped strings (clean).
- **Predict-then-check, twice.** Week progress was predicted at **4/7 = 57%** from the real rows before any UI existed, then confirmed. The due-list contents were predicted per-task by due date (`test` → Overdue, `record vid` → Due today, `CM LAB` → absent) before the owner looked.
- **A wrong prediction, caught and recorded:** my first draft of `week.realdata.test.ts` asserted the score would drop to 3/7 on 2026-07-21. It doesn't — only the 14th leaves that window, so 17/18/19/20 all remain at 4/7. **The function was right and my expectation was wrong; the test was corrected, not the code**, and a further case pins the real drop on the 24th. That is exactly what a real-data pin is for.
- **Behavioral DoD confirmed live by the owner, then re-confirmed at the data layer via MCP** (the claim was about rows, so rendering alone wasn't enough): `journal_entries` holds **exactly one** row for `entry_date = 2026-07-20` after multiple saves — the upsert on the unique constraint edits rather than duplicating — and `record vid` flipped to `status = "Done"` from Today, with the other two tasks untouched.

**Live DB state at close:** 1 user · 5 life_areas · 1 habit · 9 habit_checks · 1 journal_entry · 3 tasks (1 Done) · 3 goals.

**Carried into Step 10:** decision F's stale-until-refresh trade-off (FUTURE.md); the D1 add-before-ready race still unfixed in `GoalsSection`/`TasksSection` (FUTURE.md, recipe recorded); `tasks.area_id` still nullable (next migration window); **MCP read-only lock remains user-asserted, never observed** — re-verify only via a write you actually intend to make, never a probe.

**After DoD passes: stop. Step 10 (Journal list view + Pomodoro — note the table already exists, so this step may need no migration at all) is the next session's quest — and the PRD's planned usage pause after Step 10 (live with the app 1–2 weeks before Steps 11–12) starts there.**
