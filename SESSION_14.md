# SESSION_14 — Working State & Resume Doc

**Feature: Mobile auth fix + Option Wheel scroll-indicator nav**

This file is the single source of truth for resuming SESSION_14. The build brief is
`SESSION_14_BRIEF.md` (the spec — read it too). This file records what has been **decided,
diagnosed, and planned** so a future session can start cold without re-deriving anything.

Status as of this checkpoint: **Commit 1 SHIPPED (`004edf4`). Commit 2 blocked on source. Commit 3 not started.**

---

## RESUME-HERE (read this first)

- **Where we are:** Plan Mode finished; all four §2 pre-flight decisions and all four §10 open
  questions **resolved by the owner** (see "Owner decisions"). **Commit 1 is built, committed, and
  pushed** (`004edf4` on `main`) — gates all green (lint clean, 108 tests, build OK), 375px + desktop
  layout reachability verified via headless Chrome. The only unverified item is the owner-gated
  live check (Sign out actually signing out from a real session behind the login screen) — do that
  in-app when convenient.
- **What to do next:** **Commit 2** (vendor `OptionWheel.tsx`) — but it is **BLOCKED**: paste/provide
  the captured React Bits OptionWheel source (Manual / TS-TW copy) first. Do not fabricate it. Once
  provided, follow "Commit 2" below; enter Plan Mode before coding (project law).
- **Approved plan file:** `C:\Users\iicra\.claude\plans\mellow-watching-perlis.md` (same content
  as the Commit sections here).
- **Blocker for Commit 2 only:** the captured React Bits OptionWheel source is **not yet in the
  repo**. Commit 2 cannot start until the owner provides it (Manual / TS-TW copy). Commit 1 and
  the planning do **not** depend on it.
- **Session discipline reminders:** Plan Mode before code on every commit. Commit + push after
  every working increment. Use `fable-mode` for the Commit 3 two-way sync (§6.1) and any debug
  that fails twice. Report session-meter % before starting Commit 3; do not begin above ~85%.

---

## Scope & order (from brief §1) — strict, verified before next begins

| # | Deliverable | Blocking? |
|---|---|---|
| 1 | Mobile sign-in/out reachability fix + CLAUDE.md DoD update | Ships regardless |
| 2 | Vendor `OptionWheel.tsx` + fix its two source defects | — |
| 3 | Wheel wired as scroll-position-indicator nav | Abandonable if §2 blockers unresolved |

Commit 1 is independent: if the wheel work is abandoned, Commit 1 still ships (it fixes a live
defect). Rollback (brief §8): if Commit 3 proves unusable, revert only the Commit-3 swap; Commits
1 & 2 stay; record the reason in `FUTURE.md`.

---

## Owner decisions — RESOLVED (do not re-ask)

1. **§2.1 scroll-hijack** → **(a) remove the internal `wheel` listener entirely.** The wheel is a
   scroll *indicator*: it follows the page and never consumes the scroll that moves it. In
   Commit 2, delete the `el.addEventListener('wheel', onWheel, { passive: false })` registration
   and its `onWheel` handler. Wheel becomes display + click only.
2. **§2.4 mobile nav** → **desktop-only wheel + bottom tab bar.** Wheel at `md:` and above; a
   conventional bottom tab bar for section nav below `md`. (Wheel is a poor mobile nav: vertical
   drag competes with page scroll; arc touch targets are imprecise.)
3. **§10 Q3 section count** → **decide during verification.** Build with all 8 sections; only fold
   Pomodoro under Journal if legibility genuinely fails at a comfortable font size.
4. **§10 Q4 nav fallback** → **wheel + minimal text fallback.** The wheel does NOT fully replace
   the nav; keep a lightweight, accessible text section list alongside it. Below `md`, that
   fallback is the bottom tab bar (decision 2).

---

## §2 pre-flight findings (all four)

### 2.1 Scroll hijacking (BLOCKER) — RESOLVED (a), see above.

### 2.2 `getComputedStyle` during render (LINT BLOCKER) — fix, no owner choice
The vendored source computes `remPx` by reading
`getComputedStyle(document.documentElement).fontSize` **during render, every render**. Same defect
class as the Step-13 Pomodoro `Date.now()`-during-render failure. React 19 lint (and our DoD
`npm run lint`) reject DOM reads during render — the build won't catch it, lint will. See memory
`react19-purity-lint-rules`.
**Fix (Commit 2):** move the read into a lazy `useState` initializer or a `useEffect` that sets
`remPx` once, preserving the identical 16px fallback when unavailable. Confirm `npm run lint` green
on the vendored file **before any wiring**.

### 2.3 Line-count law exemption — add to CLAUDE.md in Commit 2
Vendored source is 347 lines (349 with `"use client"`); project law is ~200 lines/component.
**Add an explicit exemption to CLAUDE.md:** vendored third-party code under `components/reactbits/`
is exempt from the line-count law, provided it is not edited beyond the documented brief-§5
modifications. A silent violation is not acceptable.

### 2.4 Mobile navigation strategy — RESOLVED (desktop-only wheel + bottom tab bar), see above.

---

## COMMIT 1 — Mobile sign-in/out reachability fix

### Diagnosis — CONFIRMED (read the real DOM, not assumed)
`components/Sidebar.tsx` line 21: the entire `<aside>` is `hidden md:block`. The account block
(email + Sign out, currently lines 46–62 of that file) is a **child of that aside**. Below the
`md` breakpoint the whole sidebar is `display:none`, so **Sign out is genuinely unreachable on
mobile** — not merely misplaced. Confirmed by reading the file, matching the suspected cause in
brief §4.

Render tree (`app/page.tsx`):
`SessionProvider > AuthGate > div.flex flex-1 > [Sidebar (aside, hidden md:block)] + [main]`.
The account block reads `session` from `useSession()` in `components/auth/SessionProvider.tsx`.
Sign out calls `supabase.auth.signOut()` (from `lib/supabase`).

### Fix — make the account block INDEPENDENT of the sidebar
Brief §4 is explicit: moving it to the bottom of a still-hidden sidebar reproduces the bug. So:

1. **New component `components/AccountBlock.tsx`** (`"use client"`): extract the email + Sign out
   UI currently inline in `Sidebar.tsx`. Reads `useSession()`; renders nothing when `!session`.
   Reuse the exact button/hover/focus pattern already in `Sidebar.tsx` — transform/opacity
   transitions only, `focus-visible` ring in `--color-accent-edge`. No new design tokens.
2. **Strip the account block out of `Sidebar.tsx`** (lines 46–62). Sidebar becomes nav-only.
   (This also cleanly separates concerns for Commit 3, where the wheel replaces the nav but the
   account block must survive per brief §4/§6.)
3. **Render `AccountBlock` in `app/page.tsx`**, OUTSIDE the sidebar, as a **fixed element** so it
   is reachable at every width:
   - Desktop + mobile: `fixed bottom-4 left-4 z-40` (fixed bottom-left per §4). Small
     GlowCard-consistent surface: `bg-(--color-surface)`, `border-(--color-border)`, rounded,
     containing the truncated email + Sign out button.
   - At 375px: bottom-left, above content, not clipped, no horizontal scroll. Fixed + left-
     anchored; constrain width with `max-w` using `min()`/`calc` (NOT a fixed px container —
     flex/grid law). Optionally respect `env(safe-area-inset-bottom)`; otherwise `bottom-4`.
   - Guard against covering the last section: `main` already has `py-10 sm:py-16` + big gaps; if
     the fixed block overlaps the final section at small widths, add bottom padding to `main`
     (e.g. `pb-24`) so nothing is permanently hidden behind it.

### CLAUDE.md update (SAME commit)
The responsive DoD currently reads roughly *"no horizontal scroll, nothing overflows, sections
stack"* — that check passed while Sign out was unreachable. **Add:**
> "Every interactive control remains reachable and operable at 375px."

### Commit 1 verification (brief §4)
- [ ] Sign out reachable + functional at **375px**
- [ ] Sign out reachable + functional at **desktop** width
- [ ] No horizontal scroll at 375px
- [ ] `npm run lint` · `npm run build` · `npm test` all green (no skips)
- [ ] CLAUDE.md updated
- [ ] Committed + pushed; Vercel deploy verified live at both widths

Live UI check: installed Chrome + scratchpad playwright-core (memory `windows-dev-loop-gotchas`).
To kill node on Windows use PowerShell, not `pkill` (same memory).

---

## COMMIT 2 — Vendor the component (blocked on source)

- **No npm deps.** React Bits Manual/TS-TW copy needs React only — nothing to install.
- Save captured source as **`components/reactbits/OptionWheel.tsx`**.
- **Permitted modifications ONLY** (brief §5):
  1. `"use client";` as line 1 (component uses hooks/refs/DOM; App Router would SSR-fail).
  2. **Fix `remPx`** per §2.2 (move `getComputedStyle` out of render; keep 16px fallback).
  3. **Resolve scroll hijacking** per §2.1 → decision (a): remove the `wheel` listener + handler.
  4. Header comment recording: source URL, variant (TS-TW), retrieval date, licence
     (**MIT + Commons Clause**), and a list of every local modification.
- Any change beyond these needs approval — every edit is a fork that complicates future upgrades.
- **Blocker:** the captured source is not yet in the repo. Owner must paste/provide it first.
- Verify: typechecks in isolation · `npm run lint` green (remPx cleared) · `npm run build` green ·
  header comment present · CLAUDE.md line-count exemption added (§2.3) · committed separately,
  **before any wiring**.

---

## COMMIT 3 — Wheel as scroll-position-indicator nav (use `fable-mode`)

### Concept
The wheel **reflects** scroll position; it is not a menu. Page scroll → wheel rotates to current
section. Click a section → page smooth-scrolls to it.
Sections in order: `Today · Goals · Habits · Tasks · Academics · Fitness · Journal · Pomodoro`.
The "LIFE OS" wordmark stays above the wheel; the account block stays below it, independent
(Commit 1).

### ⚠ Central risk — two-way sync / feedback loop (brief §6.1)
The component is **internal-state only**: `defaultSelected` seeds state once, there is **no `value`
prop** and no imperative API. Selection can be read via `onChange(index, item)` but cannot be
pushed in from outside. Wheel→page is easy; **page→wheel requires adding a controlled path to the
vendored file.**

This project already carries ONE accepted double-state bug (Today/Habits, Step 9). **A second will
not be accepted.** Required design (state it in the plan BEFORE coding):
- **Single source of truth:** an `IntersectionObserver` is the sole authority on "current section."
- A `programmaticScrollInProgress` ref/flag **suppresses the observer** while a click-driven
  smooth-scroll animates, cleared on scroll-end.
- The wheel is a pure reflection of that authority; `onChange` only triggers a page scroll, never
  re-drives the wheel directly. This breaks the loop
  (scroll→wheel→onChange→scroll→observer→wheel→…).
- **Controlled path** added to the vendored file — smaller diff wins:
  (a) `forwardRef` + `useImperativeHandle` exposing `setIndex(i)`, called from the scroll handler;
  or (b) optional `value` prop + effect syncing into `targetRef`. Document the choice in the header.

### Prop values (brief §6.2 — starting points, tune in verification)
```tsx
<OptionWheel
  items={['Today','Goals','Habits','Tasks','Academics','Fitness','Journal','Pomodoro']}
  blur={0}              // MANDATORY — component writes filter: blur(...); animation law forbids
                        //   animating filter. At 0 it writes filter:'none' and never touches it.
  textColor="#b7a4f5"   // --color-accent-soft (idle)
  activeColor="#fafafa" // --color-text (active)
  fade={0.14}           // low, so all 8 stay legible (primary legibility lever)
  minOpacity={0.25}
  spacing={1.5}
  fontSize={1.5}        // rem
  tilt={6}
  curve={1}
  smoothing={200}
  side="left"
  loop={false}          // 8 fixed sections, no wrap
  draggable={false}     // avoid drag competing with page scroll
/>
```
- **Item count is unbounded** in the source (no cap, no `visibleCount`/height prop). Legibility is
  a function of `fade` (primary), then `spacing`/`fontSize`, then parent height.
- **The parent must supply height:** wheel root is `h-full w-full`. Give it a left rail with a
  defined height (e.g. `100dvh` fixed rail) or the 8 items won't lay out.

### Accessibility gaps to ADD (brief §6.3 — component ships incomplete)
- Root has `outline-none`, no focus-visible → add a visible focus-visible ring using
  `--color-accent-edge` (`#c026d3`), consistent with `.glow-card:focus-visible` in `globals.css`.
  Transform/opacity/token colours only.
- Keyboard: source has Arrow keys only (Up/Left −1, Down/Right +1). **Add Enter/Space = activate
  current section (scroll to it); Home = first; End = last.**
- `role="listbox"` single tab stop is acceptable, but ensure `aria-activedescendant` tracks the
  selected option so SRs announce changes. Verify `aria-selected` actually updates for AT, not just
  visually.
- **Reduced motion:** honour `prefers-reduced-motion` — skip the eased rAF animation, jump to
  target; use `behavior:'auto'` instead of `'smooth'` for page scroll.

### Owner-decision hooks folded into Commit 3
- **Nav fallback (Q4):** keep a minimal accessible text section list alongside the wheel; below
  `md` that fallback IS the bottom tab bar (Q2).
- **Mobile (Q2):** wheel only at `md:`+; bottom tab bar below `md`.
- **Section count (Q3):** build all 8; fold Pomodoro under Journal only if legibility fails.
- **375px collision:** the fixed account block (Commit 1, bottom-left) and the bottom tab bar must
  not overlap — reconcile placement/padding at 375px.

### Build sequence (brief §7 — do NOT skip)
1. Render the wheel **alongside** the existing nav — both visible simultaneously.
2. Verify everything in §6 against the wheel while the old nav still works.
3. Only then remove the old nav, in a single commit. Never delete working nav before its
   replacement is proven.

### Commit 3 verification (brief §6) — checked by observation, not assumption
**Function:** all 8 sections reachable + legible · page scroll rotates wheel to correct section ·
clicking a section smooth-scrolls to it · **no feedback loop** (scroll→click→scroll in quick
succession stays stable) · page scroll works normally with cursor over the sidebar (§2.1).
**Accessibility:** Tab reaches wheel + visible focus ring · Arrow/Enter/Space/Home/End behave ·
`prefers-reduced-motion` honoured (test with OS setting on).
**Responsive:** 375px no horizontal scroll / nothing overflows · 375px **Sign out still reachable**
(Commit 1 regression) · 375px mobile nav (bottom tab bar) works.
**Gates:** `npm run lint` · `npm run build` · `npm test` (no skips) · secret scan clean ·
`.mcp.json` still read-only (no write-probe).
**Ship:** old nav removed only after the above pass side-by-side · committed, pushed, Vercel live
at both widths.

---

## Project laws & tokens (quick reference — brief §3)

**Stack:** Next.js App Router + React + TypeScript · Tailwind CSS v4 (`@theme` in
`app/globals.css`) · Supabase · Vercel · Windows, `C:\dev\Personal Life OS`.

**Design tokens (invent none):**
```
--color-bg           #08070c   page background
--color-surface      #0f0e15   card background
--color-border       #1c1a26   hairline borders
--color-accent       #6d28d9   amethyst core (borders, glow inner)
--color-accent-edge  #c026d3   magenta edge (outer glow, focus outlines ONLY)
--color-accent-soft  #b7a4f5   lavender — accent-tinted TEXT on dark surfaces
--color-text         #fafafa
--color-text-muted   #a1a1aa
```
Fonts: Space Grotesk (display), Inter (sans). **Never** use `--color-accent` as text on
`--color-bg` — unreadable; that's what `--color-accent-soft` is for.

**Laws:** animate transform + opacity only (never `transition-all`, never filter/blur/width/
box-shadow) · no fixed pixel widths (flex/grid) · `focus-visible` + `hover` + `active` on every
interactive element · honour `prefers-reduced-motion` · section components under ~200 lines under
`components/sections/` (vendored exemption per §2.3) · all date logic through `lib/dates.ts` →
`getTodayIST()`.

**HARD PROHIBITION:** do NOT run `shadcn init` / `shadcn add` this session, for any reason.
`globals.css` is hand-tuned (the `@theme` block, three accent tokens, layered GlowCard bloom).
The wheel component is copied **manually**.

---

## Relevant memories (already in context each session)
- `react19-purity-lint-rules` — eslint rejects ref reads / `Date.now()` during render; build won't
  catch it. Directly relevant to the `remPx` fix (§2.2). Run lint in every DoD.
- `windows-dev-loop-gotchas` — kill node via PowerShell not `pkill`; diff served CSS vs disk before
  re-fixing styles; scratchpad playwright-core + installed Chrome for UI verification.
- `checkpoint-before-uninterrupted-blocks` — don't start a sequencing-sensitive block on a high
  session meter; checkpoint + commit + resume next session. Applies to Commit 3 (§6.1, §9).
