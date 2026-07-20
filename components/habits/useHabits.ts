"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ensureAreasSeeded } from "@/lib/bootstrap";
import { useSession } from "@/components/auth/SessionProvider";
import { getTodayIST } from "@/lib/dates";
import type { LifeArea } from "@/lib/lifeAreas";
import type { Habit } from "@/components/habits/types";
import {
  HABIT_COLUMNS,
  NOT_READY,
  SAVE_FAILED,
  UNIQUE_VIOLATION,
  fetchActiveHabits,
  rowToHabit,
  type HabitRow,
} from "@/components/habits/habitsData";

/** Supabase-backed CRUD for the Habits section, scoped to the signed-in user. */
export function useHabits() {
  const { session } = useSession();
  const userId = session?.user.id;
  const [habits, setHabits] = useState<Habit[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const areaIds = useRef<Record<string, string>>({});

  const refetch = useCallback(async () => {
    setHabits(await fetchActiveHabits());
  }, []);

  useEffect(() => {
    if (!userId) return; // the gate guarantees a session; guard defensively
    let cancelled = false;
    (async () => {
      try {
        const boot = await ensureAreasSeeded(userId);
        areaIds.current = boot.areaIdByName;
        await refetch();
        if (!cancelled) setStatus("ready");
      } catch (err) {
        console.error("Habits bootstrap failed:", err);
        if (!cancelled) {
          setStatus("error");
          setError("Couldn't reach the database. Refresh to retry.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refetch, userId]);

  /** Resync from the database after a failed write so the UI never lies. */
  async function resyncAfterError() {
    setError(SAVE_FAILED);
    await refetch().catch(() => {});
  }

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
    const areaId = areaIds.current[data.area];
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
      const areaId = areaIds.current[patch.area];
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

  return {
    habits,
    status,
    error,
    addHabit,
    updateHabit,
    archiveHabit,
    toggleToday,
  };
}
