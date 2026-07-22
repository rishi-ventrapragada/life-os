"use client";

import { formatISODate } from "@/lib/formatDate";
import type { WorkoutArea, WorkoutLog } from "@/components/fitness/types";

type WorkoutLogListProps = {
  logs: WorkoutLog[];
  ready: boolean;
  onToggle: (log: WorkoutLog) => void;
  onEdit: (log: WorkoutLog) => void;
  onDelete: (log: WorkoutLog) => void;
};

const AREA_CLASS: Record<WorkoutArea, string> = {
  Gym: "border-(--color-accent)/40 text-(--color-accent-soft)",
  Calisthenics: "border-emerald-500/40 text-emerald-300",
  Other: "border-(--color-border) text-(--color-text-muted)",
};

export default function WorkoutLogList({
  logs,
  ready,
  onToggle,
  onEdit,
  onDelete,
}: WorkoutLogListProps) {
  if (logs.length === 0) {
    return <p className="text-sm text-(--color-text-muted)">No workouts logged yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {logs.map((log) => (
        <li
          key={log.id}
          className="flex flex-wrap items-start gap-3 rounded-lg border border-(--color-border) px-3 py-2"
        >
          <button
            type="button"
            onClick={() => onToggle(log)}
            disabled={!ready}
            aria-pressed={log.completed}
            title={log.completed ? "Mark not done" : "Mark done"}
            className="group mt-0.5 flex shrink-0 items-center transition-transform duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent-edge) active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span
              aria-hidden="true"
              className={`flex h-5 w-5 items-center justify-center rounded border transition-[opacity,transform] duration-150 group-hover:not-disabled:scale-110 ${
                log.completed
                  ? "border-(--color-accent) bg-(--color-accent) text-white"
                  : "border-(--color-border) text-transparent"
              }`}
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                <path d="M3.5 8.5l3 3 6-6" />
              </svg>
            </span>
          </button>

          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-2">
              <span className={`text-sm ${log.completed ? "text-(--color-text)" : "text-(--color-text-muted) line-through"}`}>
                {log.workoutName}
              </span>
              <span className={`rounded-full border px-2 py-0.5 text-[0.6rem] font-medium uppercase tracking-[0.1em] ${AREA_CLASS[log.area]}`}>
                {log.area}
              </span>
            </span>
            <span className="mt-0.5 block text-xs text-(--color-text-muted)">
              {formatISODate(log.logDate)}
              {!log.completed && " · skipped"}
            </span>
            {log.notes && (
              <span className="mt-1 block whitespace-pre-wrap text-xs leading-[1.6] text-(--color-text-muted)">
                {log.notes}
              </span>
            )}
          </span>

          <span className="flex shrink-0 gap-1">
            <button type="button" onClick={() => onEdit(log)} className="rounded-md px-2 py-1 text-xs text-(--color-text-muted) transition-opacity duration-150 hover:text-(--color-text) focus-visible:outline-2 focus-visible:outline-(--color-accent-edge) active:opacity-60">
              Edit
            </button>
            <button type="button" onClick={() => onDelete(log)} className="rounded-md px-2 py-1 text-xs text-(--color-text-muted) transition-opacity duration-150 hover:text-red-400 focus-visible:outline-2 focus-visible:outline-(--color-accent-edge) active:opacity-60">
              Delete
            </button>
          </span>
        </li>
      ))}
    </ul>
  );
}
