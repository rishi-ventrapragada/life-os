import { supabase } from "@/lib/supabase";
import { getTodayIST } from "@/lib/dates";
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

export function rowToHabit(row: HabitRow, checkedIds: Set<string>): Habit {
  return {
    id: row.id,
    name: row.name,
    area: row.life_areas.name as LifeArea,
    archivedAt: row.archived_at,
    checkedToday: checkedIds.has(row.id),
  };
}

/**
 * Active habits + today's checks in one pass, joined in memory. Active means
 * `archived_at is null` (Decision B) — archived habits keep their check rows
 * for Step 8's streaks but never reach the list. Today's date is the raw
 * yyyy-mm-dd from getTodayIST() (Law 3).
 */
export async function fetchActiveHabits(): Promise<Habit[]> {
  const [habitsRes, checksRes] = await Promise.all([
    supabase
      .from("habits")
      .select(HABIT_COLUMNS)
      .is("archived_at", null)
      .order("created_at", { ascending: true }),
    supabase
      .from("habit_checks")
      .select("habit_id")
      .eq("check_date", getTodayIST()),
  ]);
  if (habitsRes.error) throw habitsRes.error;
  if (checksRes.error) throw checksRes.error;

  const checkedIds = new Set(checksRes.data.map((c) => c.habit_id as string));
  return (habitsRes.data as unknown as HabitRow[]).map((r) =>
    rowToHabit(r, checkedIds),
  );
}
