"use client";

import { WEEKDAYS, WEEK_DISPLAY_ORDER } from "@/lib/weekdays";
import type { TimetableSlot } from "@/components/academics/types";

type WeeklyTimetableProps = {
  slots: TimetableSlot[];
  onEdit: (slot: TimetableSlot) => void;
  onDelete: (slot: TimetableSlot) => void;
};

/**
 * Minutes-since-midnight for a label's start time, for chronological column
 * ordering. Labels are free text like "09:20-10:10" or "01:30-02:20" with no
 * AM/PM marker (Law: timeLabel has no fixed schema), so this assumes a class-
 * day convention: hour 8-12 is morning, hour 1-7 is afternoon (+12h). A label
 * that doesn't start with "H:MM" or "HH:MM" sorts last rather than throwing.
 */
function startMinutes(label: string): number {
  const match = /^(\d{1,2}):(\d{2})/.exec(label);
  if (!match) return Number.MAX_SAFE_INTEGER;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  const hour24 = hour >= 8 && hour <= 12 ? hour : hour + 12;
  return hour24 * 60 + minute;
}

/** One column's render instruction after merging same-subject runs. */
type Column =
  | { kind: "empty" }
  | { kind: "skip" }
  | { kind: "cell"; slot: TimetableSlot; span: number; run: TimetableSlot[] };

/**
 * Walks one day's slots in column order (`timeLabels`) and merges adjacent
 * same-subject runs (e.g. a 3-period lab) into one `"cell"` entry with
 * `span`, followed by `span - 1` `"skip"` entries the renderer omits — so the
 * column list always has exactly one entry per time label, 1:1 with the
 * header row. Consecutive means column-adjacency, not time-contiguity: a gap
 * column (no slot, or a different subject) always breaks a run.
 */
function mergeDay(
  timeLabels: string[],
  slotAt: (label: string) => TimetableSlot | undefined,
): Column[] {
  const columns: Column[] = [];
  let i = 0;
  while (i < timeLabels.length) {
    const slot = slotAt(timeLabels[i]);
    if (!slot) {
      columns.push({ kind: "empty" });
      i += 1;
      continue;
    }
    const run = [slot];
    let j = i + 1;
    while (j < timeLabels.length) {
      const next = slotAt(timeLabels[j]);
      if (!next || next.subject !== slot.subject) break;
      run.push(next);
      j += 1;
    }
    columns.push({ kind: "cell", slot, span: j - i, run });
    for (let k = 1; k < j - i; k++) columns.push({ kind: "skip" });
    i = j;
  }
  return columns;
}

/**
 * A grid table — day rows × time-slot columns — matching the shape of a real
 * class timetable. Columns are derived from whatever timeLabels are actually
 * in use (no fixed period count) and ordered chronologically via
 * startMinutes, not lexicographically — "09:20" must sort before "01:30" PM.
 *
 * Consecutive same-subject slots on a day (e.g. a 3-period lab) render as one
 * merged, more-visibly-bordered cell via colSpan — still separate rows in
 * timetable_slots underneath, so editing/deleting elsewhere is unaffected.
 * ✕ on a merged cell deletes every slot in the run; Edit opens the first.
 *
 * Sized to fit the page's max-w-5xl content column without horizontal
 * scroll: compact padding/text, and the day column plus each time column
 * share the available width evenly instead of forcing a wide min-width.
 */
export default function WeeklyTimetable({
  slots,
  onEdit,
  onDelete,
}: WeeklyTimetableProps) {
  const timeLabels = Array.from(new Set(slots.map((s) => s.timeLabel))).sort(
    (a, b) => startMinutes(a) - startMinutes(b),
  );

  const byDayAndTime = new Map<string, TimetableSlot>();
  for (const s of slots) byDayAndTime.set(`${s.dayOfWeek}|${s.timeLabel}`, s);

  if (timeLabels.length === 0) {
    return (
      <p className="text-sm text-(--color-text-muted)">
        No timetable slots yet. Add one to start building your week.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-(--color-border)">
      <table className="w-full table-fixed border-collapse text-xs">
        <thead>
          <tr>
            <th className="w-16 border-b border-(--color-border) p-1.5 text-left font-display uppercase tracking-[0.1em] text-(--color-text-muted)">
              Day
            </th>
            {timeLabels.map((label) => (
              <th
                key={label}
                className="border-b border-l border-(--color-border) p-1.5 text-left font-display uppercase tracking-[0.05em] text-(--color-accent-soft)"
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* A class timetable has no Sunday (WEEK_DISPLAY_ORDER's last
              entry); Fitness's split table still shows all 7 via the same
              shared constant, so the day is filtered out here only. */}
          {WEEK_DISPLAY_ORDER.filter((day) => day !== 0).map((day) => {
            const columns = mergeDay(timeLabels, (label) =>
              byDayAndTime.get(`${day}|${label}`),
            );

            return (
              <tr key={day}>
                <th className="border-b border-(--color-border) p-1.5 text-left font-display uppercase tracking-[0.1em] text-(--color-text-muted)">
                  {WEEKDAYS[day].slice(0, 3)}
                </th>
                {columns.map((col, i) => {
                  if (col.kind === "skip") return null;
                  if (col.kind === "empty") {
                    return (
                      <td
                        key={timeLabels[i]}
                        className="border-b border-l border-(--color-border) p-1.5 text-center align-middle"
                      >
                        <span className="text-(--color-text-muted)">—</span>
                      </td>
                    );
                  }
                  const { slot, span, run } = col;
                  const merged = span > 1;
                  return (
                    <td
                      key={timeLabels[i]}
                      colSpan={span}
                      className={`relative border-b border-l border-(--color-border) p-1.5 text-center align-middle ${
                        merged ? "bg-(--color-accent)/5 z-10 outline outline-2 -outline-offset-1 outline-(--color-accent)/60" : ""
                      }`}
                    >
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="min-w-0 truncate text-(--color-text)">
                          {slot.subject}
                        </span>
                        <span className="flex shrink-0 justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => onEdit(slot)}
                            aria-label={`Edit ${slot.subject}`}
                            className="rounded px-1 py-0.5 text-[0.65rem] text-(--color-text-muted) transition-opacity duration-150 hover:text-(--color-text) focus-visible:outline-2 focus-visible:outline-(--color-accent-edge) active:opacity-60"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => run.forEach(onDelete)}
                            aria-label={`Delete ${slot.subject}`}
                            className="rounded px-1 py-0.5 text-[0.65rem] text-(--color-text-muted) transition-opacity duration-150 hover:text-red-400 focus-visible:outline-2 focus-visible:outline-(--color-accent-edge) active:opacity-60"
                          >
                            ✕
                          </button>
                        </span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
