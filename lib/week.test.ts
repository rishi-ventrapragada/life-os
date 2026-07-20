import { describe, it, expect } from "vitest";
import { weekProgress } from "@/lib/week";

/**
 * Week progress (Step 9 decision W): the TRAILING 7 days ending today —
 * addDaysISO(today, -6) .. today — scored as checks landed / (habits × 7).
 * A trailing window is always full, so the number never looks artificially bad
 * on a Monday the way a Mon–Sun calendar week would.
 *
 * `today` is injected, never read from a clock, so every boundary is pinnable.
 */
const habit = (checkDates: string[]) => ({ checkDates });

describe("weekProgress — trailing 7 days", () => {
  it("no habits is 0/0 at 0% (never divides by zero)", () => {
    expect(weekProgress([], "2026-07-20")).toEqual({
      checked: 0,
      total: 0,
      pct: 0,
    });
  });

  it("one habit checked all 7 days is 100%", () => {
    const dates = [
      "2026-07-14", "2026-07-15", "2026-07-16", "2026-07-17",
      "2026-07-18", "2026-07-19", "2026-07-20",
    ];
    expect(weekProgress([habit(dates)], "2026-07-20")).toEqual({
      checked: 7,
      total: 7,
      pct: 100,
    });
  });

  it("one habit with no checks is 0/7 at 0%", () => {
    expect(weekProgress([habit([])], "2026-07-20")).toEqual({
      checked: 0,
      total: 7,
      pct: 0,
    });
  });

  it("counts only checks inside the window — older ones are excluded", () => {
    // 07-13 is 7 days before today: one day OUTSIDE the trailing-7 window.
    const dates = ["2026-07-13", "2026-07-14", "2026-07-20"];
    const { checked, total } = weekProgress([habit(dates)], "2026-07-20");
    expect(checked).toBe(2);
    expect(total).toBe(7);
  });

  it("excludes future-dated checks", () => {
    const dates = ["2026-07-20", "2026-07-21"];
    expect(weekProgress([habit(dates)], "2026-07-20").checked).toBe(1);
  });

  it("includes both window edges: today and 6 days back", () => {
    expect(weekProgress([habit(["2026-07-14"])], "2026-07-20").checked).toBe(1);
    expect(weekProgress([habit(["2026-07-20"])], "2026-07-20").checked).toBe(1);
  });

  it("sums across multiple habits", () => {
    const a = habit(["2026-07-19", "2026-07-20"]);
    const b = habit(["2026-07-20"]);
    expect(weekProgress([a, b], "2026-07-20")).toEqual({
      checked: 3,
      total: 14,
      pct: 21, // 3/14 = 21.4% -> rounded
    });
  });

  it("handles a window spanning a month boundary", () => {
    // today 2026-07-02 -> window starts 2026-06-26
    const dates = ["2026-06-26", "2026-06-30", "2026-07-01", "2026-07-02"];
    expect(weekProgress([habit(dates)], "2026-07-02").checked).toBe(4);
  });

  it("handles a window spanning a year boundary", () => {
    // today 2026-01-02 -> window starts 2025-12-27
    const dates = ["2025-12-27", "2025-12-31", "2026-01-01"];
    expect(weekProgress([habit(dates)], "2026-01-02").checked).toBe(3);
  });

  it("rounds pct to a whole number", () => {
    // 1 of 7 = 14.28...% -> 14
    expect(weekProgress([habit(["2026-07-20"])], "2026-07-20").pct).toBe(14);
  });
});
