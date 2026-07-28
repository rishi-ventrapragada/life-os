import { describe, it, expect } from "vitest";
import {
  CONSISTENCY_WINDOW_DAYS,
  computeAreaConsistency,
  type HabitConsistencyInput,
} from "@/lib/dashboard";
import { addDaysISO } from "@/lib/dates";

/**
 * Area consistency is a pure function of (habits, allAreaNames, todayIST) —
 * every case below injects an explicit "today" rather than reading a clock,
 * exactly like lib/streaks.test.ts. That is what makes the window-edge and
 * leap-year cases testable at all.
 *
 * The load-bearing rules:
 *   - the denominator is per-habit (days since creation, capped at the window),
 *     so a new habit is scored only on the days it could have been checked;
 *   - an area scores as the EQUAL-PEERS mean of its habits' individual rates,
 *     not sum(actual)/sum(possible) — every habit is one voice regardless of
 *     age, and a habit with possible = 0 abstains rather than voting 0;
 *   - actual/possible are still reported as sums, and never feed the score;
 *   - every name in allAreaNames appears in the output, in order.
 */

const TODAY = "2026-07-20";
/** The oldest date inside a 30-day window ending TODAY: 2026-06-21. */
const WINDOW_START = addDaysISO(TODAY, -(CONSISTENCY_WINDOW_DAYS - 1));
/** Comfortably older than the window, so the habit gets all 30 possible days. */
const LONG_AGO = "2026-01-01";

const AREAS = [
  "Academics",
  "Fitness",
  "Coding",
  "Content Creation",
  "Personal Finance",
];

/** n consecutive dates ending at `end`, oldest first. */
function runEndingAt(end: string, n: number): string[] {
  return Array.from({ length: n }, (_, i) => addDaysISO(end, -(n - 1 - i)));
}

/** The score for one area, for assertions that don't care about the rest. */
function scoreFor(result: ReturnType<typeof computeAreaConsistency>, area: string) {
  return result.find((r) => r.area === area)!.score;
}

describe("computeAreaConsistency — shape of the result", () => {
  it("returns all five areas at 0 when there are no habits at all", () => {
    const result = computeAreaConsistency([], AREAS, TODAY);

    expect(result).toEqual([
      { area: "Academics", score: 0, actual: 0, possible: 0 },
      { area: "Fitness", score: 0, actual: 0, possible: 0 },
      { area: "Coding", score: 0, actual: 0, possible: 0 },
      { area: "Content Creation", score: 0, actual: 0, possible: 0 },
      { area: "Personal Finance", score: 0, actual: 0, possible: 0 },
    ]);
  });

  it("preserves the order of allAreaNames", () => {
    const reversed = [...AREAS].reverse();
    const result = computeAreaConsistency([], reversed, TODAY);

    expect(result.map((r) => r.area)).toEqual(reversed);
  });

  it("keeps an area with no habits present at 0 while others score", () => {
    const habits: HabitConsistencyInput[] = [
      {
        areaName: "Coding",
        createdISO: LONG_AGO,
        checkDates: runEndingAt(TODAY, CONSISTENCY_WINDOW_DAYS),
      },
    ];

    const result = computeAreaConsistency(habits, AREAS, TODAY);

    expect(scoreFor(result, "Coding")).toBe(100);
    // Every other area is still in the output rather than dropped.
    expect(result).toHaveLength(5);
    for (const area of AREAS.filter((a) => a !== "Coding")) {
      expect(result.find((r) => r.area === area)).toEqual({
        area,
        score: 0,
        actual: 0,
        possible: 0,
      });
    }
  });

  it("ignores habits whose area is not in allAreaNames", () => {
    const habits: HabitConsistencyInput[] = [
      {
        areaName: "Not A Real Area",
        createdISO: LONG_AGO,
        checkDates: runEndingAt(TODAY, CONSISTENCY_WINDOW_DAYS),
      },
    ];

    const result = computeAreaConsistency(habits, AREAS, TODAY);

    expect(result).toHaveLength(5);
    expect(result.every((r) => r.score === 0)).toBe(true);
  });
});

describe("computeAreaConsistency — scoring", () => {
  it("a habit checked every possible day scores 100", () => {
    const habits: HabitConsistencyInput[] = [
      {
        areaName: "Fitness",
        createdISO: LONG_AGO,
        checkDates: runEndingAt(TODAY, CONSISTENCY_WINDOW_DAYS),
      },
    ];

    const result = computeAreaConsistency(habits, AREAS, TODAY);

    expect(result.find((r) => r.area === "Fitness")).toEqual({
      area: "Fitness",
      score: 100,
      actual: 30,
      possible: 30,
    });
  });

  it("a single habit's area score is just that habit's own rate (75)", () => {
    // The partial case, expressed as ONE habit so the area score and the
    // habit rate are the same number: 22 checks of 30 possible days would be
    // 73, so use a clean three-quarters — 15 of the 20 days it has existed.
    const habits: HabitConsistencyInput[] = [
      {
        areaName: "Academics",
        createdISO: addDaysISO(TODAY, -19), // 20 possible days
        checkDates: runEndingAt(TODAY, 15), // 15 of 20 = 75%
      },
    ];

    const result = computeAreaConsistency(habits, AREAS, TODAY);

    expect(result.find((r) => r.area === "Academics")).toEqual({
      area: "Academics",
      score: 75,
      actual: 15,
      possible: 20,
    });
  });

  it("aggregates an area as EQUAL PEERS — the mean of per-habit rates", () => {
    // A 30-day-old habit at 0%, and a 4-day-old habit at 100%.
    // Sum-weighting would give 4/34 = 12, drowning the newer habit out.
    // Equal peers gives the average of the two rates: (0 + 100) / 2 = 50.
    // actual/possible are still the sums, and deliberately do NOT equal score.
    const habits: HabitConsistencyInput[] = [
      { areaName: "Coding", createdISO: LONG_AGO, checkDates: [] },
      {
        areaName: "Coding",
        createdISO: addDaysISO(TODAY, -3),
        checkDates: runEndingAt(TODAY, 4),
      },
    ];

    const result = computeAreaConsistency(habits, AREAS, TODAY);

    expect(result.find((r) => r.area === "Coding")).toEqual({
      area: "Coding",
      score: 50,
      actual: 4,
      possible: 34,
    });
  });

  it("averages two equally-aged habits: 100% and 50% is 75", () => {
    // Both habits span the full window, so this isolates averaging from the
    // per-habit denominator: sum-weighting would give 45/60 = 75 too, but the
    // case above already separates the two formulas.
    const habits: HabitConsistencyInput[] = [
      {
        areaName: "Fitness",
        createdISO: LONG_AGO,
        checkDates: runEndingAt(TODAY, 30), // 30/30 = 100%
      },
      {
        areaName: "Fitness",
        createdISO: LONG_AGO,
        checkDates: runEndingAt(TODAY, 15), // 15/30 = 50%
      },
    ];

    const result = computeAreaConsistency(habits, AREAS, TODAY);

    expect(result.find((r) => r.area === "Fitness")).toEqual({
      area: "Fitness",
      score: 75, // (100 + 50) / 2
      actual: 45,
      possible: 60,
    });
  });

  it("excludes a possible = 0 habit from the average instead of scoring it 0", () => {
    // A future-created habit has no rate. Averaging it in as 0 would halve the
    // area's real score; abstaining leaves the perfect habit at 100.
    const habits: HabitConsistencyInput[] = [
      {
        areaName: "Coding",
        createdISO: LONG_AGO,
        checkDates: runEndingAt(TODAY, 30),
      },
      {
        areaName: "Coding",
        createdISO: addDaysISO(TODAY, 5), // possible = 0
        checkDates: [],
      },
    ];

    const result = computeAreaConsistency(habits, AREAS, TODAY);

    expect(result.find((r) => r.area === "Coding")).toEqual({
      area: "Coding",
      score: 100,
      actual: 30,
      possible: 30,
    });
  });

  it("rounds to a whole number", () => {
    // 1 of 3 days = 33.33% -> 33.
    const habits: HabitConsistencyInput[] = [
      {
        areaName: "Fitness",
        createdISO: addDaysISO(TODAY, -2),
        checkDates: [TODAY],
      },
    ];

    expect(scoreFor(computeAreaConsistency(habits, AREAS, TODAY), "Fitness")).toBe(33);
  });
});

describe("computeAreaConsistency — the per-habit denominator", () => {
  it("counts possible days from createdISO, not the whole window", () => {
    // Created 4 days before today => 5 possible days (inclusive), not 30.
    const habits: HabitConsistencyInput[] = [
      {
        areaName: "Content Creation",
        createdISO: addDaysISO(TODAY, -4),
        checkDates: runEndingAt(TODAY, 5),
      },
    ];

    const result = computeAreaConsistency(habits, AREAS, TODAY);

    expect(result.find((r) => r.area === "Content Creation")).toEqual({
      area: "Content Creation",
      score: 100, // a new habit checked every day it existed is perfect
      actual: 5,
      possible: 5,
    });
  });

  it("a habit created today has exactly one possible day", () => {
    const habits: HabitConsistencyInput[] = [
      { areaName: "Fitness", createdISO: TODAY, checkDates: [] },
    ];

    const result = computeAreaConsistency(habits, AREAS, TODAY);

    expect(result.find((r) => r.area === "Fitness")).toEqual({
      area: "Fitness",
      score: 0,
      actual: 0,
      possible: 1,
    });
  });

  it("caps possible at the window for a habit far older than it", () => {
    const habits: HabitConsistencyInput[] = [
      { areaName: "Coding", createdISO: "2020-01-01", checkDates: [] },
    ];

    expect(
      computeAreaConsistency(habits, AREAS, TODAY).find((r) => r.area === "Coding")
        ?.possible,
    ).toBe(CONSISTENCY_WINDOW_DAYS);
  });

  it("a future-created habit contributes no possible days", () => {
    // Shouldn't exist, but must not add phantom days to the denominator.
    const habits: HabitConsistencyInput[] = [
      {
        areaName: "Personal Finance",
        createdISO: addDaysISO(TODAY, 5),
        checkDates: [],
      },
    ];

    const result = computeAreaConsistency(habits, AREAS, TODAY);

    expect(result.find((r) => r.area === "Personal Finance")).toEqual({
      area: "Personal Finance",
      score: 0,
      actual: 0,
      possible: 0,
    });
  });
});

describe("computeAreaConsistency — window edges and bad rows", () => {
  it("counts a check landing exactly on the first day of the window", () => {
    const habits: HabitConsistencyInput[] = [
      { areaName: "Fitness", createdISO: LONG_AGO, checkDates: [WINDOW_START] },
    ];

    expect(
      computeAreaConsistency(habits, AREAS, TODAY).find((r) => r.area === "Fitness")
        ?.actual,
    ).toBe(1);
  });

  it("ignores a check from the day before the window opened", () => {
    const habits: HabitConsistencyInput[] = [
      {
        areaName: "Fitness",
        createdISO: LONG_AGO,
        checkDates: [addDaysISO(WINDOW_START, -1)],
      },
    ];

    expect(
      computeAreaConsistency(habits, AREAS, TODAY).find((r) => r.area === "Fitness")
        ?.actual,
    ).toBe(0);
  });

  it("ignores future-dated check rows (consistent with streaks)", () => {
    const habits: HabitConsistencyInput[] = [
      {
        areaName: "Academics",
        createdISO: LONG_AGO,
        checkDates: [TODAY, addDaysISO(TODAY, 1), addDaysISO(TODAY, 30)],
      },
    ];

    const result = computeAreaConsistency(habits, AREAS, TODAY);

    // Only today's check counts; the two future rows cannot inflate the score.
    expect(result.find((r) => r.area === "Academics")).toEqual({
      area: "Academics",
      score: 3, // round(1 / 30 * 100)
      actual: 1,
      possible: 30,
    });
  });

  it("ignores checks predating the habit's own creation date", () => {
    // Such a check falls outside the days counted as possible; admitting it
    // could push actual past possible and yield a score above 100.
    const habits: HabitConsistencyInput[] = [
      {
        areaName: "Coding",
        createdISO: addDaysISO(TODAY, -2),
        checkDates: [addDaysISO(TODAY, -10), ...runEndingAt(TODAY, 3)],
      },
    ];

    const result = computeAreaConsistency(habits, AREAS, TODAY);

    expect(result.find((r) => r.area === "Coding")).toEqual({
      area: "Coding",
      score: 100,
      actual: 3,
      possible: 3,
    });
  });

  it("never exceeds 100 even with duplicate check rows", () => {
    const habits: HabitConsistencyInput[] = [
      {
        areaName: "Fitness",
        createdISO: addDaysISO(TODAY, -1),
        checkDates: [TODAY, TODAY, TODAY, addDaysISO(TODAY, -1)],
      },
    ];

    const result = computeAreaConsistency(habits, AREAS, TODAY);

    expect(result.find((r) => r.area === "Fitness")).toEqual({
      area: "Fitness",
      score: 100,
      actual: 2,
      possible: 2,
    });
  });

  it("handles a window spanning a leap day", () => {
    // 30 days ending 2028-03-05 reaches back to 2028-02-05, crossing Feb 29.
    const leapToday = "2028-03-05";
    const habits: HabitConsistencyInput[] = [
      {
        areaName: "Academics",
        createdISO: "2028-02-29",
        checkDates: ["2028-02-29", "2028-03-01"],
      },
    ];

    const result = computeAreaConsistency(habits, AREAS, leapToday);

    // Feb 29 -> Mar 5 inclusive is 6 days (29th, 1st, 2nd, 3rd, 4th, 5th).
    expect(result.find((r) => r.area === "Academics")).toEqual({
      area: "Academics",
      score: 33, // round(2 / 6 * 100) = round(33.33)
      actual: 2,
      possible: 6,
    });
  });

  it("does not mutate the caller's arrays", () => {
    const checkDates = [addDaysISO(TODAY, -1), TODAY, TODAY];
    const habits: HabitConsistencyInput[] = [
      { areaName: "Fitness", createdISO: LONG_AGO, checkDates },
    ];
    const areaNames = [...AREAS];

    computeAreaConsistency(habits, areaNames, TODAY);

    expect(checkDates).toEqual([addDaysISO(TODAY, -1), TODAY, TODAY]);
    expect(areaNames).toEqual(AREAS);
    expect(habits).toHaveLength(1);
  });
});
