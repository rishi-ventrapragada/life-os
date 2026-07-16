# SESSION_3.md — Step 3: Wire Goals to Supabase (persistence — the data starts surviving)

**Goal:** the Goals section keeps its data. Create the `life_areas` and `goals` tables via the Supabase MCP (with `user_id` + RLS from birth), wire GoalsSection's add/edit/delete/slider to the database, and retire local-only state.
**Done when (from PRD §8):** a goal survives a hard refresh and is visible in the Supabase table editor. Verified by *doing both*, then committed, pushed, and confirmed live on Vercel.

## Kickoff prompt (paste as first message)

> New session. Read CLAUDE.md, PRD.md, and SECURITY.md fully. We are on **Step 3 of the PRD build plan: wire Goals to Supabase (persistence).**
> Enter plan mode and propose the plan for:
> - First: flip `read_only=true` off in `.mcp.json` (per SECURITY.md this is temporary — it goes back on when schema work is done)
> - Create `life_areas` and `goals` tables via the Supabase MCP, each born with a `user_id` column and Row Level Security enabled per Architecture Law 4 — owner reads/writes own rows only, no table goes live without RLS
> - Wire GoalsSection CRUD (add / edit / delete / progress slider) to the database, replacing local-only state
> - Note: full RLS behavior testing with two real accounts lands at Step 5 — but tables are still born with RLS now
> Work in small increments and verify by using the rendered page and the Supabase table editor, not by assuming. End of session: commit, push, and I'll confirm the live Vercel URL.

## Before starting (2 min)
- [ ] Open VS Code at `C:\dev\Personal Life OS` (NOT the old OneDrive path if it appears in Open Recent)
- [ ] Claude Code: Step 3 **is on the fable-mode list** — invoke the skill with the plan
- [ ] Have the Supabase dashboard open (table editor + API keys page) and the Vercel URL handy: https://life-os-lac-tau.vercel.app/

## Session rules (unchanged)
- One step only. New ideas → FUTURE.md.
- Approve read-only commands quickly; read write/install commands fully.
- Two failed fixes = wrong diagnosis → invoke fable-mode.
- Never end the session without commit + push.

## Notes carried over from Step 2 + security pass
- **Re-enable `read_only=true` in `.mcp.json` after schema work is done** — SECURITY.md item; write access is for the duration of the schema work, then re-locked.
- **`.env` gets created this step** (it doesn't exist yet — nothing needed keys before now). Keys go in `.env` and Vercel env vars, never in chat or code. `.gitignore` already covers `.env` / `.env.*`; verify the file never shows in `git status`.
- **Anon vs service-role key:** the anon (publishable) key is safe in client code via `NEXT_PUBLIC_*` env vars; the **service-role key bypasses RLS and never ships to the client** — it shouldn't be needed this step at all.
- **Open question for the plan:** auth arrives at Step 5, so there's no logged-in user yet — the plan must say how `user_id` and owner-only RLS work in the meantime. Expect this to be the step's main design decision; don't let it silently weaken Law 4.
- **The wiring surface is ready:** GoalsSection owns all state and handlers (`addGoal` / `updateGoal` / `deleteGoal`); GoalCard and GoalForm are props-only. The `Goal` type in `components/goals/types.ts` mirrors the PRD draft schema (id, title, area, deadline "yyyy-mm-dd" | null, progress 0–100) so wiring should be rename-free.
- `supabase-js` is a new dependency — npm registry only, per SECURITY.md.
- Still no date logic: `lib/dates.ts` / `getTodayIST()` is Step 4. Deadline stays a display-only string.
- Windows gotcha: if styles look stale or a port is haunted, kill node via PowerShell (`Get-Process node | Stop-Process -Force`) — bash `pkill` doesn't work.
- Claude self-verifies visually with headless Chrome + playwright-core from its scratchpad (worked all through Step 2); persistence claims additionally need the Supabase table editor check.

**After DoD passes: stop. Step 4 (`getTodayIST()` + midnight edge-case tests) is the next session's quest.**
