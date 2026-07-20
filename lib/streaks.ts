import { addDaysISO, diffDaysISO } from "@/lib/dates";

export type Streaks = {
  /** Length of the unbroken run ending today or yesterday; 0 if broken. */
  current: number;
  /** Longest unbroken run anywhere in the supplied history. */
  max: number;
};

/**
 * Streaks computed from `habit_checks` dates — a pure function of
 * (checkDates, todayIST), never a stored column. A stored streak would desync
 * the moment a row is backdated, deleted, or a habit archived; these rows are
 * the single source of truth (PRD §6).
 *
 * Dates are "yyyy-mm-dd" strings throughout. ISO dates sort lexicographically
 * into chronological order, so sorting needs no Date objects, and gaps are
 * measured with diffDaysISO — never `new Date(dateString)`, whose local-time
 * parsing would shift dates in some timezones (Architecture Law 3).
 *
 * Decision D1 — a run ending YESTERDAY still counts as current, because today
 * isn't over in IST yet. The value returned is the run's actual length: a run
 * of 3 ending yesterday reads 3, and checking today makes it 4. It never
 * optimistically includes an unchecked today (which would force the number to
 * *drop* at midnight if the day were missed — a streak that decreases while you
 * do nothing reads as a bug).
 */
export function computeStreaks(checkDates: string[], todayIST: string): Streaks {
  if (checkDates.length === 0) return { current: 0, max: 0 };

  // Copy before sorting — the caller's array must not be mutated — and dedupe.
  const dates = [...new Set(checkDates)].sort();

  let max = 1;
  let run = 1;
  for (let i = 1; i < dates.length; i++) {
    run = diffDaysISO(dates[i], dates[i - 1]) === 1 ? run + 1 : 1;
    if (run > max) max = run;
  }

  return { current: currentRun(dates, todayIST), max };
}

/**
 * The run ending at today or yesterday. Anything older means the chain is
 * broken. Future-dated rows are ignored rather than trusted: they shouldn't
 * exist, but they must not be able to inflate the number.
 */
function currentRun(sorted: string[], todayIST: string): number {
  const yesterday = addDaysISO(todayIST, -1);
  const owned = new Set(sorted.filter((d) => d <= todayIST));

  let cursor = owned.has(todayIST)
    ? todayIST
    : owned.has(yesterday)
      ? yesterday
      : null;
  if (!cursor) return 0;

  let count = 0;
  while (owned.has(cursor)) {
    count++;
    cursor = addDaysISO(cursor, -1);
  }
  return count;
}
