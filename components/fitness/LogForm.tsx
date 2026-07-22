"use client";

import { useState } from "react";
import GlowCard from "@/components/GlowCard";
import { getTodayIST } from "@/lib/dates";
import {
  WORKOUT_AREAS,
  type WorkoutArea,
  type WorkoutLog,
} from "@/components/fitness/types";

type LogFormProps = {
  initial?: WorkoutLog;
  onSave: (data: Omit<WorkoutLog, "id">) => void;
  onCancel: () => void;
};

const fieldClass =
  "w-full rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm text-(--color-text) focus-visible:outline-2 focus-visible:outline-(--color-accent-edge)";

export default function LogForm({ initial, onSave, onCancel }: LogFormProps) {
  // log_date defaults to today (Law 3: the raw yyyy-mm-dd from getTodayIST()).
  const [logDate, setLogDate] = useState(initial?.logDate ?? getTodayIST());
  const [workoutName, setWorkoutName] = useState(initial?.workoutName ?? "");
  const [area, setArea] = useState<WorkoutArea>(initial?.area ?? "Gym");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [completed, setCompleted] = useState(initial?.completed ?? true);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = workoutName.trim();
    if (!name) return;
    onSave({ logDate, workoutName: name, area, notes: notes.trim() || null, completed });
  }

  return (
    <GlowCard>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-1.5 text-sm text-(--color-text-muted)">
            Date
            <input
              type="date"
              value={logDate}
              max={getTodayIST()}
              onChange={(e) => setLogDate(e.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm text-(--color-text-muted)">
            Workout
            <input
              type="text"
              value={workoutName}
              onChange={(e) => setWorkoutName(e.target.value)}
              placeholder="e.g. Upper body"
              required
              autoFocus
              className={fieldClass}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm text-(--color-text-muted)">
            Area
            <select
              value={area}
              onChange={(e) => setArea(e.target.value as WorkoutArea)}
              className={fieldClass}
            >
              {WORKOUT_AREAS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="flex flex-col gap-1.5 text-sm text-(--color-text-muted)">
          Notes (optional)
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="How did it go?"
            className={`${fieldClass} resize-y`}
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-(--color-text-muted)">
          <input
            type="checkbox"
            checked={completed}
            onChange={(e) => setCompleted(e.target.checked)}
            className="h-4 w-4 accent-(--color-accent)"
          />
          Completed
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
            {initial ? "Save changes" : "Log workout"}
          </button>
        </div>
      </form>
    </GlowCard>
  );
}
