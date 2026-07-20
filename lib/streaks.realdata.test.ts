import { describe, it, expect } from "vitest";
import { computeStreaks } from "@/lib/streaks";

/**
 * Ground-truth check: these are the ACTUAL habit_checks rows read back from the
 * database via MCP for the "Coding" habit (5ce4b8d3-…) on 2026-07-20, not a
 * hand-made fixture. It pins the real-data expectation the UI must display, so
 * a refactor that breaks the live numbers fails here rather than in the app.
 */
const REAL_ROWS = [
  "2026-06-28",
  "2026-06-29",
  "2026-06-30",
  "2026-07-01",
  "2026-07-02",
  "2026-07-17",
  "2026-07-18",
  "2026-07-19",
];

describe("real DB rows for the Coding habit (read via MCP, 2026-07-20)", () => {
  it("current=3 (17/18/19, today unchecked) and max=5 (Jun28-Jul2)", () => {
    expect(computeStreaks(REAL_ROWS, "2026-07-20")).toEqual({
      current: 3,
      max: 5,
    });
  });

  it("checking today extends current to 4; max stays 5", () => {
    expect(computeStreaks([...REAL_ROWS, "2026-07-20"], "2026-07-20")).toEqual({
      current: 4,
      max: 5,
    });
  });

  it("after IST rolls to the 21st with today unchecked, current drops to 0", () => {
    // The last check (19th) is then 2 days old — a genuine broken streak, not a
    // bug. Pinned so the rollover behaviour is a documented expectation.
    expect(computeStreaks(REAL_ROWS, "2026-07-21")).toEqual({
      current: 0,
      max: 5,
    });
  });
});
