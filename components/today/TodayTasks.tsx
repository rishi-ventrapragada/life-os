"use client";

import { dueLabel } from "@/lib/due";
import type { Task } from "@/components/tasks/types";

type TodayTasksProps = {
  tasks: Task[];
  todayIST: string;
  onComplete: (task: Task) => void;
  ready: boolean;
};

/**
 * Tasks due today or overdue (PRD §4.1c), completable in place so the daily
 * check-in never has to leave this section. Filtering uses the shared
 * lib/due.ts comparison — the same one TaskCard renders its badge from, so the
 * two can't disagree about what "overdue" means.
 */
export default function TodayTasks({
  tasks,
  todayIST,
  onComplete,
  ready,
}: TodayTasksProps) {
  const due = tasks
    .filter((t) => t.status !== "Done")
    .filter((t) => t.dueDate && dueLabel(t.dueDate, todayIST) !== null);

  if (due.length === 0) {
    return (
      <p className="text-sm text-(--color-text-muted)">
        Nothing due today. Clear.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-1">
      {due.map((task) => {
        const label = dueLabel(task.dueDate!, todayIST);
        return (
          <li key={task.id}>
            <button
              type="button"
              onClick={() => onComplete(task)}
              disabled={!ready}
              className="group flex w-full items-center gap-3 rounded-lg py-1.5 text-left transition-transform duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent-edge) active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
              title="Mark done"
            >
              <span
                aria-hidden="true"
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-(--color-border) text-transparent transition-[opacity,transform] duration-150 group-hover:not-disabled:scale-110 group-hover:not-disabled:text-(--color-text-muted)"
              >
                <svg
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-3 w-3"
                >
                  <path d="M3.5 8.5l3 3 6-6" />
                </svg>
              </span>
              <span className="min-w-0 truncate text-sm text-(--color-text)">
                {task.title}
              </span>
              <span
                className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-[0.1em] ${
                  label === "Overdue"
                    ? "bg-red-500/15 text-red-300"
                    : "bg-(--color-accent)/15 text-(--color-accent-soft)"
                }`}
              >
                {label}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
