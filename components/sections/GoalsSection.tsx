"use client";

import { useState } from "react";
import GlowCard from "@/components/GlowCard";
import SectionHeader from "@/components/SectionHeader";
import GoalCard from "@/components/goals/GoalCard";
import GoalForm from "@/components/goals/GoalForm";
import type { Goal } from "@/components/goals/types";

export default function GoalsSection() {
  // Local state only this step — persistence arrives in Step 3.
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  function addGoal(data: Omit<Goal, "id">) {
    setGoals((prev) => [...prev, { id: crypto.randomUUID(), ...data }]);
    setIsAdding(false);
  }

  function updateGoal(id: string, patch: Partial<Goal>) {
    setGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, ...patch } : g)),
    );
  }

  function deleteGoal(id: string) {
    setGoals((prev) => prev.filter((g) => g.id !== id));
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
        {isAdding && (
          <GoalForm onSave={addGoal} onCancel={() => setIsAdding(false)} />
        )}

        {goals.length === 0 && !isAdding ? (
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
