import { dueLabel, type DueInfo } from "@/lib/due";
import type { Task } from "@/components/tasks/types";
import type { Assignment, Course } from "@/components/academics/types";

/**
 * One row of Today's "What's due" list, from either source.
 *
 * `id` is namespaced ("task:<uuid>" / "assignment:<uuid>") because tasks and
 * assignments are different tables: two raw uuids could collide as React keys,
 * and a key collision is a silent rendering bug rather than a loud one.
 * `sourceId` keeps the unprefixed id so the completion handler can write back
 * to the right table.
 *
 * `dueDate` is non-null by construction — collectDueItems drops undated rows,
 * so consumers never re-check it.
 */
export type DueItem = {
  id: string;
  kind: "task" | "assignment";
  title: string;
  dueDate: string;
  info: DueInfo;
  /** Course name for assignments; undefined for tasks. */
  subtitle?: string;
  sourceId: string;
};

/** What "not done" means per source — the two tables spell it differently. */
const isOpen = {
  task: (t: Task) => t.status !== "Done",
  assignment: (a: Assignment) => a.status !== "Done",
};

/**
 * Everything due within the next week (PRD §4.1c), tasks and assignments in one
 * list, soonest first.
 *
 * Both sources go through the SAME lib/due.ts ladder that TaskCard and
 * AssignmentList already render their badges from, so Today can never disagree
 * with either section about what "overdue" means.
 *
 * The cut is an explicit "not Distant" test rather than a null check: since the
 * ladder widened, every dated row gets a label, so a `!== null` filter would
 * pass items years out. Undated and completed rows are dropped first.
 *
 * `today` is injected rather than read from a clock (Law 3, and the lib/due.ts
 * idiom) — that is what makes the boundaries testable.
 */
export function collectDueItems(
  tasks: Task[],
  assignments: Assignment[],
  courses: Course[],
  today: string,
): DueItem[] {
  // Same fallback AssignmentList uses, so a row whose course vanished still
  // renders instead of disappearing from the list without explanation.
  const courseName = (id: string) =>
    courses.find((c) => c.id === id)?.name ?? "Unknown course";

  const items: DueItem[] = [];

  for (const t of tasks) {
    if (!t.dueDate || !isOpen.task(t)) continue;
    items.push({
      id: `task:${t.id}`,
      kind: "task",
      title: t.title,
      dueDate: t.dueDate,
      info: dueLabel(t.dueDate, today),
      sourceId: t.id,
    });
  }

  for (const a of assignments) {
    if (!a.dueDate || !isOpen.assignment(a)) continue;
    items.push({
      id: `assignment:${a.id}`,
      kind: "assignment",
      title: a.title,
      dueDate: a.dueDate,
      info: dueLabel(a.dueDate, today),
      subtitle: courseName(a.courseId),
      sourceId: a.id,
    });
  }

  return items
    .filter((i) => i.info.tier !== "Distant")
    .sort(
      (a, b) =>
        // ISO dates sort chronologically as plain strings — the same property
        // the ladder itself relies on. Kind then title break ties so items
        // sharing a date hold a stable order between renders instead of
        // depending on which array they came from.
        a.dueDate.localeCompare(b.dueDate) ||
        a.kind.localeCompare(b.kind) ||
        a.title.localeCompare(b.title),
    );
}
