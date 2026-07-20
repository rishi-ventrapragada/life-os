import { supabase } from "@/lib/supabase";
import { addDaysISO, getTodayIST } from "@/lib/dates";
import type { LifeArea } from "@/lib/lifeAreas";
import type { Habit } from "@/components/habits/types";

/**
 * Pure data-layer helpers for the Habits slice — no React, no state. Split out
 * of useHabits.ts to keep that file well under the ~200-line cap (Law 1).
 */

export const HABIT_COLUMNS = "id,name,archived_at,life_areas!inner(name)";

export type HabitRow = {
  id: string;
  name: string;
  archived_at: string | null;
  life_areas: { name: string };
};

export const SAVE_FAILED =
  "Couldn't save to the database — refresh to see what actually stuck.";
/** D1 guard: the seed hasn't resolved, so we have no area id to write. */
export const NOT_READY = "Still loading your life areas — try again in a moment.";
/** Postgres unique_violation: (habit_id, check_date) already exists. */
export const UNIQUE_VIOLATION = "23505";

/**
 * How far back check history is fetched. The monthly grid needs the current IST
 * month, but a current streak can reach arbitrarily far past its start — so
 * "this month only" would truncate a long streak — while unbounded history
 * grows forever. A year covers any realistic streak in one indexed range scan.
 * A streak longer than this would display capped: a documented limit, not a bug.
 */
export const HISTORY_WINDOW_DAYS = 365;

export function rowToHabit(
  row: HabitRow,
  checksByHabit: Map<string, string[]>,
  todayIST: string,
): Habit {
  const checkDates = checksByHabit.get(row.id) ?? [];
  return {
    id: row.id,
    name: row.name,
    area: row.life_areas.name as LifeArea,
    archivedAt: row.archived_at,
    // Derived from the same array the streak reads, so they cannot disagree.
    checkedToday: checkDates.includes(todayIST),
    checkDates,
  };
}

/**
 * Active habits + their check history for the trailing window, joined in
 * memory. Active means `archived_at is null` (Decision B) — archived habits
 * keep their check rows but never reach the list (Step 8 decision D2).
 * All dates are raw yyyy-mm-dd strings from lib/dates (Law 3).
 *
 * RLS scopes both queries to the owner (the anon key + the user's JWT), so
 * widening the window cannot widen visibility — no policy change was needed.
 */
export async function fetchActiveHabits(): Promise<Habit[]> {
  const todayIST = getTodayIST();
  const windowStart = addDaysISO(todayIST, -HISTORY_WINDOW_DAYS);

  const [habitsRes, checksRes] = await Promise.all([
    supabase
      .from("habits")
      .select(HABIT_COLUMNS)
      .is("archived_at", null)
      .order("created_at", { ascending: true }),
    supabase
      .from("habit_checks")
      .select("habit_id,check_date")
      .gte("check_date", windowStart)
      .order("check_date", { ascending: true }),
  ]);
  if (habitsRes.error) throw habitsRes.error;
  if (checksRes.error) throw checksRes.error;

  const checksByHabit = new Map<string, string[]>();
  for (const c of checksRes.data as { habit_id: string; check_date: string }[]) {
    const list = checksByHabit.get(c.habit_id);
    if (list) list.push(c.check_date);
    else checksByHabit.set(c.habit_id, [c.check_date]);
  }

  return (habitsRes.data as unknown as HabitRow[]).map((r) =>
    rowToHabit(r, checksByHabit, todayIST),
  );
}
