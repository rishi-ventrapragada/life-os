import { describe, it, expect } from "vitest";
import {
  groupChecksByHabit,
  instantToISTDate,
  rowsToInputs,
  type CheckRow,
  type DashboardHabitRow,
} from "@/lib/dashboardShape";

/**
 * Only the PURE shaping helpers are tested here — fetchConsistencyInputs talks
 * to Supabase and is verified in the browser, not in unit tests. These helpers
 * live in lib/ precisely so importing them doesn't boot the Supabase client.
 *
 * The load-bearing case is instantToISTDate: created_at is a timestamptz
 * INSTANT, and IST is UTC+5:30, so the IST calendar date rolls at 18:30 UTC.
 * Getting this wrong shifts a habit's createdISO by a day, which silently
 * changes its denominator in computeAreaConsistency.
 */
describe("instantToISTDate — timestamptz to IST calendar date", () => {
  const cases: Array<[string, string, string]> = [
    // [created_at instant, expected IST date, what it pins]
    ["2026-07-19T12:00:00+00:00", "2026-07-19", "midday UTC is the same day"],
    ["2026-07-19T18:29:00+00:00", "2026-07-19", "one minute before IST midnight"],
    ["2026-07-19T18:30:00+00:00", "2026-07-20", "exact tick — IST midnight"],
    ["2026-07-19T20:15:00+00:00", "2026-07-20", "late UTC evening is NEXT day IST"],
    ["2026-01-31T18:31:00+00:00", "2026-02-01", "month rollover"],
    ["2025-12-31T18:31:00+00:00", "2026-01-01", "year rollover"],
  ];

  for (const [instant, expected, pins] of cases) {
    it(`${instant} -> ${expected} (${pins})`, () => {
      expect(instantToISTDate(instant)).toBe(expected);
    });
  }

  it("does NOT simply truncate the string — the 20:15Z case would differ", () => {
    const instant = "2026-07-19T20:15:00+00:00";
    // A naive created_at.slice(0, 10) would yield 2026-07-19 and hand the
    // habit an extra possible day it never had.
    expect(instantToISTDate(instant)).not.toBe(instant.slice(0, 10));
    expect(instantToISTDate(instant)).toBe("2026-07-20");
  });

  it("handles a Z-suffixed instant identically to a +00:00 one", () => {
    expect(instantToISTDate("2026-07-19T20:15:00Z")).toBe(
      instantToISTDate("2026-07-19T20:15:00+00:00"),
    );
  });

  it("handles a fractional-seconds instant (Postgres emits these)", () => {
    expect(instantToISTDate("2026-07-19T20:15:00.123456+00:00")).toBe("2026-07-20");
  });

  it("resolves a non-UTC offset to the same instant", () => {
    // 2026-07-20T01:45+05:30 IS 2026-07-19T20:15Z — the same moment, so the
    // same IST date, regardless of which offset the server serialized with.
    expect(instantToISTDate("2026-07-20T01:45:00+05:30")).toBe("2026-07-20");
  });
});

describe("groupChecksByHabit", () => {
  it("returns an empty map for no checks", () => {
    expect(groupChecksByHabit([]).size).toBe(0);
  });

  it("groups multiple checks under their habit id", () => {
    const checks: CheckRow[] = [
      { habit_id: "a", check_date: "2026-07-18" },
      { habit_id: "b", check_date: "2026-07-19" },
      { habit_id: "a", check_date: "2026-07-19" },
    ];

    const grouped = groupChecksByHabit(checks);

    expect(grouped.get("a")).toEqual(["2026-07-18", "2026-07-19"]);
    expect(grouped.get("b")).toEqual(["2026-07-19"]);
  });
});

describe("rowsToInputs", () => {
  const habitRow = (
    id: string,
    areaName: string,
    created_at: string,
  ): DashboardHabitRow => ({ id, created_at, life_areas: { name: areaName } });

  it("maps rows to the shape computeAreaConsistency expects", () => {
    const habits = [habitRow("h1", "Fitness", "2026-07-19T20:15:00+00:00")];
    const checks: CheckRow[] = [{ habit_id: "h1", check_date: "2026-07-20" }];

    expect(rowsToInputs(habits, checks)).toEqual([
      {
        areaName: "Fitness",
        createdISO: "2026-07-20", // IST-converted, not string-sliced
        checkDates: ["2026-07-20"],
      },
    ]);
  });

  it("gives a habit with no checks an empty checkDates array", () => {
    const habits = [habitRow("h1", "Coding", "2026-07-01T06:00:00+00:00")];

    expect(rowsToInputs(habits, [])).toEqual([
      { areaName: "Coding", createdISO: "2026-07-01", checkDates: [] },
    ]);
  });

  it("does not leak one habit's checks into another", () => {
    const habits = [
      habitRow("h1", "Coding", "2026-07-01T06:00:00+00:00"),
      habitRow("h2", "Fitness", "2026-07-01T06:00:00+00:00"),
    ];
    const checks: CheckRow[] = [{ habit_id: "h1", check_date: "2026-07-20" }];

    const inputs = rowsToInputs(habits, checks);

    expect(inputs[0].checkDates).toEqual(["2026-07-20"]);
    expect(inputs[1].checkDates).toEqual([]);
  });

  it("returns an empty list when there are no habits", () => {
    expect(rowsToInputs([], [])).toEqual([]);
  });
});
