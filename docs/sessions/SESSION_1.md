# SESSION_1.md — Step 1: Design System + GlowCard (the app gets its face)

**Goal:** black theme, fonts, the signature GlowCard component, sidebar with smooth-scroll, and empty skeletons for every section.
**Done when (from PRD §8):** all sections are scroll-navigable via the sidebar, and the GlowCard matches the mood of the reference images. Verified by *looking at the rendered page*, then committed, pushed, and confirmed live on Vercel.

## Before starting (2 min)
- [ ] Open VS Code at `C:\dev\Personal Life OS` (NOT the old OneDrive path if it appears in Open Recent)
- [ ] Claude Code: model **Opus**, default effort (this is a design/layout step, not hard logic)
- [ ] Have the Vercel URL handy for the end-of-session check: https://life-os-lac-tau.vercel.app/

## Session rules (unchanged)
- One step only. New ideas → FUTURE.md.
- Approve read-only commands quickly; read write/install commands fully.
- Two failed fixes = wrong diagnosis → invoke fable-mode.
- Never end the session without commit + push.

## Notes carried over from Step 0
- Supabase MCP is read-only by design; flip `read_only=true` off only at Step 3 (schema work), then consider flipping it back.
- `/mcp` and other slash commands go in Claude Code's chat/terminal session — not PowerShell.
- "Command not recognized" ladder: new terminal → restart VS Code → actually not installed.
- The screenshot/browser MCP (for visual self-verification) is scheduled to join around this phase — optional; ask Claude Code to set it up only if the manual look-and-check loop feels slow.

**After DoD passes: stop. Step 2 (Goals section with local-state CRUD) is the next session's quest.**
