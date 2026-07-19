import type { LifeArea } from "@/lib/lifeAreas";

export const PRIORITIES = ["Low", "Med", "High"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const STATUSES = ["Not started", "In progress", "Done"] as const;
export type Status = (typeof STATUSES)[number];

/**
 * Mirrors the `tasks` table (PRD §4), minus user_id which is enforced by RLS.
 * Due dates are the raw "yyyy-mm-dd" string from the date input; any due-today/
 * overdue comparison goes through getTodayIST() (Architecture Law 3).
 */
export type Task = {
  id: string;
  title: string;
  area: LifeArea;
  /** "yyyy-mm-dd" from the date input, or null when unset. */
  dueDate: string | null;
  priority: Priority;
  status: Status;
};
