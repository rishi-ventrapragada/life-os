"use client";

import { useState } from "react";
import GlowCard from "@/components/GlowCard";
import SectionHeader from "@/components/SectionHeader";
import HabitCard from "@/components/habits/HabitCard";
import HabitForm from "@/components/habits/HabitForm";
import { useHabits } from "@/components/habits/useHabits";
import type { LifeArea } from "@/lib/lifeAreas";

export default function HabitsSection() {
  const {
    habits,
    status,
    error,
    addHabit,
    updateHabit,
    archiveHabit,
    toggleToday,
  } = useHabits();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // D1 guard: nothing that writes an area_id may fire before the seed resolves.
  const ready = status === "ready";

  async function handleAdd(data: { name: string; area: LifeArea }) {
    // Keep the form open (with its values) if the insert fails.
    if (await addHabit(data)) setIsAdding(false);
  }

  async function handleEdit(id: string, data: { name: string; area: LifeArea }) {
    if (await updateHabit(id, data)) setEditingId(null);
  }

  return (
    <section id="habits" className="scroll-mt-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeader eyebrow="Daily consistency" title="Habits" />
        {!isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            disabled={!ready}
            className="rounded-md bg-(--color-accent) px-4 py-2 text-sm font-medium text-white transition-[opacity,transform] duration-150 hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent-edge) active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            + Add habit
          </button>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-4">
        {error && (
          <p role="alert" className="text-sm text-red-400">
            {error}
          </p>
        )}

        {isAdding && (
          <HabitForm onSave={handleAdd} onCancel={() => setIsAdding(false)} />
        )}

        {status === "loading" ? (
          <GlowCard>
            <p className="text-(--color-text-muted)">Loading your habits…</p>
          </GlowCard>
        ) : habits.length === 0 && !isAdding ? (
          <GlowCard>
            <p className="text-(--color-text-muted)">
              No habits yet. Add your first one to start the streak.
            </p>
          </GlowCard>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {habits.map((habit) =>
              editingId === habit.id ? (
                <HabitForm
                  key={habit.id}
                  initial={habit}
                  onSave={(data) => handleEdit(habit.id, data)}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  ready={ready}
                  onToggle={() => toggleToday(habit)}
                  onEdit={() => setEditingId(habit.id)}
                  onArchive={() => archiveHabit(habit.id)}
                />
              ),
            )}
          </div>
        )}
      </div>
    </section>
  );
}
