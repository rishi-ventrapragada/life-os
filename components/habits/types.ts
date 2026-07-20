import type { LifeArea } from "@/lib/lifeAreas";

/**
 * Mirrors the `habits` table (PRD §6), minus user_id which is enforced by RLS.
 *
 * `checkedToday` is NOT a column — it is derived per fetch from whether a
 * `habit_checks` row exists for (habit_id, getTodayIST()). A mutable "done"
 * flag on the habit would drift from the check history Step 8's streaks read.
 *
 * `archivedAt` is NULL for active habits and a timestamp once archived
 * (Decision B): archiving hides a habit from the active list while preserving
 * both when it happened and every `habit_checks` row it owns.
 */
export type Habit = {
  id: string;
  name: string;
  area: LifeArea;
  /** ISO timestamp when archived, or null while active. */
  archivedAt: string | null;
  /** Derived: a habit_checks row exists for today's IST date. */
  checkedToday: boolean;
};
