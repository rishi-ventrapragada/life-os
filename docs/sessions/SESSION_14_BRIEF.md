# SESSION_14 — Build Brief

**Mobile auth fix + Option Wheel scroll-indicator nav**

*Post-v1 work. Personal Life OS. Hand this file to Claude Code at session start.*

---

## 0. How to use this document

Paste into Claude Code with:

> *"This is the SESSION_14 build brief. Read it fully, then enter Plan Mode and propose the plan for Section 2 (pre-flight decisions) first. Do not write code until I approve."*

This brief supersedes any earlier ad-hoc instructions about the Option Wheel. Where it conflicts with research notes from other sources, **this file wins**.

---

## 1. Scope and order of work

Three commits, strictly in this order. Each is verified before the next begins.

| # | Deliverable | Blocking? |
|---|---|---|
| 1 | Mobile sign-in/out reachability fix + CLAUDE.md DoD update | Ships regardless of the rest |
| 2 | Vendor `OptionWheel.tsx` + fix its two source defects | — |
| 3 | Wheel wired as scroll-position-indicator nav | Abandonable if §2 blockers can't be resolved |

**Commit 1 is independent.** If the wheel work is abandoned at any point, Commit 1 still ships. It fixes a live defect in a deployed app.

---

## 2. Pre-flight decisions — resolve BEFORE writing any wheel code

Claude Code must present findings on all four of these in Plan Mode and get owner approval before proceeding to Commit 3. These are not implementation details; they can each kill or reshape the feature.

### 2.1 Scroll hijacking (BLOCKER — resolve first)

The vendored component registers a non-passive `wheel` listener on its root and calls `e.preventDefault()` unconditionally:

```
el.addEventListener('wheel', onWheel, { passive: false });
```

This is **not gated by the `draggable` prop**. Consequence: whenever the cursor is over the sidebar, mouse/trackpad scrolling spins the wheel instead of scrolling the page.

For a scroll-position *indicator*, this is backwards — the wheel is supposed to follow the page, not consume the scroll that moves it.

**Required:** Claude Code proposes one of:
- **(a)** Remove/disable the internal `wheel` listener entirely; the wheel becomes purely display + click. *(Recommended — matches the indicator concept.)*
- **(b)** Gate the listener behind a prop (`scrollable={false}`) added to the vendored file.
- **(c)** Keep it and accept that the sidebar is a scroll dead zone. *(Document the tradeoff explicitly if proposing this.)*

State which, and why, before coding.

### 2.2 `getComputedStyle` during render (LINT BLOCKER)

The source computes:

```
const remPx = typeof window !== 'undefined'
  ? parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
  : 16;
```

This runs **during render, on every render**. It is the same defect class as the pre-existing Pomodoro `Date.now()`-during-render failure fixed at Step 13 — React 19 lint rules reject reading from the DOM during render, and `npm run lint` is now part of the Definition of Done.

**Required:** Move this into an effect or a lazy ref initializer, preserving identical behaviour (16px fallback when unavailable). Confirm `npm run lint` is green on the vendored file **in Commit 2, before any wiring**.

### 2.3 Line-count law exemption

The vendored source is **347 lines** (349 with `"use client"`). The project law is ~200 lines per component.

**Required decision:** Vendored third-party code is exempt from the line-count law, *provided* it lives under `components/reactbits/` and is not edited beyond the documented modifications in §5. Claude Code must add this exemption explicitly to `CLAUDE.md` — a silent violation is not acceptable.

### 2.4 Mobile navigation strategy

The wheel is a poor mobile nav: vertical drag competes with page scroll, and touch targets on an arc are imprecise.

**Required:** Propose the mobile treatment before building. Default recommendation is **desktop-only wheel** — wheel at `md:` and above, a conventional mobile nav (bottom tab bar or drawer) below that. Confirm or argue otherwise.

---

## 3. Project context and laws

**Stack:** Next.js App Router + React + TypeScript · Tailwind CSS v4 (`@theme` in `app/globals.css`) · Supabase · Vercel · Windows, `C:\dev\Personal Life OS`

**Design tokens — use these exactly, invent none:**

```
--color-bg           #08070c    page background
--color-surface      #0f0e15    card background
--color-border       #1c1a26    hairline borders
--color-accent       #6d28d9    amethyst core (borders, glow inner layers)
--color-accent-edge  #c026d3    magenta edge (outer glow, focus outlines ONLY)
--color-accent-soft  #b7a4f5    lavender — accent-tinted TEXT on dark surfaces
--color-text         #fafafa
--color-text-muted   #a1a1aa
```

Fonts: Space Grotesk (display), Inter (sans).

> **Never** use `--color-accent` (`#6d28d9`) as text on `--color-bg` (`#08070c`) — it's unreadable. That is what `--color-accent-soft` exists for.

**Project laws — every deliverable must satisfy:**

1. Animate **transform and opacity only**. Never `transition-all`. Never transition `filter`/`blur`/`width`/`box-shadow`.
2. No fixed pixel widths — flex/grid.
3. `focus-visible` + `hover` + `active` states on every interactive element.
4. Honour `prefers-reduced-motion`.
5. Section components under ~200 lines, under `components/sections/`. (Vendored exemption per §2.3.)
6. All date logic through `lib/dates.ts` → `getTodayIST()`. Never raw `new Date()` date-strings.

**Hard prohibition:** Do **not** run `shadcn init` or `shadcn add` in this session, for any reason. `globals.css` is hand-tuned — the `@theme` block, the three accent tokens, and the layered GlowCard bloom are deliberate. A registry tool must never touch it. The component is copied manually.

---

## 4. COMMIT 1 — Mobile sign-in/out reachability fix

**This is a live v1 defect.** Sign in/out is unreachable on mobile.

### Diagnose first

Suspected cause: the account block is a child of a sidebar hidden at narrow widths (`hidden md:flex` or similar), so the control disappears with its parent.

**Do not assume this is correct.** Inspect the DOM tree, the sidebar's responsive classes, and where the auth block actually lives. Report the real cause before fixing.

### Fix

Make the account block **independent of the sidebar** — not merely relocated within it. Moving it to the bottom of a still-hidden sidebar reproduces the bug.

- **Desktop:** fixed bottom-left.
- **Mobile:** reachable at 375px — not clipped, not behind a hidden sidebar, no horizontal scroll.
- **Hard requirement:** sign out reachable at **both** desktop and 375px.

The account block contains the user email and Sign out. It stays **outside** the wheel permanently, in both this commit and Commit 3.

### CLAUDE.md update (same commit)

The responsive Definition of Done currently reads roughly *"no horizontal scroll, nothing overflows, sections stack."* That check **passed while a control was unreachable**.

Add: **"Every interactive control remains reachable and operable at 375px."**

### Commit 1 verification

- [ ] Sign out reachable and functional at 375px
- [ ] Sign out reachable and functional at desktop width
- [ ] No horizontal scroll at 375px
- [ ] `npm run lint` · `npm run build` · `npm test` all green
- [ ] CLAUDE.md updated
- [ ] Committed and pushed; Vercel deploy verified live

---

## 5. COMMIT 2 — Vendor the component

**No npm dependencies.** The React Bits Manual tab states "No dependencies" — the manual copy path needs React only. Nothing to install.

### File

Save the captured source as `components/reactbits/OptionWheel.tsx`.

### Modifications permitted in this commit — and only these

1. `"use client";` as line 1. *(Required: the component uses hooks, refs, and DOM APIs; App Router would otherwise attempt SSR and fail.)*
2. **Fix `remPx`** per §2.2 — move the `getComputedStyle` read out of render.
3. **Resolve scroll hijacking** per §2.1, whichever option was approved.
4. A header comment recording: source URL, variant (TS-TW), retrieval date, licence (**MIT + Commons Clause**), and a list of every local modification.

Any modification beyond these needs approval. Every change to vendored code is a fork that complicates future upgrades — keep the diff minimal and documented.

### Commit 2 verification

- [ ] File typechecks in isolation
- [ ] `npm run lint` green — specifically confirming the `remPx` fix cleared it
- [ ] `npm run build` green
- [ ] Header comment present with licence + modification list
- [ ] CLAUDE.md line-count exemption added per §2.3
- [ ] Committed separately, before any wiring

---

## 6. COMMIT 3 — Wheel as scroll-position-indicator nav

### Concept

The wheel **reflects** scroll position; it is not a menu.

- Page scroll → wheel rotates to the current section.
- Clicking a section → page smooth-scrolls to it.

Sections, in order:

```
Today · Goals · Habits · Tasks · Academics · Fitness · Journal · Pomodoro
```

The "LIFE OS" wordmark stays above the wheel. The account block stays below it, independent per Commit 1.

### 6.1 Two-way sync — the central risk

**The component is internal-state only.** `defaultSelected` seeds state once. There is **no `value` prop** and no imperative API. Selection can be *read* via `onChange(index, item)` but **cannot be pushed in from outside**.

So:
- Wheel → page: straightforward via `onChange`.
- Page → wheel: **not possible as shipped.** Requires adding a controlled path to the vendored file.

**Add a controlled path** — prefer whichever is the smaller diff:
- **(a)** `forwardRef` + `useImperativeHandle` exposing `setIndex(i)`, called from the scroll handler; or
- **(b)** an optional `value` prop plus an effect syncing it into `targetRef`.

Document the choice in the vendored file's header comment.

> ### ⚠ STALE-STATE / FEEDBACK-LOOP REQUIREMENT
>
> This project already carries **one accepted double-state bug** (Today/Habits, Step 9). **A second will not be accepted.**
>
> Two-way sync is exactly where a feedback loop appears:
> *scroll updates wheel → wheel fires onChange → onChange scrolls page → scroll handler fires → updates wheel → …*
>
> **Required before coding:** design a **single source of truth** and state explicitly in the plan how the loop is broken. Expected shape: an `IntersectionObserver` is the sole authority on "current section", plus a `programmaticScrollInProgress` flag that suppresses the observer while a click-driven smooth-scroll animates, cleared on scroll-end.
>
> The plan must describe this mechanism **before** any code is written. Do not ship a second double-state bug.

### 6.2 Prop values

Starting values — tune during verification, do not treat as final:

```tsx
<OptionWheel
  items={['Today','Goals','Habits','Tasks','Academics','Fitness','Journal','Pomodoro']}
  blur={0}                 // REQUIRED — see below
  textColor="#b7a4f5"      // --color-accent-soft (idle)
  activeColor="#fafafa"    // --color-text (active)
  fade={0.14}              // low, so all 8 stay legible
  minOpacity={0.25}        // far items readable, not near-invisible
  spacing={1.5}
  fontSize={1.5}           // rem
  tilt={6}
  curve={1}
  smoothing={200}
  side="left"
  loop={false}             // 8 fixed sections, no wrap
  draggable={false}        // avoid drag competing with page scroll
/>
```

**`blur={0}` is mandatory, not stylistic.** The component writes `filter: blur(dist * blur)` per frame; the project's animation law forbids animating `filter`. At `blur={0}` the component writes `filter: 'none'` and the property is never touched. Depth comes from `fade` (opacity) instead. Do not pass a nonzero blur.

**Item count is unbounded.** There is no cap in the source (`items.map(...)`, no slicing) and **no `visibleCount` or height prop**. How many items read clearly at once is a function of `fade` (primary lever), then `spacing`/`fontSize`, then available parent height.

**The parent must supply height.** The wheel root is `h-full w-full`. Give it a left rail with a defined height (e.g. `100dvh` fixed rail) or the 8 items will not lay out.

### 6.3 Accessibility gaps in the shipped component

The vendored component is **incomplete** on accessibility. All of the following must be added:

| Gap | Requirement |
|---|---|
| Root has `outline-none`, no focus-visible styling | Add a visible focus-visible ring using `--color-accent-edge` (`#c026d3`), consistent with `.glow-card:focus-visible` in `globals.css`. Transform/opacity/token colours only. |
| Keyboard: Arrow keys only (Up/Left −1, Down/Right +1) | Add **Enter/Space** = activate current section (scroll to it). Add **Home** = first section, **End** = last section. |
| Single tab stop; options are not individually tabbable | Acceptable for a `role="listbox"`, but ensure `aria-activedescendant` correctly tracks the selected option so screen readers announce changes. |
| No reduced-motion handling | Honour `prefers-reduced-motion`: skip the eased rAF animation and jump directly to target; use `behavior: 'auto'` instead of `'smooth'` for the page scroll. |

Verify the `aria-selected` state actually updates for assistive tech, not just visually.

### Commit 3 verification

Nothing is "done" until every box is checked by observation, not assumption.

**Function**
- [ ] All 8 sections reachable and their labels legible
- [ ] Scrolling the page rotates the wheel to the correct section
- [ ] Clicking a section smooth-scrolls the page to it
- [ ] **No feedback loop** — scroll → click → scroll in quick succession stays stable, no oscillation, no drift
- [ ] Page scroll works normally with the cursor over the sidebar (per §2.1 resolution)

**Accessibility**
- [ ] Tab reaches the wheel; focus-visible ring clearly visible
- [ ] Arrow / Enter / Space / Home / End all behave as specified
- [ ] `prefers-reduced-motion` honoured (test with OS setting enabled)

**Responsive**
- [ ] 375px: no horizontal scroll, nothing overflows
- [ ] 375px: **sign out still reachable** (regression check on Commit 1)
- [ ] 375px: mobile nav strategy from §2.4 works as approved

**Gates**
- [ ] `npm run lint` green
- [ ] `npm run build` green
- [ ] `npm test` green (all tests, no skips)
- [ ] Secret scan clean
- [ ] `.mcp.json` still read-only — no write-probe

**Ship**
- [ ] Old nav removed only after the above pass side-by-side
- [ ] Committed, pushed, Vercel deploy verified live at both widths

---

## 7. Build sequence

1. Render the wheel **alongside** the existing nav — both visible simultaneously.
2. Verify everything in §6 against the wheel while the old nav still works.
3. Only then remove the old nav, in a single commit.

Do not delete working navigation before its replacement is proven. If the wheel fails verification, the old nav is still there and nothing is lost.

---

## 8. Rollback

If Commit 3 ships and the wheel proves unusable in daily use:

- Revert the Commit 3 swap. Commits 1 and 2 stay — the mobile fix is independent, and the vendored file is inert if unused.
- Record the reason in `FUTURE.md`, not just the git history.

---

## 9. Session discipline

- Plan Mode before code, every commit.
- Commit and push after every working increment. Never end the session uncommitted.
- Invoke `fable-mode` for the two-way sync work (§6.1) and for any debugging that fails twice.
- **Two failed fixes = wrong diagnosis.** Stop patching, question the assumption.
- Report session-meter % before starting Commit 3. Do not begin it above ~85% — checkpoint and resume fresh.
- New ideas go to `FUTURE.md`, never into the current commit.
- Write the RESUME-HERE section in `SESSION_14.md` before ending, whatever state the work is in.

---

## 10. Open questions for the owner

Claude Code should surface these in Plan Mode rather than deciding unilaterally:

1. **§2.1** — which scroll-hijack resolution?
2. **§2.4** — desktop-only wheel, or wheel on mobile too?
3. If `fade={0.14}` still leaves sections 7–8 hard to read at a comfortable font size, is a **reduced section count** (e.g. folding Pomodoro under Journal) on the table, or do all 8 stay top-level?
4. Does the wheel replace the nav entirely, or sit alongside a minimal text fallback for accessibility?

---

*End of brief. First action: read fully, enter Plan Mode, propose Section 2 findings and Commit 1 plan.*
