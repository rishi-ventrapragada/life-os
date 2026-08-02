"use client";

import { getTodayIST } from "@/lib/dates";
import { dueLabel, DUE_TIER_CLASS } from "@/lib/due";
import { formatISODate } from "@/lib/formatDate";
import type { Assignment, Course } from "@/components/academics/types";

type AssignmentListProps = {
  assignments: Assignment[];
  courses: Course[];
  onToggle: (assignment: Assignment) => void;
  onEdit: (assignment: Assignment) => void;
  onDelete: (assignment: Assignment) => void;
  ready: boolean;
};

export default function AssignmentList({
  assignments,
  courses,
  onToggle,
  onEdit,
  onDelete,
  ready,
}: AssignmentListProps) {
  if (assignments.length === 0) {
    return (
      <p className="text-sm text-(--color-text-muted)">
        No assignments yet.
      </p>
    );
  }

  const courseName = (id: string) =>
    courses.find((c) => c.id === id)?.name ?? "Unknown course";
  const today = getTodayIST();

  return (
    <ul className="flex flex-col gap-2">
      {assignments.map((a) => {
        const due = a.dueDate ? dueLabel(a.dueDate, today) : null;
        const done = a.status === "Done";
        return (
          <li
            key={a.id}
            className="flex flex-wrap items-center gap-3 rounded-lg border border-(--color-border) px-3 py-2"
          >
            <button
              type="button"
              onClick={() => onToggle(a)}
              disabled={!ready}
              aria-pressed={done}
              title={done ? "Mark pending" : "Mark done"}
              className="group flex shrink-0 items-center transition-transform duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent-edge) active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span
                aria-hidden="true"
                className={`flex h-5 w-5 items-center justify-center rounded border transition-[opacity,transform] duration-150 group-hover:not-disabled:scale-110 ${
                  done
                    ? "border-(--color-accent) bg-(--color-accent) text-white"
                    : "border-(--color-border) text-transparent"
                }`}
              >
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                  <path d="M3.5 8.5l3 3 6-6" />
                </svg>
              </span>
            </button>

            <span className="min-w-0 flex-1">
              <span className={`block truncate text-sm ${done ? "text-(--color-text-muted) line-through" : "text-(--color-text)"}`}>
                {a.title}
              </span>
              <span className="flex flex-wrap items-center gap-2 text-xs text-(--color-text-muted)">
                {courseName(a.courseId)}
                {a.dueDate && <span>· due {formatISODate(a.dueDate)}</span>}
                {/* Distant repeats the raw date beside it — badge only the
                    word-labelled tiers. */}
                {due && due.tier !== "Distant" && !done && (
                  <span className={`rounded-full px-1.5 py-0.5 text-[0.6rem] font-medium uppercase tracking-[0.1em] ${DUE_TIER_CLASS[due.tier]}`}>
                    {due.text}
                  </span>
                )}
              </span>
            </span>

            <span className="flex shrink-0 gap-1">
              <button type="button" onClick={() => onEdit(a)} className="rounded-md px-2 py-1 text-xs text-(--color-text-muted) transition-opacity duration-150 hover:text-(--color-text) focus-visible:outline-2 focus-visible:outline-(--color-accent-edge) active:opacity-60">
                Edit
              </button>
              <button type="button" onClick={() => onDelete(a)} className="rounded-md px-2 py-1 text-xs text-(--color-text-muted) transition-opacity duration-150 hover:text-red-400 focus-visible:outline-2 focus-visible:outline-(--color-accent-edge) active:opacity-60">
                Delete
              </button>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
