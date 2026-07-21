"use client";

import { useState } from "react";
import GlowCard from "@/components/GlowCard";
import { WEEKDAYS, type TimetableSlot } from "@/components/academics/types";

type TimetableSlotFormProps = {
  initial?: TimetableSlot;
  onSave: (data: Omit<TimetableSlot, "id">) => void;
  onCancel: () => void;
};

const fieldClass =
  "w-full rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm text-(--color-text) focus-visible:outline-2 focus-visible:outline-(--color-accent-edge)";

export default function TimetableSlotForm({
  initial,
  onSave,
  onCancel,
}: TimetableSlotFormProps) {
  // Default to Monday (1), the usual start of a study week.
  const [dayOfWeek, setDayOfWeek] = useState(initial?.dayOfWeek ?? 1);
  const [timeLabel, setTimeLabel] = useState(initial?.timeLabel ?? "");
  const [subject, setSubject] = useState(initial?.subject ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const t = timeLabel.trim();
    const s = subject.trim();
    if (!t || !s) return;
    onSave({ dayOfWeek, timeLabel: t, subject: s });
  }

  return (
    <GlowCard>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-3">
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
            Time
            <input
              type="text"
              value={timeLabel}
              onChange={(e) => setTimeLabel(e.target.value)}
              placeholder="e.g. 9:00"
              required
              className={fieldClass}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm text-(--color-text-muted)">
            Subject
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Networks"
              required
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
