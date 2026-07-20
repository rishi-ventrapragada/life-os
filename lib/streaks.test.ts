import { describe, it, expect } from "vitest";
import { computeStreaks } from "@/lib/streaks";

/**
 * Streaks are a pure function of (checkDates, todayIST) — every case below
 * injects an explicit "today" rather than reading a clock, exactly like
 * lib/dates.test.ts. That is what makes the midnight/leap cases testable at all.
 *
 * The load-bearing rule (Step 8 decision D1): a run ending YESTERDAY still
 * counts as the current streak, because today isn't over in IST yet. The number
 * shown is the run's length — it does NOT optimistically include today.
 */
describe("computeStreaks — current streak (decision D1)", () => {
  it("empty history is 0/0", () => {
    expect(computeStreaks([], "2026-07-20")).toEqual({ current: 0, max: 0 });
  });

  it("a single check today is 1/1", () => {
    expect(computeStreaks(["2026-07-20"], "2026-07-20")).toEqual({
      current: 1,
      max: 1,
    });
  });

  it("a single check YESTERDAY still counts as current (D1)", () => {
    expect(computeStreaks(["2026-07-19"], "2026-07-20")).toEqual({
      current: 1,
      max: 1,
    });
  });

  it("D1's exact case: 17/18/19 checked, today 20 unchecked -> current 3", () => {
    const dates = ["2026-07-17", "2026-07-18", "2026-07-19"];
    expect(computeStreaks(dates, "2026-07-20")).toEqual({ current: 3, max: 3 });
  });

  it("checking today extends that run to 4 (never jumps by 2)", () => {
    const dates = ["2026-07-17", "2026-07-18", "2026-07-19", "2026-07-20"];
    expect(computeStreaks(dates, "2026-07-20")).toEqual({ current: 4, max: 4 });
  });

  it("last check 2 days ago breaks the streak: current 0, max survives", () => {
    const dates = ["2026-07-17", "2026-07-18"];
    expect(computeStreaks(dates, "2026-07-20")).toEqual({ current: 0, max: 2 });
  });

  it("a future-dated check is not treated as the current run", () => {
    // Defensive: shouldn't happen, but a stray future row must not inflate today.
    const dates = ["2026-07-19", "2026-07-25"];
    const { current } = computeStreaks(dates, "2026-07-20");
    expect(current).toBe(1);
  });
});

describe("computeStreaks — max streak", () => {
  it("max is strictly in the past while current is shorter", () => {
    const dates = [
      // past run of 5
      "2026-06-28", "2026-06-29", "2026-06-30", "2026-07-01", "2026-07-02",
      // gap, then a current run of 2 ending yesterday
      "2026-07-19", "2026-07-18",
    ];
    expect(computeStreaks(dates, "2026-07-20")).toEqual({ current: 2, max: 5 });
  });

  it("gaps reset the run rather than accumulating total checks", () => {
    // 6 checks total, but never more than 2 consecutive.
    const dates = [
      "2026-07-01", "2026-07-02",
      "2026-07-05", "2026-07-06",
      "2026-07-09", "2026-07-10",
    ];
    expect(computeStreaks(dates, "2026-07-20").max).toBe(2);
  });

  it("counts a run spanning a MONTH boundary as unbroken", () => {
    const dates = ["2026-06-29", "2026-06-30", "2026-07-01", "2026-07-02"];
    expect(computeStreaks(dates, "2026-07-20").max).toBe(4);
  });

  it("counts a run spanning a YEAR boundary as unbroken", () => {
    const dates = ["2025-12-30", "2025-12-31", "2026-01-01", "2026-01-02"];
    expect(computeStreaks(dates, "2026-07-20").max).toBe(4);
  });

  it("counts a run across Feb 29 in a LEAP year as unbroken", () => {
    const dates = ["2028-02-27", "2028-02-28", "2028-02-29", "2028-03-01"];
    expect(computeStreaks(dates, "2028-03-05").max).toBe(4);
  });

  it("treats Feb 28 -> Mar 1 in a NON-leap year as unbroken", () => {
    const dates = ["2027-02-27", "2027-02-28", "2027-03-01"];
    expect(computeStreaks(dates, "2027-03-05").max).toBe(3);
  });
});

describe("computeStreaks — input robustness", () => {
  it("does not care about input order", () => {
    const shuffled = ["2026-07-19", "2026-07-17", "2026-07-18"];
    expect(computeStreaks(shuffled, "2026-07-20")).toEqual({
      current: 3,
      max: 3,
    });
  });

  it("de-duplicates repeated dates instead of counting them twice", () => {
    // The DB's unique(habit_id, check_date) prevents this, but the function
    // must not depend on that to be correct.
    const dupes = ["2026-07-18", "2026-07-19", "2026-07-19", "2026-07-18"];
    expect(computeStreaks(dupes, "2026-07-20")).toEqual({ current: 2, max: 2 });
  });

  it("never mutates the caller's array", () => {
    const input = ["2026-07-19", "2026-07-17", "2026-07-18"];
    const copy = [...input];
    computeStreaks(input, "2026-07-20");
    expect(input).toEqual(copy);
  });
});
