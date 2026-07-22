"use client";

import { useCallback, useEffect, useState } from "react";
import { PHASE_MS, nextPhase, type Phase } from "@/lib/pomodoro";

type RunState = "idle" | "running" | "paused";

/**
 * A 25/5 Pomodoro timer, frontend-only (PRD §4.8) — no database, no persistence.
 *
 * Law 3 note: this is a *duration* timer, not calendar-date logic, so
 * getTodayIST() does not apply and CLAUDE.md's "no custom clocks" rule (aimed at
 * ad-hoc date maths) is not the constraint here. But the implementation is still
 * timestamp-based rather than tick-decrement: the remaining time is derived from
 * a target `endAt = Date.now() + remaining`, and the interval only recomputes
 * `remaining` from that target. Decrementing a counter each tick would drift and,
 * worse, stall when a background tab throttles or pauses its intervals; recomputing
 * from the wall clock each tick stays accurate through both.
 *
 * The wall clock is read inside effects/handlers, never during render — render
 * only reads state (`remaining`), keeping the component pure.
 */
export function usePomodoro() {
  const [phase, setPhase] = useState<Phase>("work");
  const [runState, setRunState] = useState<RunState>("idle");
  // When running: the wall-clock instant the phase ends. When idle/paused: null.
  const [endAt, setEndAt] = useState<number | null>(null);
  // The ms left, recomputed from endAt while running and frozen otherwise. This
  // is the single value render reads.
  const [remaining, setRemaining] = useState<number>(PHASE_MS.work);

  function start() {
    if (runState === "running") return;
    setEndAt(Date.now() + remaining);
    setRunState("running");
  }

  function pause() {
    if (runState !== "running" || endAt === null) return;
    setRemaining(Math.max(0, endAt - Date.now()));
    setEndAt(null);
    setRunState("paused");
  }

  const reset = useCallback(
    (toPhase: Phase = phase) => {
      setEndAt(null);
      setRemaining(PHASE_MS[toPhase]);
      setRunState("idle");
    },
    [phase],
  );

  /** Move to the other phase, reset to full, and stop (never auto-runs away). */
  const advance = useCallback(() => {
    const np = nextPhase(phase);
    setPhase(np);
    setEndAt(null);
    setRemaining(PHASE_MS[np]);
    setRunState("idle");
  }, [phase]);

  // The one interval: while running, recompute `remaining` from the wall clock
  // ~4x/sec, and hand off to the next phase when the target instant passes. The
  // value is always recomputed from endAt — never decremented — so a throttled or
  // missed tick can't desync it.
  useEffect(() => {
    if (runState !== "running" || endAt === null) return;
    const tick = () => {
      const now = Date.now();
      if (now >= endAt) advance();
      else setRemaining(endAt - now);
    };
    tick(); // sync immediately so the display doesn't wait up to 250ms
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [runState, endAt, advance]);

  return {
    phase,
    runState,
    remaining,
    start,
    pause,
    reset: () => reset(),
    skip: advance,
  };
}
