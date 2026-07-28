import { addDaysISO, diffDaysISO } from "@/lib/dates";

/** Days in the trailing consistency window, including today. */
export const CONSISTENCY_WINDOW_DAYS = 30;

/** Only the fields this maths needs — any Habit-shaped row satisfies it structurally. */
export type HabitConsistencyInput = {
  /** life_areas.name — must match an entry in allAreaNames to be counted. */
  areaName: string;
  /** The habit's creation date as "yyyy-mm-dd" (IST calendar date, not an instant). */
  createdISO: string;
  checkDates: string[];
};

export type AreaConsistency = {
  area: string;
  /**
   * The average of the area's habits' individual completion rates, as a
   * whole-number percentage; 0 when the area has no scorable habits. NOT
   * actual/possible — see computeAreaConsistency.
   */
  score: number;
  /** Checks landed inside the window, across the area's habits. */
  actual: number;
  /** Days the area's habits could have been checked — the perfect score. */
  possible: number;
};

/**
 * Habit consistency per life area over the trailing 30 days ending todayIST —
 * a pure function of (habits, allAreaNames, todayIST), never a stored column,
 * for the same reason streaks aren't (lib/streaks.ts): any stored figure
 * desyncs the moment a row is backdated, deleted, or a habit archived.
 *
 * The denominator is per-habit, not a flat habits × 30: a habit created 5 days
 * ago could only have been checked 5 times, so it contributes 5 possible days,
 * not 30. Scoring it out of 30 would punish new habits for being new — the
 * number would read as "you're failing" when nothing was missed.
 *
 * Areas aggregate as the MEAN OF PER-HABIT RATES — equal peers — not as
 * sum(actual)/sum(possible). Each habit is one voice regardless of age, so a
 * 30-day-old habit at 0% and a 4-day-old habit at 100% average to 50, not the
 * 12 that sum-weighting would give. The question the radar answers is "how are
 * the habits in this area doing?", and under sum-weighting a single long-lived
 * habit would drown out every newer one in its area.
 *
 * A habit with possible = 0 has no rate to contribute and is excluded from the
 * average entirely rather than averaged in as 0 — counting it would let a
 * future-dated row silently halve a real area's score.
 *
 * `actual` and `possible` are still returned as SUMS across the area's habits,
 * so a caller can see total sample size: a 100 built on 3 possible days is not
 * the same claim as one built on 60, and only the UI layer has the room to say
 * so. They are deliberately NOT the inputs to `score`.
 *
 * Dates are "yyyy-mm-dd" strings throughout. ISO dates compare lexicographically
 * in chronological order, so window membership needs no Date objects, and day
 * counts go through diffDaysISO — never `new Date(dateString)`, whose local-time
 * parsing would shift dates in some timezones (Architecture Law 3).
 *
 * Returns exactly one entry per name in `allAreaNames`, in that order, so an
 * area with no habits still renders (at 0) instead of silently vanishing from
 * the chart. Habits whose areaName isn't in `allAreaNames` are ignored: there is
 * no slot to put them in, which mirrors the `life_areas!inner` join that already
 * hides orphaned rows from every fetch.
 */
export function computeAreaConsistency(
  habits: HabitConsistencyInput[],
  allAreaNames: string[],
  todayIST: string,
): AreaConsistency[] {
  const windowStart = addDaysISO(todayIST, -(CONSISTENCY_WINDOW_DAYS - 1));

  // Seeded from allAreaNames up front — this, not the habit loop, is what
  // guarantees every area appears in the output. `rates` holds one entry per
  // scorable habit (possible > 0); actual/possible accumulate separately as
  // reporting totals and never feed the score.
  type Totals = { actual: number; possible: number; rates: number[] };
  const totals = new Map<string, Totals>();
  for (const name of allAreaNames) {
    if (!totals.has(name)) totals.set(name, { actual: 0, possible: 0, rates: [] });
  }

  for (const habit of habits) {
    const area = totals.get(habit.areaName);
    if (!area) continue; // no slot for this area; see doc comment

    const possible = possibleChecks(habit.createdISO, windowStart, todayIST);
    const actual = actualChecks(habit, windowStart, todayIST);

    area.possible += possible;
    area.actual += actual;
    // possible === 0 means the habit could not have been checked at all: it has
    // no rate, so it abstains from the average instead of voting 0.
    if (possible > 0) area.rates.push((actual / possible) * 100);
  }

  return allAreaNames.map((name) => {
    const { actual, possible, rates } = totals.get(name)!;
    const score =
      rates.length === 0
        ? 0
        : Math.round(rates.reduce((sum, rate) => sum + rate, 0) / rates.length);
    return { area: name, score, actual, possible };
  });
}

/**
 * Days in the window on or after the habit's creation date. A habit created
 * before the window opened gets the full 30; one created mid-window gets only
 * the days it existed for. A future-dated creation yields 0 — such a row
 * shouldn't exist, but it must not be able to add phantom days to the
 * denominator (which would drag the area's score down for free).
 */
function possibleChecks(
  createdISO: string,
  windowStart: string,
  todayIST: string,
): number {
  const start = createdISO > windowStart ? createdISO : windowStart;
  if (start > todayIST) return 0;
  return diffDaysISO(todayIST, start) + 1; // inclusive of both ends
}

/**
 * Checks that landed inside the window. Deduplicated because a repeated date
 * must not count twice: the unique(habit_id, check_date) constraint makes that
 * unlikely from the database, but the invariant actual <= possible is what
 * keeps a score from exceeding 100, so it's enforced here rather than assumed.
 *
 * Both ends are bounded deliberately. Future-dated rows are ignored rather than
 * trusted (consistent with computeStreaks), and checks predating createdISO are
 * excluded too — they fall outside the days counted as possible, so admitting
 * them could push actual past possible and produce a score above 100.
 */
function actualChecks(
  habit: HabitConsistencyInput,
  windowStart: string,
  todayIST: string,
): number {
  const lowerBound =
    habit.createdISO > windowStart ? habit.createdISO : windowStart;

  let count = 0;
  const seen = new Set<string>();
  for (const date of habit.checkDates) {
    if (date < lowerBound || date > todayIST) continue;
    if (seen.has(date)) continue;
    seen.add(date);
    count++;
  }
  return count;
}
