# SESSION_4.md — Step 4: `getTodayIST()` + midnight edge-case tests (the only clock the app will ever have)

**Goal:** create `lib/dates.ts` with `getTodayIST()` — the calendar date in Asia/Kolkata — and prove it correct with automated tests around the midnight boundary. Per Architecture Law 3 this becomes the single source of ALL date logic (habit checks, streaks, journal days, due-date comparisons in later steps).
**Done when (from PRD §8):** utility returns the correct IST date; edge tests pass. Then committed, pushed, and the live Vercel URL still works (no visible UI change this step — "live" just means the deploy didn't break).

## Kickoff prompt (paste as first message)

> New session. Read CLAUDE.md, PRD.md, and SESSION_4.md fully. We are on **Step 4 of the PRD build plan: `lib/dates.ts` + `getTodayIST()` with midnight edge-case tests.**
> Enter plan mode and propose the plan for:
> - `lib/dates.ts` exporting `getTodayIST()`: the calendar date ("yyyy-mm-dd") in Asia/Kolkata, derived timezone-correctly (e.g. `Intl.DateTimeFormat` with `timeZone: "Asia/Kolkata"`) — never raw `new Date()` date-strings, never UTC, never a custom clock/counter (Law 3)
> - A test runner (none exists yet — propose one, npm registry only per SECURITY.md) and edge tests that pin the IST boundary: IST = UTC+5:30, so 18:29 UTC vs 18:31 UTC must yield *different* IST dates; include month and year rollovers (e.g. Dec 31 → Jan 1) and note IST has no DST to trip on
> - Tests must inject the instant (pass a `Date`/use fake timers) — a test that only checks "now" proves nothing about midnight
> Work in small increments; the DoD is watching the edge tests fail for the right reason first, then pass. End of session: commit, push, confirm the Vercel deploy still loads.

## Before starting (2 min)
- [ ] Open VS Code at `C:\dev\Personal Life OS` (NOT the old OneDrive path if it appears in Open Recent)
- [ ] Claude Code: Step 4 **is on the fable-mode list** — invoke the skill with the plan
- [ ] Vercel URL handy: https://life-os-lac-tau.vercel.app/ (Supabase dashboard not needed — no schema work this step)

## Session rules (unchanged)
- One step only. New ideas → FUTURE.md.
- Approve read-only commands quickly; read write/install commands fully.
- Two failed fixes = wrong diagnosis → invoke fable-mode.
- Never end the session without commit + push.

## Notes carried over from Step 3
- **Supabase MCP is locked `read_only=true` and stays that way** — Step 4 touches no schema (no tables, no Supabase calls at all). The re-lock lands with the next step that needs writes, not by default.
- **Stray anonymous users on prod are accepted until Step 5** (Solo verification runs added 3+ already; each carries 5 seeded `life_areas` rows via the `on delete cascade` FK). Don't share the URL around; Step 5's login gate ends it and they get cleaned from the dashboard then.
- **Step 5 reminder from the advisors:** the two accepted "Anonymous Access Policies" WARNs on `life_areas`/`goals` get revisited at Step 5 (add an `is_anonymous` exclusion once real accounts exist).
- **`GoalCard.formatDeadline` stays pure string formatting** — deadlines remain display-only until due-date *comparisons* arrive (Today section, Step 9). Step 4 builds the utility those comparisons will use; it does NOT retrofit GoalCard.
- **A test runner is a new dev dependency** — npm registry only, per SECURITY.md. `npm audit`'s 2 moderate pre-existing findings (Next's bundled postcss) stay parked as the pre-v2 audit item.
- **The data layer files are `lib/bootstrap.ts` + `components/goals/useGoals.ts`** (not the once-planned `lib/goals.ts`) — future wiring steps should extend that pattern.
- Windows gotchas: kill node via PowerShell (`Get-Process node | Stop-Process -Force`), not bash `pkill`; stop the dev server before `npm run build` (shared `.next`); if styles look stale, diff the *served* CSS against disk before re-editing.
- Claude self-verifies with headless Chrome + `playwright-core` installed in its session scratchpad (worked through Steps 2–3); for this step the primary evidence is the test run output, not the browser.

**After DoD passes: stop. Step 5 (Supabase Auth: email/password login, adversarial RLS testing with two real accounts, seed-on-first-login, anon-user cleanup) is the next session's quest.**
