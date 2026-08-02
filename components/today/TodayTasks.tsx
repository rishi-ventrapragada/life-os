"use client";

import { dueLabel, DUE_TIER_CLASS } from "@/lib/due";
import type { Task } from "@/components/tasks/types";

type TodayTasksProps = {
  tasks: Task[];
  todayIST: string;
  onComplete: (task: Task) => void;
  ready: boolean;
};

/**
 * Everything due within the next week (PRD §4.1c), completable in place so the
 * daily check-in never has to leave this section. Filtering uses the shared
 * lib/due.ts ladder — the same one TaskCard renders its badge from, so the two
 * can't disagree about what "overdue" means.
 *
 * The cut is an explicit "not Distant" test, not a null check: since the ladder
 * widened, every dated task gets a label, so the old `!== null` filter would
 * pass every task in the list including ones years out.
 */
export default function TodayTasks({
  tasks,
  todayIST,
  onComplete,
  ready,
}: TodayTasksProps) {
  // Pair each task with its label once (the filter and the row both need it),
  // then sort soonest-first. ISO dates sort chronologically as plain strings,
  // the same property the ladder itself relies on.
  const due = tasks
    .filter((t) => t.status !== "Done" && t.dueDate)
    .map((task) => ({ task, info: dueLabel(task.dueDate!, todayIST) }))
    .filter(({ info }) => info.tier !== "Distant")
    .sort((a, b) => a.task.dueDate!.localeCompare(b.task.dueDate!));

  if (due.length === 0) {
    return (
      <p className="text-sm text-(--color-text-muted)">
        Nothing due this week. Clear.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-1">
      {due.map(({ task, info }) => {
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
                className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-[0.1em] ${DUE_TIER_CLASS[info.tier]}`}
              >
                {info.text}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
