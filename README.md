# Personal Life OS

A personal life-tracking web app — one signed-in user, one scrollable page. It brings the
things worth staying on top of into a single daily surface: a **Today** check-in, **Goals**,
**Habits** (with streaks), **Tasks** (with due dates), **Academics** (courses, assignments,
a weekly timetable), **Fitness** (a weekly split and a workout log), a **Journal**, and a
**Pomodoro** timer. All of a user's data can be downloaded as a single JSON file from the
Today section.

Everything a user sees is their own: every table is protected by Supabase Row Level
Security, so a signed-in account can only ever read and write its own rows.

## Stack

- **Next.js** (App Router) + **React** + **TypeScript**
- **Tailwind CSS v4** (installed via PostCSS — never the CDN script)
- **Supabase** — Postgres, Auth (email/password), and Row Level Security
- **Vercel** for hosting (deploys on push to `main`)

## Architecture

- **One page.** `app/page.tsx` composes independent section components
  (`components/sections/*`). No giant page file; each section is a small vertical slice that
  ships its UI and its Supabase wiring together.
- **Client-side data hooks.** Each section owns a `use*` hook (e.g.
  `components/tasks/useTasks.ts`) with a `loading | ready | error` status, optimistic writes,
  and a resync-on-error path.
- **All date logic goes through `lib/dates.ts`** → `getTodayIST()`, the calendar date in
  Asia/Kolkata. Stored dates are raw `yyyy-mm-dd` strings; there is no UTC-vs-local ambiguity
  and no hand-rolled clocks.
- **Pure, tested helpers** live in `lib/` (streaks, due-date labels, week progress, the export
  assembler, …) and are covered by Vitest.

## Getting started

Requires Node 20+.

```bash
npm install
npm run dev      # http://localhost:3000
```

Other scripts:

```bash
npm run build    # production build
npm test         # run the Vitest suite once
npm run lint     # eslint
```

## Environment variables

Create `.env.local` (git-ignored — never commit it) with your Supabase project's values:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

The same two variables must be set in the Vercel project for production.

Only the **anon (publishable)** key is used, and only client-side — that is safe, because RLS
is the real data boundary. The **service-role key must never ship to the client** or be added
to any `NEXT_PUBLIC_*` variable.
