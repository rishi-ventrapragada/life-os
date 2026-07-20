import { addDaysISO } from "@/lib/dates";

/** Days in the trailing window, including today. */
export const WEEK_DAYS = 7;

export type WeekProgress = {
  /** Checks landed inside the window, across all habits. */
  checked: number;
  /** habits × WEEK_DAYS — the perfect score. */
  total: number;
  /** checked/total as a whole-number percentage; 0 when there are no habits. */
  pct: number;
};

/** Only the field this maths needs — any Habit satisfies it structurally. */
type HasCheckDates = { checkDates: string[] };

/**
 * Week progress over the TRAILING 7 days ending today (Step 9 decision W):
 * addDaysISO(today, -6) .. today inclusive, scored as checks landed over
 * (active habits × 7).
 *
 * A trailing window is always full, so the figure never looks artificially bad
 * on a Monday the way a Mon–Sun calendar week would — the daily check-in asks
 * "how have I been doing lately?", not "how am I doing against the calendar?".
 *
 * Pure: `today` is a parameter, never a clock read, and comparisons are
 * lexicographic on "yyyy-mm-dd" strings — no Date objects (Architecture Law 3).
 */
export function weekProgress(
  habits: HasCheckDates[],
  todayIST: string,
): WeekProgress {
  const total = habits.length * WEEK_DAYS;
  if (total === 0) return { checked: 0, total: 0, pct: 0 };

  const windowStart = addDaysISO(todayIST, -(WEEK_DAYS - 1));

  let checked = 0;
  for (const habit of habits) {
    for (const date of habit.checkDates) {
      // Future-dated rows shouldn't exist, but must never inflate the score.
      if (date >= windowStart && date <= todayIST) checked++;
    }
  }

  return { checked, total, pct: Math.round((checked / total) * 100) };
}
