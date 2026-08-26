# SESSION_11.md — Step 11: Academics — courses → assignments → timetable (three sub-steps)

> **Read this first — the usage pause.** PRD §8 puts a deliberate pause *before* this step: "**live with the app 1–2 weeks** before steps 11–12 to let reality reorder priorities." v1's daily-use core (Today, Goals, Habits, Tasks, Journal, Pomodoro, Auth) is complete as of Step 10. **Do not start Step 11 the day after Step 10.** Use the app first; then let what actually hurt in daily use decide whether Academics is even the right next step, or whether something from FUTURE.md / a rough edge you hit should jump the queue. If you're reading this right after finishing Step 10, the correct move is usually to close the laptop.

**Goal:** the Academics section (PRD §4.5) — the largest section in v1, and explicitly **three sub-steps, each CRUD-complete and persistent before the next begins**:
1. **Courses** — cards: name, assignments done/total, next exam date.
2. **Assignments** — list: course, title, due date, status. (FK to courses.)
3. **Timetable** — a weekly table (day-of-week → time-label → subject), editable.

**Done when (from PRD §8):** each of the three sub-features is CRUD-complete and persists across a hard refresh, verified on the deployed app, then committed and pushed. This is really **three DoDs in sequence** — finish and verify courses before starting assignments, assignments before timetable.

## Kickoff prompt (paste as first message)

> New session. Read CLAUDE.md, PRD.md, SECURITY.md, FUTURE.md, SESSION_10.md and SESSION_11.md fully. We are on **Step 11 of the PRD build plan: Academics — courses, assignments, timetable.** Step 11 is **not** on the fable-mode list — but it is the **largest step in v1** (three tables, three slices) and the migration + RLS work is security-critical, so invoke `fable-mode` for the schema/RLS increments and for any debugging that fails twice.
> Enter plan mode and propose the plan for **three sub-steps, sequenced — do not build all three at once:**
> - **Confirm the schema first, against the DB, before writing any migration.** PRD §6 drafts `courses (id, user_id, name, next_exam_date?)`, `assignments (id, user_id, course_id, title, due_date, status)`, `timetable_slots (id, user_id, day_of_week, time_label, subject)`. Read the live table list via MCP; these three do not exist yet. Decide the real column types (e.g. `assignments.status` CHECK values — reuse the Tasks status set or define its own?), and whether `assignments.course_id` is **ON DELETE CASCADE** (deleting a course clears its assignments — probably yes, mirroring `habit_checks`→`habits`) while the `user_id` FKs stay non-cascade.
> - **Each table is born with `user_id` + RLS in the same DDL** (Law 4, SECURITY.md Step 3), 4 per-command policies on `authenticated` with `(select auth.uid()) = user_id`, mirroring the template proven six times. **`assignments` is a child of `courses`** — so by the SECURITY.md child-table rule added in Step 7, its INSERT policy must verify **parent ownership** via `EXISTS (courses c WHERE c.id = assignments.course_id AND c.user_id = auth.uid())`, not just `user_id = auth.uid()`. Do not ship the weak user-id-only form. `timetable_slots` has no parent table, so it takes the standard 4 policies.
> - **The migrations need the MCP lock dance** (write access). Prefer **one migration per sub-step** so each ships and is RLS-tested before the next, OR one migration for all three if the plan argues it's cleaner and lower-risk — say which and why. Re-lock after (SECURITY.md Step 3), and never write-probe the lock.
> - **Adversarial RLS gate per new table.** `courses`, `assignments`, `timetable_slots` are the **7th, 8th and 9th** RLS tables. Extend the git-ignored `scripts/rls-test.mjs` for each: both directions, R/U/D → 0 rows, cross-owner INSERT rejected — and for `assignments`, the **foreign-parent INSERT** (a row referencing a course the attacker doesn't own, with their own honest user_id) must be rejected, exactly the Decision-A case Step 7 established. Two throwaway `+alias` accounts (rate-limited email); cleanup in the dashboard SQL editor, children before parents.
> - **Reuse the proven slice pattern per sub-feature:** a `use{Courses,Assignments,Timetable}` hook shaped like `useTasks`/`useHabits` (optimistic writes, `resyncAfterError`, `useSession`, D1 guard — resolve FK ids before insert, gate controls on `status === "ready"`), a `components/academics/` folder split by sub-feature, thin `AcademicsSection.tsx` composing them. Assignments done/total on a course card is a **derived count** from assignments rows, never a stored column (same discipline as habit streaks). Reuse `lib/dates.ts`, `lib/due.ts`, `lib/formatDate.ts`, `GlowCard` soft variant, the shared field/button classes. Keep every file under ~200 lines (Law 1) — `AcademicsSection` composing three sub-features is a Law-1 risk, so plan the split up front.
> - **Law 3:** `next_exam_date` and `due_date` are raw `yyyy-mm-dd`; any "next exam" / overdue comparison goes through `getTodayIST()` and `lib/due.ts`. `day_of_week` is an enum/int, not a date. No `new Date()` maths.
> Work in three verified sub-steps (courses schema+RLS+UI → assignments → timetable), committing after each. End of session: commit, push, and I'll confirm each sub-feature persists live on Vercel.

## Before starting (2 min)
- [ ] **Did you actually take the usage pause?** If not, reconsider starting (see the top of this file).
- [ ] Open VS Code at `C:\dev\Personal Life OS`.
- [ ] **Confirm Step 10 closed clean:** SESSION_10.md records commit `dcb791f`, 95/95 tests, and owner-verified journal + timer live, with the one-per-day guarantee confirmed via MCP.
- [ ] Have the Supabase dashboard and the Vercel URL handy (https://life-os-lac-tau.vercel.app/).
- [ ] Know the **MCP lock dance** is coming (three tables need write access), and the **adversarial RLS gate** applies to all three new tables. Free-tier auth email is rate-limited — space out the throwaway signups.

## Session rules (unchanged)
- One step only (but this step is three sub-steps — finish each before the next). New ideas → FUTURE.md.
- Approve read-only commands quickly; read write/install commands fully.
- Two failed fixes = wrong diagnosis → invoke fable-mode.
- Never end the session without commit + push.

## Explicitly NOT this step (guard against scope creep)
- **Fitness is Step 12.** Don't build the workout split/log here even though it's structurally similar.
- **No grades/GPA, no attendance, no analytics** — none are in PRD §4.5 (name, done/total, exam date, timetable). If the itch appears → FUTURE.md.
- **No calendar view** of assignments/exams — post-v1 (PRD §11). A due-date list is in scope; a month grid is not.
- **Don't fix the D1 race in Goals/Tasks**, **don't lift hooks into a provider** (decision F) — FUTURE.md, both with recipes.

## Notes carried over from Step 10
- **Six migrations exist** (`20260717121030` … `20260720180647`). None to re-apply. This step adds courses/assignments/timetable.
- **The child-table ownership rule is now law** (SECURITY.md, added Step 7): any INSERT policy on a table with a parent FK must verify parent ownership via `EXISTS`, not just `user_id`. **`assignments` is the first table since `habit_checks` to trigger it** — get it right at birth and prove it with the foreign-parent INSERT test.
- **The slice pattern is proven six times** (`goals`, `tasks`, `habits`, `journal`): bootstrap-await where areas are involved, optimistic writes + `resyncAfterError`, `useSession` for the user id, D1 guard (resolve ids before insert, gate on ready). Courses/assignments don't use `life_areas`, so they don't need `ensureAreasSeeded` — but assignments DO need the course-id resolved before insert, same guard shape.
- **`lib/` helpers to reuse:** `getTodayIST`/`addDaysISO`/`diffDaysISO` (dates), `dueLabel` (due.ts), `formatISODate` (formatDate.ts) — all pure and tested (95 cases). Derived counts (assignments done/total) computed like streaks: a pure function of the rows, not a stored column.
- **Law 1 watch-list:** `useHabits.ts` **185** is the closest to the cap. Academics must build in `components/academics/` split by sub-feature — a single AcademicsSection composing three features is the likeliest new Law-1 breach; plan the split first.
- **RLS gate is per-table** and the test scores 23505 as a FAIL where a unique/parent constraint is involved (a duplicate/constraint error would mean RLS *accepted* the row) — only a real policy rejection (42501 / "violates row-level security policy") passes. Same discipline as Steps 7 and 9.
- **MCP read-only lock is USER-ASSERTED, not observed** — re-verify only via a write you actually intend to make, never a probe (that left a junk migration row in Step 7, since cleaned up).
- **Parked, do not re-chase:** leaked-password WARN (Pro-gated), `npm audit` 2 moderate (never `npm audit fix --force`), custom SMTP before multi-user, `tasks.area_id` still nullable (fold into this migration window if convenient — it's the same kind of NOT NULL tidy-up, but only if it doesn't complicate the Academics migrations; otherwise leave it), D1 backfill for Goals/Tasks, decision-F provider lift.
- **Env/deploy unchanged:** anon key client-safe, service-role never ships, push to `main` auto-deploys.
- **Windows gotchas** ([[windows-dev-loop-gotchas]]): kill node via PowerShell, not bash `pkill`; stop the dev server before `npm run build`. The localhost hydration warning is the Grammarly extension ([[grammarly-hydration-warning-not-ours]]) — don't "fix" it.
- **Verification bar:** predict expected results before looking at the UI; confirm derived counts and persistence against real rows via MCP. "It renders" is not "the count is right."

## Step 11 — COMPLETE (2026-07-21) · commit `2a39c77`

**Decisions locked this session** (asked before building):
- **D1 — `assignments.status` = `Pending / Done`** (2-state, CHECK-constrained). Course "done/total" is a count of `Done`, computed from rows.
- **D2 — one migration, all three tables** (FK order courses → assignments → timetable_slots). One unlock window; the RLS gate ran once across all three.
- **D3 — timetable = row-per-slot** `(day_of_week 0–6, time_label, subject)`, rendered Mon-first, grouped by day.

**Migration `create_academics_courses_assignments_timetable`** — courses (7th RLS table), assignments (8th, child of courses), timetable_slots (9th). Verified by read-back, not the success flag: **12 policies**, all `user_id` NOT NULL, `assignments.status` + `day_of_week` CHECKs, `course_id → courses ON DELETE CASCADE` with `user_id` FKs non-cascade, 4 FK/user_id indexes, RLS on all three, advisors clean bar the accepted leaked-password WARN. **The `assignments` INSERT policy carries the parent-ownership `EXISTS` on courses** (SECURITY.md child-table rule from Step 7) — not the weak user-id-only form.

**RLS gate — PASSED 62/62** (31 per direction, all six RLS tables). The parent-ownership case — attacker inserts an assignment referencing the **victim's course** with their **own honest** `user_id` — was rejected with **42501** in both directions. 23505 was coded as a FAIL per the house rule; here no unique constraint even applies, so a rejection could only be the policy. MCP ground truth confirmed **0 attacker rows** and **0 cross-owner assignments** (no row whose `user_id` differs from its course's owner). Throwaways `+rlsE`/`+rlsF` cleaned up; DB back to 1 user.

**Three slices** in `components/academics/`, mirroring the proven `useTasks`/`useGoals` shape (optimistic writes, `resyncAfterError`, `useSession`):
- **Courses** — `useCourses` (no `life_areas`, so no `ensureAreasSeeded`); deleting a course cascade-deletes its assignments.
- **Assignments** — `useAssignments` guards the parent: `addAssignment` resolves and verifies `course_id` against loaded courses before insert (the parent-ownership analogue of the D1 area-id guard). Done/total is a **pure count** in `lib/academics.ts` (`courseDoneTotal`), never a stored column — vitest-covered.
- **Timetable** — `useTimetable`; `WeeklyTimetable` renders Mon-first from a fixed constant array; `day_of_week` is an int, never `new Date()` (Law 3).
- `AcademicsSection` composes the three and holds the shared course/assignment hooks so done/total reads one source. **166 lines**, the largest file, under the ~200 cap (Law 1).

**Verification actually performed:**
- **100/100 vitest** (adds 5 `academics`); `npm run build` clean; deployed bundle scanned for the Step 11 markers **and** service-role/secret-shaped strings (clean); no `transition-all`; no `new Date()` maths.
- **Owner-verified live**, then **re-confirmed at the data layer via MCP**: after cleanup the DB holds 1 course (`Software Engineering`) + its 1 assignment (0/1) + 0 slots — real owner usage, **0 attacker/orphan rows**, and every assignment owned by its course. The cascade and done/total paths were exercised and the RLS gate proved the FK integrity directly.

**Live DB state at close:** 1 user · 5 life_areas · 1 habit · 9 habit_checks · 2 journal_entries · 3 tasks · 3 goals · **1 course · 1 assignment · 0 timetable_slots**.

**Carried into Step 12:** MCP read-only lock is user-asserted (re-verify only via an intended write); D1 race in Goals/Tasks and the decision-F provider lift still parked in FUTURE.md; `tasks.area_id` still nullable.

**After the three sub-steps pass: stop. Step 12 (Fitness — split table + workout log) is next, then Step 13 (finishing touches + data export + responsive pass). The usage pause applies again before 12.**
