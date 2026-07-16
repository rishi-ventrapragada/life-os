import GlowCard from "@/components/GlowCard";
import SectionHeader from "@/components/SectionHeader";

export default function TodaySection() {
  return (
    <section id="today" className="scroll-mt-8">
      <SectionHeader eyebrow="Daily check-in" title="Today" />
      <div className="mt-6">
        <GlowCard glow="strong">
          <p className="text-(--color-text-muted)">
            Habits, tasks due today, and a quick journal line will live here.
          </p>
        </GlowCard>
      </div>
    </section>
  );
}
