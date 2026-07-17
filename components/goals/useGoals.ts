"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ensureSessionAndAreas } from "@/lib/bootstrap";
import type { LifeArea } from "@/lib/lifeAreas";
import type { Goal } from "@/components/goals/types";

const GOAL_COLUMNS = "id,title,progress_pct,deadline,life_areas!inner(name)";

type GoalRow = {
  id: string;
  title: string;
  progress_pct: number;
  deadline: string | null;
  life_areas: { name: string };
};

const SAVE_FAILED =
  "Couldn't save to the database — refresh to see what actually stuck.";

function rowToGoal(row: GoalRow): Goal {
  return {
    id: row.id,
    title: row.title,
    area: row.life_areas.name as LifeArea,
    deadline: row.deadline,
    progress: row.progress_pct,
  };
}

function patchToRow(patch: Partial<Goal>, areaIds: Record<string, string>) {
  const row: Record<string, unknown> = {};
  if (patch.title !== undefined) row.title = patch.title;
  if (patch.area !== undefined) row.area_id = areaIds[patch.area];
  if (patch.deadline !== undefined) row.deadline = patch.deadline;
  if (patch.progress !== undefined) row.progress_pct = patch.progress;
  return row;
}

/** Supabase-backed CRUD for the Goals section (anonymous session until Step 5). */
export function useGoals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const areaIds = useRef<Record<string, string>>({});
  const sliderTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const refetch = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from("goals")
      .select(GOAL_COLUMNS)
      .order("created_at", { ascending: true });
    if (fetchError) throw fetchError;
    setGoals((data as unknown as GoalRow[]).map(rowToGoal));
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const boot = await ensureSessionAndAreas();
        areaIds.current = boot.areaIdByName;
        await refetch();
        if (!cancelled) setStatus("ready");
      } catch (err) {
        console.error("Goals bootstrap failed:", err);
        if (!cancelled) {
          setStatus("error");
          setError("Couldn't reach the database. Refresh to retry.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refetch]);

  /** Resync from the database after a failed write so the UI never lies. */
  async function resyncAfterError() {
    setError(SAVE_FAILED);
    await refetch().catch(() => {});
  }

  async function addGoal(data: Omit<Goal, "id">): Promise<boolean> {
    setError(null);
    const { data: row, error: insertError } = await supabase
      .from("goals")
      .insert(patchToRow(data, areaIds.current))
      .select(GOAL_COLUMNS)
      .single();
    if (insertError) {
      setError(SAVE_FAILED);
      return false;
    }
    setGoals((prev) => [...prev, rowToGoal(row as unknown as GoalRow)]);
    return true;
  }

  function updateGoal(id: string, patch: Partial<Goal>) {
    setError(null);
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, ...patch } : g)));

    const persist = async () => {
      const { error: updateError } = await supabase
        .from("goals")
        .update(patchToRow(patch, areaIds.current))
        .eq("id", id);
      if (updateError) await resyncAfterError();
    };

    const sliderOnly = patch.progress !== undefined && Object.keys(patch).length === 1;
    if (sliderOnly) {
      // Dragging fires onChange per tick; only the settled value needs saving.
      clearTimeout(sliderTimers.current.get(id));
      sliderTimers.current.set(
        id,
        setTimeout(() => {
          sliderTimers.current.delete(id);
          void persist();
        }, 400),
      );
    } else {
      void persist();
    }
  }

  async function deleteGoal(id: string) {
    setError(null);
    setGoals((prev) => prev.filter((g) => g.id !== id));
    const { error: deleteError } = await supabase
      .from("goals")
      .delete()
      .eq("id", id);
    if (deleteError) await resyncAfterError();
  }

  return { goals, status, error, addGoal, updateGoal, deleteGoal };
}
