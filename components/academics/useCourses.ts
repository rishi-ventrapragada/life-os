"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/components/auth/SessionProvider";
import type { Course } from "@/components/academics/types";

const COURSE_COLUMNS = "id,name,next_exam_date";

type CourseRow = {
  id: string;
  name: string;
  next_exam_date: string | null;
};

const SAVE_FAILED =
  "Couldn't save to the database — refresh to see what actually stuck.";

function rowToCourse(row: CourseRow): Course {
  return { id: row.id, name: row.name, nextExamDate: row.next_exam_date };
}

/**
 * Supabase-backed CRUD for Courses, scoped to the signed-in user by RLS.
 * Same shape as useTasks/useGoals but with no life_areas (courses aren't
 * tagged by area), so no ensureAreasSeeded and no area-id guard.
 */
export function useCourses() {
  const { session } = useSession();
  const userId = session?.user.id;
  const [courses, setCourses] = useState<Course[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from("courses")
      .select(COURSE_COLUMNS)
      .order("created_at", { ascending: true });
    if (fetchError) throw fetchError;
    setCourses((data as CourseRow[]).map(rowToCourse));
  }, []);

  useEffect(() => {
    if (!userId) return; // the gate guarantees a session; guard defensively
    let cancelled = false;
    (async () => {
      try {
        await refetch();
        if (!cancelled) setStatus("ready");
      } catch (err) {
        console.error("Courses load failed:", err);
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

  function rowFor(patch: Partial<Course>) {
    const row: Record<string, unknown> = {};
    if (patch.name !== undefined) row.name = patch.name;
    if (patch.nextExamDate !== undefined) row.next_exam_date = patch.nextExamDate;
    return row;
  }

  async function addCourse(data: Omit<Course, "id">): Promise<boolean> {
    setError(null);
    const { data: row, error: insertError } = await supabase
      .from("courses")
      .insert(rowFor(data))
      .select(COURSE_COLUMNS)
      .single();
    if (insertError) {
      setError(SAVE_FAILED);
      return false;
    }
    setCourses((prev) => [...prev, rowToCourse(row as CourseRow)]);
    return true;
  }

  async function updateCourse(id: string, patch: Partial<Course>): Promise<boolean> {
    setError(null);
    setCourses((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    const { error: updateError } = await supabase
      .from("courses")
      .update(rowFor(patch))
      .eq("id", id);
    if (updateError) {
      await resyncAfterError();
      return false;
    }
    return true;
  }

  /** Deleting a course cascade-deletes its assignments (FK ON DELETE CASCADE). */
  async function deleteCourse(id: string) {
    setError(null);
    setCourses((prev) => prev.filter((c) => c.id !== id));
    const { error: deleteError } = await supabase
      .from("courses")
      .delete()
      .eq("id", id);
    if (deleteError) await resyncAfterError();
  }

  return { courses, status, error, addCourse, updateCourse, deleteCourse };
}
