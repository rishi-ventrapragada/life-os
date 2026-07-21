import GlowCard from "@/components/GlowCard";
import SectionHeader from "@/components/SectionHeader";
import PomodoroTimer from "@/components/pomodoro/PomodoroTimer";

export default function PomodoroSection() {
  return (
    <section id="pomodoro" className="scroll-mt-8">
      <SectionHeader eyebrow="Focus timer" title="Pomodoro" />
      <div className="mt-6">
        {/* Frontend-only (PRD §4.8): a refresh legitimately resets the timer. */}
        <GlowCard>
          <PomodoroTimer />
        </GlowCard>
      </div>
    </section>
  );
}
