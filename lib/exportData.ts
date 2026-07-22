/**
 * JSON data-export — assembles every row the signed-in user owns into one object.
 *
 * All reads go through the passed-in client, which is the shared anon-key browser
 * client under Row Level Security (Law 4): each `select("*")` can only ever return
 * the caller's own rows. There is no service key and no server endpoint here — the
 * export is exactly as scoped as everything else the user can already read.
 *
 * Raw column values are passed through verbatim — no reformatting. Stored date
 * strings (log_date / due_date / entry_date) stay `yyyy-mm-dd` as written (Law 3);
 * the only produced timestamp is `exportedAt`, which is an instant, not a calendar
 * date (same reasoning as habits' `archived_at`), so a real `new Date()` is correct.
 */

/** Every RLS table in the app, in a fixed order. Update this when a table is added. */
export const EXPORT_TABLES = [
  "life_areas",
  "goals",
  "tasks",
  "habits",
  "habit_checks",
  "journal_entries",
  "courses",
  "assignments",
  "timetable_slots",
  "workout_split",
  "workout_logs",
] as const;

export type ExportTable = (typeof EXPORT_TABLES)[number];

export type ExportFile = {
  exportedAt: string;
  tables: Record<ExportTable, unknown[]>;
};

/**
 * Minimal shape of the Supabase client we depend on — keeps this testable, and
 * matches the real client. `select()` returns a thenable (PostgrestFilterBuilder,
 * not a plain Promise), so this uses `PromiseLike`, which both the real builder
 * and a fake `async () => …` satisfy.
 */
type SelectableClient = {
  from: (table: string) => {
    select: (
      columns: string,
    ) => PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>;
  };
};

export type ExportResult = {
  data: ExportFile;
  /** Per-table errors, keyed by table name. Empty when every table read cleanly. */
  errors: Partial<Record<ExportTable, string>>;
};

/**
 * Read every table and assemble the export object. A table that errors is recorded
 * in `errors` and exported as an empty array, so a single failure surfaces instead
 * of silently producing a partial file that looks complete.
 */
export async function collectExport(
  client: SelectableClient,
): Promise<ExportResult> {
  const tables = {} as Record<ExportTable, unknown[]>;
  const errors: Partial<Record<ExportTable, string>> = {};

  for (const table of EXPORT_TABLES) {
    const { data, error } = await client.from(table).select("*");
    if (error) {
      errors[table] = error.message;
      tables[table] = [];
    } else {
      tables[table] = data ?? [];
    }
  }

  return {
    data: { exportedAt: new Date().toISOString(), tables },
    errors,
  };
}
