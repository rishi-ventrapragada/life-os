import { describe, it, expect } from "vitest";
import { EXPORT_TABLES, collectExport } from "@/lib/exportData";

describe("EXPORT_TABLES", () => {
  it("lists all 11 RLS tables, once each", () => {
    expect(EXPORT_TABLES).toHaveLength(11);
    expect(new Set(EXPORT_TABLES).size).toBe(11);
  });

  it("includes every table by name", () => {
    for (const t of [
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
    ]) {
      expect(EXPORT_TABLES).toContain(t);
    }
  });
});

/**
 * Fake client: records which tables were read, returns one canned row per table.
 *
 * Overrides are written partially (`{ data: [] }`, `{ error: … }`) for brevity,
 * but `collectExport` destructures BOTH `data` and `error` off every result, so
 * the fake must hand back both keys with `null` for whichever the test omitted —
 * matching SelectableClient's `unknown[] | null` / `{ message } | null`. Spreading
 * over a null-filled base is what normalises the optional input to that shape.
 */
type SelectOverride = { data?: unknown[]; error?: { message: string } };

function fakeClient(overrides: Record<string, SelectOverride> = {}) {
  const readTables: string[] = [];
  const client = {
    from(table: string) {
      readTables.push(table);
      return {
        select: async (): Promise<{
          data: unknown[] | null;
          error: { message: string } | null;
        }> => {
          const override = overrides[table];
          if (!override) return { data: [{ id: `${table}-1` }], error: null };
          return { data: null, error: null, ...override };
        },
      };
    },
  };
  return { client, readTables };
}

describe("collectExport", () => {
  it("reads every table and shapes { exportedAt, tables }", async () => {
    const { client, readTables } = fakeClient();
    const { data, errors } = await collectExport(client);

    expect(readTables).toEqual([...EXPORT_TABLES]);
    expect(Object.keys(data.tables)).toEqual([...EXPORT_TABLES]);
    expect(data.tables.tasks).toEqual([{ id: "tasks-1" }]);
    expect(typeof data.exportedAt).toBe("string");
    expect(errors).toEqual({});
  });

  it("an empty table exports as [] (not undefined)", async () => {
    const { client } = fakeClient({ workout_logs: { data: [] } });
    const { data } = await collectExport(client);
    expect(data.tables.workout_logs).toEqual([]);
  });

  it("a failing table is recorded and exported as []", async () => {
    const { client } = fakeClient({ goals: { error: { message: "boom" } } });
    const { data, errors } = await collectExport(client);
    expect(errors.goals).toBe("boom");
    expect(data.tables.goals).toEqual([]);
  });
});
