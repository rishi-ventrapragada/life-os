"use client";

import { useState } from "react";
import GlowCard from "@/components/GlowCard";
import SectionHeader from "@/components/SectionHeader";
import GoalCard from "@/components/goals/GoalCard";
import GoalForm from "@/components/goals/GoalForm";
import { useGoals } from "@/components/goals/useGoals";
import type { Goal } from "@/components/goals/types";

export default function GoalsSection() {
  const { goals, status, error, addGoal, updateGoal, deleteGoal } = useGoals();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function handleAdd(data: Omit<Goal, "id">) {
    // Keep the form open (with its values) if the insert fails.
    if (await addGoal(data)) setIsAdding(false);
  }

  return (
    <section id="goals" className="scroll-mt-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeader eyebrow="Track progress" title="Goals" />
        {!isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="rounded-md bg-(--color-accent) px-4 py-2 text-sm font-medium text-white transition-[opacity,transform] duration-150 hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent-edge) active:scale-95"
          >
            + Add goal
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
          <GoalForm onSave={handleAdd} onCancel={() => setIsAdding(false)} />
        )}

        {status === "loading" ? (
          <GlowCard>
            <p className="text-(--color-text-muted)">Loading your goals…</p>
          </GlowCard>
        ) : goals.length === 0 && !isAdding ? (
          <GlowCard>
            <p className="text-(--color-text-muted)">
              No goals yet. Add your first one to start tracking.
            </p>
          </GlowCard>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {goals.map((goal) =>
              editingId === goal.id ? (
                <GoalForm
                  key={goal.id}
                  initial={goal}
                  onSave={(data) => {
                    updateGoal(goal.id, data);
                    setEditingId(null);
                  }}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onEdit={() => setEditingId(goal.id)}
                  onDelete={() => deleteGoal(goal.id)}
                  onProgressChange={(value) =>
                    updateGoal(goal.id, { progress: value })
                  }
                />
              ),
            )}
          </div>
        )}
      </div>
    </section>
  );
}
