"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ensureAreasSeeded } from "@/lib/bootstrap";
import { useSession } from "@/components/auth/SessionProvider";
import type { LifeArea } from "@/lib/lifeAreas";
import type { Task, Priority, Status } from "@/components/tasks/types";

const TASK_COLUMNS = "id,title,due_date,priority,status,life_areas!inner(name)";

type TaskRow = {
  id: string;
  title: string;
  due_date: string | null;
  priority: Priority;
  status: Status;
  life_areas: { name: string };
};

const SAVE_FAILED =
  "Couldn't save to the database — refresh to see what actually stuck.";

const NOT_READY = "Workspace still setting up — try again in a second.";

function rowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    area: row.life_areas.name as LifeArea,
    dueDate: row.due_date,
    priority: row.priority,
    status: row.status,
  };
}

function patchToRow(patch: Partial<Task>, areaIds: Record<string, string>) {
  const row: Record<string, unknown> = {};
  if (patch.title !== undefined) row.title = patch.title;
  if (patch.area !== undefined) row.area_id = areaIds[patch.area];
  if (patch.dueDate !== undefined) row.due_date = patch.dueDate;
  if (patch.priority !== undefined) row.priority = patch.priority;
  if (patch.status !== undefined) row.status = patch.status;
  return row;
}

/** Supabase-backed CRUD for the Tasks section, scoped to the signed-in user. */
export function useTasks() {
  const { session } = useSession();
  const userId = session?.user.id;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const areaIds = useRef<Record<string, string>>({});

  const refetch = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from("tasks")
      .select(TASK_COLUMNS)
      .order("created_at", { ascending: true });
    if (fetchError) throw fetchError;
    setTasks((data as unknown as TaskRow[]).map(rowToTask));
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
        console.error("Tasks bootstrap failed:", err);
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

  async function addTask(data: Omit<Task, "id">): Promise<boolean> {
    setError(null);
    const areaId = areaIds.current[data.area];
    if (!areaId) {
      setError(NOT_READY);
      return false;
    }
    const { data: row, error: insertError } = await supabase
      .from("tasks")
      .insert(patchToRow(data, areaIds.current))
      .select(TASK_COLUMNS)
      .single();
    if (insertError) {
      setError(SAVE_FAILED);
      return false;
    }
    setTasks((prev) => [...prev, rowToTask(row as unknown as TaskRow)]);
    return true;
  }

  function updateTask(id: string, patch: Partial<Task>) {
    setError(null);
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));

    void (async () => {
      const { error: updateError } = await supabase
        .from("tasks")
        .update(patchToRow(patch, areaIds.current))
        .eq("id", id);
      if (updateError) await resyncAfterError();
    })();
  }

  async function deleteTask(id: string) {
    setError(null);
    setTasks((prev) => prev.filter((t) => t.id !== id));
    const { error: deleteError } = await supabase
      .from("tasks")
      .delete()
      .eq("id", id);
    if (deleteError) await resyncAfterError();
  }

  return { tasks, status, error, addTask, updateTask, deleteTask };
}
