"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/components/auth/SessionProvider";
import { getTodayIST } from "@/lib/dates";

const SAVE_FAILED =
  "Couldn't save to the database — refresh to see what actually stuck.";

/**
 * Today's single journal line (PRD §4.1). Reads and writes exactly one row —
 * the one for `entry_date = getTodayIST()` (Law 3: the raw yyyy-mm-dd, never a
 * browser-clock date).
 *
 * Saving is an UPSERT on the `unique (user_id, entry_date)` constraint, so
 * writing twice in a day edits the entry instead of failing on a duplicate.
 * That mirrors Step 7's discipline: the DB constraint is the source of truth,
 * and the app cooperates with it rather than trying to out-guess it.
 *
 * Step 10 builds the full journal list view on the same table; this hook is
 * deliberately scoped to today only.
 */
export function useJournalToday() {
  const { session } = useSession();
  const userId = session?.user.id;
  const [content, setContent] = useState("");
  const [savedContent, setSavedContent] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const refetch = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from("journal_entries")
      .select("content")
      .eq("entry_date", getTodayIST())
      .maybeSingle();
    if (fetchError) throw fetchError;
    const text = data?.content ?? "";
    setContent(text);
    setSavedContent(text);
  }, []);

  useEffect(() => {
    if (!userId) return; // the gate guarantees a session; guard defensively
    let cancelled = false;
    (async () => {
      try {
        await refetch();
        if (!cancelled) setStatus("ready");
      } catch (err) {
        console.error("Journal load failed:", err);
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

  /**
   * D1 guard: never write before the session/fetch resolves. An empty line is
   * treated as a no-op rather than writing an empty row — deleting the day's
   * entry is Step 10's concern, not a side effect of blurring an empty input.
   */
  async function save(): Promise<boolean> {
    if (status !== "ready" || isSaving) return false;
    const text = content.trim();
    if (!text || text === savedContent) return false;

    setError(null);
    setIsSaving(true);
    const { error: saveError } = await supabase
      .from("journal_entries")
      .upsert(
        { entry_date: getTodayIST(), content: text },
        { onConflict: "user_id,entry_date" },
      );
    setIsSaving(false);

    if (saveError) {
      setError(SAVE_FAILED);
      await refetch().catch(() => {}); // the UI never lies
      return false;
    }
    setSavedContent(text);
    return true;
  }

  return {
    content,
    setContent,
    /** True when the box holds unsaved edits. */
    isDirty: content.trim() !== savedContent && content.trim() !== "",
    status,
    error,
    isSaving,
    save,
  };
}
