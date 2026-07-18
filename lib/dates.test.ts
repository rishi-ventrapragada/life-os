import { describe, it, expect } from "vitest";
import { getTodayIST } from "@/lib/dates";

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
