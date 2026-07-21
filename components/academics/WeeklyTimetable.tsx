"use client";

import { WEEKDAYS, type TimetableSlot } from "@/components/academics/types";

type WeeklyTimetableProps = {
  slots: TimetableSlot[];
  onEdit: (slot: TimetableSlot) => void;
  onDelete: (slot: TimetableSlot) => void;
};

// Study-week order: Monday first, Sunday last. Indices map back to day_of_week
// (0=Sun..6=Sat) — a fixed constant array, never new Date() (Law 3).
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export default function WeeklyTimetable({
  slots,
  onEdit,
  onDelete,
}: WeeklyTimetableProps) {
  const byDay = new Map<number, TimetableSlot[]>();
  for (const s of slots) {
    const list = byDay.get(s.dayOfWeek);
    if (list) list.push(s);
    else byDay.set(s.dayOfWeek, [s]);
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {DISPLAY_ORDER.map((day) => {
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
              <p className="text-xs text-(--color-text-muted)">—</p>
            ) : (
              daySlots.map((s) => (
                <div
                  key={s.id}
                  className="group flex items-center justify-between gap-2 text-sm"
                >
                  <span className="min-w-0">
                    <span className="text-(--color-text-muted)">{s.timeLabel}</span>{" "}
                    <span className="text-(--color-text)">{s.subject}</span>
                  </span>
                  <span className="flex shrink-0 gap-0.5">
                    <button
                      type="button"
                      onClick={() => onEdit(s)}
                      aria-label={`Edit ${s.subject}`}
                      className="rounded px-1 py-0.5 text-xs text-(--color-text-muted) transition-opacity duration-150 hover:text-(--color-text) focus-visible:outline-2 focus-visible:outline-(--color-accent-edge) active:opacity-60"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(s)}
                      aria-label={`Delete ${s.subject}`}
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
