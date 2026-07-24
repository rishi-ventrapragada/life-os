"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Reveal — a pure-CSS scroll-reveal wrapper. Its content starts translated-down and transparent,
 * then eases into place the first time it scrolls into view, once. Motion lives entirely in the
 * `.reveal` / `.reveal-in` rules in globals.css (transform + opacity only — no transition-all,
 * no filter/width/box-shadow). Reduced-motion callers just get the content, present, no animation.
 *
 * Why an own observer (never the wheel's): the Option Wheel (components/WheelNav.tsx) derives its
 * position from a SEPARATE IntersectionObserver on the <section> wrappers. This component wraps
 * content blocks INSIDE sections and animates only transform/opacity — which don't affect layout —
 * so the observed section's box never shifts and the wheel never jitters. Do not wrap a <section>
 * with this.
 *
 * Stagger: `index` sets `--reveal-delay` (index * STAGGER_MS) so blocks within a section cascade.
 * Distance/duration/easing are fixed in CSS, identical everywhere → one consistent reveal feel.
 */

const STAGGER_MS = 120;

type RevealProps = {
  children: ReactNode;
  /** Position within a group; sets the CSS reveal delay (index * 120ms). */
  index?: number;
  className?: string;
};

export default function Reveal({ children, index = 0, className = "" }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // No IntersectionObserver (very old browser / SSR fallback path already visible): just show it.
    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("reveal-in");
      return;
    }

    // Already in view on mount? Reveal without waiting for a scroll.
    const observer = new IntersectionObserver(
      (entries, obs) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal-in");
            obs.unobserve(entry.target); // reveal-once
            obs.disconnect();
          }
        }
      },
      { threshold: 0.15 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${className}`}
      style={{ "--reveal-delay": `${index * STAGGER_MS}ms` } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
