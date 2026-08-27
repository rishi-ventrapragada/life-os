"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";
import { ensureAreasSeeded } from "@/lib/bootstrap";
import { useSession } from "@/components/auth/SessionProvider";
import { completionStamp } from "@/lib/completion";
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

/**
 * Clock for `completed_at`. An instant, not an IST calendar date, so
 * getTodayIST() deliberately does not apply — see lib/completion.ts.
 */
const nowISO = () => new Date().toISOString();

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

/**
 * Maps model fields to columns. `completed_at` is deliberately NOT handled here:
 * it is derived from a status *transition*, not from a field on Task, so the
 * callers merge it in via completionStamp() — always into this same row object,
 * so the stamp and the status ship in one write rather than a second round-trip.
 */
function patchToRow(patch: Partial<Task>, areaIds: Record<string, string>) {
  const row: Record<string, unknown> = {};
  if (patch.title !== undefined) row.title = patch.title;
  if (patch.area !== undefined) row.area_id = areaIds[patch.area];
  if (patch.dueDate !== undefined) row.due_date = patch.dueDate;
  if (patch.priority !== undefined) row.priority = patch.priority;
  if (patch.status !== undefined) row.status = patch.status;
  return row;
}

export type TasksValue = {
  tasks: Task[];
  status: "loading" | "ready" | "error";
  error: string | null;
  addTask: (data: Omit<Task, "id">) => Promise<boolean>;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => Promise<void>;
};

/**
 * `undefined` default on purpose — no benign fallback. A consumer mounted
 * outside the provider would otherwise render an empty list and a no-op
 * addTask: a silently broken section that looks like "no tasks yet". The
 * useTasks() hook below throws instead, which is the failure we want.
 */
const TasksContext = createContext<TasksValue | undefined>(undefined);

/**
 * Supabase-backed CRUD for every task consumer, scoped to the signed-in user.
 *
 * This body is the former useTasks() hook, relocated unchanged (Increment 1).
 * The fetch, the optimistic add/update/delete, resyncAfterError, the D1
 * NOT_READY guard and the areaIds ref all behave exactly as before; the only
 * thing that changed is WHERE the state lives. Previously TodaySection and
 * TasksSection each mounted their own instance, so the page fetched `tasks`
 * twice and the two copies drifted: an add in one was invisible in the other
 * until a refresh. Now one instance sits above both.
 */
function useTasksState(): TasksValue {
  const { session } = useSession();
  const userId = session?.user.id;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const areaIds = useRef<Record<string, string>>({});

  /**
   * Mirror of `tasks` for reads inside event handlers. updateTask needs the
   * status a task had before the write, and a ref gives it the committed value
   * without making the setTasks updater impure (React 19 lint forbids side
   * effects in updaters) and without adding `tasks` to a dependency list.
   */
  const tasksRef = useRef<Task[]>([]);
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  /**
   * Fetches every task row — deliberately unfiltered. Section-level filtering
   * is a client-side pass over these rows, so switching filters never hits the
   * network.
   */
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
    // A task can be created directly as Done (the form offers all three
    // statuses), so creation is a transition from "no previous status".
    const row0 = patchToRow(data, areaIds.current);
    const stamp = completionStamp(undefined, data.status, nowISO);
    if (stamp !== undefined) row0.completed_at = stamp;

    const { data: row, error: insertError } = await supabase
      .from("tasks")
      .insert(row0)
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

    // The status the task had BEFORE this write. Needed because the edit form
    // resends the full task, so `patch.status` is present even on a rename —
    // only comparing against the previous value distinguishes a real completion
    // from an unrelated edit. Read from the ref (committed state) rather than
    // from inside the updater, which must stay pure.
    const prevStatus = tasksRef.current.find((t) => t.id === id)?.status;

    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));

    void (async () => {
      const row = patchToRow(patch, areaIds.current);
      const stamp = completionStamp(prevStatus, patch.status, nowISO);
      if (stamp !== undefined) row.completed_at = stamp;

      const { error: updateError } = await supabase
        .from("tasks")
        .update(row)
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

/**
 * Mounts the single task state for the whole authed tree. Placed inside
 * AuthGate's logged-in branch (app/page.tsx) for two reasons: the fetch must
 * never run for a logged-out visitor, and a sign-out unmounts this provider so
 * the next user cannot inherit the previous one's rows.
 */
export default function TasksProvider({ children }: { children: ReactNode }) {
  const value = useTasksState();
  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
}

/** Read the shared task state anywhere below <TasksProvider>. */
export function useTasks(): TasksValue {
  const ctx = useContext(TasksContext);
  if (!ctx) {
    throw new Error(
      "useTasks must be used inside <TasksProvider>. Wrap the authed tree in app/page.tsx.",
    );
  }
  return ctx;
}
