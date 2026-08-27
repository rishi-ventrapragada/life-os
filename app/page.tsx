import SessionProvider from "@/components/auth/SessionProvider";
import AuthGate from "@/components/auth/AuthGate";
import WheelNav from "@/components/WheelNav";
import MobileNav from "@/components/MobileNav";
import AccountBlock from "@/components/AccountBlock";
import TasksProvider from "@/components/tasks/TasksProvider";
import HabitsProvider from "@/components/habits/HabitsProvider";
import AcademicsProvider from "@/components/academics/AcademicsProvider";
import TodaySection from "@/components/sections/TodaySection";
import AnalyticsSection from "@/components/sections/AnalyticsSection";
import GoalsSection from "@/components/sections/GoalsSection";
import HabitsSection from "@/components/sections/HabitsSection";
import TasksSection from "@/components/sections/TasksSection";
import AcademicsSection from "@/components/sections/AcademicsSection";
import FitnessSection from "@/components/sections/FitnessSection";
import JournalSection from "@/components/sections/JournalSection";
import PomodoroSection from "@/components/sections/PomodoroSection";

export default function Home() {
  return (
    <SessionProvider>
      <AuthGate>
        {/* The shared data providers: one instance each of the task, habit and
            academics (courses + assignments) state, for every section that
            reads them. All sit inside AuthGate so their fetches never run for a
            logged-out visitor, and so signing out unmounts them rather than
            leaking the previous user's rows into the next session. They are
            independent — none reads another's context — so the nesting order
            carries no meaning. */}
        <TasksProvider>
          <HabitsProvider>
            <AcademicsProvider>
              {/* relative z-10 lifts the app above the fixed StarField, which sits
                  at z-0 (it cannot go negative — body paints --color-bg over it). */}
              <div className="relative z-10 flex flex-1">
                <WheelNav />
                <main className="min-w-0 flex-1 px-4 py-10 pb-28 sm:px-8 sm:py-16 sm:pb-28">
                  <div className="mx-auto flex w-full max-w-5xl flex-col gap-16 sm:gap-24">
                    <TodaySection />
                    <AnalyticsSection />
                    <GoalsSection />
                    <HabitsSection />
                    <TasksSection />
                    <AcademicsSection />
                    <FitnessSection />
                    <JournalSection />
                    <PomodoroSection />
                    <AccountBlock />
                  </div>
                </main>
              </div>
            </AcademicsProvider>
          </HabitsProvider>
        </TasksProvider>
        <MobileNav />
      </AuthGate>
    </SessionProvider>
  );
}
