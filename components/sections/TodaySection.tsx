"use client";

import GlowCard from "@/components/GlowCard";
import SectionHeader from "@/components/SectionHeader";
import Reveal from "@/components/Reveal";
import TodayDate from "@/components/today/TodayDate";
import TodayHabits from "@/components/today/TodayHabits";
import TodayTasks from "@/components/today/TodayTasks";
import TodayJournalLine from "@/components/today/TodayJournalLine";
import WeekProgress from "@/components/today/WeekProgress";
import ExportButton from "@/components/today/ExportButton";
import { useHabits } from "@/components/habits/useHabits";
import { useTasks } from "@/components/tasks/useTasks";
import { getTodayIST } from "@/lib/dates";

/**
 * The daily check-in (PRD §4.1) — the landing section, and the whole point of
 * the app: habits, what's due, a journal line and a week indicator, all
 * actionable without scrolling elsewhere.
 *
 * Composition only. Every piece lives in components/today/ and the data comes
 * from the existing useHabits()/useTasks() hooks rather than new queries, so
 * checking a habit here runs exactly the same write path as the Habits section.
 *
 * Known v1 trade-off (Step 9 decision F, recorded in FUTURE.md): this mounts
 * its own hook instances, so the Habits/Tasks sections hold independent state
 * and won't visibly update until a refresh. Accepted rather than refactoring
 * three working slices; lifting state into a provider is the fix when it bites.
 */
export default function TodaySection() {
  const habits = useHabits();
  const tasks = useTasks();
  const todayIST = getTodayIST();

  return (
    <section id="today" className="scroll-mt-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionHeader eyebrow="Daily check-in" title="Today" />
        <ExportButton />
      </div>

      <Reveal className="mt-6">
        <GlowCard glow="strong" className="flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <TodayDate />
            <WeekProgress habits={habits.habits} todayIST={todayIST} />
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <div className="flex flex-col gap-3">
              <h3 className="font-display text-xs uppercase tracking-[0.2em] text-(--color-text-muted)">
                Habits
              </h3>
              {habits.status === "loading" ? (
                <p className="text-sm text-(--color-text-muted)">Loading habits…</p>
              ) : (
                <TodayHabits
                  habits={habits.habits}
                  ready={habits.status === "ready"}
                  onToggle={habits.toggleToday}
                />
              )}
              {habits.error && (
                <p role="alert" className="text-sm text-red-400">
                  {habits.error}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <h3 className="font-display text-xs uppercase tracking-[0.2em] text-(--color-text-muted)">
                Due today
              </h3>
              {tasks.status === "loading" ? (
                <p className="text-sm text-(--color-text-muted)">Loading tasks…</p>
              ) : (
                <TodayTasks
                  tasks={tasks.tasks}
                  todayIST={todayIST}
                  ready={tasks.status === "ready"}
                  onComplete={(task) =>
                    tasks.updateTask(task.id, { status: "Done" })
                  }
                />
              )}
              {tasks.error && (
                <p role="alert" className="text-sm text-red-400">
                  {tasks.error}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="font-display text-xs uppercase tracking-[0.2em] text-(--color-text-muted)">
              Journal
            </h3>
            <TodayJournalLine />
          </div>
        </GlowCard>
      </Reveal>
    </section>
  );
}
