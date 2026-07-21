import { describe, it, expect } from "vitest";
import { formatISODate } from "@/lib/formatDate";

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
