"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/components/auth/SessionProvider";
import type { TimetableSlot } from "@/components/academics/types";

const SLOT_COLUMNS = "id,day_of_week,time_label,subject";

type SlotRow = {
  id: string;
  day_of_week: number;
  time_label: string;
  subject: string;
};

const SAVE_FAILED =
  "Couldn't save to the database — refresh to see what actually stuck.";

function rowToSlot(row: SlotRow): TimetableSlot {
  return {
    id: row.id,
    dayOfWeek: row.day_of_week,
    timeLabel: row.time_label,
    subject: row.subject,
  };
}

/** Supabase-backed CRUD for timetable slots. No parent table — standard shape. */
export function useTimetable() {
  const { session } = useSession();
  const userId = session?.user.id;
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from("timetable_slots")
      .select(SLOT_COLUMNS)
      .order("day_of_week", { ascending: true })
      .order("time_label", { ascending: true });
    if (fetchError) throw fetchError;
    setSlots((data as SlotRow[]).map(rowToSlot));
  }, []);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      try {
        await refetch();
        if (!cancelled) setStatus("ready");
      } catch (err) {
        console.error("Timetable load failed:", err);
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

  async function addSlot(data: Omit<TimetableSlot, "id">): Promise<boolean> {
    setError(null);
    const { error: insertError } = await supabase.from("timetable_slots").insert({
      day_of_week: data.dayOfWeek,
      time_label: data.timeLabel,
      subject: data.subject,
    });
    if (insertError) {
      setError(SAVE_FAILED);
      return false;
    }
    await refetch().catch(() => {}); // re-sort by (day, time) in the DB order
    return true;
  }

  async function updateSlot(
    id: string,
    data: Omit<TimetableSlot, "id">,
  ): Promise<boolean> {
    setError(null);
    const { error: updateError } = await supabase
      .from("timetable_slots")
      .update({
        day_of_week: data.dayOfWeek,
        time_label: data.timeLabel,
        subject: data.subject,
      })
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
      .from("timetable_slots")
      .delete()
      .eq("id", id);
    if (deleteError) await resyncAfterError();
  }

  return { slots, status, error, addSlot, updateSlot, deleteSlot };
}
