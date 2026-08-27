"use client";

import GlowCard from "@/components/GlowCard";
import SectionHeader from "@/components/SectionHeader";
import Reveal from "@/components/Reveal";
import TodayDate from "@/components/today/TodayDate";
import TodayHabits from "@/components/today/TodayHabits";
import TodayTasks from "@/components/today/TodayTasks";
import TodayJournalLine from "@/components/today/TodayJournalLine";
import WeekProgress from "@/components/today/WeekProgress";
import { useHabits } from "@/components/habits/HabitsProvider";
import { useTasks } from "@/components/tasks/TasksProvider";
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
 * Tasks and habits now come from the shared TasksProvider/HabitsProvider
 * (Increments 1 and 2), so a check-off or an add here and in the Habits/Tasks
 * sections move one state: both update instantly, no refresh. The Analytics
 * radar still reads its own dedicated query (components/dashboard/), so it
 * keeps the Step 9 decision F staleness — see FUTURE.md.
 */
export default function TodaySection() {
  const habits = useHabits();
  const tasks = useTasks();
  const todayIST = getTodayIST();

  return (
    <section id="today" className="scroll-mt-8">
      {/* Theme / Export / Reset demo moved into the account settings menu
          (components/settings/) — they are app settings, not daily check-in
          controls. */}
      <SectionHeader eyebrow="Daily check-in" title="Today" />

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
                What&apos;s due
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
