"use client";

import { useState } from "react";
import GlowCard from "@/components/GlowCard";
import { LIFE_AREAS, type LifeArea } from "@/lib/lifeAreas";
import type { Habit } from "@/components/habits/types";

type HabitFormProps = {
  /** When set, the form edits this habit; otherwise it creates a new one. */
  initial?: Habit;
  onSave: (data: { name: string; area: LifeArea }) => void;
  onCancel: () => void;
};

const fieldClass =
  "w-full rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm text-(--color-text) focus-visible:outline-2 focus-visible:outline-(--color-accent-edge)";

export default function HabitForm({
  initial,
  onSave,
  onCancel,
}: HabitFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [area, setArea] = useState<LifeArea>(initial?.area ?? LIFE_AREAS[0]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave({ name: trimmed, area });
  }

  return (
    <GlowCard>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm text-(--color-text-muted)">
          Habit
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="What will you do every day?"
            required
            autoFocus
            className={fieldClass}
          />
        </label>

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
            {initial ? "Save changes" : "Add habit"}
          </button>
        </div>
      </form>
    </GlowCard>
  );
}
