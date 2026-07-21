"use client";

import { useState } from "react";
import GlowCard from "@/components/GlowCard";
import type { Course } from "@/components/academics/types";

type CourseFormProps = {
  initial?: Course;
  onSave: (data: Omit<Course, "id">) => void;
  onCancel: () => void;
};

const fieldClass =
  "w-full rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm text-(--color-text) focus-visible:outline-2 focus-visible:outline-(--color-accent-edge)";

export default function CourseForm({ initial, onSave, onCancel }: CourseFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [nextExamDate, setNextExamDate] = useState(initial?.nextExamDate ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave({ name: trimmed, nextExamDate: nextExamDate || null });
  }

  return (
    <GlowCard>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm text-(--color-text-muted)">
          Course name
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Compiler Design"
            required
            autoFocus
            className={fieldClass}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm text-(--color-text-muted)">
          Next exam (optional)
          <input
            type="date"
            value={nextExamDate}
            onChange={(e) => setNextExamDate(e.target.value)}
            className={`${fieldClass} sm:max-w-48`}
          />
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
            {initial ? "Save changes" : "Add course"}
          </button>
        </div>
      </form>
    </GlowCard>
  );
}
