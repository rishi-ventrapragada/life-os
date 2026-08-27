import { describe, it, expect } from "vitest";
import { collectDueItems } from "@/lib/dueItems";
import type { Task } from "@/components/tasks/types";
import type { Assignment, Course } from "@/components/academics/types";

/**
 * The merge that feeds Today's "What's due". Two sources, one ladder: both
 * tasks and assignments are filtered and labelled by lib/due.ts, so these tests
 * pin the merge/exclusion/ordering rules rather than re-testing dueLabel.
 *
 * `today` is fixed at 2026-07-20 throughout and every date is written relative
 * to it by hand, so a boundary case reads as a date rather than as arithmetic.
 */
const TODAY = "2026-07-20";

function task(over: Partial<Task> = {}): Task {
  return {
    id: "t1",
    title: "A task",
    area: "Coding",
    dueDate: TODAY,
    priority: "Med",
    status: "Not started",
    ...over,
  };
}

function assignment(over: Partial<Assignment> = {}): Assignment {
  return {
    id: "a1",
    courseId: "c1",
    title: "An assignment",
    dueDate: TODAY,
    status: "Pending",
    ...over,
  };
}

const COURSES: Course[] = [
  { id: "c1", name: "Databases", nextExamDate: null },
  { id: "c2", name: "Operating Systems", nextExamDate: null },
];

describe("collectDueItems", () => {
  it("returns both sources in one list", () => {
    const out = collectDueItems([task()], [assignment()], COURSES, TODAY);
    expect(out).toHaveLength(2);
    expect(out.map((i) => i.kind).sort()).toEqual(["assignment", "task"]);
  });

  it("namespaces ids so a shared uuid cannot collide as a React key", () => {
    const out = collectDueItems(
      [task({ id: "same" })],
      [assignment({ id: "same" })],
      COURSES,
      TODAY,
    );
    expect(new Set(out.map((i) => i.id)).size).toBe(2);
    // The unprefixed id survives for the write-back.
    expect(out.every((i) => i.sourceId === "same")).toBe(true);
  });

  it("sorts soonest-due first across both sources", () => {
    const out = collectDueItems(
      [task({ id: "t1", title: "later task", dueDate: "2026-07-23" })],
      [
        assignment({ id: "a1", title: "sooner", dueDate: "2026-07-21" }),
        assignment({ id: "a2", title: "latest", dueDate: "2026-07-25" }),
      ],
      COURSES,
      TODAY,
    );
    expect(out.map((i) => i.title)).toEqual(["sooner", "later task", "latest"]);
  });

  it("breaks ties stably (kind, then title) rather than by source array", () => {
    const out = collectDueItems(
      [task({ id: "t1", title: "zebra" }), task({ id: "t2", title: "apple" })],
      [assignment({ id: "a1", title: "middle" })],
      COURSES,
      TODAY,
    );
    // assignment sorts before task; tasks then sort by title.
    expect(out.map((i) => i.title)).toEqual(["middle", "apple", "zebra"]);
  });

  it("excludes completed rows from both sources", () => {
    const out = collectDueItems(
      [task({ status: "Done" })],
      [assignment({ status: "Done" })],
      COURSES,
      TODAY,
    );
    expect(out).toEqual([]);
  });

  it("excludes undated rows from both sources", () => {
    const out = collectDueItems(
      [task({ dueDate: null })],
      [assignment({ dueDate: null })],
      COURSES,
      TODAY,
    );
    expect(out).toEqual([]);
  });

  it("excludes Distant rows from both sources", () => {
    // +8 days is one past the THIS_WEEK_DAYS window.
    const out = collectDueItems(
      [task({ dueDate: "2026-07-28" })],
      [assignment({ dueDate: "2026-07-28" })],
      COURSES,
      TODAY,
    );
    expect(out).toEqual([]);
  });

  it("keeps the last day of the week window (+7) but not +8", () => {
    const kept = collectDueItems([], [assignment({ dueDate: "2026-07-27" })], COURSES, TODAY);
    expect(kept).toHaveLength(1);
    expect(kept[0].info.tier).toBe("This week");

    const dropped = collectDueItems([], [assignment({ dueDate: "2026-07-28" })], COURSES, TODAY);
    expect(dropped).toEqual([]);
  });

  it("keeps overdue rows from both sources", () => {
    const out = collectDueItems(
      [task({ dueDate: "2026-07-19" })],
      [assignment({ dueDate: "2026-07-18" })],
      COURSES,
      TODAY,
    );
    expect(out.map((i) => i.info.tier)).toEqual(["Overdue", "Overdue"]);
    // Most overdue first.
    expect(out[0].dueDate).toBe("2026-07-18");
  });

  it("labels assignments with their course name", () => {
    const out = collectDueItems([], [assignment({ courseId: "c2" })], COURSES, TODAY);
    expect(out[0].subtitle).toBe("Operating Systems");
  });

  it("falls back to 'Unknown course' rather than dropping an orphaned assignment", () => {
    const out = collectDueItems([], [assignment({ courseId: "gone" })], COURSES, TODAY);
    expect(out).toHaveLength(1);
    expect(out[0].subtitle).toBe("Unknown course");
  });

  it("gives tasks no subtitle", () => {
    const out = collectDueItems([task()], [], COURSES, TODAY);
    expect(out[0].subtitle).toBeUndefined();
  });

  it("returns [] when both sources are empty", () => {
    expect(collectDueItems([], [], COURSES, TODAY)).toEqual([]);
  });

  it("assigns the same tier the ladder would give each date", () => {
    const out = collectDueItems(
      [task({ id: "t1", dueDate: "2026-07-20" })],
      [assignment({ id: "a1", dueDate: "2026-07-21" })],
      COURSES,
      TODAY,
    );
    const tiers = Object.fromEntries(out.map((i) => [i.kind, i.info.tier]));
    expect(tiers).toEqual({ task: "Due today", assignment: "Due tomorrow" });
  });
});
