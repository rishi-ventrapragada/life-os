"use client";

import { usePomodoro } from "@/components/pomodoro/usePomodoro";
import { formatRemaining } from "@/lib/pomodoro";

const btn =
  "rounded-md px-4 py-2 text-sm font-medium transition-[opacity,transform] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent-edge) active:scale-95";

export default function PomodoroTimer() {
  const { phase, runState, remaining, start, pause, reset, skip } = usePomodoro();

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <p className="font-display text-xs uppercase tracking-[0.25em] text-(--color-accent-soft)">
        {phase === "work" ? "Focus" : "Break"}
      </p>

      {/* tabular-nums keeps every digit the same width, so the countdown
          doesn't jitter as the numbers change. */}
      <p className="font-display text-7xl font-bold tabular-nums tracking-tight text-(--color-text)">
        {formatRemaining(remaining)}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {runState === "running" ? (
          <button
            type="button"
            onClick={pause}
            className={`${btn} bg-(--color-accent) text-white hover:opacity-85`}
          >
            Pause
          </button>
        ) : (
          <button
            type="button"
            onClick={start}
            className={`${btn} bg-(--color-accent) text-white hover:opacity-85`}
          >
            {runState === "paused" ? "Resume" : "Start"}
          </button>
        )}
        <button
          type="button"
          onClick={reset}
          className={`${btn} border border-(--color-border) text-(--color-text-muted) hover:text-(--color-text)`}
        >
          Reset
        </button>
        <button
          type="button"
          onClick={skip}
          className={`${btn} border border-(--color-border) text-(--color-text-muted) hover:text-(--color-text)`}
        >
          Skip to {phase === "work" ? "break" : "focus"}
        </button>
      </div>
    </div>
  );
}
