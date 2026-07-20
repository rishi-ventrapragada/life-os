import { addDaysISO } from "@/lib/dates";
import { WEEK_DAYS, weekProgress } from "@/lib/week";

type WeekProgressProps = {
  habits: { checkDates: string[] }[];
  todayIST: string;
};

/**
 * The small week-progress indicator (PRD §4.1e) — a row of day dots plus the
 * headline fraction. Deliberately NOT a chart: charts are post-v1 (PRD §11).
 *
 * All maths lives in lib/week.ts (Step 9 decision W: trailing 7 days ending
 * today). This component only renders what that pure function returns.
 */
export default function WeekProgress({ habits, todayIST }: WeekProgressProps) {
  const { checked, total, pct } = weekProgress(habits, todayIST);

  // Oldest -> newest, so the row reads left-to-right ending on today.
  const days = Array.from({ length: WEEK_DAYS }, (_, i) =>
    addDaysISO(todayIST, -(WEEK_DAYS - 1 - i)),
  );
  const checkedDates = new Set(habits.flatMap((h) => h.checkDates));

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <div className="flex items-center gap-1.5" aria-hidden="true">
        {days.map((date) => (
          <span
            key={date}
            title={date}
            className={`h-2 w-6 rounded-full ${
              checkedDates.has(date)
                ? "bg-(--color-accent)"
                : "bg-(--color-border)/60"
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-(--color-text-muted)">
        {total === 0 ? (
          "No habits yet"
        ) : (
          <>
            <span className="text-(--color-text)">{pct}%</span> this week —{" "}
            {checked} of {total} checks
          </>
        )}
      </p>
    </div>
  );
}
