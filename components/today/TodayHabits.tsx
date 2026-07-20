"use client";

import type { Habit } from "@/components/habits/types";

type TodayHabitsProps = {
  habits: Habit[];
  /** False until the seed + session resolve (D1 guard) — boxes stay inert. */
  ready: boolean;
  onToggle: (habit: Habit) => void;
};

/**
 * Active habits with today's checkbox (PRD §4.1b), checkable without leaving
 * the section. Reuses useHabits().toggleToday via the onToggle prop — no
 * parallel query, no second write path.
 */
export default function TodayHabits({ habits, ready, onToggle }: TodayHabitsProps) {
  if (habits.length === 0) {
    return (
      <p className="text-sm text-(--color-text-muted)">
        No habits yet — add one in the Habits section.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-1">
      {habits.map((habit) => (
        <li key={habit.id}>
          <button
            type="button"
            onClick={() => onToggle(habit)}
            disabled={!ready}
            aria-pressed={habit.checkedToday}
            className="group flex w-full items-center gap-3 rounded-lg py-1.5 text-left transition-transform duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent-edge) active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span
              aria-hidden="true"
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-[opacity,transform] duration-150 group-hover:not-disabled:scale-110 ${
                habit.checkedToday
                  ? "border-(--color-accent) bg-(--color-accent) text-white"
                  : "border-(--color-border) text-transparent"
              }`}
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
            <span
              className={`min-w-0 truncate text-sm ${
                habit.checkedToday
                  ? "text-(--color-text-muted) line-through"
                  : "text-(--color-text)"
              }`}
            >
              {habit.name}
            </span>
            <span className="ml-auto shrink-0 text-[0.65rem] uppercase tracking-[0.15em] text-(--color-text-muted)">
              {habit.area}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
