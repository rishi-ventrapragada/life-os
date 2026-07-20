import { getTodayIST } from "@/lib/dates";

type HabitGridProps = {
  /** Every "yyyy-mm-dd" check in the fetched window; other months are ignored. */
  checkDates: string[];
};

/**
 * GitHub-style completion grid for the CURRENT IST month.
 *
 * The month comes from getTodayIST().slice(0, 7) — never the browser clock
 * (Architecture Law 3), so a user abroad still sees their IST month. Day count
 * comes from Date.UTC(y, m, 0).getUTCDate(): day 0 of the *next* month is the
 * last day of this one, which handles February and leap years without a table.
 *
 * Cells are presentational, not buttons: the only writable day is today, and
 * the card's checkbox already owns that. Future days are styled distinctly from
 * missed ones — otherwise a fresh month reads as a wall of failure.
 */
export default function HabitGrid({ checkDates }: HabitGridProps) {
  const today = getTodayIST();
  const month = today.slice(0, 7); // "yyyy-mm"
  const [year, mon] = month.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(year, mon, 0)).getUTCDate();

  const checked = new Set(checkDates);

  return (
    <div>
      <div className="flex flex-wrap gap-1" role="list" aria-label={`Completions for ${month}`}>
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = String(i + 1).padStart(2, "0");
          const date = `${month}-${day}`;
          const isChecked = checked.has(date);
          const isToday = date === today;
          const isFuture = date > today;

          return (
            <span
              key={date}
              role="listitem"
              title={`${date}${isChecked ? " — done" : isFuture ? "" : " — missed"}`}
              aria-label={`${date}${isChecked ? ", done" : isFuture ? ", upcoming" : ", missed"}`}
              className={`h-3.5 w-3.5 rounded-[3px] ${
                isChecked
                  ? "bg-(--color-accent)"
                  : isFuture
                    ? "border border-(--color-border)/40"
                    : "bg-(--color-border)/50"
              } ${isToday ? "ring-1 ring-(--color-accent-soft) ring-offset-1 ring-offset-(--color-bg)" : ""}`}
            />
          );
        })}
      </div>
    </div>
  );
}
