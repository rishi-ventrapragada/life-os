"use client";

import { useState } from "react";
import GlowCard from "@/components/GlowCard";
import { LIFE_AREAS, type LifeArea } from "@/lib/lifeAreas";
import {
  PRIORITIES,
  STATUSES,
  type Task,
  type Priority,
  type Status,
} from "@/components/tasks/types";

type TaskFormProps = {
  /** When set, the form edits this task; otherwise it creates a new one. */
  initial?: Task;
  onSave: (data: Omit<Task, "id">) => void;
  onCancel: () => void;
};

const fieldClass =
  "w-full rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm text-(--color-text) focus-visible:outline-2 focus-visible:outline-(--color-accent-edge)";

export default function TaskForm({ initial, onSave, onCancel }: TaskFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [area, setArea] = useState<LifeArea>(initial?.area ?? LIFE_AREAS[0]);
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? "");
  const [priority, setPriority] = useState<Priority>(initial?.priority ?? "Med");
  const [taskStatus, setTaskStatus] = useState<Status>(
    initial?.status ?? "Not started",
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onSave({
      title: trimmed,
      area,
      dueDate: dueDate || null,
      priority,
      status: taskStatus,
    });
  }

  return (
    <GlowCard>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm text-(--color-text-muted)">
          Title
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs doing?"
            required
            autoFocus
            className={fieldClass}
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm text-(--color-text-muted)">
            Life area
            <select
              value={area}
              onChange={(e) => setArea(e.target.value as LifeArea)}
              className={fieldClass}
            >
              {LIFE_AREAS.map((a) => (
                <option key={a} value={a}>
                  {a}
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

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm text-(--color-text-muted)">
            Priority
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className={fieldClass}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm text-(--color-text-muted)">
            Status
            <select
              value={taskStatus}
              onChange={(e) => setTaskStatus(e.target.value as Status)}
              className={fieldClass}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </div>

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
            {initial ? "Save changes" : "Add task"}
          </button>
        </div>
      </form>
    </GlowCard>
  );
}
