"use client";

import { useState } from "react";
import GlowCard from "@/components/GlowCard";
import { LIFE_AREAS, type LifeArea } from "@/lib/lifeAreas";
import type { Goal } from "@/components/goals/types";

type GoalFormProps = {
  /** When set, the form edits this goal; otherwise it creates a new one. */
  initial?: Goal;
  onSave: (data: Omit<Goal, "id">) => void;
  onCancel: () => void;
};

const fieldClass =
  "w-full rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm text-(--color-text) focus-visible:outline-2 focus-visible:outline-(--color-accent-edge)";

export default function GoalForm({ initial, onSave, onCancel }: GoalFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [area, setArea] = useState<LifeArea>(initial?.area ?? LIFE_AREAS[0]);
  const [deadline, setDeadline] = useState(initial?.deadline ?? "");
  const [progress, setProgress] = useState(initial?.progress ?? 0);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onSave({ title: trimmed, area, deadline: deadline || null, progress });
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
            placeholder="What are you working toward?"
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
            Deadline (optional)
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className={fieldClass}
            />
          </label>
        </div>

        <label className="flex flex-col gap-1.5 text-sm text-(--color-text-muted)">
          <span className="flex justify-between">
            Progress
            <span className="font-display tabular-nums text-(--color-text)">
              {progress}%
            </span>
          </span>
          <input
            type="range"
            min={0}
            max={100}
            value={progress}
            onChange={(e) => setProgress(Number(e.target.value))}
            className="progress-slider mt-1"
            style={{
              background: `linear-gradient(to right, var(--color-accent) ${progress}%, var(--color-border) ${progress}%)`,
            }}
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
            {initial ? "Save changes" : "Add goal"}
          </button>
        </div>
      </form>
    </GlowCard>
  );
}
