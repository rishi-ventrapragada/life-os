# PRD — Personal Life OS (working name: "life-os")
**Version 1.0 · July 2026 · Author: You (planned with Claude)**
**Status: Planning complete → ready for build**

> Theme: *Solo Leveling.* This app is "The System" — the interface through which a D-rank hunter grinds daily quests until he becomes S-rank. v1 is unlocking the System. Gamification (ranks, XP) is a future arc.

---

## 1. Vision

A personal, Notion-inspired life dashboard: **one long scrollable web page** where the owner tracks every life area — habits, goals, tasks, academics, fitness, journaling — via **manual daily check-ins**. It exists to build consistency, expose weak points, and stop time-wasting. Built by a beginner, 100% AI-assisted (Claude Code), one small verified step at a time.

**Design north star:** the "Life Planner" Notion template aesthetic — full black background, glowing card components, dense but calm information layout — with elements from "Student Life OS" (academics) and "Health OS" (fitness) as sub-sections.

## 2. Users & Phases

| Phase | Users | Timing |
|---|---|---|
| v1 | Owner only (single account, login required) | Now |
| v2 | Friends can register and get their own private dashboards | After months of personal use |
| v3 | AI agent assists with organizing/tracking | Distant future |

## 3. Success Criteria for v1

1. Owner completes a daily check-in (habits + tasks) in under 2 minutes.
2. All data persists in Supabase and survives refresh/redeploy.
3. Every life-area section (below) is usable end-to-end on a laptop browser.
4. App is live on a Vercel URL from week 1 onward.
5. Zero features from the "NOT in v1" list snuck in.

## 4. Scope — v1 Features

Single scrollable page, sections top-to-bottom. Sidebar links smooth-scroll to each section.

1. **Today (landing section)** — the daily check-in. Contains, and only contains: (a) today's date (IST); (b) all active habits with today's checkbox; (c) tasks due today or overdue; (d) a one-line journal quick-entry; (e) small week-progress indicator. Everything actionable without scrolling elsewhere.
2. **Goals** — cards with title, life area, optional deadline, and a manual progress bar (0–100%, owner sets the value). Add / edit / delete.
3. **Habits** — per habit: name, life area, daily checkbox, current streak, max streak, monthly grid (GitHub-style) of completed days. Add / edit / archive.
4. **Tasks** — title, life area, due date, priority (Low/Med/High), status (Not started / In progress / Done). Filterable by status. Add / edit / delete.
5. **Academics** — course cards (name, assignments done/total, next exam date); assignment list (course, title, due date, status); weekly timetable table (editable).
6. **Fitness** — weekly workout split table (day → workout name); workout log (date, workout, notes, done?). Sub-areas: Gym, Calisthenics, Other.
7. **Journal** — one text entry per day, listed newest-first.
8. **Pomodoro** — 25/5 timer widget (frontend only, no database).
9. **Auth** — email/password login via Supabase Auth. All data is per-user (RLS).
10. **Seed data** — five life areas pre-created on first login: Academics, Fitness, Coding, Content Creation, Personal Finance (finance is a *category tag* in v1, not a module).

### NOT in v1 (printed here so future-you can't pretend otherwise)
Gamification/XP/ranks/rewards · Finance tracker module · Calendar month-view · Charts (radar/Wheel of Life, analytics) · Drag-and-drop dashboard customization · Eisenhower matrix · Notion-style arbitrary databases/blocks (option B) · Auto-computed goal pacing · Reminders/notifications · Multi-user/friends · AI agent · Mobile-responsive polish (built responsive-*friendly*, polished later) · Data export button (scheduled: finishing-touches phase, not v1 core).
**Rule:** every new idea mid-build goes into `FUTURE.md`. Never into the current step.

## 5. Tech Stack & Tooling

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js (App Router) + React + Tailwind CSS | Best AI-tool fluency; component model fits our file-per-section law |
| Backend/DB/Auth | Supabase (Postgres + Auth + RLS) | DB + login + hosting in one; free tier; trivial multi-user later |
| Hosting | Vercel | Free; auto-deploy on git push; live URL from week 1 |
| AI builder | Claude Code **in VS Code** | Fable plans/supervises, Opus builds, Sonnet small tasks |
| Method | Plan Mode every feature + `fable-mode` skill for medium/hard steps | Discipline layer |
| DB access for AI | **Supabase MCP server** — project-scoped, tool-call approvals ON | Claude creates tables/migrations/types itself |
| Safety net | Git commit after every working step; `.env` git-ignored from commit #1 | Undo button; no leaked keys |
| Later | Screenshot/browser MCP (design phase); custom slash commands | Not needed at start |

**Known platform facts:** free Supabase projects pause after ~1 week of zero activity — nothing is lost; restore from dashboard. Daily use is the keep-alive.

## 6. Architecture Laws

1. **One page, many files.** The page is a stack of section components: `TodaySection.tsx`, `GoalsSection.tsx`, `HabitsSection.tsx`, etc. No component file exceeds ~200 lines; split when approaching.
2. **Vertical slices.** Each feature = its UI + its database wiring together. Never "all UI first."
3. **IST is the only clock.** One utility, `getTodayIST()` (Asia/Kolkata calendar date), used by ALL date logic — check-ins, streaks, due dates. Building a custom clock/counter is forbidden; the fix is timezone-correct date reads, not new timekeeping.
4. **Every table has `user_id`** + Row Level Security ("owner sees own rows only") from creation.
5. **Responsive-friendly always:** flex/grid, no fixed pixel widths — even though v1 is desktop-first.

### Data model (draft — Claude Code refines via Supabase MCP)
- `life_areas` (id, user_id, name, sort_order)
- `goals` (id, user_id, area_id, title, progress_pct, deadline?, created_at)
- `habits` (id, user_id, area_id, name, archived_at, created_at)
- `habit_checks` (id, user_id, habit_id, check_date /*IST date*/) — unique (habit_id, check_date); streaks computed from rows
- `tasks` (id, user_id, area_id, title, due_date?, priority, status)
- `courses` (id, user_id, name, next_exam_date?) · `assignments` (id, user_id, course_id, title, due_date, status)
- `timetable_slots` (id, user_id, day_of_week, time_label, subject)
- `workout_split` (id, user_id, day_of_week, workout_name) · `workout_logs` (id, user_id, log_date, workout_name, notes, completed)
- `journal_entries` (id, user_id, entry_date, content) — unique (user_id, entry_date)

## 7. Design System (v1)

- **Background:** pure/near black. **Text:** white/neutral-100. **Accent:** custom purple (never default Tailwind indigo/blue).
- **Signature component:** `GlowCard` — dark card with purple glow border (layered, color-tinted shadows at low opacity; no flat `shadow-md`).
- Typography: display font for headings + clean sans for body; tight tracking on large headings, generous line-height on body.
- Every clickable element has hover, focus-visible, and active states. Animate only `transform`/`opacity`; never `transition-all`.
- Desktop-first layout; responsive-friendly construction (Law 5).
- Reference images: the six Notion screenshots live in `/design-refs/`; match the *mood*, don't clone content.

## 8. Build Plan — steps, in order, one per session

Each step ends with: **test against its Done list → git commit → push (auto-deploys) → next.**
Never start step N+1 with step N's Done list unchecked.

| # | Step | Definition of Done |
|---|---|---|
| 0 | Setup: Node, git, GitHub repo, VS Code + Claude Code, CLAUDE.md + fable-mode in repo, Next.js + Tailwind scaffold, Vercel connected, Supabase project + MCP connected, `.env` git-ignored | "Hello World" page visible at the Vercel URL; `.env` absent from GitHub |
| 1 | Design system: black theme, fonts, `GlowCard`, sidebar + empty section skeletons with smooth-scroll | All sections scroll-navigable; GlowCard matches reference mood |
| 2 | Goals section UI + local state (learn CRUD) | Add/edit/delete goal cards; progress bar slider works (data not yet persistent) |
| 3 | Wire Goals to Supabase (learn persistence; tables via MCP) | Goal survives hard refresh; visible in Supabase table editor |
| 4 | `getTodayIST()` utility + tests around midnight edge cases | Utility returns correct IST date; edge tests pass |
| 5 | Auth: Supabase email/password login; RLS on `life_areas` + `goals`; seed 5 life areas on first login | Logged-out users see login only; two test accounts can't see each other's goals |
| 6 | To-do/Tasks section (repeat the CRUD+persistence pattern solo) | Task CRUD persists; filter by status works |
| 7 | Habits: CRUD + daily checkbox + `habit_checks` | Checking today creates one row; unchecking removes it; unique per day; `habit_checks` INSERT policy verifies habit ownership (`EXISTS` on `habits`), not just `user_id`; habits archive via `archived_at` (NULL = active) with every active query filtering `archived_at IS NULL` and archiving never deleting checks; adversarial RLS matrix passes both directions on both tables including cross-owner INSERT and the foreign-habit check-insert |
| 8 | Habit streaks + monthly grid | Streak/max streak correct across gaps and month edges; grid renders current month |
| 9 | **Today section** (assembles habits due + tasks due/overdue + journal quick-line + week indicator) | Full daily check-in possible without leaving the section |
| 10 | Journal + Pomodoro | One entry per IST day, editable; timer runs 25/5 accurately |
| 11 | Academics: courses → assignments → timetable (three sub-steps) | Each sub-feature CRUD-complete and persistent |
| 12 | Fitness: split table → workout log (two sub-steps) | Both persistent; areas tagged Gym/Calisthenics/Other |
| 13 | Finishing touches: empty states, loading states, data-export button, responsive pass, polish | App usable on phone; export downloads all user data as JSON |

**Usage pause after step 10:** live with the app 1–2 weeks before steps 11–12 to let reality reorder priorities.

## 9. Working Rules (the process itself)

1. Start every session: state the current step number; enter Plan Mode; approve the plan before code.
2. Invoke `fable-mode` for medium/hard steps (3, 4, 5, 7, 8, 9) and any debugging spiral.
3. Two failed fixes = wrong diagnosis. Stop patching; question the assumption.
4. Claude never modifies files unrelated to the current step.
5. Commit after every working increment; push daily minimum.
6. New feature ideas → `FUTURE.md`, immediately, without discussion.
7. Verify at the layer of the claim: "it deployed" means you opened the Vercel URL and saw it.

## 10. Risks & Mitigations (from the audit)

| Risk | Mitigation |
|---|---|
| Monster-file trap (AI mangles giant files) | Architecture Law 1: component-per-section, ~200-line cap |
| Timezone/streak corruption | Law 3: `getTodayIST()` everywhere; Step 4 dedicated to it |
| Session amnesia / plan drift | CLAUDE.md as law; step-number ritual; Working Rule 4 |
| Deploy-day surprises | Deploy the empty skeleton in Step 0; deploy every step after |
| Secret leak | `.env` git-ignored in commit #1; keys never pasted into chat/code |
| Retrofitting auth | Auth at Step 5, before most tables exist |
| Supabase free-tier pause | Known + documented; restore via dashboard; export button in Step 13 |
| Scope creep | NOT-in-v1 list (§4) + FUTURE.md rule |
| Untrusted internet artifacts (skills/plugins/CLAUDE.md files) | Only trusted sources; review contents before enabling; no skill-finder/council plugins in v1 |

## 11. Future Roadmap (post-v1, in rough order)

1. Mobile-responsive polish (promoted if phone pain is high)
2. Gamification — "The System": XP, ranks (E→S), quests, rewards
3. Charts & analytics (Wheel of Life radar, trends)
4. Finance tracker module
5. Calendar month-view · Eisenhower matrix
6. Multi-user (friends) — flip of existing auth + polish
7. AI agent integration
