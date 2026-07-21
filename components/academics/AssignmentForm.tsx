"use client";

import { useState } from "react";
import GlowCard from "@/components/GlowCard";
import {
  ASSIGNMENT_STATUSES,
  type Assignment,
  type AssignmentStatus,
  type Course,
} from "@/components/academics/types";

type AssignmentFormProps = {
  courses: Course[];
  initial?: Assignment;
  onSave: (data: Omit<Assignment, "id">) => void;
  onCancel: () => void;
};

const fieldClass =
  "w-full rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm text-(--color-text) focus-visible:outline-2 focus-visible:outline-(--color-accent-edge)";

export default function AssignmentForm({
  courses,
  initial,
  onSave,
  onCancel,
}: AssignmentFormProps) {
  const [courseId, setCourseId] = useState(initial?.courseId ?? courses[0]?.id ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? "");
  const [status, setStatus] = useState<AssignmentStatus>(initial?.status ?? "Pending");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || !courseId) return;
    onSave({ courseId, title: trimmed, dueDate: dueDate || null, status });
  }

  return (
    <GlowCard>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm text-(--color-text-muted)">
            Course
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              // Editing keeps a fixed course (course_id is immutable in the hook).
              disabled={!!initial}
              className={`${fieldClass} disabled:opacity-60`}
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm text-(--color-text-muted)">
            Due date (optional)
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={fieldClass}
            />
          </label>
        </div>
        <label className="flex flex-col gap-1.5 text-sm text-(--color-text-muted)">
          Title
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Problem set 4"
            required
            autoFocus
            className={fieldClass}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm text-(--color-text-muted)">
          Status
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as AssignmentStatus)}
            className={`${fieldClass} sm:max-w-48`}
          >
            {ASSIGNMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md px-4 py-2 text-sm text-(--color-text-muted) transition-opacity duration-150 hover:text-(--color-text) focus-visible:outline-2 focus-visible:outline-(--color-accent-edge) active:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-md bg-(--color-accent) px-4 py-2 text-sm font-medium text-white transition-[opacity,transform] duration-150 hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent-edge) active:scale-95"
          >
            {initial ? "Save changes" : "Add assignment"}
          </button>
        </div>
      </form>
    </GlowCard>
  );
}
