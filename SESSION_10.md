# SESSION_10.md — Step 10: Journal (list view) + Pomodoro — the last step before the usage pause

**Goal:** finish the two remaining v1 sections. **Journal** (PRD §4.7): one entry per IST day, listed newest-first, editable — the table and today's write path already exist from Step 9, so this step is the **list + edit view**, not a new slice. **Pomodoro** (PRD §4.8): a 25/5 timer widget, **frontend only, no database**.
**Done when (from PRD §8):** one entry per IST day, editable; the timer runs 25/5 accurately. Verified by actually using the deployed app — write an entry, edit it, confirm a second entry for the same day is impossible; run the timer through a work→break transition — then committed, pushed, and confirmed live on Vercel.

> **Scope note carried from Step 9 (decision J):** `journal_entries` was created in Step 9 (migration `20260720180647`) so Today's check-in could include its journal line. **This step is therefore smaller than the PRD implies — most likely NO migration at all.** Verify the table's shape via MCP before assuming anything about it.

## Kickoff prompt (paste as first message)

> New session. Read CLAUDE.md, PRD.md, SECURITY.md, FUTURE.md, SESSION_9.md and SESSION_10.md fully. We are on **Step 10 of the PRD build plan: Journal (list view) + Pomodoro.** Step 10 is **not** on the fable-mode list (steps 3,4,5,7,8,9 are) — but invoke `fable-mode` if any debugging fails twice.
> Enter plan mode and propose the plan for:
> - **First, verify what already exists — don't rebuild it.** `journal_entries` was created in Step 9 with `user_id` + RLS (4 policies) + `unique (user_id, entry_date)`; `components/today/useJournalToday.ts` already reads/writes **today's** row via an upsert on that constraint. Read both via MCP and on disk, then say plainly whether this step needs a migration at all (it probably doesn't) and how much of `useJournalToday` the list view can reuse vs. what genuinely needs a new hook (fetching *many* days, editing a *past* day).
> - **Journal list view.** Entries newest-first by `entry_date`. Decide and state: does editing a past day happen inline in the list, or only today's entry? Is there a delete? (PRD §4.7 says "one text entry per day, listed newest-first" — editing is in the Step 10 DoD; delete is not mentioned, so don't invent it.) Whatever the list writes must keep using the unique constraint as the source of truth, exactly as Step 9 does.
> - **Pomodoro is frontend-only — and Law 3 has a specific trap here.** A 25/5 timer is a *duration* counter, not a calendar date, so `getTodayIST()` does not apply. But CLAUDE.md forbids "custom clocks/counters" in the *date* sense — the rule exists to stop ad-hoc date maths, not to ban a timer. **Say this out loud in the plan** and implement the timer the correct way regardless: derive remaining time from a stored end-timestamp and `Date.now()` deltas rather than decrementing a counter every tick, because `setInterval` drifts and pauses in background tabs. No database (PRD §4.8), so no table, no RLS, no migration.
> - **Law 1 up front.** `components/journal/` and `components/pomodoro/` folders, each file well under ~200 lines, with thin `JournalSection.tsx` / `PomodoroSection.tsx` composing them — the Step 9 pattern that worked. Do not grow `useJournalToday.ts` (95 lines) into a general-purpose journal hook if a separate one is cleaner.
> - **Design system:** grid/list cards use the `GlowCard` **`soft`** variant (`strong` is reserved for Today's hero card). Every interactive element gets hover + focus-visible + active; animate only `transform`/`opacity`; **never** `transition-all`. The timer's display must not jitter — use tabular numerals.
> - **No new RLS gate unless a table is born.** `journal_entries` already passed the adversarial matrix in Step 9 (32/32, both directions, cross-owner INSERT rejected 42501). Pomodoro has no table. So unless the plan creates something new, **do not re-run the matrix** — and do not create throwaway accounts for nothing.
> Work in small increments (verify what exists → journal list + edit → Pomodoro timer → verify live). End of session: commit, push, and I'll confirm one-entry-per-day + the 25/5 timer live on Vercel.

## Before starting (2 min)
- [ ] Open VS Code at `C:\dev\Personal Life OS`.
- [ ] **Confirm Step 9 closed clean:** SESSION_9.md records commits `d0cec73`/`5fdd83e`/`a4c79e8`, 77/77 tests, RLS 32/32, and owner-verified live check-in. Never start step N+1 with step N unchecked (PRD §8).
- [ ] Have the Supabase dashboard and the Vercel URL handy (https://life-os-lac-tau.vercel.app/).
- [ ] **Real data exists:** 1 journal entry (2026-07-20), 1 habit + 9 checks, 3 tasks, 3 goals. **Write journal entries on 2–3 different days before judging the list** — a one-row list proves nothing about ordering.
- [ ] **MCP should stay `read_only=true` all session** unless the plan proves a migration is needed. The lock is **user-asserted, not observed** — never write-probe it.

## Session rules (unchanged)
- One step only. New ideas → FUTURE.md.
- Approve read-only commands quickly; read write/install commands fully.
- Two failed fixes = wrong diagnosis → invoke fable-mode.
- Never end the session without commit + push.

## Explicitly NOT this step (guard against scope creep)
- **Academics (Step 11) and Fitness (Step 12).** After this step comes the **planned usage pause** (PRD §8: live with the app 1–2 weeks before 11–12) — resist rolling straight on.
- **No Pomodoro persistence.** PRD §4.8 says frontend only. Session history, stats, or a `pomodoro_sessions` table are FUTURE.md, not this step.
- **No gamification, no charts, no analytics** — post-v1 (PRD §11).
- **Don't fix the D1 race in Goals/Tasks** and **don't lift the hooks into a provider** (decision F) — both recorded in FUTURE.md with recipes; neither is this step's job unless the stale-until-refresh behaviour actually blocks the DoD.

## Notes carried over from Step 9
- **`journal_entries` already exists** (migration `20260720180647`): `id`, `user_id` NOT NULL default `auth.uid()`, `entry_date date NOT NULL`, `content text NOT NULL`, `created_at`, `unique (user_id, entry_date)`, `journal_entries_user_id_idx`, RLS on with the 4 standard policies. **Do not re-create or re-apply it.**
- **`useJournalToday.ts` (95 lines)** already does today's read + upsert-on-conflict. The list view needs a *wider* fetch and possibly past-day edits — decide whether that's a new hook or a widened one, deliberately.
- **The upsert pattern is proven:** saving twice in a day edits rather than duplicating (verified via MCP at Step 9 close — exactly 1 row after multiple saves). Keep the DB constraint as the source of truth.
- **`lib/` is the home for logic:** `dates.ts` (`getTodayIST`, `addDaysISO`, `diffDaysISO`), `streaks.ts`, `due.ts`, `week.ts` — all pure and tested (77 cases). Any non-trivial maths this step needs goes there with vitest coverage, not into a component.
- **Law 1 watch-list:** `useHabits.ts` **185**, `TodaySection.tsx` 92, `useJournalToday.ts` 95, `HabitCard.tsx` 104. Nothing may cross ~200.
- **Decision F trade-off is live:** Today mounts its own hook instances, so sections don't cross-update until refresh. If the journal list and Today's line disagree on screen, **that's this known issue, not a new bug** — check FUTURE.md before "fixing" it.
- **Parked, do not re-chase:** leaked-password WARN (Pro-gated), `npm audit` 2 moderate (never `npm audit fix --force` — it downgrades Next), custom SMTP before multi-user, `tasks.area_id` still nullable, D1 backfill for Goals/Tasks.
- **Env/deploy unchanged:** `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel; anon key client-safe; service-role key never ships. Push to `main` auto-deploys.
- **Windows gotchas** ([[windows-dev-loop-gotchas]]): kill node via PowerShell (`Get-Process node | Stop-Process -Force`), not bash `pkill`; stop the dev server before `npm run build` (shared `.next`). The localhost React hydration warning is the **Grammarly extension** ([[grammarly-hydration-warning-not-ours]]) — don't "fix" it.
- **Verification bar (what Steps 8 and 9 proved works):** predict the expected result *before* looking at the UI, then confirm against real rows via MCP. For the timer, "it counts down" is not evidence it's *accurate* — check it against wall-clock elapsed time, and check what happens after the tab has been backgrounded.

**After DoD passes: stop — and take the PRD's planned usage pause (§8: live with the app 1–2 weeks) before Step 11 (Academics). Steps 11–13 should be re-prioritised by what daily use actually reveals.**
