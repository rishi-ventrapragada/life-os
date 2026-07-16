# CLAUDE.md — Personal Life OS (project law)

You are building a personal life-tracking web app for a beginner developer who reviews but does not hand-write code. Follow these rules in every session. When a rule here conflicts with your instinct, the rule wins. The full spec is in `PRD.md`; new ideas go to `FUTURE.md`, never into the current step.

## Session ritual
- Every session begins with the user stating the current build step (PRD §8). Work ONLY on that step.
- Use Plan Mode: propose a plan, wait for approval, then build.
- For steps 3, 4, 5, 7, 8, 9 and any debugging that fails twice: apply the `fable-mode` skill.
- Never modify files unrelated to the current step. Never delete substantive code without explicit approval.
- End of any working increment: run the step's Definition of Done, then `git commit`.

## Stack (fixed — do not substitute)
- Next.js (App Router) + React + Tailwind CSS (properly installed — NEVER the CDN `<script>` tag).
- Supabase for database + auth. Use the Supabase MCP server for schema work; it is project-scoped and every tool call is user-approved.
- Deployed on Vercel via git push. No other services without asking.

## Architecture laws
1. The app is ONE scrollable page composed of section components (`components/sections/TodaySection.tsx` etc.). Never build a single giant page file. Keep every component under ~200 lines; propose a split when approaching.
2. Build vertical slices: a feature's UI and its Supabase wiring ship together in the same step.
3. ALL date logic goes through `lib/dates.ts` → `getTodayIST()` (calendar date in Asia/Kolkata). Never use raw `new Date()` date-strings, never UTC dates, never build custom clocks/counters. Habit checks, streaks, journal days, and due-date comparisons all use IST dates.
4. Every table has `user_id` with Row Level Security: owner reads/writes own rows only. No exceptions, including "temporary" tables.
5. Layouts use flex/grid with fluid sizing. No fixed pixel widths on containers. Desktop-first, responsive-friendly.

## Security
- SECURITY.md is law. Its checklist items are part of every step's Definition of Done at the stage they apply to.
- `.env*` files are git-ignored (verify in Step 0 and never remove). Never print, log, or commit secrets. Never paste keys into code; read from environment variables.
- Supabase anon key in the client is fine; service-role key NEVER ships to the client.

## Design system
- Pure/near-black background, white/neutral-100 text, custom purple accent. NEVER default Tailwind indigo/blue as primary.
- Signature `GlowCard` component: dark surface, purple glow border via layered low-opacity color-tinted shadows. Never flat `shadow-md`.
- Font pairing: display font for headings (tight tracking), clean sans for body (line-height ~1.7).
- Every interactive element: hover + focus-visible + active states. Animate only `transform` and `opacity`. NEVER `transition-all`.
- Reference images in `/design-refs/` define the mood; match mood, do not clone content, do not add sections not in the PRD.

## Honesty & verification
- "Done" means the Definition of Done was executed and observed — not "should work."
- If a fix fails twice, stop patching: state the assumption being questioned and test it directly.
- Report what actually happened, including failures, with the real error output.
