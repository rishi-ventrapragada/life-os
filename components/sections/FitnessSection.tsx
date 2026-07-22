"use client";

import { useState } from "react";
import GlowCard from "@/components/GlowCard";
import SectionHeader from "@/components/SectionHeader";
import SplitForm from "@/components/fitness/SplitForm";
import WeeklySplit from "@/components/fitness/WeeklySplit";
import LogForm from "@/components/fitness/LogForm";
import WorkoutLogList from "@/components/fitness/WorkoutLogList";
import { useWorkoutSplit } from "@/components/fitness/useWorkoutSplit";
import { useWorkoutLog } from "@/components/fitness/useWorkoutLog";
import type { SplitSlot, WorkoutLog } from "@/components/fitness/types";

const accentBtn =
  "rounded-md bg-(--color-accent) px-4 py-2 text-sm font-medium text-white transition-[opacity,transform] duration-150 hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent-edge) active:scale-95 disabled:cursor-not-allowed disabled:opacity-50";

const subheading =
  "font-display text-sm uppercase tracking-[0.2em] text-(--color-text-muted)";

export default function FitnessSection() {
  const split = useWorkoutSplit();
  const log = useWorkoutLog();

  const [addingSlot, setAddingSlot] = useState(false);
  const [editingSlot, setEditingSlot] = useState<SplitSlot | null>(null);
  const [addingLog, setAddingLog] = useState(false);
  const [editingLog, setEditingLog] = useState<WorkoutLog | null>(null);

  async function saveSlot(data: Omit<SplitSlot, "id">) {
    const ok = editingSlot
      ? await split.updateSlot(editingSlot.id, data)
      : await split.addSlot(data);
    if (ok) {
      setAddingSlot(false);
      setEditingSlot(null);
    }
  }

  async function saveLog(data: Omit<WorkoutLog, "id">) {
    const ok = editingLog
      ? await log.updateLog(editingLog.id, data)
      : await log.addLog(data);
    if (ok) {
      setAddingLog(false);
      setEditingLog(null);
    }
  }

  return (
    <section id="fitness" className="scroll-mt-8 flex flex-col gap-8">
      <SectionHeader eyebrow="Training" title="Fitness" />

      {/* Weekly split */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className={subheading}>Weekly split</h3>
          {!addingSlot && !editingSlot && (
            <button type="button" disabled={split.status !== "ready"} onClick={() => setAddingSlot(true)} className={accentBtn}>
              + Add slot
            </button>
          )}
        </div>
        {split.error && <p role="alert" className="text-sm text-red-400">{split.error}</p>}
        {(addingSlot || editingSlot) && (
          <SplitForm
            initial={editingSlot ?? undefined}
            onSave={saveSlot}
            onCancel={() => { setAddingSlot(false); setEditingSlot(null); }}
          />
        )}
        {split.status === "loading" ? (
          <GlowCard><p className="text-(--color-text-muted)">Loading split…</p></GlowCard>
        ) : (
          <WeeklySplit slots={split.slots} onEdit={(s) => setEditingSlot(s)} onDelete={(s) => split.deleteSlot(s.id)} />
        )}
      </div>

      {/* Workout log */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className={subheading}>Workout log</h3>
          {!addingLog && !editingLog && (
            <button type="button" disabled={log.status !== "ready"} onClick={() => setAddingLog(true)} className={accentBtn}>
              + Log workout
            </button>
          )}
        </div>
        {log.error && <p role="alert" className="text-sm text-red-400">{log.error}</p>}
        {(addingLog || editingLog) && (
          <LogForm
            initial={editingLog ?? undefined}
            onSave={saveLog}
            onCancel={() => { setAddingLog(false); setEditingLog(null); }}
          />
        )}
        {log.status === "loading" ? (
          <GlowCard><p className="text-(--color-text-muted)">Loading log…</p></GlowCard>
        ) : (
          <WorkoutLogList
            logs={log.logs}
            ready={log.status === "ready"}
            onToggle={(l) => log.updateLog(l.id, { completed: !l.completed })}
            onEdit={(l) => setEditingLog(l)}
            onDelete={(l) => log.deleteLog(l.id)}
          />
        )}
      </div>
    </section>
  );
}
