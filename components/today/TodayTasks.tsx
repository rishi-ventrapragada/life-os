"use client";

import { DUE_TIER_CLASS } from "@/lib/due";
import type { DueItem } from "@/lib/dueItems";

type TodayTasksProps = {
  items: DueItem[];
  onComplete: (item: DueItem) => void;
  ready: boolean;
};

/**
 * Everything due within the next week (PRD §4.1c) — tasks AND assignments in
 * one list — completable in place so the daily check-in never has to leave this
 * section.
 *
 * The merge, the due-window filter and the ordering all live in
 * lib/dueItems.ts, which routes both sources through the same lib/due.ts ladder
 * TaskCard and AssignmentList render their own badges from. This component only
 * renders what that pure function returns; it holds no filtering logic of its
 * own, so Today can never drift from either section about what "overdue" means.
 *
 * Assignments carry a course name as `subtitle`; tasks have none, which is what
 * distinguishes the two kinds in the combined list.
 */
export default function TodayTasks({
  items,
  onComplete,
  ready,
}: TodayTasksProps) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-(--color-text-muted)">
        Nothing due this week. Clear.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-1">
      {items.map((item) => (
        <li key={item.id}>
          <button
            type="button"
            onClick={() => onComplete(item)}
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

            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm text-(--color-text)">
                {item.title}
              </span>
              {/* Only assignments carry a subtitle — it is what tells the two
                  kinds apart without adding a badge to every row. */}
              {item.subtitle && (
                <span className="block truncate text-xs text-(--color-text-muted)">
                  {item.subtitle}
                </span>
              )}
            </span>

            <span
              className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-[0.1em] ${DUE_TIER_CLASS[item.info.tier]}`}
            >
              {item.info.text}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
