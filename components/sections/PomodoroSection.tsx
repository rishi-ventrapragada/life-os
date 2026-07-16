import GlowCard from "@/components/GlowCard";
import SectionHeader from "@/components/SectionHeader";

export default function PomodoroSection() {
  return (
    <section id="pomodoro" className="scroll-mt-8">
      <SectionHeader eyebrow="Focus timer" title="Pomodoro" />
      <div className="mt-6">
        <GlowCard>
          <p className="text-(--color-text-muted)">
            A 25/5 focus timer will live here.
          </p>
        </GlowCard>
      </div>
    </section>
  );
}
