/**
 * Mirrors the two Fitness tables (PRD §4.6 / §6), minus user_id which is
 * enforced by RLS. log_date is a raw "yyyy-mm-dd" string (Law 3); day_of_week
 * is an int 0-6.
 */

export type SplitSlot = {
  id: string;
  dayOfWeek: number; // 0-6
  workoutName: string;
};

export const WORKOUT_AREAS = ["Gym", "Calisthenics", "Other"] as const;
export type WorkoutArea = (typeof WORKOUT_AREAS)[number];

export type WorkoutLog = {
  id: string;
  /** "yyyy-mm-dd". */
  logDate: string;
  workoutName: string;
  notes: string | null;
  area: WorkoutArea;
  completed: boolean;
};
