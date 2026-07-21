"use client";

import GlowCard from "@/components/GlowCard";
import { getTodayIST } from "@/lib/dates";
import { dueLabel } from "@/lib/due";
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
  const examLabel = course.nextExamDate
    ? dueLabel(course.nextExamDate, getTodayIST())
    : null;

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
            {examLabel && (
              <span
                className={`rounded-full px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-[0.1em] ${
                  examLabel === "Overdue"
                    ? "bg-red-500/15 text-red-300"
                    : "bg-(--color-accent)/15 text-(--color-accent-soft)"
                }`}
              >
                {examLabel === "Overdue" ? "Passed" : "Today"}
              </span>
            )}
          </span>
        )}
      </div>
    </GlowCard>
  );
}
