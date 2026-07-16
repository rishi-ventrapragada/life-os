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
    <div className="flex flex-1">
      <Sidebar />
      <main className="min-w-0 flex-1 px-8 py-16">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-24">
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
  );
}
