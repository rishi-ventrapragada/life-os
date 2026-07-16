import GlowCard from "@/components/GlowCard";
import SectionHeader from "@/components/SectionHeader";

export default function HabitsSection() {
  return (
    <section id="habits" className="scroll-mt-8">
      <SectionHeader eyebrow="Daily consistency" title="Habits" />
      <div className="mt-6">
        <GlowCard>
          <p className="text-(--color-text-muted)">
            Habits with daily checkboxes, streaks, and a monthly grid will live
            here.
          </p>
        </GlowCard>
      </div>
    </section>
  );
}
