type HasCourseStatus = { courseId: string; status: "Pending" | "Done" };

export type DoneTotal = { done: number; total: number };

/**
 * Assignments done/total for one course (PRD §4.5) — a pure count over the
 * assignment rows, never a stored column (same discipline as habit streaks: a
 * stored count would desync the moment an assignment is added, deleted, or
 * toggled). "done" counts status === "Done".
 */
export function courseDoneTotal(
  assignments: HasCourseStatus[],
  courseId: string,
): DoneTotal {
  let done = 0;
  let total = 0;
  for (const a of assignments) {
    if (a.courseId !== courseId) continue;
    total++;
    if (a.status === "Done") done++;
  }
  return { done, total };
}
