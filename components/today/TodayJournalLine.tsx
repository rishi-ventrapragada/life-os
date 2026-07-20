"use client";

import { useJournalToday } from "@/components/today/useJournalToday";

/**
 * The one-line journal quick-entry (PRD §4.1d) — writes today's row in
 * journal_entries, upserted on unique(user_id, entry_date) so re-saving edits
 * the day's line instead of erroring. Step 10 adds the full list view.
 *
 * D1 guard: input and button stay disabled until the hook is ready, so no
 * write can fire before the session resolves.
 */
export default function TodayJournalLine() {
  const { content, setContent, isDirty, status, error, isSaving, save } =
    useJournalToday();
  const disabled = status !== "ready" || isSaving;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await save();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onBlur={() => void save()}
          disabled={disabled}
          placeholder={
            status === "loading" ? "Loading…" : "One line about today…"
          }
          aria-label="Today's journal line"
          className="min-w-0 flex-1 rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm text-(--color-text) transition-opacity duration-150 focus-visible:outline-2 focus-visible:outline-(--color-accent-edge) disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || !isDirty}
          className="rounded-md bg-(--color-accent) px-4 py-2 text-sm font-medium text-white transition-[opacity,transform] duration-150 hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent-edge) active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSaving ? "Saving…" : "Save"}
        </button>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}
      {!error && status === "ready" && !isDirty && content.trim() !== "" && (
        <p className="text-xs text-(--color-text-muted)">Saved for today.</p>
      )}
    </form>
  );
}
