import GlowCard from "@/components/GlowCard";
import SectionHeader from "@/components/SectionHeader";

export default function GoalsSection() {
  return (
    <section id="goals" className="scroll-mt-8">
      <SectionHeader eyebrow="Track progress" title="Goals" />
      <div className="mt-6">
        <GlowCard>
          <p className="text-(--color-text-muted)">
            Goal cards with life area, deadline, and a progress bar will live
            here.
          </p>
        </GlowCard>
      </div>
    </section>
  );
}
