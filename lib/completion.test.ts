import { describe, it, expect } from "vitest";
import { completionStamp } from "@/lib/completion";
import type { Status } from "@/components/tasks/types";

/**
 * Latest-completion-wins, expressed as transitions rather than as "did the
 * patch contain a status?". The distinction is the reason this function exists:
 * the edit form sends a complete task object, so `nextStatus` is present on
 * every edit — including a pure rename of an already-Done task, which must NOT
 * re-stamp. Only a genuine change of status may write the column.
 *
 * The clock is injected so re-completion can be shown producing a strictly
 * newer timestamp instead of an unassertable real `new Date()`.
 */
describe("completionStamp", () => {
  const T1 = "2026-08-02T09:00:00.000Z";
  const at = (iso: string) => () => iso;
  const never = () => {
    throw new Error("clock must not be read when the column is untouched");
  };

  describe("stamps on entering Done", () => {
    const cases: Array<[Status | undefined, string]> = [
      ["Not started", "from Not started"],
      ["In progress", "from In progress"],
      [undefined, "on creation (no previous status)"],
    ];
    it.each(cases)("%s — %s", (prev) => {
      expect(completionStamp(prev, "Done", at(T1))).toBe(T1);
    });
  });

  describe("clears on leaving Done", () => {
    const cases: Array<[Status, string]> = [
      ["Not started", "reopened to Not started"],
      ["In progress", "reopened to In progress"],
    ];
    it.each(cases)("Done -> %s — %s", (next) => {
      expect(completionStamp("Done", next, never)).toBeNull();
    });
  });

  describe("leaves the column untouched", () => {
    it("when an already-Done task is edited (rename / priority change)", () => {
      // The form resends status: "Done" unchanged. This is the case that would
      // corrupt every completion time if the rule keyed off patch presence.
      expect(completionStamp("Done", "Done", never)).toBeUndefined();
    });

    it("when the patch carries no status at all", () => {
      expect(completionStamp("Done", undefined, never)).toBeUndefined();
      expect(completionStamp("Not started", undefined, never)).toBeUndefined();
    });

    it("when status changes between two non-Done values", () => {
      expect(
        completionStamp("Not started", "In progress", never),
      ).toBeUndefined();
      expect(
        completionStamp("In progress", "Not started", never),
      ).toBeUndefined();
    });

    it("when a non-Done status is resent unchanged", () => {
      expect(completionStamp("In progress", "In progress", never)).toBeUndefined();
    });

    it("when creating a task that is not Done", () => {
      expect(completionStamp(undefined, "Not started", never)).toBeUndefined();
      expect(completionStamp(undefined, "In progress", never)).toBeUndefined();
    });
  });

  it("re-stamps with the newer time on re-completion (latest wins)", () => {
    const T2 = "2026-08-02T17:30:00.000Z";

    const first = completionStamp("Not started", "Done", at(T1));
    const reopened = completionStamp("Done", "In progress", never);
    const second = completionStamp("In progress", "Done", at(T2));

    expect(first).toBe(T1);
    expect(reopened).toBeNull();
    expect(second).toBe(T2);
    // The point of latest-wins: the second completion overwrites the first.
    expect(String(second) > String(first)).toBe(true);
  });
});
