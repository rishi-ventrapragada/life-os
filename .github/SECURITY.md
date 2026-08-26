# SECURITY.md — mandatory security checklist

This file is law (see CLAUDE.md). Each item below is part of the Definition of Done
for every step at the stage it applies to. "Done" means the item was checked and
observed, not assumed.

## Always — every step, every session

- [ ] **No secrets in code, chat, or commits.** All keys live in `.env` locally and
      in Vercel environment variables for deploys. Never paste a key into a source
      file, a chat message, or a commit message.
- [ ] **Service-role key never ships to the client.** Only the Supabase anon
      (publishable) key may appear in client-side code paths. The service-role key,
      if ever needed, stays server-side and out of `NEXT_PUBLIC_*`.
- [ ] **Secret-scan the staged diff before every commit.** Check `git diff --staged`
      for secret-shaped strings (JWTs `eyJ…`, `sb_secret_…`, `service_role`, private
      key blocks, provider token prefixes) before running `git commit`.
- [ ] **`.env*` stays git-ignored.** Verified in Step 0; the ignore rule is never
      removed or narrowed.
- [ ] **Dependencies only from npm.** `npm install <package>` from the public
      registry only. No copy-pasted install scripts, no `curl | sh`, no tarballs or
      scripts from the internet.

## Step 3 — database (first schema work)

- [ ] **Every table is born with `user_id` and Row Level Security enabled.** RLS is
      part of the CREATE migration, never a follow-up: owner can read/write only
      their own rows.
- [ ] **No table ever goes live without RLS — including "temporary" ones.** There
      are no exceptions and no "just for now" tables.
- [ ] **Child-table INSERT policies must verify parent-row ownership** (via `EXISTS`
      on the parent), not merely `user_id = auth.uid()`. A child row that points at
      someone else's parent is an attack even when its own `user_id` is honest —
      with a `unique` constraint it silently denies the real owner their row.
- [ ] **Supabase MCP returns to `read_only=true` after schema work is done.** Write
      access is enabled only for the duration of a step that needs it, then
      re-locked.

## Step 5 — auth

- [ ] **Supabase Auth exclusively.** Never hand-rolled password hashing, storage,
      comparison, or reset flows.
- [ ] **RLS tested adversarially with two real test accounts.** Account A attempts
      to read account B's rows (and vice versa) on every table with RLS; every
      attempt must fail. Observed, not assumed.
- [ ] **Auth pages are rate-limit aware.** Know and respect Supabase Auth's built-in
      rate limits; no custom endpoints that bypass them.
- [ ] **Session handling stays on Supabase defaults.** No custom token storage,
      expiry tinkering, or session persistence schemes.

## Every step after 5

- [ ] **New table or API route ⇒ re-check this list before the step is marked
      done.** Specifically: table has `user_id` + RLS with owner-only policies;
      route leaks no secrets and trusts no client-supplied `user_id`.

## Before v2 — multi-user opens the doors

Run a full adversarial security audit session using the `fable-mode` skill:

- [ ] **RLS verified table-by-table** with two accounts attempting cross-account
      reads and writes on every table.
- [ ] **MFA (Supabase Auth) enabled and required** for accounts.
- [ ] **Input validation review** across every form and API surface.
- [ ] **`npm audit`** run and findings resolved or explicitly accepted.
- [ ] **Vercel deployment protection settings** reviewed (preview-deploy access,
      environment variable exposure per environment).
