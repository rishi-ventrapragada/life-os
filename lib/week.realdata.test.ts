import { describe, it, expect } from "vitest";
import { weekProgress } from "@/lib/week";

/**
 * Ground truth: the ACTUAL habit_checks rows read back from the database via
 * MCP for the single "Coding" habit on 2026-07-20 — not a hand-made fixture.
 * The expected numbers were stated before any Today UI existed, so this pins a
 * prediction rather than rationalising whatever the code happened to produce.
 */
const REAL_ROWS = [
  "2026-06-28", "2026-06-29", "2026-06-30", "2026-07-01", "2026-07-02",
  "2026-07-17", "2026-07-18", "2026-07-19", "2026-07-20",
];

describe("weekProgress against real DB rows (2026-07-20)", () => {
  it("counts only the 4 rows inside the trailing window: 4/7 = 57%", () => {
    // Window is 2026-07-14..2026-07-20, so 17/18/19/20 count and the five
    // June–Jul 2 rows fall outside.
    expect(weekProgress([{ checkDates: REAL_ROWS }], "2026-07-20")).toEqual({
      checked: 4,
      total: 7,
      pct: 57,
    });
  });

  it("after IST rolls to the 21st with no new check, it stays 4/7 = 57%", () => {
    // Window becomes 07-15..07-21. Only the 14th (already empty) drops out, so
    // 17/18/19/20 all remain inside — the score holds rather than falling.
    // My first draft of this test guessed 3/7; the function was right and the
    // guess was wrong, which is exactly what a real-data pin is for.
    expect(weekProgress([{ checkDates: REAL_ROWS }], "2026-07-21")).toEqual({
      checked: 4,
      total: 7,
      pct: 57,
    });
  });

  it("drops to 3/7 = 43% on the 24th, when the 17th leaves the window", () => {
    // Window 07-18..07-24: the 17th finally falls out, leaving 18/19/20.
    expect(weekProgress([{ checkDates: REAL_ROWS }], "2026-07-24")).toEqual({
      checked: 3,
      total: 7,
      pct: 43,
    });
  });
});
