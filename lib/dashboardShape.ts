import { getTodayIST } from "@/lib/dates";
import type { HabitConsistencyInput } from "@/lib/dashboard";

/**
 * Pure row-shaping for the Analytics dashboard: database rows in, scorer input
 * out. No React, no Supabase — deliberately in lib/ rather than beside the
 * fetch, because components/dashboard/dashboardData.ts imports the Supabase
 * client at module scope, and that client throws without env vars. Keeping
 * these helpers here means they can be unit-tested without a live config, the
 * same way lib/streaks.ts and lib/week.ts are.
 */

export type DashboardHabitRow = {
  id: string;
  /** timestamptz — a full ISO-8601 instant, not a calendar date. */
  created_at: string;
  life_areas: { name: string };
};

export type CheckRow = { habit_id: string; check_date: string };

/**
 * A timestamptz instant -> the calendar date it fell on in IST.
 *
 * `new Date(...)` here parses an INSTANT, which is unambiguous: the parsing
 * inconsistency lib/dates.ts warns about is between a bare "2026-07-20" (UTC)
 * and "2026-07-20T00:00" (local). A timestamptz from Postgres always carries an
 * explicit offset or Z, so it resolves to one exact moment in every runtime.
 * The IST calendar conversion is then done by getTodayIST, the single clock the
 * app has (Law 3) — no date arithmetic touches this Date object.
 *
 * This is load-bearing, not ceremony: IST is UTC+5:30, so a habit created at
 * 2026-07-19T20:15Z was created on JULY 20th in IST. Slicing the string to
 * "2026-07-19" would hand that habit an extra possible day it never had and
 * permanently depress its area's score.
 */
export function instantToISTDate(timestamptz: string): string {
  return getTodayIST(new Date(timestamptz));
}

/** Group check dates by habit id. Dates stay raw "yyyy-mm-dd" strings. */
export function groupChecksByHabit(checks: CheckRow[]): Map<string, string[]> {
  const byHabit = new Map<string, string[]>();
  for (const check of checks) {
    const list = byHabit.get(check.habit_id);
    if (list) list.push(check.check_date);
    else byHabit.set(check.habit_id, [check.check_date]);
  }
  return byHabit;
}

/** Join habit rows to their check history, in the shape the scorer expects. */
export function rowsToInputs(
  habits: DashboardHabitRow[],
  checks: CheckRow[],
): HabitConsistencyInput[] {
  const byHabit = groupChecksByHabit(checks);
  return habits.map((row) => ({
    areaName: row.life_areas.name,
    createdISO: instantToISTDate(row.created_at),
    checkDates: byHabit.get(row.id) ?? [],
  }));
}
