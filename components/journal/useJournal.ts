"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/components/auth/SessionProvider";

export type JournalEntry = {
  id: string;
  entryDate: string; // yyyy-mm-dd
  content: string;
};

type JournalRow = {
  id: string;
  entry_date: string;
  content: string;
};

const SAVE_FAILED =
  "Couldn't save to the database — refresh to see what actually stuck.";

/**
 * The many-day journal (PRD §4.7) — every entry, newest-first. Sibling to
 * components/today/useJournalToday.ts, which is deliberately scoped to today's
 * single row; this hook owns the full list and past-day editing/backfill.
 *
 * Writes are UPSERTs on the `unique (user_id, entry_date)` constraint, so a
 * save for a date that already exists edits that row rather than duplicating —
 * the DB constraint is the source of truth (proven at Step 9 close). entry_date
 * is always a raw yyyy-mm-dd string (Law 3): today from getTodayIST(), a
 * backfilled day from the date input — never new Date() maths.
 */
export function useJournal() {
  const { session } = useSession();
  const userId = session?.user.id;
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from("journal_entries")
      .select("id,entry_date,content")
      .order("entry_date", { ascending: false });
    if (fetchError) throw fetchError;
    setEntries(
      (data as JournalRow[]).map((r) => ({
        id: r.id,
        entryDate: r.entry_date,
        content: r.content,
      })),
    );
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

  /** Resync from the database after a failed write so the UI never lies. */
  async function resyncAfterError() {
    setError(SAVE_FAILED);
    await refetch().catch(() => {});
  }

  /**
   * Create or edit the entry for `entryDate`. D1 guard: never writes before the
   * session/fetch resolves, and an empty line is a no-op rather than an empty
   * row. Re-fetches after the upsert so a backfilled row lands in the list in
   * the right (newest-first) position without re-sorting by hand.
   */
  async function saveEntry(entryDate: string, content: string): Promise<boolean> {
    if (status !== "ready") return false;
    const text = content.trim();
    if (!text) return false;

    setError(null);
    const { error: saveError } = await supabase
      .from("journal_entries")
      .upsert(
        { entry_date: entryDate, content: text },
        { onConflict: "user_id,entry_date" },
      );
    if (saveError) {
      await resyncAfterError();
      return false;
    }
    await refetch().catch(() => {});
    return true;
  }

  return { entries, status, error, saveEntry };
}
