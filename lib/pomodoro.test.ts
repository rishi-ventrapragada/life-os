import { describe, it, expect } from "vitest";
import { formatRemaining, nextPhase, WORK_MS, BREAK_MS } from "@/lib/pomodoro";

describe("formatRemaining", () => {
  const cases: Array<[number, string, string]> = [
    [WORK_MS, "25:00", "full work phase"],
    [BREAK_MS, "05:00", "full break phase"],
    [0, "00:00", "zero"],
    [-5000, "00:00", "negative clamps to zero, never shows a minus"],
    [1000, "00:01", "one second"],
    [59_000, "00:59", "just under a minute"],
    [60_000, "01:00", "exactly a minute"],
    [90_000, "01:30", "a minute and a half"],
    [999, "00:01", "rounds up: <1s remaining still reads 1s, not 0"],
    [24 * 60 * 1000 + 1, "24:01", "just over 24 minutes"],
  ];
  for (const [ms, expected, pins] of cases) {
    it(`${ms}ms -> ${expected} (${pins})`, () => {
      expect(formatRemaining(ms)).toBe(expected);
    });
  }
});

describe("nextPhase", () => {
  it("work is followed by break", () => {
    expect(nextPhase("work")).toBe("break");
  });
  it("break is followed by work", () => {
    expect(nextPhase("break")).toBe("work");
  });
});
