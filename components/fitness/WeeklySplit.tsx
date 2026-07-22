"use client";

import { WEEKDAYS, WEEK_DISPLAY_ORDER } from "@/lib/weekdays";
import type { SplitSlot } from "@/components/fitness/types";

type WeeklySplitProps = {
  slots: SplitSlot[];
  onEdit: (slot: SplitSlot) => void;
  onDelete: (slot: SplitSlot) => void;
};

export default function WeeklySplit({ slots, onEdit, onDelete }: WeeklySplitProps) {
  const byDay = new Map<number, SplitSlot[]>();
  for (const s of slots) {
    const list = byDay.get(s.dayOfWeek);
    if (list) list.push(s);
    else byDay.set(s.dayOfWeek, [s]);
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {WEEK_DISPLAY_ORDER.map((day) => {
        const daySlots = byDay.get(day) ?? [];
        return (
          <div
            key={day}
            className="flex flex-col gap-2 rounded-lg border border-(--color-border) p-3"
          >
            <p className="font-display text-xs uppercase tracking-[0.15em] text-(--color-accent-soft)">
              {WEEKDAYS[day]}
            </p>
            {daySlots.length === 0 ? (
              <p className="text-xs text-(--color-text-muted)">Rest</p>
            ) : (
              daySlots.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="min-w-0 truncate text-(--color-text)">{s.workoutName}</span>
                  <span className="flex shrink-0 gap-0.5">
                    <button
                      type="button"
                      onClick={() => onEdit(s)}
                      aria-label={`Edit ${s.workoutName}`}
                      className="rounded px-1 py-0.5 text-xs text-(--color-text-muted) transition-opacity duration-150 hover:text-(--color-text) focus-visible:outline-2 focus-visible:outline-(--color-accent-edge) active:opacity-60"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(s)}
                      aria-label={`Delete ${s.workoutName}`}
                      className="rounded px-1 py-0.5 text-xs text-(--color-text-muted) transition-opacity duration-150 hover:text-red-400 focus-visible:outline-2 focus-visible:outline-(--color-accent-edge) active:opacity-60"
                    >
                      ✕
                    </button>
                  </span>
                </div>
              ))
            )}
          </div>
        );
      })}
    </div>
  );
}
