import { describe, it, expect } from "vitest";
import { getTodayIST, addDaysISO, diffDaysISO } from "@/lib/dates";

/**
 * IST = UTC+5:30, constant (no DST). So the IST calendar date rolls over at
 * 18:30:00 UTC. Every case injects a fixed instant so we are testing the
 * midnight boundary, not "now". A test that only checks the current moment
 * proves nothing about midnight.
 */
describe("getTodayIST — IST date rolls at 18:30:00 UTC", () => {
  const cases: Array<[string, string, string]> = [
    // [injected UTC instant, expected IST date, what it pins]
    ["2026-01-01T18:29:00Z", "2026-01-01", "just before midnight IST"],
    ["2026-01-01T18:30:00Z", "2026-01-02", "exact tick — midnight IST"],
    ["2026-01-01T18:31:00Z", "2026-01-02", "just after — differs from 18:29"],
    ["2026-01-01T12:00:00Z", "2026-01-01", "mid-day sanity"],
    ["2026-01-31T18:31:00Z", "2026-02-01", "month rollover"],
    ["2025-12-31T18:31:00Z", "2026-01-01", "year rollover"],
    ["2025-12-31T18:29:00Z", "2025-12-31", "year boundary, just before"],
  ];

  for (const [instant, expected, pins] of cases) {
    it(`${instant} -> ${expected} (${pins})`, () => {
      expect(getTodayIST(new Date(instant))).toBe(expected);
    });
  }

  it("18:29 UTC and 18:31 UTC yield different IST dates", () => {
    const before = getTodayIST(new Date("2026-01-01T18:29:00Z"));
    const after = getTodayIST(new Date("2026-01-01T18:31:00Z"));
    expect(before).not.toBe(after);
  });

  it("no-arg call returns a well-formed yyyy-mm-dd date", () => {
    expect(getTodayIST()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

/**
 * Step 8 needs date *arithmetic* ("yesterday", "how many days between") that
 * getTodayIST() can't express. These operate on "yyyy-mm-dd" strings via
 * Date.UTC on the split parts, so they never touch local time and never parse
 * a date string (new Date("2026-07-20") is UTC, but new Date("2026-07-20T00:00")
 * is local — that inconsistency is exactly what these avoid).
 */
describe("addDaysISO — calendar-correct day stepping", () => {
  const cases: Array<[string, number, string, string]> = [
    // [input, n, expected, what it pins]
    ["2026-07-20", 1, "2026-07-21", "trivial forward"],
    ["2026-07-20", -1, "2026-07-19", "trivial backward"],
    ["2026-07-20", 0, "2026-07-20", "zero is identity"],
    ["2025-12-31", 1, "2026-01-01", "year rollover forward"],
    ["2026-01-01", -1, "2025-12-31", "year rollover backward"],
    ["2026-01-31", 1, "2026-02-01", "31-day month edge"],
    ["2026-04-30", 1, "2026-05-01", "30-day month edge"],
    ["2026-03-01", -1, "2026-02-28", "non-leap: Mar 1 back to Feb 28"],
    ["2028-03-01", -1, "2028-02-29", "LEAP: Mar 1 back to Feb 29"],
    ["2028-02-28", 1, "2028-02-29", "LEAP: Feb 29 exists in 2028"],
    ["2027-02-28", 1, "2027-03-01", "non-leap: Feb 29 does NOT exist in 2027"],
    ["2026-07-20", 365, "2027-07-20", "a full non-leap year forward"],
    ["2026-07-20", -365, "2025-07-20", "a full year backward"],
  ];

  for (const [input, n, expected, pins] of cases) {
    it(`addDaysISO("${input}", ${n}) -> ${expected} (${pins})`, () => {
      expect(addDaysISO(input, n)).toBe(expected);
    });
  }

  it("round-trips: adding then subtracting n returns the original", () => {
    expect(addDaysISO(addDaysISO("2026-02-27", 400), -400)).toBe("2026-02-27");
  });

  it("always returns zero-padded yyyy-mm-dd", () => {
    expect(addDaysISO("2026-01-08", 1)).toBe("2026-01-09");
    expect(addDaysISO("2026-09-30", 1)).toBe("2026-10-01");
  });
});

describe("diffDaysISO — whole days between two ISO dates", () => {
  const cases: Array<[string, string, number, string]> = [
    // [a, b, expected a-minus-b, what it pins]
    ["2026-07-20", "2026-07-19", 1, "consecutive days"],
    ["2026-07-19", "2026-07-20", -1, "sign flips when a is earlier"],
    ["2026-07-20", "2026-07-20", 0, "same date is zero"],
    ["2026-03-01", "2026-02-28", 1, "NON-leap 2026: Feb 28 -> Mar 1 is 1 day"],
    ["2028-03-01", "2028-02-28", 2, "LEAP 2028: Feb 29 sits between them"],
    ["2026-01-01", "2025-12-31", 1, "across the year boundary"],
    ["2027-07-20", "2026-07-20", 365, "a non-leap year is 365 days"],
    ["2029-03-01", "2028-03-01", 365, "Mar-to-Mar spanning Feb 2029 (non-leap)"],
    ["2028-03-01", "2027-03-01", 366, "Mar-to-Mar spanning Feb 2028 (leap)"],
  ];

  for (const [a, b, expected, pins] of cases) {
    it(`diffDaysISO("${a}", "${b}") -> ${expected} (${pins})`, () => {
      expect(diffDaysISO(a, b)).toBe(expected);
    });
  }

  it("is consistent with addDaysISO for arbitrary gaps", () => {
    const start = "2026-11-15";
    for (const n of [1, 7, 30, 100, 365]) {
      expect(diffDaysISO(addDaysISO(start, n), start)).toBe(n);
    }
  });
});
