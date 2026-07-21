"use client";

import { useState } from "react";
import { getTodayIST } from "@/lib/dates";

type JournalEntryFormProps = {
  /** Preset + locked when editing an existing day; free + defaulted when adding. */
  initialDate?: string;
  initialContent?: string;
  /** True for the add form (date is editable for backfill); false when editing. */
  allowDateChange: boolean;
  onSave: (entryDate: string, content: string) => void;
  onCancel: () => void;
  saveLabel: string;
};

const fieldClass =
  "w-full rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm text-(--color-text) focus-visible:outline-2 focus-visible:outline-(--color-accent-edge)";

export default function JournalEntryForm({
  initialDate,
  initialContent = "",
  allowDateChange,
  onSave,
  onCancel,
  saveLabel,
}: JournalEntryFormProps) {
  const [entryDate, setEntryDate] = useState(initialDate ?? getTodayIST());
  const [content, setContent] = useState(initialContent);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = content.trim();
    if (!text) return;
    onSave(entryDate, text);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      {allowDateChange && (
        <label className="flex flex-col gap-1.5 text-sm text-(--color-text-muted)">
          Date
          <input
            type="date"
            value={entryDate}
            max={getTodayIST()}
            onChange={(e) => setEntryDate(e.target.value)}
            className={`${fieldClass} sm:max-w-48`}
          />
        </label>
      )}
      <label className="flex flex-col gap-1.5 text-sm text-(--color-text-muted)">
        Entry
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What happened today?"
          rows={3}
          required
          autoFocus
          className={`${fieldClass} resize-y`}
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
          {saveLabel}
        </button>
      </div>
    </form>
  );
}
