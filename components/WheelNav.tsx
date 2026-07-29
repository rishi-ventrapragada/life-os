"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import OptionWheel from "@/components/reactbits/OptionWheel";

/**
 * WheelNav — the desktop section navigation, rendered as a scroll-position INDICATOR.
 *
 * The wheel reflects scroll position; it is not a menu:
 *   - Page scroll  → an IntersectionObserver decides the current section → the wheel silently
 *     rotates to it (via OptionWheel's controlled `value` prop, which does NOT emit onChange).
 *   - Wheel click  → OptionWheel fires onChange → we scroll the page to that section.
 *
 * Single source of truth for "current section": the IntersectionObserver. To avoid the feedback
 * loop (scroll → wheel → onChange → scroll → …), two mechanisms:
 *   1. The wheel is driven by `value` and its sync is silent (no onChange), so a scroll-driven
 *      update can never bounce back out as a scroll command.
 *   2. `programmaticScrollRef` suppresses the observer while a click-driven scroll animates, cleared
 *      on `scrollend` (with a timeout fallback), so the observer can't flicker the wheel mid-scroll.
 *
 * Desktop only (`hidden md:flex`); the mobile nav is components/MobileNav.tsx.
 */

const SECTIONS = [
  { id: "today", label: "Today" },
  { id: "analytics", label: "Analytics" },
  { id: "goals", label: "Goals" },
  { id: "habits", label: "Habits" },
  { id: "tasks", label: "Tasks" },
  { id: "academics", label: "Academics" },
  { id: "fitness", label: "Fitness" },
  { id: "journal", label: "Journal" },
  { id: "pomodoro", label: "Pomodoro" },
] as const;

const LABELS = SECTIONS.map((s) => s.label);

export default function WheelNav() {
  const [activeIndex, setActiveIndex] = useState(0);
  // Suppresses the observer while a click-driven smooth-scroll animates.
  const programmaticScrollRef = useRef(false);
  const scrollEndTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Observer: sole authority on the current section for user scrolls. A thin band through the
  // vertical middle of the viewport (-45%/-45%) marks "current" — whichever section intersects it.
  useEffect(() => {
    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter(
      (el): el is HTMLElement => el != null,
    );
    if (els.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (programmaticScrollRef.current) return; // click-scroll owns the wheel right now
        // Pick the highest-index section currently in the band (the one scrolled furthest to).
        let best = -1;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const idx = SECTIONS.findIndex((s) => s.id === entry.target.id);
          if (idx > best) best = idx;
        }
        if (best >= 0) setActiveIndex(best);
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );

    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Wheel click → scroll the page to that section. Guard the observer for the scroll duration.
  const handleWheelChange = useCallback((index: number) => {
    const target = document.getElementById(SECTIONS[index].id);
    if (!target) return;

    setActiveIndex(index); // reflect immediately; observer stays suppressed until scrollend
    programmaticScrollRef.current = true;
    if (scrollEndTimerRef.current) clearTimeout(scrollEndTimerRef.current);

    const release = () => {
      programmaticScrollRef.current = false;
      window.removeEventListener("scrollend", release);
      if (scrollEndTimerRef.current) {
        clearTimeout(scrollEndTimerRef.current);
        scrollEndTimerRef.current = null;
      }
    };
    window.addEventListener("scrollend", release);
    // Fallback for browsers without `scrollend` (or if the scroll is a no-op): release after a beat.
    scrollEndTimerRef.current = setTimeout(release, 700);

    // No behavior arg: globals.css `scroll-behavior: smooth` animates it and already honours
    // prefers-reduced-motion (auto) via its media override.
    target.scrollIntoView();
  }, []);

  useEffect(
    () => () => {
      if (scrollEndTimerRef.current) clearTimeout(scrollEndTimerRef.current);
    },
    [],
  );

  return (
    <aside className="hidden md:flex sticky top-0 h-[100dvh] w-64 shrink-0 flex-col pb-24">
      <p className="mt-8 pl-8 font-display text-xs uppercase tracking-[0.2em] text-(--color-text-muted)">
        Life OS
      </p>
      {/* The wheel occupies the band between the wordmark above and the fixed AccountBlock below
          (the aside's pb-24 keeps flex-1 clear of it). A soft top/bottom mask dissolves items at the
          edges instead of hard-clipping against OptionWheel's own overflow-hidden root. */}
      <div className="relative min-h-0 flex-1 [mask-image:linear-gradient(to_bottom,transparent,black_12%,black_88%,transparent)] [-webkit-mask-image:linear-gradient(to_bottom,transparent,black_12%,black_88%,transparent)]">
        <OptionWheel
          items={LABELS}
          value={activeIndex}
          defaultSelected={0}
          onChange={handleWheelChange}
          blur={0}
          textColor="var(--color-accent-soft)"
          activeColor="var(--color-text)"
          fade={0.25}
          minOpacity={0}
          spacing={1.5}
          fontSize={1.9}
          tilt={0}
          curve={0}
          smoothing={200}
          inset={28}
          side="left"
          loop={false}
          draggable={false}
        />
      </div>
    </aside>
  );
}
