import { diffDaysISO } from "@/lib/dates";
import { formatISODateShort } from "@/lib/formatDate";

/**
 * The four fixed tiers of the ladder. `Distant` is deliberately NOT part of
 * this union: its display text is a formatted date, not a constant, so keeping
 * it separate is what lets callers write an exhaustive Record<DueTier, string>
 * for styling. A widened `... | string` union would collapse to `string` and
 * silently erase every literal, which is the one thing that must not happen —
 * the styling map in the components is the reason this type exists.
 */
export type DueTier = "Overdue" | "Due today" | "Due tomorrow" | "This week";

/** How far out the "This week" window reaches, inclusive, in days. */
export const THIS_WEEK_DAYS = 7;

export type DueInfo =
  | { tier: DueTier; text: DueTier }
  | { tier: "Distant"; text: string };

/** Every tier including "Distant" — what styling maps must cover. */
export type DueTierAll = DueInfo["tier"];

/**
 * One styling source for every due badge, replacing the four copies of the
 * same Overdue-or-accent ternary that used to live in TaskCard, TodayTasks,
 * AssignmentList and CourseCard. A Record (the PRIORITY_CLASS idiom) rather
 * than a conditional so adding a tier is a compile error here instead of a
 * silent fallback to the wrong colour.
 *
 * Colour carries urgency: red demands action, the purple accent marks today,
 * amber is imminent, slate is on the horizon, and Distant recedes into the
 * muted body text since its label is a bare date. Size stays at the call site
 * — Assignments render a smaller badge than Tasks.
 */
export const DUE_TIER_CLASS: Record<DueTierAll, string> = {
  Overdue: "bg-red-500/15 text-red-300",
  "Due today": "bg-(--color-accent)/15 text-(--color-accent-soft)",
  "Due tomorrow": "bg-amber-500/15 text-amber-300",
  "This week": "bg-slate-500/15 text-slate-300",
  Distant: "text-(--color-text-muted)",
};

/**
 * Classify a stored "yyyy-mm-dd" due date against today's IST date
 * (Architecture Law 3), most-specific tier first:
 *
 *   past -> "Overdue" | today -> "Due today" | +1 -> "Due tomorrow"
 *   +2..+7 -> "This week" | beyond -> "Due 14 Aug" (year appended if not this year)
 *
 * Every date now yields a label, so this no longer returns null — see the note
 * on the removal below. Ordering matters: each branch assumes the earlier ones
 * already returned, so `diff` is known positive by the time it is compared to
 * THIS_WEEK_DAYS.
 *
 * `today` stays a parameter rather than an internal getTodayIST() call so the
 * function stays pure and its boundaries are testable; callers pass
 * getTodayIST(). Day arithmetic goes through lib/dates.ts diffDaysISO — never
 * `new Date(str)` or UTC slicing (Law 3).
 */
export function dueLabel(dueDate: string, today: string): DueInfo {
  // ISO date strings sort lexicographically, so the past/present comparisons
  // stay plain string compares — no arithmetic needed to get them right.
  if (dueDate < today) return { tier: "Overdue", text: "Overdue" };
  if (dueDate === today) return { tier: "Due today", text: "Due today" };

  const diff = diffDaysISO(dueDate, today);
  if (diff === 1) return { tier: "Due tomorrow", text: "Due tomorrow" };
  if (diff <= THIS_WEEK_DAYS) return { tier: "This week", text: "This week" };

  return { tier: "Distant", text: `Due ${formatISODateShort(dueDate, today)}` };
}
