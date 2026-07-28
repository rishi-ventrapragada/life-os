"use client";

import { useCallback, useEffect, useState } from "react";
import { ensureAreasSeeded } from "@/lib/bootstrap";
import { useSession } from "@/components/auth/SessionProvider";
import { LIFE_AREAS } from "@/lib/lifeAreas";
import {
  computeAreaConsistency,
  type AreaConsistency,
} from "@/lib/dashboard";
import { fetchConsistencyInputs } from "@/components/dashboard/dashboardData";

/**
 * Read-only data for the Analytics radar: habit consistency per life area over
 * the trailing 30-day IST window.
 *
 * Narrower than the other section hooks by design — the dashboard only ever
 * reads, so there is no add/update/delete, no areaIds ref (nothing writes an
 * area_id), and no resyncAfterError (no optimistic local state that could lie).
 * What it keeps is the established shape: session guard, loading/ready/error
 * status, and a cancelled flag so a fetch resolving after unmount can't set
 * state.
 *
 * The scoring itself lives in lib/dashboard.ts and the fetching in
 * dashboardData.ts; this file is state plumbing only (Law 1).
 */
export function useDashboard() {
  const { session } = useSession();
  const userId = session?.user.id;
  const [areaScores, setAreaScores] = useState<AreaConsistency[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  /**
   * Returns the scores rather than setting them, so the effect below can make
   * every state write conditional on `cancelled` — a fetch that resolves after
   * unmount must not touch state at all, not even the data.
   */
  const load = useCallback(async (): Promise<AreaConsistency[]> => {
    const { inputs, todayIST } = await fetchConsistencyInputs();
    // LIFE_AREAS, not the seeded map's keys: a fixed order keeps the radar's
    // axes stable between loads instead of following object-key order.
    return computeAreaConsistency(inputs, [...LIFE_AREAS], todayIST);
  }, []);

  useEffect(() => {
    if (!userId) return; // the gate guarantees a session; guard defensively
    let cancelled = false;
    (async () => {
      try {
        // Guarantees the five area rows exist before anything is scored — a
        // brand-new account would otherwise chart against nothing.
        await ensureAreasSeeded(userId);
        const scores = await load();
        if (!cancelled) {
          setAreaScores(scores);
          setStatus("ready");
        }
      } catch (err) {
        console.error("Dashboard load failed:", err);
        if (!cancelled) {
          setStatus("error");
          setError("Couldn't reach the database. Refresh to retry.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load, userId]);

  return { areaScores, status, error };
}
