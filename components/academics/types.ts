/**
 * Mirrors the three Academics tables (PRD §4.5 / §6), minus user_id which is
 * enforced by RLS. Dates are raw "yyyy-mm-dd" strings from the date input; any
 * exam/overdue comparison goes through getTodayIST() + lib/due.ts (Law 3).
 */

export type Course = {
  id: string;
  name: string;
  /** "yyyy-mm-dd" or null when unset. */
  nextExamDate: string | null;
};

export const ASSIGNMENT_STATUSES = ["Pending", "Done"] as const;
export type AssignmentStatus = (typeof ASSIGNMENT_STATUSES)[number];

export type Assignment = {
  id: string;
  courseId: string;
  title: string;
  /** "yyyy-mm-dd" or null when unset. */
  dueDate: string | null;
  status: AssignmentStatus;
};

/** 0 = Sunday … 6 = Saturday, matching JS getUTCDay ordering. */
export const WEEKDAYS = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
] as const;

export type TimetableSlot = {
  id: string;
  dayOfWeek: number; // 0-6
  timeLabel: string;
  subject: string;
};
