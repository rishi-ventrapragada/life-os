import GlowCard from "@/components/GlowCard";
import { getTodayIST } from "@/lib/dates";
import { dueLabel, DUE_TIER_CLASS } from "@/lib/due";
import { formatISODate } from "@/lib/formatDate";
import type { Task, Priority } from "@/components/tasks/types";

type TaskCardProps = {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
};

const PRIORITY_CLASS: Record<Priority, string> = {
  Low: "border-(--color-border) text-(--color-text-muted)",
  Med: "border-amber-500/40 text-amber-300",
  High: "border-red-500/40 text-red-300",
};

export default function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  const due = task.dueDate ? dueLabel(task.dueDate, getTodayIST()) : null;

  return (
    <GlowCard className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <span className="rounded-full border border-(--color-accent)/40 bg-(--color-accent)/10 px-2.5 py-0.5 font-display text-[0.65rem] uppercase tracking-[0.15em] text-(--color-accent-soft)">
          {task.area}
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={onEdit}
            className="rounded-md px-2 py-1 text-xs text-(--color-text-muted) transition-opacity duration-150 hover:text-(--color-text) focus-visible:outline-2 focus-visible:outline-(--color-accent-edge) active:opacity-60"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-md px-2 py-1 text-xs text-(--color-text-muted) transition-opacity duration-150 hover:text-red-400 focus-visible:outline-2 focus-visible:outline-(--color-accent-edge) active:opacity-60"
          >
            Delete
          </button>
        </div>
      </div>

      <div>
        <h3 className="font-display text-xl font-semibold tracking-[-0.02em]">
          {task.title}
        </h3>
        {task.dueDate && (
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-(--color-text-muted)">
            <span>Due {formatISODate(task.dueDate)}</span>
            {/* The Distant badge is just the date again — the raw text beside
                it already says so, so only the word-labelled tiers get a pill. */}
            {due && due.tier !== "Distant" && (
              <span
                className={`rounded-full px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-[0.1em] ${DUE_TIER_CLASS[due.tier]}`}
              >
                {due.text}
              </span>
            )}
          </p>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between gap-3">
        <span
          className={`rounded-md border px-2 py-0.5 text-xs ${PRIORITY_CLASS[task.priority]}`}
        >
          {task.priority}
        </span>
        <span className="text-xs text-(--color-text-muted)">{task.status}</span>
      </div>
    </GlowCard>
  );
}
