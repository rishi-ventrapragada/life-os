"use client";

import { getTodayIST } from "@/lib/dates";
import { formatMonthLabel } from "@/lib/formatDate";
import type { JournalEntry } from "@/components/journal/useJournal";

type JournalCalendarProps = {
  entries: JournalEntry[];
  selectedDate: string | null;
  onSelect: (entryDate: string) => void;
};

/**
 * A flowing timeline of entry cells, oldest first — only days that actually
 * have an entry render (no empty-day scaffolding: a journal is sparse, unlike
 * a habit's every-day grid, so a full month grid was mostly dead space). Each
 * cell carries its own day-number label above it; a month label is inserted
 * inline right before the first entry of a new month, so the sequence still
 * reads chronologically without a hard section break per month.
 */
export default function JournalCalendar({
  entries,
  selectedDate,
  onSelect,
}: JournalCalendarProps) {
  const today = getTodayIST();
  const chronological = [...entries].sort((a, b) =>
    a.entryDate < b.entryDate ? -1 : a.entryDate > b.entryDate ? 1 : 0,
  );

  return (
    <div
      className="flex flex-wrap items-end gap-3"
      role="list"
      aria-label="Journal entries"
    >
      {chronological.map((entry, index) => {
        const month = entry.entryDate.slice(0, 7);
        const day = entry.entryDate.slice(8, 10);
        // A pure lookback instead of a mutated "last seen month" — render
        // must not reassign state across iterations (React 19 purity lint).
        const showMonth = index === 0 || chronological[index - 1].entryDate.slice(0, 7) !== month;
        const isToday = entry.entryDate === today;
        const isSelected = entry.entryDate === selectedDate;

        return (
          <div key={entry.id} className="flex items-end gap-3">
            {showMonth && (
              <p className="pb-1.5 font-display text-xs uppercase tracking-[0.2em] text-(--color-text-muted)">
                {formatMonthLabel(month)}
              </p>
            )}
            <button
              type="button"
              onClick={() => onSelect(entry.entryDate)}
              title={entry.entryDate}
              aria-label={`Open journal entry for ${entry.entryDate}`}
              aria-pressed={isSelected}
              className="flex flex-col items-center gap-1 rounded-md transition-[opacity,transform] duration-150 hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent-edge) active:scale-90"
            >
              <span className="text-xs text-(--color-text-muted)">{Number(day)}</span>
              <span
                className={`h-8 w-8 rounded-md ${
                  isSelected ? "bg-(--color-accent-edge)" : "bg-(--color-accent)"
                } ${isToday ? "ring-2 ring-(--color-accent-soft) ring-offset-2 ring-offset-(--color-bg)" : ""}`}
              />
            </button>
          </div>
        );
      })}
    </div>
  );
}
