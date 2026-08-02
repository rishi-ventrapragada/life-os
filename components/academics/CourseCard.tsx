"use client";

import GlowCard from "@/components/GlowCard";
import { getTodayIST } from "@/lib/dates";
import { dueLabel, DUE_TIER_CLASS } from "@/lib/due";
import { formatISODate } from "@/lib/formatDate";
import { courseDoneTotal } from "@/lib/academics";
import type { Assignment, Course } from "@/components/academics/types";

type CourseCardProps = {
  course: Course;
  assignments: Assignment[];
  onEdit: () => void;
  onDelete: () => void;
};

export default function CourseCard({
  course,
  assignments,
  onEdit,
  onDelete,
}: CourseCardProps) {
  const { done, total } = courseDoneTotal(assignments, course.id);
  const exam = course.nextExamDate
    ? dueLabel(course.nextExamDate, getTodayIST())
    : null;

  /**
   * Exams borrow the due ladder's comparison but not all of its wording: an
   * exam that has happened is "Passed", not "Overdue", and the day itself is
   * "Today", not "Due today". Every other tier already reads correctly for an
   * exam ("Due tomorrow", "This week", a date), so it renders as-is — the old
   * two-branch version fell through to "Today" and would have shown a
   * week-away exam as happening today.
   */
  const examText =
    exam === null
      ? null
      : exam.tier === "Overdue"
        ? "Passed"
        : exam.tier === "Due today"
          ? "Today"
          : exam.text;

  return (
    <GlowCard className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-xl font-semibold tracking-[-0.02em]">
          {course.name}
        </h3>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={onEdit}
            className="rounded-md px-2 py-1 text-xs text-(--color-text-muted) transition-opacity duration-150 hover:text-(--color-text) focus-visible:outline-2 focus-visible:outline-(--color-accent-edge) active:opacity-60"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-md px-2 py-1 text-xs text-(--color-text-muted) transition-opacity duration-150 hover:text-red-400 focus-visible:outline-2 focus-visible:outline-(--color-accent-edge) active:opacity-60"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 text-sm">
        <span className="rounded-md border border-(--color-accent)/40 bg-(--color-accent)/10 px-2 py-0.5 text-xs text-(--color-accent-soft)">
          {done}/{total} done
        </span>
        {course.nextExamDate && (
          <span className="flex flex-wrap items-center gap-2 text-(--color-text-muted)">
            Exam {formatISODate(course.nextExamDate)}
            {exam && examText && (
              <span
                className={`rounded-full px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-[0.1em] ${DUE_TIER_CLASS[exam.tier]}`}
              >
                {examText}
              </span>
            )}
          </span>
        )}
      </div>
    </GlowCard>
  );
}
