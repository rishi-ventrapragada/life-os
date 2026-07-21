export const WORK_MS = 25 * 60 * 1000;
export const BREAK_MS = 5 * 60 * 1000;

export type Phase = "work" | "break";

export const PHASE_MS: Record<Phase, number> = {
  work: WORK_MS,
  break: BREAK_MS,
};

/**
 * Milliseconds remaining -> "mm:ss". Rounds UP so a timer started at 25:00
 * reads "25:00" for the first second rather than flicking straight to 24:59,
 * and never shows a negative value. Pure — no clock read, no Date object; the
 * caller supplies the remaining time it computed from a wall-clock timestamp.
 */
export function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const mm = Math.floor(totalSeconds / 60);
  const ss = totalSeconds % 60;
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

/** The phase that follows the current one (work <-> break). */
export function nextPhase(phase: Phase): Phase {
  return phase === "work" ? "break" : "work";
}
