import GlowCard from "@/components/GlowCard";
import type { Goal } from "@/components/goals/types";

type GoalCardProps = {
  goal: Goal;
  onEdit: () => void;
  onDelete: () => void;
  onProgressChange: (value: number) => void;
};

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Pure string formatting of the "yyyy-mm-dd" input value — no Date objects
 *  (all real date logic waits for lib/dates.ts in Step 4). */
function formatDeadline(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${Number(d)} ${MONTHS[Number(m) - 1] ?? "?"} ${y}`;
}

export default function GoalCard({
  goal,
  onEdit,
  onDelete,
  onProgressChange,
}: GoalCardProps) {
  return (
    <GlowCard className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <span className="rounded-full border border-(--color-accent)/40 bg-(--color-accent)/10 px-2.5 py-0.5 font-display text-[0.65rem] uppercase tracking-[0.15em] text-(--color-accent-soft)">
          {goal.area}
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
          {goal.title}
        </h3>
        {goal.deadline && (
          <p className="mt-1 text-sm text-(--color-text-muted)">
            Due {formatDeadline(goal.deadline)}
          </p>
        )}
      </div>

      <div className="mt-auto">
        <div className="flex items-baseline justify-between text-sm">
          <span className="text-(--color-text-muted)">Progress</span>
          <span className="font-display tabular-nums">{goal.progress}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={goal.progress}
          onChange={(e) => onProgressChange(Number(e.target.value))}
          aria-label={`Progress for ${goal.title}`}
          className="progress-slider mt-2"
          style={{
            background: `linear-gradient(to right, var(--color-accent) ${goal.progress}%, var(--color-border) ${goal.progress}%)`,
          }}
        />
      </div>
    </GlowCard>
  );
}
