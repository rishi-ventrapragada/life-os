"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PHASE_MS, nextPhase, type Phase } from "@/lib/pomodoro";

type RunState = "idle" | "running" | "paused";

/**
 * A 25/5 Pomodoro timer, frontend-only (PRD §4.8) — no database, no persistence.
 *
 * Law 3 note: this is a *duration* timer, not calendar-date logic, so
 * getTodayIST() does not apply and CLAUDE.md's "no custom clocks" rule (aimed at
 * ad-hoc date maths) is not the constraint here. But the implementation is still
 * timestamp-based rather than tick-decrement: the remaining time is derived from
 * a target `endAt = Date.now() + remaining`, and setInterval only forces a
 * re-render. Decrementing a counter each tick would drift and, worse, stall when
 * a background tab throttles or pauses its intervals; reading the wall clock each
 * render stays accurate through both.
 */
export function usePomodoro() {
  const [phase, setPhase] = useState<Phase>("work");
  const [runState, setRunState] = useState<RunState>("idle");
  // When running: the wall-clock instant the phase ends. When idle/paused: null,
  // and `remaining` holds the frozen ms left.
  const endAtRef = useRef<number | null>(null);
  const [remaining, setRemaining] = useState<number>(PHASE_MS.work);
  // Forces re-render ~4x/sec while running so the display tracks the wall clock.
  const [, setTick] = useState(0);

  const remainingNow = useCallback(() => {
    if (runState === "running" && endAtRef.current !== null) {
      return Math.max(0, endAtRef.current - Date.now());
    }
    return remaining;
  }, [runState, remaining]);

  function start() {
    if (runState === "running") return;
    endAtRef.current = Date.now() + remaining;
    setRunState("running");
  }

  function pause() {
    if (runState !== "running") return;
    setRemaining(remainingNow());
    endAtRef.current = null;
    setRunState("paused");
  }

  const reset = useCallback(
    (toPhase: Phase = phase) => {
      endAtRef.current = null;
      setRemaining(PHASE_MS[toPhase]);
      setRunState("idle");
    },
    [phase],
  );

  /** Move to the other phase, reset to full, and stop (never auto-runs away). */
  const advance = useCallback(() => {
    const np = nextPhase(phase);
    setPhase(np);
    endAtRef.current = null;
    setRemaining(PHASE_MS[np]);
    setRunState("idle");
  }, [phase]);

  // The one interval: while running, re-render to re-read the wall clock, and
  // hand off to the next phase when the target instant passes. The value never
  // lives in the interval — it is always recomputed from endAt — so a throttled
  // or missed tick can't desync it.
  useEffect(() => {
    if (runState !== "running") return;
    const id = setInterval(() => {
      if (endAtRef.current !== null && Date.now() >= endAtRef.current) {
        advance();
      } else {
        setTick((t) => t + 1);
      }
    }, 250);
    return () => clearInterval(id);
  }, [runState, advance]);

  return {
    phase,
    runState,
    remaining: remainingNow(),
    start,
    pause,
    reset: () => reset(),
    skip: advance,
  };
}
