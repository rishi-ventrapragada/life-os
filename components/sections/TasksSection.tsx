"use client";

import { useMemo, useState } from "react";
import GlowCard from "@/components/GlowCard";
import SectionHeader from "@/components/SectionHeader";
import Reveal from "@/components/Reveal";
import TaskCard from "@/components/tasks/TaskCard";
import TaskForm from "@/components/tasks/TaskForm";
import { useTasks } from "@/components/tasks/TasksProvider";
import { STATUSES, type Task, type Status } from "@/components/tasks/types";

type Filter = "All" | Status;
const FILTERS: Filter[] = ["All", ...STATUSES];

export default function TasksSection() {
  const { tasks, status, error, addTask, updateTask, deleteTask } = useTasks();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("All");

  async function handleAdd(data: Omit<Task, "id">) {
    // Keep the form open (with its values) if the insert fails.
    if (await addTask(data)) setIsAdding(false);
  }

  // Client-side filter over already-fetched rows — no refetch (Increment D).
  // The provider fetches every task unfiltered, so switching filters is pure
  // local work: memoised so it only recomputes when the rows or filter change.
  const visible = useMemo(
    () => (filter === "All" ? tasks : tasks.filter((t) => t.status === filter)),
    [tasks, filter],
  );

  return (
    <section id="tasks" className="scroll-mt-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeader eyebrow="What's due" title="Tasks" />
        {!isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="rounded-md bg-(--color-accent) px-4 py-2 text-sm font-medium text-white transition-[opacity,transform] duration-150 hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent-edge) active:scale-95"
          >
            + Add task
          </button>
        )}
      </div>

      {status === "ready" && tasks.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const active = filter === f;
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                aria-pressed={active}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-[opacity,transform] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent-edge) active:scale-95 ${
                  active
                    ? "bg-(--color-accent) text-white"
                    : "border border-(--color-border) text-(--color-text-muted) hover:text-(--color-text)"
                }`}
              >
                {f}
              </button>
            );
          })}
        </div>
      )}

      <Reveal className="mt-6 flex flex-col gap-4">
        {error && (
          <p role="alert" className="text-sm text-red-400">
            {error}
          </p>
        )}

        {isAdding && (
          <TaskForm onSave={handleAdd} onCancel={() => setIsAdding(false)} />
        )}

        {status === "loading" ? (
          <GlowCard>
            <p className="text-(--color-text-muted)">Loading tasks…</p>
          </GlowCard>
        ) : tasks.length === 0 && !isAdding ? (
          <GlowCard>
            <p className="text-(--color-text-muted)">
              No tasks yet. Add your first one to start tracking.
            </p>
          </GlowCard>
        ) : visible.length === 0 && !isAdding ? (
          <GlowCard>
            <p className="text-(--color-text-muted)">
              No {filter.toLowerCase()} tasks.
            </p>
          </GlowCard>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {visible.map((task) =>
              editingId === task.id ? (
                <TaskForm
                  key={task.id}
                  initial={task}
                  onSave={(data) => {
                    updateTask(task.id, data);
                    setEditingId(null);
                  }}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={() => setEditingId(task.id)}
                  onDelete={() => deleteTask(task.id)}
                />
              ),
            )}
          </div>
        )}
      </Reveal>
    </section>
  );
}
