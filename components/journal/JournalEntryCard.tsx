"use client";

import GlowCard from "@/components/GlowCard";
import { getTodayIST } from "@/lib/dates";
import { formatISODate } from "@/lib/formatDate";
import type { JournalEntry } from "@/components/journal/useJournal";

type JournalEntryCardProps = {
  entry: JournalEntry;
  onEdit: () => void;
};

export default function JournalEntryCard({ entry, onEdit }: JournalEntryCardProps) {
  const isToday = entry.entryDate === getTodayIST();

  return (
    <GlowCard className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 font-display text-sm uppercase tracking-[0.15em] text-(--color-accent-soft)">
          {formatISODate(entry.entryDate)}
          {isToday && (
            <span className="rounded-full border border-(--color-accent)/40 bg-(--color-accent)/10 px-2 py-0.5 text-[0.6rem] tracking-[0.1em]">
              Today
            </span>
          )}
        </p>
        <button
          type="button"
          onClick={onEdit}
          className="rounded-md px-2 py-1 text-xs text-(--color-text-muted) transition-opacity duration-150 hover:text-(--color-text) focus-visible:outline-2 focus-visible:outline-(--color-accent-edge) active:opacity-60"
        >
          Edit
        </button>
      </div>
      <p className="whitespace-pre-wrap text-sm leading-[1.7] text-(--color-text)">
        {entry.content}
      </p>
    </GlowCard>
  );
}
