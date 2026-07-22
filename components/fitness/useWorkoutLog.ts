"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/components/auth/SessionProvider";
import type { WorkoutLog } from "@/components/fitness/types";

const LOG_COLUMNS = "id,log_date,workout_name,notes,area,completed";

type LogRow = {
  id: string;
  log_date: string;
  workout_name: string;
  notes: string | null;
  area: WorkoutLog["area"];
  completed: boolean;
};

const SAVE_FAILED =
  "Couldn't save to the database — refresh to see what actually stuck.";

function rowToLog(row: LogRow): WorkoutLog {
  return {
    id: row.id,
    logDate: row.log_date,
    workoutName: row.workout_name,
    notes: row.notes,
    area: row.area,
    completed: row.completed,
  };
}

/** CRUD over dated workout log entries, newest-first. Closest to useJournal/useTasks. */
export function useWorkoutLog() {
  const { session } = useSession();
  const userId = session?.user.id;
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from("workout_logs")
      .select(LOG_COLUMNS)
      .order("log_date", { ascending: false })
      .order("created_at", { ascending: false });
    if (fetchError) throw fetchError;
    setLogs((data as LogRow[]).map(rowToLog));
  }, []);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      try {
        await refetch();
        if (!cancelled) setStatus("ready");
      } catch (err) {
        console.error("Workout log load failed:", err);
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

  function rowFor(data: Partial<Omit<WorkoutLog, "id">>) {
    const row: Record<string, unknown> = {};
    if (data.logDate !== undefined) row.log_date = data.logDate;
    if (data.workoutName !== undefined) row.workout_name = data.workoutName;
    if (data.notes !== undefined) row.notes = data.notes;
    if (data.area !== undefined) row.area = data.area;
    if (data.completed !== undefined) row.completed = data.completed;
    return row;
  }

  async function addLog(data: Omit<WorkoutLog, "id">): Promise<boolean> {
    setError(null);
    const { error: insertError } = await supabase
      .from("workout_logs")
      .insert(rowFor(data));
    if (insertError) {
      setError(SAVE_FAILED);
      return false;
    }
    await refetch().catch(() => {});
    return true;
  }

  async function updateLog(
    id: string,
    patch: Partial<Omit<WorkoutLog, "id">>,
  ): Promise<boolean> {
    setError(null);
    setLogs((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
    const { error: updateError } = await supabase
      .from("workout_logs")
      .update(rowFor(patch))
      .eq("id", id);
    if (updateError) {
      await resyncAfterError();
      return false;
    }
    return true;
  }

  async function deleteLog(id: string) {
    setError(null);
    setLogs((prev) => prev.filter((l) => l.id !== id));
    const { error: deleteError } = await supabase
      .from("workout_logs")
      .delete()
      .eq("id", id);
    if (deleteError) await resyncAfterError();
  }

  return { logs, status, error, addLog, updateLog, deleteLog };
}
