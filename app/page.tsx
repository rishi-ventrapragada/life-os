import SessionProvider from "@/components/auth/SessionProvider";
import AuthGate from "@/components/auth/AuthGate";
import Sidebar from "@/components/Sidebar";
import TodaySection from "@/components/sections/TodaySection";
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
        <div className="flex flex-1">
          <Sidebar />
          <main className="min-w-0 flex-1 px-4 py-10 sm:px-8 sm:py-16">
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-16 sm:gap-24">
              <TodaySection />
              <GoalsSection />
              <HabitsSection />
              <TasksSection />
              <AcademicsSection />
              <FitnessSection />
              <JournalSection />
              <PomodoroSection />
            </div>
          </main>
        </div>
      </AuthGate>
    </SessionProvider>
  );
}
