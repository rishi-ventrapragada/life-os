"use client";

import { useState } from "react";
import GlowCard from "@/components/GlowCard";
import SectionHeader from "@/components/SectionHeader";
import Reveal from "@/components/Reveal";
import JournalEntryCard from "@/components/journal/JournalEntryCard";
import JournalEntryForm from "@/components/journal/JournalEntryForm";
import JournalCalendar from "@/components/journal/JournalCalendar";
import { useJournal } from "@/components/journal/useJournal";

export default function JournalSection() {
  const { entries, status, error, saveEntry } = useJournal();
  const [isAdding, setIsAdding] = useState(false);
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const ready = status === "ready";

  async function handleAdd(entryDate: string, content: string) {
    if (await saveEntry(entryDate, content)) {
      setIsAdding(false);
      setSelectedDate(entryDate);
    }
  }

  async function handleEdit(entryDate: string, content: string) {
    if (await saveEntry(entryDate, content)) setEditingDate(null);
  }

  const selectedEntry = entries.find((e) => e.entryDate === selectedDate) ?? null;

  return (
    <section id="journal" className="scroll-mt-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeader eyebrow="One entry per day" title="Journal" />
        {!isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            disabled={!ready}
            className="rounded-md bg-(--color-accent) px-4 py-2 text-sm font-medium text-white transition-[opacity,transform] duration-150 hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent-edge) active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            + New entry
          </button>
        )}
      </div>

      <Reveal className="mt-6 flex flex-col gap-4">
        {error && (
          <p role="alert" className="text-sm text-red-400">
            {error}
          </p>
        )}

        {isAdding && (
          <GlowCard>
            <JournalEntryForm
              allowDateChange
              onSave={handleAdd}
              onCancel={() => setIsAdding(false)}
              saveLabel="Save entry"
            />
          </GlowCard>
        )}

        {status === "loading" ? (
          <GlowCard>
            <p className="text-(--color-text-muted)">Loading journal…</p>
          </GlowCard>
        ) : entries.length === 0 && !isAdding ? (
          <GlowCard>
            <p className="text-(--color-text-muted)">
              No entries yet. Write your first one — one line is enough.
            </p>
          </GlowCard>
        ) : (
          <>
            <GlowCard>
              <JournalCalendar
                entries={entries}
                selectedDate={selectedDate}
                onSelect={(date) => setSelectedDate(date)}
              />
            </GlowCard>

            {selectedEntry &&
              (editingDate === selectedEntry.entryDate ? (
                <GlowCard>
                  <JournalEntryForm
                    allowDateChange={false}
                    initialDate={selectedEntry.entryDate}
                    initialContent={selectedEntry.content}
                    onSave={handleEdit}
                    onCancel={() => setEditingDate(null)}
                    saveLabel="Save changes"
                  />
                </GlowCard>
              ) : (
                <JournalEntryCard
                  entry={selectedEntry}
                  onEdit={() => setEditingDate(selectedEntry.entryDate)}
                  onClose={() => setSelectedDate(null)}
                />
              ))}
          </>
        )}
      </Reveal>
    </section>
  );
}
