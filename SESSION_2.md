# SESSION_2.md — Step 2: Goals Section UI + Local-State CRUD (learn the pattern)

**Goal:** the Goals section becomes real — add, edit, and delete goal cards (title, life area, optional deadline) with a manual 0–100% progress slider. Data lives in React local state only; nothing persists yet.
**Done when (from PRD §8):** add/edit/delete goal cards works and the progress bar slider works — data NOT yet persistent (a refresh wiping goals is correct behavior this step). Verified by *using the rendered page*, then committed, pushed, and confirmed live on Vercel.

## Kickoff prompt (paste as first message)

> New session. Read CLAUDE.md and PRD.md fully. We are on **Step 2 of the PRD build plan: Goals section UI with local-state CRUD.**
> Enter plan mode and propose the plan for:
> - Goal cards inside GoalsSection: title, life area, optional deadline, manual progress bar (0–100%, I set the value)
> - Add / edit / delete, all in local React state — NO Supabase wiring (that's Step 3), no persistence
> - Use the existing GlowCard (soft variant) and design system; keep GoalsSection under ~200 lines — propose a split into subcomponents (form, card) as needed
> Work in small increments and verify by using the rendered page, not by assuming. End of session: commit, push, and I'll confirm the live Vercel URL.

## Before starting (2 min)
- [ ] Open VS Code at `C:\dev\Personal Life OS` (NOT the old OneDrive path if it appears in Open Recent)
- [ ] Claude Code: model **Opus**, default effort (Step 2 is not on the fable-mode list — it's a UI/CRUD learning step)
- [ ] Have the Vercel URL handy for the end-of-session check: https://life-os-lac-tau.vercel.app/

## Session rules (unchanged)
- One step only. New ideas → FUTURE.md.
- Approve read-only commands quickly; read write/install commands fully.
- Two failed fixes = wrong diagnosis → invoke fable-mode.
- Never end the session without commit + push.

## Notes carried over from Step 1
- **GlowCard API:** `glow="soft"` (default, grid-safe — glows never bleed into 16px gutters) | `glow="strong"` (full bloom, heroes only — Today keeps the single strong card). Goal cards in a grid = soft.
- **Animation law in practice:** glow states live on `::before`/`::after` pseudo-elements and crossfade via opacity — never transition `box-shadow` or use `transition-all`. The pattern is in `app/globals.css`; reuse it, don't reinvent it.
- **GlowCard is presentational.** Its focus ring is defined but inert (a div takes no focus). When goal cards get buttons/inputs this step, the interactive elements go *inside* the card — don't add tabIndex to the card itself.
- **Life areas aren't in the database yet** (they're seeded at Step 5). For Step 2, the five fixed names — Academics, Fitness, Coding, Content Creation, Personal Finance — can be a local constant.
- **No date logic yet:** `lib/dates.ts` / `getTodayIST()` is Step 4. The deadline field this step is just a value you set; no due-date comparisons.
- Supabase MCP stays **read-only** until Step 3 (verified working this session: correct project ref, zero tables, writes rejected).
- Windows gotcha: if styles look stale or a port is haunted, kill node via PowerShell (`Get-Process node | Stop-Process -Force`) — bash `pkill` doesn't work. Claude has this in memory; hold it to it.
- Claude self-verifies visually with headless Chrome + playwright-core from its scratchpad — no browser MCP setup needed yet.

**After DoD passes: stop. Step 3 (wire Goals to Supabase — first schema work, read-only comes OFF) is the next session's quest.**
