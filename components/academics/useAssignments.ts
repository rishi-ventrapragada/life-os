"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/components/auth/SessionProvider";
import type {
  Assignment,
  AssignmentStatus,
} from "@/components/academics/types";

const ASSIGNMENT_COLUMNS = "id,course_id,title,due_date,status";

type AssignmentRow = {
  id: string;
  course_id: string;
  title: string;
  due_date: string | null;
  status: AssignmentStatus;
};

const SAVE_FAILED =
  "Couldn't save to the database — refresh to see what actually stuck.";
const NO_COURSE =
  "Pick a course first — assignments need one to attach to.";

function rowToAssignment(row: AssignmentRow): Assignment {
  return {
    id: row.id,
    courseId: row.course_id,
    title: row.title,
    dueDate: row.due_date,
    status: row.status,
  };
}

/**
 * Supabase-backed CRUD for Assignments. Every assignment belongs to a course;
 * the DB enforces that its INSERT policy verifies the caller owns that course
 * (parent-ownership EXISTS), so addAssignment must resolve a real course_id
 * before inserting — the parent-ownership analogue of the D1 area-id guard.
 */
export function useAssignments(knownCourseIds: string[]) {
  const { session } = useSession();
  const userId = session?.user.id;
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from("assignments")
      .select(ASSIGNMENT_COLUMNS)
      .order("created_at", { ascending: true });
    if (fetchError) throw fetchError;
    setAssignments((data as AssignmentRow[]).map(rowToAssignment));
  }, []);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      try {
        await refetch();
        if (!cancelled) setStatus("ready");
      } catch (err) {
        console.error("Assignments load failed:", err);
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

  async function addAssignment(
    data: Omit<Assignment, "id">,
  ): Promise<boolean> {
    setError(null);
    // Guard: the chosen course must be one we actually loaded (and thus own).
    if (!data.courseId || !knownCourseIds.includes(data.courseId)) {
      setError(NO_COURSE);
      return false;
    }
    const { data: row, error: insertError } = await supabase
      .from("assignments")
      .insert({
        course_id: data.courseId,
        title: data.title,
        due_date: data.dueDate,
        status: data.status,
      })
      .select(ASSIGNMENT_COLUMNS)
      .single();
    if (insertError) {
      setError(SAVE_FAILED);
      return false;
    }
    setAssignments((prev) => [...prev, rowToAssignment(row as AssignmentRow)]);
    return true;
  }

  async function updateAssignment(
    id: string,
    patch: Partial<Omit<Assignment, "id" | "courseId">>,
  ): Promise<boolean> {
    setError(null);
    setAssignments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    );
    const row: Record<string, unknown> = {};
    if (patch.title !== undefined) row.title = patch.title;
    if (patch.dueDate !== undefined) row.due_date = patch.dueDate;
    if (patch.status !== undefined) row.status = patch.status;
    const { error: updateError } = await supabase
      .from("assignments")
      .update(row)
      .eq("id", id);
    if (updateError) {
      await resyncAfterError();
      return false;
    }
    return true;
  }

  async function deleteAssignment(id: string) {
    setError(null);
    setAssignments((prev) => prev.filter((a) => a.id !== id));
    const { error: deleteError } = await supabase
      .from("assignments")
      .delete()
      .eq("id", id);
    if (deleteError) await resyncAfterError();
  }

  return {
    assignments,
    status,
    error,
    addAssignment,
    updateAssignment,
    deleteAssignment,
  };
}
