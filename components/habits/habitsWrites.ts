"use client";

import { supabase } from "@/lib/supabase";
import { getTodayIST } from "@/lib/dates";
import type { LifeArea } from "@/lib/lifeAreas";
import type { Habit } from "@/components/habits/types";
import {
  HABIT_COLUMNS,
  NOT_READY,
  SAVE_FAILED,
  UNIQUE_VIOLATION,
  rowToHabit,
  type HabitRow,
} from "@/components/habits/habitsData";

/**
 * The Habits slice's write mechanics — add, update, archive and the daily
 * check-off — split out of HabitsProvider.tsx to keep that file under the
 * ~200-line cap (Law 1), the same way habitsData.ts holds the read path.
 *
 * These are NOT pure like habitsData.ts: every one of them writes React state
 * optimistically before awaiting Supabase, which is what makes the UI feel
 * instant. So rather than free functions, they are built by a factory that
 * takes the provider's state setters once and closes over them. The function
 * bodies are byte-identical to the versions that lived in the provider —
 * this was a mechanical extraction, not a rewrite.
 */
export type HabitWriteDeps = {
  setHabits: React.Dispatch<React.SetStateAction<Habit[]>>;
  setError: (message: string | null) => void;
  /**
   * life_area name -> row id; empty until the seed resolves (the D1 guard).
   *
   * A getter, not the ref itself: React 19's lint forbids handing a ref to a
   * function during render, since it cannot prove the value isn't read there.
   * The read still happens inside the handlers at call time, exactly as it did
   * when these functions closed over `areaIds.current` directly.
   */
  getAreaIds: () => Record<string, string>;
  /** Re-reads from the database after a failed write so the UI never lies. */
  resyncAfterError: () => Promise<void>;
};

export function createHabitWrites({
  setHabits,
  setError,
  getAreaIds,
  resyncAfterError,
}: HabitWriteDeps) {
  /**
   * D1 fix — deliberately NOT the Goals/Tasks add-path. Those call patchToRow
   * with a possibly-empty areaIds map, so a submit before the seed resolves
   * sends area_id: undefined; the row lands with area_id = null and the
   * life_areas!inner join hides it from every future fetch — an invisible
   * orphan while the UI says "save failed". Here a missing area id is a hard
   * bail with a real message, before any insert.
   */
  async function addHabit(data: { name: string; area: LifeArea }): Promise<boolean> {
    setError(null);
    const areaId = getAreaIds()[data.area];
    if (!areaId) {
      setError(NOT_READY);
      return false;
    }
    const { data: row, error: insertError } = await supabase
      .from("habits")
      .insert({ name: data.name, area_id: areaId })
      .select(HABIT_COLUMNS)
      .single();
    if (insertError) {
      setError(SAVE_FAILED);
      return false;
    }
    // A brand-new habit cannot have a check yet — empty history map.
    setHabits((prev) => [
      ...prev,
      rowToHabit(row as unknown as HabitRow, new Map(), getTodayIST()),
    ]);
    return true;
  }

  /** Same guard: an edit that changes area must resolve a real area id. */
  async function updateHabit(
    id: string,
    patch: { name?: string; area?: LifeArea },
  ): Promise<boolean> {
    setError(null);
    const row: Record<string, unknown> = {};
    if (patch.name !== undefined) row.name = patch.name;
    if (patch.area !== undefined) {
      const areaId = getAreaIds()[patch.area];
      if (!areaId) {
        setError(NOT_READY);
        return false;
      }
      row.area_id = areaId;
    }

    setHabits((prev) =>
      prev.map((h) => (h.id === id ? { ...h, ...patch } : h)),
    );
    const { error: updateError } = await supabase
      .from("habits")
      .update(row)
      .eq("id", id);
    if (updateError) {
      await resyncAfterError();
      return false;
    }
    return true;
  }

  /**
   * Archive = set archived_at (Decision B). Never deletes the habit and never
   * touches habit_checks — Step 8's streaks read that history.
   *
   * Law 3 note: archived_at is an *instant*, not an IST calendar date, so
   * getTodayIST() is deliberately not used here. `new Date().toISOString()` is
   * a UTC timestamp for a timestamptz column — no date arithmetic, no calendar
   * reasoning, nothing streaks or due-dates ever read. The date logic Law 3
   * governs is check_date, which does go through getTodayIST().
   */
  async function archiveHabit(id: string) {
    setError(null);
    setHabits((prev) => prev.filter((h) => h.id !== id));
    const { error: archiveError } = await supabase
      .from("habits")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", id);
    if (archiveError) await resyncAfterError();
  }

  /**
   * Today's checkbox as insert/delete, never a boolean column (Law 3: the date
   * is the raw yyyy-mm-dd from getTodayIST()). The unique(habit_id, check_date)
   * constraint is the real guard against double-logging; the optimistic flip is
   * convenience only, so a 23505 means "already checked" — success, not error.
   */
  async function toggleToday(habit: Habit) {
    setError(null);
    const next = !habit.checkedToday;
    const today = getTodayIST();

    // Move checkDates too, not just the flag: the streak badge and the grid
    // both read that array, so they update with the checkbox instead of
    // waiting for a refetch. resyncAfterError() still corrects any lie.
    setHabits((prev) =>
      prev.map((h) =>
        h.id === habit.id
          ? {
              ...h,
              checkedToday: next,
              checkDates: next
                ? [...h.checkDates, today].sort()
                : h.checkDates.filter((d) => d !== today),
            }
          : h,
      ),
    );

    if (next) {
      const { error: insertError } = await supabase
        .from("habit_checks")
        .insert({ habit_id: habit.id, check_date: getTodayIST() });
      if (insertError && insertError.code !== UNIQUE_VIOLATION) {
        await resyncAfterError();
      }
    } else {
      const { error: deleteError } = await supabase
        .from("habit_checks")
        .delete()
        .eq("habit_id", habit.id)
        .eq("check_date", getTodayIST());
      if (deleteError) await resyncAfterError();
    }
  }

  return { addHabit, updateHabit, archiveHabit, toggleToday };
}
