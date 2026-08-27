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
import { ensureAreasSeeded } from "@/lib/bootstrap";
import { useSession } from "@/components/auth/SessionProvider";
import type { LifeArea } from "@/lib/lifeAreas";
import type { Habit } from "@/components/habits/types";
import { SAVE_FAILED, fetchActiveHabits } from "@/components/habits/habitsData";
import { createHabitWrites } from "@/components/habits/habitsWrites";

export type HabitsValue = {
  habits: Habit[];
  status: "loading" | "ready" | "error";
  error: string | null;
  addHabit: (data: { name: string; area: LifeArea }) => Promise<boolean>;
  updateHabit: (
    id: string,
    patch: { name?: string; area?: LifeArea },
  ) => Promise<boolean>;
  archiveHabit: (id: string) => Promise<void>;
  toggleToday: (habit: Habit) => Promise<void>;
};

/**
 * `undefined` default on purpose — no benign fallback. A consumer mounted
 * outside the provider would otherwise render an empty habit list and a no-op
 * toggleToday: a silently dead section that looks like "no habits yet". The
 * useHabits() hook below throws instead, which is the failure we want.
 */
const HabitsContext = createContext<HabitsValue | undefined>(undefined);

/**
 * Supabase-backed CRUD for every habit consumer, scoped to the signed-in user.
 *
 * This body is the former useHabits() hook, relocated unchanged (Increment 2).
 * The habits + habit_checks fetch, the optimistic check-off, archive, add,
 * update, resyncAfterError and the D1 NOT_READY guard all behave exactly as
 * before; only WHERE the state lives changed. Previously TodaySection and
 * HabitsSection each mounted their own instance, so the page fetched habits
 * and checks twice and the copies drifted: a check-off in one was invisible in
 * the other until a refresh. Now one instance sits above both.
 *
 * Streaks and the month grid need no special handling here: toggleToday moves
 * `checkDates` (not just the flag), and computeStreaks/HabitGrid derive from
 * that array during render — so they already update in the same tick as the
 * checkbox, and sharing the state simply makes that true across sections too.
 */
function useHabitsState(): HabitsValue {
  const { session } = useSession();
  const userId = session?.user.id;
  const [habits, setHabits] = useState<Habit[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const areaIds = useRef<Record<string, string>>({});

  const refetch = useCallback(async () => {
    setHabits(await fetchActiveHabits());
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
        console.error("Habits bootstrap failed:", err);
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
   * The four write paths live in habitsWrites.ts (Law 1: this file was over the
   * ~200-line cap). Their bodies are unchanged; the factory just hands them the
   * setters they used to close over directly.
   *
   * Built lazily inside each wrapper rather than once during render: the
   * factory reads `areaIds.current`, and React 19's lint forbids a ref reaching
   * a function call during render. Every one of these only ever runs from an
   * event handler, so constructing on call is the same work at the same moment
   * — and it keeps the D1 guard reading the *current* seed state, exactly as
   * the originals did.
   */
  const writes = () =>
    createHabitWrites({
      setHabits,
      setError,
      getAreaIds: () => areaIds.current,
      resyncAfterError,
    });

  const addHabit: HabitsValue["addHabit"] = (data) => writes().addHabit(data);
  const updateHabit: HabitsValue["updateHabit"] = (id, patch) =>
    writes().updateHabit(id, patch);
  const archiveHabit: HabitsValue["archiveHabit"] = (id) =>
    writes().archiveHabit(id);
  const toggleToday: HabitsValue["toggleToday"] = (habit) =>
    writes().toggleToday(habit);

  return {
    habits,
    status,
    error,
    addHabit,
    updateHabit,
    archiveHabit,
    toggleToday,
  };
}

/**
 * Mounts the single habit state for the whole authed tree. Placed inside
 * AuthGate's logged-in branch (app/page.tsx) for two reasons: the fetch must
 * never run for a logged-out visitor, and a sign-out unmounts this provider so
 * the next user cannot inherit the previous one's rows.
 */
export default function HabitsProvider({ children }: { children: ReactNode }) {
  const value = useHabitsState();
  return (
    <HabitsContext.Provider value={value}>{children}</HabitsContext.Provider>
  );
}

/** Read the shared habit state anywhere below <HabitsProvider>. */
export function useHabits(): HabitsValue {
  const ctx = useContext(HabitsContext);
  if (!ctx) {
    throw new Error(
      "useHabits must be used inside <HabitsProvider>. Wrap the authed tree in app/page.tsx.",
    );
  }
  return ctx;
}
