export type DueLabel = "Overdue" | "Due today";

/**
 * Compare a stored "yyyy-mm-dd" due date against today's IST date
 * (Architecture Law 3). ISO date strings sort lexicographically, so a plain
 * string compare is correct — no `new Date()` math, no timezone to get wrong.
 *
 * `today` is a parameter rather than an internal getTodayIST() call so the
 * function stays pure and its boundaries are testable; callers pass
 * getTodayIST(). Returns null when the date is in the future.
 */
export function dueLabel(dueDate: string, today: string): DueLabel | null {
  if (dueDate < today) return "Overdue";
  if (dueDate === today) return "Due today";
  return null;
}
