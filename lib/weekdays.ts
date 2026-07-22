/**
 * The seven weekday names, indexed 0=Sunday … 6=Saturday to match JS
 * getUTCDay() and the `day_of_week` smallint stored in timetable_slots and
 * workout_split. Shared across Today, Academics and Fitness instead of a copy
 * per section.
 */
export const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

/**
 * Monday-first display order (indices into WEEKDAYS). A study/work week reads
 * Mon→Sun; the stored day_of_week keeps its 0=Sun basis, so this array maps
 * display position → stored index. A fixed constant, never new Date() (Law 3).
 */
export const WEEK_DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;
