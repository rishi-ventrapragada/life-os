import { describe, it, expect } from "vitest";
import { formatISODate, formatISODateShort } from "@/lib/formatDate";

describe("formatISODate", () => {
  const cases: Array<[string, string]> = [
    ["2026-07-05", "5 Jul 2026"],
    ["2026-07-20", "20 Jul 2026"],
    ["2026-01-01", "1 Jan 2026"],
    ["2026-12-31", "31 Dec 2026"],
    ["2028-02-29", "29 Feb 2028"],
    ["2026-09-09", "9 Sep 2026"], // no zero-padding in the display
  ];
  for (const [iso, expected] of cases) {
    it(`${iso} -> ${expected}`, () => {
      expect(formatISODate(iso)).toBe(expected);
    });
  }
});

/**
 * The year is dropped only when it is obvious from context — i.e. when the
 * date falls in the same calendar year as `today`. The cross-year cases are
 * the point: "14 Aug" for a date 14 months out would read as already past.
 */
describe("formatISODateShort", () => {
  const cases: Array<[string, string, string, string]> = [
    // [iso, today, expected, what it pins]
    ["2026-08-14", "2026-08-07", "14 Aug", "same year drops the year"],
    ["2026-01-01", "2026-12-31", "1 Jan", "same year, opposite ends"],
    ["2027-08-14", "2026-08-07", "14 Aug 2027", "next year keeps the year"],
    ["2025-12-31", "2026-01-01", "31 Dec 2025", "last year keeps the year"],
    ["2026-09-09", "2026-01-01", "9 Sep", "no zero-padding in the display"],
    ["2028-02-29", "2028-03-01", "29 Feb", "leap day, same year"],
    ["2028-02-29", "2026-03-01", "29 Feb 2028", "leap day, different year"],
  ];

  for (const [iso, today, expected, pins] of cases) {
    it(`${iso} on ${today} -> ${expected} (${pins})`, () => {
      expect(formatISODateShort(iso, today)).toBe(expected);
    });
  }

  it("agrees with formatISODate on day and month", () => {
    // The short form is the long form minus the year — not a second opinion
    // about which day it is. Guards against the two drifting apart.
    const iso = "2026-08-14";
    expect(formatISODate(iso)).toBe("14 Aug 2026");
    expect(formatISODateShort(iso, "2026-01-01")).toBe("14 Aug");
  });
});
