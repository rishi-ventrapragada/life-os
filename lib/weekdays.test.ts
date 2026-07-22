import { describe, it, expect } from "vitest";
import { WEEKDAYS, WEEK_DISPLAY_ORDER } from "@/lib/weekdays";

describe("weekdays", () => {
  it("has 7 days indexed 0=Sunday..6=Saturday", () => {
    expect(WEEKDAYS).toHaveLength(7);
    expect(WEEKDAYS[0]).toBe("Sunday");
    expect(WEEKDAYS[6]).toBe("Saturday");
  });

  it("display order is Monday-first, Sunday-last, and a permutation of 0..6", () => {
    expect(WEEK_DISPLAY_ORDER[0]).toBe(1); // Monday first
    expect(WEEK_DISPLAY_ORDER[6]).toBe(0); // Sunday last
    expect([...WEEK_DISPLAY_ORDER].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it("maps display order back to the right weekday names", () => {
    const ordered = WEEK_DISPLAY_ORDER.map((i) => WEEKDAYS[i]);
    expect(ordered).toEqual([
      "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
    ]);
  });
});
