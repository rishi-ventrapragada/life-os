import { describe, it, expect } from "vitest";
import { dueLabel } from "@/lib/due";

/**
 * Due/overdue is a lexicographic compare of two "yyyy-mm-dd" strings — ISO
 * dates sort chronologically, so no Date objects are involved (Law 3). `today`
 * is injected rather than read from a clock, which is what makes the boundary
 * cases testable.
 *
 * Lifted out of components/tasks/TaskCard.tsx in Step 9 so Today and Tasks
 * share one implementation instead of two drifting copies.
 */
describe("dueLabel", () => {
  const cases: Array<[string, string, string | null, string]> = [
    // [dueDate, today, expected, what it pins]
    ["2026-07-19", "2026-07-20", "Overdue", "yesterday is overdue"],
    ["2026-07-20", "2026-07-20", "Due today", "same date is due today"],
    ["2026-07-21", "2026-07-20", null, "tomorrow is neither"],
    ["2026-06-30", "2026-07-01", "Overdue", "across a month boundary"],
    ["2025-12-31", "2026-01-01", "Overdue", "across a year boundary"],
    ["2026-01-01", "2025-12-31", null, "future across a year boundary"],
    ["2028-02-29", "2028-02-29", "Due today", "leap day is comparable"],
    ["2028-02-29", "2028-03-01", "Overdue", "leap day, one day later"],
    ["2026-01-09", "2026-01-10", "Overdue", "single-digit day zero-padding"],
    ["2026-10-01", "2026-09-30", null, "month rollover stays future"],
  ];

  for (const [dueDate, today, expected, pins] of cases) {
    it(`due ${dueDate} on ${today} -> ${expected ?? "null"} (${pins})`, () => {
      expect(dueLabel(dueDate, today)).toBe(expected);
    });
  }

  it("is a pure string compare — a far-future date is never overdue", () => {
    expect(dueLabel("2099-01-01", "2026-07-20")).toBeNull();
  });
});
