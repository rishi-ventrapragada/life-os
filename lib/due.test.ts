import { describe, it, expect } from "vitest";
import { dueLabel, THIS_WEEK_DAYS } from "@/lib/due";
import { addDaysISO } from "@/lib/dates";

/**
 * The ladder is past -> today -> tomorrow -> this week (+2..+7) -> a formatted
 * date. Past/present stay a lexicographic compare of two "yyyy-mm-dd" strings;
 * the day offsets go through diffDaysISO. No Date objects either way (Law 3),
 * and `today` is injected rather than read from a clock — that is what makes
 * the boundary cases below testable.
 *
 * Lifted out of components/tasks/TaskCard.tsx in Step 9 so Today and Tasks
 * share one implementation instead of two drifting copies. Widened from
 * Overdue/Due-today/null to the 5-tier ladder in the due-label change; the two
 * cases that used to assert null for near-future dates now assert real labels.
 */
describe("dueLabel", () => {
  const cases: Array<[string, string, string, string]> = [
    // [dueDate, today, expected text, what it pins]
    ["2026-07-19", "2026-07-20", "Overdue", "yesterday is overdue"],
    ["2026-07-20", "2026-07-20", "Due today", "same date is due today"],
    ["2026-07-21", "2026-07-20", "Due tomorrow", "tomorrow is its own tier"],
    ["2026-06-30", "2026-07-01", "Overdue", "across a month boundary"],
    ["2025-12-31", "2026-01-01", "Overdue", "across a year boundary"],
    ["2026-01-01", "2025-12-31", "Due tomorrow", "tomorrow across a year boundary"],
    ["2028-02-29", "2028-02-29", "Due today", "leap day is comparable"],
    ["2028-02-29", "2028-03-01", "Overdue", "leap day, one day later"],
    ["2026-01-09", "2026-01-10", "Overdue", "single-digit day zero-padding"],
    ["2026-10-01", "2026-09-30", "Due tomorrow", "month rollover, one day out"],
  ];

  for (const [dueDate, today, expected, pins] of cases) {
    it(`due ${dueDate} on ${today} -> ${expected} (${pins})`, () => {
      expect(dueLabel(dueDate, today).text).toBe(expected);
    });
  }

  /**
   * The whole point of the widening: every offset either side of the +1/+2 and
   * +7/+8 edges is pinned, walked off a single `today` with addDaysISO so the
   * arithmetic under test is not re-implemented in the expectation.
   */
  describe("ladder boundaries", () => {
    const today = "2026-08-07";
    const boundaries: Array<[number, string, string]> = [
      // [offset from today, expected text, what it pins]
      [-1, "Overdue", "one day before"],
      [0, "Due today", "the day itself"],
      [1, "Due tomorrow", "+1 is tomorrow, not this week"],
      [2, "This week", "+2 is the first this-week day"],
      [5, "This week", "mid-window"],
      [7, "This week", "+7 is the last this-week day, inclusive"],
      [8, "Due 15 Aug", "+8 falls through to a formatted date"],
      [30, "Due 6 Sep", "far future is still a formatted date"],
    ];

    for (const [offset, expected, pins] of boundaries) {
      const dueDate = addDaysISO(today, offset);
      it(`today${offset >= 0 ? "+" : ""}${offset} (${dueDate}) -> ${expected} (${pins})`, () => {
        expect(dueLabel(dueDate, today).text).toBe(expected);
      });
    }
  });

  it("the this-week window is exactly THIS_WEEK_DAYS wide", () => {
    const today = "2026-08-07";
    const last = addDaysISO(today, THIS_WEEK_DAYS);
    const past = addDaysISO(today, THIS_WEEK_DAYS + 1);
    expect(dueLabel(last, today).tier).toBe("This week");
    expect(dueLabel(past, today).tier).toBe("Distant");
  });

  /** The window must not widen or shift when it spans a month or year end. */
  it("the window holds across month and year boundaries", () => {
    expect(dueLabel("2026-09-03", "2026-08-27").tier).toBe("This week");
    expect(dueLabel("2026-09-04", "2026-08-27").tier).toBe("Distant");
    expect(dueLabel("2027-01-03", "2026-12-27").tier).toBe("This week");
    expect(dueLabel("2027-01-04", "2026-12-27").tier).toBe("Distant");
  });

  /** A leap day inside the window must not be miscounted as a 366th day. */
  it("counts the window across a leap day", () => {
    expect(dueLabel("2028-03-03", "2028-02-25").tier).toBe("This week");
    expect(dueLabel("2028-03-04", "2028-02-25").tier).toBe("Distant");
  });

  it("a far-future date is never overdue", () => {
    const info = dueLabel("2099-01-01", "2026-07-20");
    expect(info.tier).toBe("Distant");
    expect(info.text).toBe("Due 1 Jan 2099");
  });

  /**
   * The Distant tier shortens the date, but only within the current year —
   * otherwise a date months out would read as one that has already passed.
   */
  it("the Distant tier drops the year only within the current year", () => {
    expect(dueLabel("2026-08-15", "2026-08-07").text).toBe("Due 15 Aug");
    expect(dueLabel("2027-08-15", "2026-08-07").text).toBe("Due 15 Aug 2027");
  });

  it("never returns null — every date now yields a label", () => {
    const offsets = [-400, -1, 0, 1, 2, 7, 8, 400];
    for (const offset of offsets) {
      const info = dueLabel(addDaysISO("2026-08-07", offset), "2026-08-07");
      expect(info).not.toBeNull();
      expect(info.text.length).toBeGreaterThan(0);
    }
  });
});
