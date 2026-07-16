import GlowCard from "@/components/GlowCard";
import SectionHeader from "@/components/SectionHeader";

export default function TasksSection() {
  return (
    <section id="tasks" className="scroll-mt-8">
      <SectionHeader eyebrow="What's due" title="Tasks" />
      <div className="mt-6">
        <GlowCard>
          <p className="text-(--color-text-muted)">
            Tasks with due dates, priority, and status filters will live here.
          </p>
        </GlowCard>
      </div>
    </section>
  );
}
