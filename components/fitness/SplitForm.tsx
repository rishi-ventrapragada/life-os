"use client";

import { useState } from "react";
import GlowCard from "@/components/GlowCard";
import { WEEKDAYS } from "@/lib/weekdays";
import type { SplitSlot } from "@/components/fitness/types";

type SplitFormProps = {
  initial?: SplitSlot;
  onSave: (data: Omit<SplitSlot, "id">) => void;
  onCancel: () => void;
};

const fieldClass =
  "w-full rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm text-(--color-text) focus-visible:outline-2 focus-visible:outline-(--color-accent-edge)";

export default function SplitForm({ initial, onSave, onCancel }: SplitFormProps) {
  const [dayOfWeek, setDayOfWeek] = useState(initial?.dayOfWeek ?? 1);
  const [workoutName, setWorkoutName] = useState(initial?.workoutName ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = workoutName.trim();
    if (!name) return;
    onSave({ dayOfWeek, workoutName: name });
  }

  return (
    <GlowCard>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm text-(--color-text-muted)">
            Day
            <select
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(Number(e.target.value))}
              className={fieldClass}
            >
              {WEEKDAYS.map((d, i) => (
                <option key={d} value={i}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm text-(--color-text-muted)">
            Workout
            <input
              type="text"
              value={workoutName}
              onChange={(e) => setWorkoutName(e.target.value)}
              placeholder="e.g. Push · Legs · Rest"
              required
              autoFocus
              className={fieldClass}
            />
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
            {initial ? "Save changes" : "Add slot"}
          </button>
        </div>
      </form>
    </GlowCard>
  );
}
