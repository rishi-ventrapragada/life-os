# STEP_0.md — Launch Checklist (do these in order)

**Goal:** "Hello World" live at your Vercel URL. That's the ONLY goal today.
**Done when:** you open the Vercel URL in your browser and see the page, and `.env` is NOT visible in your GitHub repo.

## Before touching Claude Code (10–15 min, manual)
- [ ] Fix the skill filename if not done: `.claude/skills/fable-mode/SKILL.md` (exactly — no double `.md`)
- [ ] Install Node.js LTS from nodejs.org → verify: `node -v` in terminal
- [ ] Install Git from git-scm.com → verify: `git -v`
- [ ] Create a GitHub account (if none) and one empty private repo (pick your name — even `life-os`)
- [ ] Create a Supabase account at supabase.com → create one new project (free tier) → note the Project ID from project settings
- [ ] Create a Vercel account at vercel.com (sign in with GitHub — easiest)

## Then, in Claude Code (Opus, default effort, Plan Mode)
Paste this as your first message:

> Read CLAUDE.md and PRD.md fully. We are on Step 0 of the PRD build plan.
> Enter plan mode and propose the exact sequence to:
> 1. git init this folder, create a proper .gitignore (must include .env*) BEFORE anything else, and connect it to my GitHub repo
> 2. Scaffold Next.js (App Router) + Tailwind in this folder
> 3. Connect the Supabase MCP server, scoped to my project ID
> 4. Connect the repo to Vercel so pushes auto-deploy
> 5. Verify Hello World loads at the Vercel URL
> Wait for my approval before executing anything. Guide me through any parts I must do manually (account authorizations, dashboard clicks) one at a time.

## Rules for the session (from CLAUDE.md — enforce them)
- Approve the plan BEFORE any execution
- Approve each Supabase MCP tool call individually (keep approvals ON)
- Never paste keys into the chat; Claude reads them from .env
- Commit when Hello World deploys — that's commit #1
- Any new feature idea today → FUTURE.md, not the session

## If something breaks
- Read the error out loud to Claude Code and ask it to diagnose before fixing
- Two failed fixes on the same problem = stop, invoke fable-mode, question the diagnosis
- Nothing today is irreversible: worst case, delete the folder and restart Step 0

**After the URL loads: stop. Step 0 is done. Step 1 (design system + GlowCard) is tomorrow's quest.**
