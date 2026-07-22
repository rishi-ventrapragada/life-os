"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/components/auth/SessionProvider";
import type { SplitSlot } from "@/components/fitness/types";

const SPLIT_COLUMNS = "id,day_of_week,workout_name";

type SplitRow = {
  id: string;
  day_of_week: number;
  workout_name: string;
};

const SAVE_FAILED =
  "Couldn't save to the database — refresh to see what actually stuck.";

function rowToSlot(row: SplitRow): SplitSlot {
  return { id: row.id, dayOfWeek: row.day_of_week, workoutName: row.workout_name };
}

/** CRUD over the weekly workout split. No parent FK — standard shape (mirrors useTimetable). */
export function useWorkoutSplit() {
  const { session } = useSession();
  const userId = session?.user.id;
  const [slots, setSlots] = useState<SplitSlot[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from("workout_split")
      .select(SPLIT_COLUMNS)
      .order("day_of_week", { ascending: true })
      .order("created_at", { ascending: true });
    if (fetchError) throw fetchError;
    setSlots((data as SplitRow[]).map(rowToSlot));
  }, []);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      try {
        await refetch();
        if (!cancelled) setStatus("ready");
      } catch (err) {
        console.error("Workout split load failed:", err);
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

  async function resyncAfterError() {
    setError(SAVE_FAILED);
    await refetch().catch(() => {});
  }

  async function addSlot(data: Omit<SplitSlot, "id">): Promise<boolean> {
    setError(null);
    const { error: insertError } = await supabase.from("workout_split").insert({
      day_of_week: data.dayOfWeek,
      workout_name: data.workoutName,
    });
    if (insertError) {
      setError(SAVE_FAILED);
      return false;
    }
    await refetch().catch(() => {});
    return true;
  }

  async function updateSlot(id: string, data: Omit<SplitSlot, "id">): Promise<boolean> {
    setError(null);
    const { error: updateError } = await supabase
      .from("workout_split")
      .update({ day_of_week: data.dayOfWeek, workout_name: data.workoutName })
      .eq("id", id);
    if (updateError) {
      await resyncAfterError();
      return false;
    }
    await refetch().catch(() => {});
    return true;
  }

  async function deleteSlot(id: string) {
    setError(null);
    setSlots((prev) => prev.filter((s) => s.id !== id));
    const { error: deleteError } = await supabase
      .from("workout_split")
      .delete()
      .eq("id", id);
    if (deleteError) await resyncAfterError();
  }

  return { slots, status, error, addSlot, updateSlot, deleteSlot };
}
