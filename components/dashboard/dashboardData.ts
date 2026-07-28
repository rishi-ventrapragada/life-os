import { supabase } from "@/lib/supabase";
import { addDaysISO, getTodayIST } from "@/lib/dates";
import {
  CONSISTENCY_WINDOW_DAYS,
  type HabitConsistencyInput,
} from "@/lib/dashboard";
import {
  rowsToInputs,
  type CheckRow,
  type DashboardHabitRow,
} from "@/lib/dashboardShape";

/**
 * The Analytics dashboard's Supabase read. Pure row-shaping lives in
 * lib/dashboardShape.ts — this file imports the Supabase client at module
 * scope, so anything importable without a live config has to stay out of it.
 *
 * This is a DEDICATED read path, deliberately independent of
 * components/habits/habitsData.ts. The dashboard needs `created_at` (for the
 * per-habit denominator) and never renders a habit name; the Habits section
 * needs names and 365 days of history for streaks. Sharing one fetch would mean
 * one section's needs silently widening the other's query, so each owns its own.
 */

/** No `name`: the radar aggregates by area and never renders a habit name. */
export const DASHBOARD_HABIT_COLUMNS = "id,created_at,life_areas!inner(name)";

/**
 * Active habits + their checks for the scoring window, joined in memory.
 *
 * The check query is bounded by the SAME window constant the scorer uses, so
 * the fetch and the maths can never drift apart — anything older would be
 * discarded by computeAreaConsistency anyway. Active means `archived_at is
 * null`, consistent with the Habits section: archiving a habit drops it from
 * the radar too.
 *
 * RLS scopes both queries to the owner, so this read can only ever see the
 * signed-in user's rows.
 */
export async function fetchConsistencyInputs(): Promise<{
  inputs: HabitConsistencyInput[];
  todayIST: string;
}> {
  const todayIST = getTodayIST();
  const windowStart = addDaysISO(todayIST, -(CONSISTENCY_WINDOW_DAYS - 1));

  const [habitsRes, checksRes] = await Promise.all([
    supabase
      .from("habits")
      .select(DASHBOARD_HABIT_COLUMNS)
      .is("archived_at", null),
    supabase
      .from("habit_checks")
      .select("habit_id,check_date")
      .gte("check_date", windowStart),
  ]);
  if (habitsRes.error) throw habitsRes.error;
  if (checksRes.error) throw checksRes.error;

  return {
    inputs: rowsToInputs(
      habitsRes.data as unknown as DashboardHabitRow[],
      checksRes.data as CheckRow[],
    ),
    todayIST,
  };
}
