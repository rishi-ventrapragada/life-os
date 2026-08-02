import type { Status } from "@/components/tasks/types";

/**
 * The single rule for when `tasks.completed_at` is written, extracted from
 * useTasks so it can be tested without React or Supabase (the lib/due.ts idiom).
 *
 * Law 3 note: `completed_at` is an *instant*, not an IST calendar date, so
 * getTodayIST() deliberately does not apply here — exactly the carve-out already
 * made for habits' `archived_at`. The stored value is a UTC ISO timestamp for a
 * timestamptz column: no date arithmetic, no calendar reasoning, and nothing
 * that streaks or due-dates ever read. Law 3 governs calendar dates, and this
 * is not one.
 *
 * `now` is injected rather than called internally so the tests can pin the
 * timestamp and prove latest-wins re-stamping, the same way dueLabel() takes
 * `today` instead of reading a clock.
 */

/**
 * Decide what happens to `completed_at` for a status transition.
 *
 * The three-valued return is the whole point: `undefined` means *do not write
 * the column at all*, which is what keeps a rename or priority edit on an
 * already-Done task from re-stamping it. That distinction matters because the
 * edit form sends a COMPLETE task object — `nextStatus` is present on every
 * edit, changed or not — so "was status in the patch?" is not a usable test.
 * Only a real transition may touch the column.
 *
 * @param prevStatus the task's status before the write; undefined when creating
 * @param nextStatus the status being written; undefined for a partial patch
 * @param now returns the ISO timestamp to stamp
 * @returns ISO string to stamp, `null` to clear, or `undefined` to leave alone
 */
export function completionStamp(
  prevStatus: Status | undefined,
  nextStatus: Status | undefined,
  now: () => string,
): string | null | undefined {
  // No status in this write, or it did not actually change: leave the column
  // untouched. Re-completion (Done -> other -> Done) is not caught here because
  // those are two separate transitions, each of which does change status.
  if (nextStatus === undefined || nextStatus === prevStatus) return undefined;

  // Entering Done stamps the moment. On a re-completion this runs again with a
  // later clock reading, which is precisely the latest-wins semantics.
  if (nextStatus === "Done") return now();

  // Leaving Done clears the stamp: the task is no longer complete, so it must
  // not keep a completion time a throughput chart would count.
  if (prevStatus === "Done") return null;

  // A change between two non-Done statuses (Not started -> In progress) has
  // nothing to do with completion.
  return undefined;
}
