"use client";

import { WEEKDAYS, WEEK_DISPLAY_ORDER } from "@/lib/weekdays";
import type { SplitSlot } from "@/components/fitness/types";

type WeeklySplitProps = {
  slots: SplitSlot[];
  onEdit: (slot: SplitSlot) => void;
  onDelete: (slot: SplitSlot) => void;
};

/**
 * A one-row grid table — day columns, workout-name cells — matching the shape
 * of WeeklyTimetable so Academics and Fitness read as one system. There's no
 * time axis here (a split is one workout per day), so unlike the timetable
 * this never grows beyond a single body row.
 */
export default function WeeklySplit({ slots, onEdit, onDelete }: WeeklySplitProps) {
  const byDay = new Map<number, SplitSlot>();
  for (const s of slots) byDay.set(s.dayOfWeek, s);

  return (
    <div className="overflow-x-auto rounded-lg border border-(--color-border)">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr>
            {WEEK_DISPLAY_ORDER.map((day) => (
              <th
                key={day}
                className="border-b border-l border-(--color-border) p-3 text-left font-display text-xs uppercase tracking-[0.15em] text-(--color-accent-soft) first:border-l-0"
              >
                {WEEKDAYS[day]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {WEEK_DISPLAY_ORDER.map((day) => {
              const slot = byDay.get(day);
              return (
                <td
                  key={day}
                  className="border-l border-(--color-border) p-3 align-top first:border-l-0"
                >
                  {slot ? (
                    <div className="flex items-center justify-between gap-2">
                      <span className="min-w-0 truncate text-(--color-text)">
                        {slot.workoutName}
                      </span>
                      <span className="flex shrink-0 gap-0.5">
                        <button
                          type="button"
                          onClick={() => onEdit(slot)}
                          aria-label={`Edit ${slot.workoutName}`}
                          className="rounded px-1 py-0.5 text-xs text-(--color-text-muted) transition-opacity duration-150 hover:text-(--color-text) focus-visible:outline-2 focus-visible:outline-(--color-accent-edge) active:opacity-60"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(slot)}
                          aria-label={`Delete ${slot.workoutName}`}
                          className="rounded px-1 py-0.5 text-xs text-(--color-text-muted) transition-opacity duration-150 hover:text-red-400 focus-visible:outline-2 focus-visible:outline-(--color-accent-edge) active:opacity-60"
                        >
                          ✕
                        </button>
                      </span>
                    </div>
                  ) : (
                    <span className="text-(--color-text-muted)">Rest</span>
                  )}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
