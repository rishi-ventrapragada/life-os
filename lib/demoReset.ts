/**
 * Demo-account reset — deletes every content row the demo user owns, keeping
 * life_areas untouched (Increment 2). Mirrors exportData.ts's shape: same
 * minimal client interface, same per-table error collection, so a single
 * failure surfaces instead of silently leaving a partial wipe unreported.
 *
 * Deleting habits/courses cascades to habit_checks/assignments (ON DELETE
 * CASCADE), so those two tables are deliberately not listed here.
 */

/** Content tables to wipe, in a fixed order. life_areas is never included. */
export const RESET_TABLES = [
  "habits",
  "courses",
  "goals",
  "tasks",
  "timetable_slots",
  "workout_split",
  "workout_logs",
  "journal_entries",
] as const;

export type ResetTable = (typeof RESET_TABLES)[number];

/**
 * Minimal shape of the Supabase client this depends on — keeps it testable
 * with a fake client, matches the real `.from(table).delete().eq(...)` chain.
 */
type DeletableClient = {
  from: (table: string) => {
    delete: () => {
      eq: (
        column: string,
        value: string,
      ) => PromiseLike<{ error: { message: string } | null }>;
    };
  };
};

export type ResetResult = {
  /** Per-table errors, keyed by table name. Empty when every delete succeeded. */
  errors: Partial<Record<ResetTable, string>>;
};

/**
 * Deletes every RESET_TABLES row owned by `userId`. The explicit
 * `.eq("user_id", userId)` filter is redundant with RLS (which already scopes
 * the delete to the caller) but documents intent and avoids ever sending an
 * unfiltered `.delete()`.
 */
export async function resetDemoData(
  client: DeletableClient,
  userId: string,
): Promise<ResetResult> {
  const errors: Partial<Record<ResetTable, string>> = {};

  for (const table of RESET_TABLES) {
    const { error } = await client.from(table).delete().eq("user_id", userId);
    if (error) errors[table] = error.message;
  }

  return { errors };
}
