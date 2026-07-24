"use client";

/**
 * OptionWheel — vendored from React Bits.
 *
 * Source:   https://reactbits.dev/  (OptionWheel component, TypeScript + Tailwind "TS-TW" variant)
 * Variant:  TS-TW (Manual copy path — no npm dependencies; React only)
 * Retrieved: 2026-07-24
 * Licence:  MIT + Commons Clause (React Bits). Retained as third-party vendored code.
 *
 * This file is vendored under components/reactbits/ and is EXEMPT from the project's
 * ~200-line-per-component law (see CLAUDE.md) provided it is edited only per the
 * modifications listed below. Keep the diff from upstream minimal and documented.
 *
 * Local modifications (SESSION_14, Commit 2):
 *   1. Added `"use client";` as line 1 — the component uses hooks/refs/DOM APIs; under the
 *      Next.js App Router it would otherwise be treated as a Server Component and fail to render.
 *   2. Render-phase purity fix (React 19 / eslint-plugin-react-hooks v7 rejects DOM reads and ref
 *      writes during render — same defect class as the Step-13 Date.now()-in-render failure):
 *        a. `remPx` no longer reads getComputedStyle in the render body. It is read once via a lazy
 *           useState initializer (React runs it a single time, not on re-renders), preserving the
 *           identical 16px fallback when the DOM is unavailable (SSR).
 *        b. `onChangeRef.current = onChange` moved from render into a useEffect.
 *        c. `cfgRef.current = {…}` moved from render into a useLayoutEffect keyed on its inputs.
 *   3. Removed the internal non-passive `wheel` listener (the useEffect registering
 *      addEventListener('wheel', …, { passive:false }) with unconditional preventDefault, plus the
 *      `onWheel` handler and `wheelTimerRef`). It hijacked page scrolling whenever the cursor was
 *      over the wheel; for a scroll-position *indicator* the wheel must follow the page, not consume
 *      the scroll. The wheel remains navigable via click, drag, and keyboard.
 *   4. Self-scheduling rAF fix (owner-approved; a third source defect our stricter lint config
 *      surfaced, beyond the two the build brief named): the upstream `runFrame` re-scheduled itself
 *      via `requestAnimationFrame(runFrame)` inside its own useCallback, which react-hooks v7's
 *      `immutability` rule rejects ("accessed before it is declared"). Now it schedules through
 *      `runFrameRef.current`, kept in sync with `runFrame` via an effect. Behaviour-identical.
 *
 * Local modifications (SESSION_14, Commit 3 — wiring the wheel as a controlled scroll indicator):
 *   5. Controlled `value` path (two-way sync). Upstream is internal-state only (`defaultSelected`
 *      seeds once; no way to push selection in). Added an optional `value?: number` prop whose effect
 *      SILENTLY syncs the wheel to that index — it sets targetRef/selectedRef/selectedIndex and
 *      restarts the loop but DELIBERATELY does NOT call `onChange`. This is what breaks the
 *      scroll→wheel→onChange→scroll feedback loop: an externally-pushed value rotates the wheel
 *      without re-emitting a navigation event. Early-returns when value already matches.
 *   6. Accessibility additions:
 *        a. focus-visible ring on the root (was `outline-none`) using --color-accent-edge, matching
 *           .glow-card:focus-visible. Transform/opacity/token-colour only.
 *        b. keyboard: added Enter/Space (activate current section), Home (first), End (last) to the
 *           existing Arrow handling. Enter/Space go through the same snap path a click uses, so they
 *           emit onChange (real navigation) — unlike the silent `value` sync.
 *        c. `aria-activedescendant` on the root listbox + stable `id` per option, so assistive tech
 *           announces selection changes (not just the visual highlight).
 *        d. reduced-motion: when prefers-reduced-motion is set, the eased rAF is skipped and the wheel
 *           jumps straight to target. (Page scrolling already honours reduced-motion via the CSS
 *           `scroll-behavior` override in globals.css, so scroll callers need no behavior arg.)
 *
 * Local modifications (sidebar-wheel refinements — fade / band / selected-larger):
 *   7. Three refinements, all inside the existing per-frame `runFrame` item loop (no new system):
 *        a. Selected-item enlargement via transform `scale(1 + p*SELECTED_SCALE)` appended to the
 *           SAME transform string (p is the existing closeness ramp, 1 at centre → 0 by distance 1).
 *           Deliberately NOT font-size: font-size animation forces layout every frame and would
 *           break the project's transform/opacity-only law. `origin-left` (already set on the item)
 *           makes it grow rightward. SELECTED_SCALE is a module const so it is owner-tunable in one
 *           place (0.25 / 0.35 / 0.45). The existing font-extralight -> font-medium weight switch is
 *           kept as-is.
 *        b. Inert-when-invisible: once an item's computed opacity <= 0.01 (which now reaches true 0,
 *           since the WheelNav caller passes minOpacity:0), it is given `pointer-events:none` and
 *           `aria-hidden="true"` so far items are neither clickable nor exposed to screen readers.
 *           Both are cleared per-frame as the item scrolls back toward centre. Written through the
 *           same per-frame style write, not a separate observer.
 *      (The fade curve itself (fade/minOpacity) is set purely via props from WheelNav — no code
 *      change here; `1 - dist*fade` floored at `minOpacity` already existed.)
 */

import { useRef, useState, useCallback, useEffect, useLayoutEffect, CSSProperties } from 'react';

type Side = 'left' | 'right';

export interface OptionWheelProps {
  items?: string[];
  defaultSelected?: number;
  /**
   * Local mod 5: controlled index. When provided, the wheel silently syncs to it (no onChange
   * emitted). Lets a parent drive the wheel from an external source of truth (e.g. scroll position)
   * without creating a feedback loop.
   */
  value?: number;
  onChange?: (index: number, item: string) => void;
  textColor?: string;
  activeColor?: string;
  side?: Side;
  fontSize?: number;
  spacing?: number;
  curve?: number;
  tilt?: number;
  blur?: number;
  fade?: number;
  minOpacity?: number;
  smoothing?: number;
  inset?: number;
  loop?: boolean;
  draggable?: boolean;
  soundUrl?: string;
  soundVolume?: number;
  className?: string;
}

interface WheelConfig {
  count: number;
  items: string[];
  rowH: number;
  curve: number;
  tilt: number;
  blur: number;
  fade: number;
  minOpacity: number;
  side: Side;
  loop: boolean;
  smoothing: number;
  draggable: boolean;
  soundUrl: string;
  soundVolume: number;
}

// Local mod 7: how much larger the selected item renders, as a fraction, applied via transform
// scale (NOT font-size). Selected = 1 + SELECTED_SCALE (e.g. 0.35 → 1.35x); distance >= 1 stays 1.0
// and it interpolates smoothly between. Owner-tunable — try 0.25 / 0.35 / 0.45.
const SELECTED_SCALE = 0.35;

const DEFAULT_ITEMS = [
  'Ambient',
  'House',
  'Techno',
  'Jazz',
  'Lo-Fi',
  'Synthwave',
  'Trance',
  'Funk',
  'Disco',
  'Hip-Hop',
  'Chillwave',
  'Drum & Bass'
];

const OptionWheel = ({
  items = DEFAULT_ITEMS,
  defaultSelected = 3,
  value,
  onChange,
  textColor = '#a6a6a6',
  activeColor = '#ffffff',
  side = 'left',
  fontSize = 3,
  spacing = 1.4,
  curve = 1,
  tilt = 6,
  blur = 2,
  fade = 0.25,
  minOpacity = 0.05,
  smoothing = 200,
  inset = 80,
  loop = false,
  draggable = true,
  soundUrl = '',
  soundVolume = 0.5,
  className = ''
}: OptionWheelProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const posRef = useRef(defaultSelected);
  const targetRef = useRef(defaultSelected);
  const rafRef = useRef<number | null>(null);
  // Local mod 4: holds the latest `runFrame` so the rAF loop can re-schedule itself without the
  // closure referencing `runFrame` before its declaration (react-hooks/immutability).
  const runFrameRef = useRef<(now: number) => void>(() => {});
  const lastRef = useRef(0);
  const cfgRef = useRef<WheelConfig>({} as WheelConfig);
  const onChangeRef = useRef(onChange);
  const selectedRef = useRef(defaultSelected);
  const dragRef = useRef<{ y: number; start: number; id: number } | null>(null);
  const dragMovedRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef('');
  const lastTickRef = useRef(0);
  // Local mod 6d: current prefers-reduced-motion state, read in the rAF loop to jump instead of ease.
  const reducedMotionRef = useRef(false);
  const [selectedIndex, setSelectedIndex] = useState(defaultSelected);
  const [isDragging, setIsDragging] = useState(false);
  // Local mod 2a: read getComputedStyle out of the render body via a lazy useState initializer,
  // which React runs exactly once (not on re-renders). Preserves the 16px SSR/unavailable fallback.
  const [remPx] = useState(() =>
    typeof window !== 'undefined'
      ? parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
      : 16
  );

  // Local mod 2b: ref write moved out of render.
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Local mod 2c: cfg ref write moved out of render (useLayoutEffect so cfgRef is fresh before
  // paint, keeping ordering with the layout effect below).
  useLayoutEffect(() => {
    cfgRef.current = {
      count: items.length,
      items,
      rowH: Math.max(fontSize * spacing * remPx, 1),
      curve,
      tilt,
      blur,
      fade,
      minOpacity,
      side,
      loop,
      smoothing,
      draggable,
      soundUrl,
      soundVolume
    };
  });

  // Single rAF loop that eases the wheel position toward its target with
  // frame-rate independent exponential smoothing, then lays every option out
  // along the curve based on its distance from the current position.
  const runFrame = useCallback((now: number) => {
    const dt = Math.min((now - lastRef.current) / 1000, 0.05);
    lastRef.current = now;
    const cfg = cfgRef.current;
    const tau = Math.max(cfg.smoothing, 1) / 1000;
    // Local mod 6d: jump straight to target under prefers-reduced-motion (k = 1), else ease.
    const k = reducedMotionRef.current ? 1 : 1 - Math.exp(-dt / tau);

    const target = targetRef.current;
    const cur = posRef.current;
    let next = cur + (target - cur) * k;
    const settled = Math.abs(target - next) < 0.001;
    if (settled) next = target;
    posRef.current = next;

    const els = itemRefs.current;
    const n = cfg.count;
    const mirror = cfg.side === 'right' ? -1 : 1;
    // Options sit on a circle whose radius keeps the arc length between two
    // neighbors equal to one row height, so tilt controls how tightly it curls.
    const tiltRad = (cfg.tilt * Math.PI) / 180;
    const R = tiltRad > 0.0005 ? cfg.rowH / tiltRad : 0;
    for (let i = 0; i < n; i++) {
      const el = els[i];
      if (!el) continue;
      let d = i - next;
      if (cfg.loop && n > 1) {
        d = ((d % n) + n) % n;
        if (d > n / 2) d -= n;
      }
      const dist = Math.abs(d);
      let x = 0;
      let y = d * cfg.rowH;
      let rot = 0;
      if (R > 0) {
        const ang = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, d * tiltRad));
        y = R * Math.sin(ang);
        x = -mirror * R * (1 - Math.cos(ang)) * cfg.curve;
        rot = (mirror * ang * 180) / Math.PI;
      }
      // Local mod 7: closeness ramp p (1 at the selected item, 0 by distance >= 1). Drives both the
      // active-colour blend (--ow-p) and the selected-item enlargement (scale, appended to the SAME
      // transform string so we stay transform/opacity-only — no per-frame font-size / layout).
      const p = Math.max(0, 1 - Math.min(dist, 1));
      const scale = 1 + p * SELECTED_SCALE;
      el.style.transform = `translate(${x.toFixed(2)}px, calc(${y.toFixed(2)}px - 50%)) rotate(${rot.toFixed(3)}deg) scale(${scale.toFixed(4)})`;
      const op = Math.max(cfg.minOpacity, 1 - dist * cfg.fade);
      el.style.opacity = String(op);
      el.style.filter = cfg.blur > 0 ? `blur(${(dist * cfg.blur).toFixed(2)}px)` : 'none';
      el.style.setProperty('--ow-p', p.toFixed(4));
      // Local mod 7: once effectively invisible, make the item inert — drop it from hit-testing and
      // the a11y tree. Cleared as it scrolls back toward centre and op rises above the threshold.
      // Done here in the existing per-frame write, not via a separate observer.
      const inert = op <= 0.01;
      el.style.pointerEvents = inert ? 'none' : '';
      el.setAttribute('aria-hidden', inert ? 'true' : 'false');
    }

    rafRef.current = settled ? null : requestAnimationFrame(runFrameRef.current);
  }, []);

  // Local mod 4: keep the ref pointing at the latest runFrame (out of render — pure).
  useEffect(() => {
    runFrameRef.current = runFrame;
  }, [runFrame]);

  const startLoop = useCallback(() => {
    if (rafRef.current != null) return;
    lastRef.current = performance.now();
    rafRef.current = requestAnimationFrame(runFrameRef.current);
  }, []);

  // Optional tick on selection change, throttled so fast scrolling can't spam
  // it, and with playback failures (e.g. autoplay policies) silently ignored.
  const playTick = useCallback(() => {
    const { soundUrl, soundVolume } = cfgRef.current;
    if (!soundUrl) return;
    const now = performance.now();
    if (now - lastTickRef.current < 70) return;
    lastTickRef.current = now;
    if (!audioRef.current || audioUrlRef.current !== soundUrl) {
      audioRef.current = new Audio(soundUrl);
      audioRef.current.preload = 'auto';
      audioUrlRef.current = soundUrl;
    }
    const audio = audioRef.current;
    audio.volume = Math.min(Math.max(soundVolume, 0), 1);
    audio.currentTime = 0;
    audio.play()?.catch(() => {});
  }, []);

  const applyTarget = useCallback(
    (value: number, snap: boolean) => {
      const cfg = cfgRef.current;
      let v = value;
      if (!cfg.loop) v = Math.min(Math.max(v, 0), Math.max(cfg.count - 1, 0));
      if (snap) v = Math.round(v);
      targetRef.current = v;
      const idx = ((Math.round(v) % cfg.count) + cfg.count) % cfg.count;
      if (idx !== selectedRef.current) {
        selectedRef.current = idx;
        setSelectedIndex(idx);
        onChangeRef.current?.(idx, cfg.items[idx]);
        playTick();
      }
      startLoop();
    },
    [startLoop, playTick]
  );

  // Local mod 5: silent external sync. Rotates the wheel to `idx` WITHOUT firing onChange, so a
  // parent driving the wheel from an outside source of truth (scroll position) cannot bounce the
  // update back out as a navigation event. Early-returns when already there.
  const syncToValue = useCallback(
    (idx: number) => {
      const cfg = cfgRef.current;
      const clamped = Math.min(Math.max(idx, 0), Math.max(cfg.count - 1, 0));
      if (clamped === selectedRef.current) return;
      targetRef.current = clamped;
      selectedRef.current = clamped;
      setSelectedIndex(clamped);
      startLoop();
    },
    [startLoop]
  );

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!cfgRef.current.draggable) return;
    dragRef.current = { y: e.clientY, start: targetRef.current, id: e.pointerId };
    dragMovedRef.current = false;
    setIsDragging(true);
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag) return;
      const dy = e.clientY - drag.y;
      if (!dragMovedRef.current && Math.abs(dy) > 4) {
        dragMovedRef.current = true;
        // Capture only once a real drag starts, so plain clicks still reach
        // the items and navigate to them.
        rootRef.current?.setPointerCapture(drag.id);
      }
      if (dragMovedRef.current) applyTarget(drag.start - dy / cfgRef.current.rowH, false);
    },
    [applyTarget]
  );

  const handlePointerEnd = useCallback(() => {
    if (!dragRef.current) return;
    dragRef.current = null;
    setIsDragging(false);
    if (dragMovedRef.current) applyTarget(targetRef.current, true);
  }, [applyTarget]);

  const handleItemClick = useCallback(
    (index: number) => {
      if (dragMovedRef.current) return;
      const cfg = cfgRef.current;
      const cur = targetRef.current;
      let d = index - (((cur % cfg.count) + cfg.count) % cfg.count);
      if (cfg.loop && cfg.count > 1) {
        if (d > cfg.count / 2) d -= cfg.count;
        else if (d < -cfg.count / 2) d += cfg.count;
      }
      applyTarget(cur + d, true);
    },
    [applyTarget]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const cfg = cfgRef.current;
      // Local mod 6b: Enter/Space activate the current section (re-affirm the selection so onChange
      // fires even if the wheel is already parked there); Home/End jump to first/last.
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        const idx = ((Math.round(targetRef.current) % cfg.count) + cfg.count) % cfg.count;
        onChangeRef.current?.(idx, cfg.items[idx]);
        return;
      }
      if (e.key === 'Home') {
        e.preventDefault();
        applyTarget(0, true);
        return;
      }
      if (e.key === 'End') {
        e.preventDefault();
        applyTarget(Math.max(cfg.count - 1, 0), true);
        return;
      }
      let delta: number | null = null;
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') delta = -1;
      else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') delta = 1;
      if (delta == null) return;
      e.preventDefault();
      applyTarget(Math.round(targetRef.current) + delta, true);
    },
    [applyTarget]
  );

  useEffect(() => {
    applyTarget(targetRef.current, false);
  }, [items, fontSize, spacing, curve, tilt, blur, fade, minOpacity, side, loop, smoothing, remPx, applyTarget]);

  // Local mod 5: push the controlled `value` into the wheel silently (no onChange).
  useEffect(() => {
    if (value == null) return;
    syncToValue(value);
  }, [value, syncToValue]);

  // Local mod 6d: track prefers-reduced-motion so the rAF loop can jump instead of ease.
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotionRef.current = mq.matches;
    const onChange = () => {
      reducedMotionRef.current = mq.matches;
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(
    () => () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      audioRef.current?.pause();
    },
    []
  );

  return (
    <div
      ref={rootRef}
      role="listbox"
      tabIndex={0}
      aria-label="Option wheel"
      aria-activedescendant={`ow-opt-${selectedIndex}`}
      className={`relative h-full w-full select-none overflow-hidden outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent-edge) [touch-action:none] ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}${className ? ` ${className}` : ''}`}
      style={
        {
          '--ow-text-color': textColor,
          '--ow-active-color': activeColor,
          '--ow-font-size': `${fontSize}rem`,
          '--ow-inset': `${inset}px`
        } as CSSProperties
      }
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onKeyDown={handleKeyDown}
    >
      {items.map((label, index) => (
        <div
          key={`${label}-${index}`}
          id={`ow-opt-${index}`}
          ref={el => {
            itemRefs.current[index] = el;
          }}
          role="option"
          aria-selected={selectedIndex === index}
          className={`absolute top-1/2 cursor-pointer whitespace-nowrap leading-none will-change-[transform,opacity,filter] [font-size:var(--ow-font-size)] [color:color-mix(in_srgb,var(--ow-active-color)_calc(var(--ow-p,0)*100%),var(--ow-text-color))] ${
            side === 'right' ? 'right-[var(--ow-inset)] origin-right' : 'left-[var(--ow-inset)] origin-left'
          } ${selectedIndex === index ? 'font-medium' : 'font-extralight'}`}
          onClick={() => handleItemClick(index)}
        >
          {label}
        </div>
      ))}
    </div>
  );
};

export default OptionWheel;
